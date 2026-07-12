# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import date

class TransitopsDriver(models.Model):
    _name = 'transitops.driver'
    _description = 'TransitOps Driver'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Name', required=True, tracking=True)
    photo = fields.Binary(string='Photo')
    license_number = fields.Char(string='License Number', required=True, tracking=True)
    
    license_category = fields.Selection([
        ('cdl_a', 'Class A Commercial (CDL-A)'),
        ('cdl_b', 'Class B Commercial (CDL-B)'),
        ('cdl_c', 'Class C Commercial (CDL-C)'),
        ('standard', 'Standard Driver License')
    ], string='License Category', required=True, default='cdl_a', tracking=True)
    
    license_expiry = fields.Date(string='License Expiry Date', required=True, tracking=True)
    phone = fields.Char(string='Phone Number', required=True, tracking=True)
    email = fields.Char(string='Email Address', tracking=True)
    experience = fields.Integer(string='Years of Experience', default=1, tracking=True)
    
    safety_score = fields.Integer(string='Safety Score (0-100)', default=100, tracking=True)
    status = fields.Selection([
        ('available', 'Available'),
        ('on_trip', 'On Trip'),
        ('suspended', 'Suspended'),
        ('inactive', 'Inactive')
    ], string='Driver Status', default='available', required=True, tracking=True)
    
    assigned_vehicle_id = fields.Many2one('transitops.vehicle', string='Assigned Vehicle', tracking=True)
    emergency_contact = fields.Char(string='Emergency Contact Info', required=True)

    # Computed fields
    trips_completed = fields.Integer(string='Trips Completed', compute='_compute_driver_stats')
    average_fuel_efficiency = fields.Float(string='Avg Fuel Efficiency (km/L)', compute='_compute_driver_stats')
    average_delay = fields.Float(string='Avg Delay (hours)', compute='_compute_driver_stats')
    total_distance_driven = fields.Float(string='Total Distance Driven (km)', compute='_compute_driver_stats')

    @api.constrains('license_expiry')
    def _check_license_expiry(self):
        for rec in self:
            if rec.license_expiry and rec.license_expiry < date.today():
                # We don't block saving if expired, but we will block dispatching.
                # However, a warning tag is useful. We can validate here or during dispatch.
                pass

    def _compute_driver_stats(self):
        for rec in self:
            completed_trips = self.env['transitops.trip'].search([
                ('driver_id', '=', rec.id),
                ('trip_status', '=', 'completed')
            ])
            rec.trips_completed = len(completed_trips)
            rec.total_distance_driven = sum(completed_trips.mapped('distance'))
            
            # Fuel efficiency from trips
            fuel_used = sum(completed_trips.mapped('actual_fuel'))
            if fuel_used > 0:
                rec.average_fuel_efficiency = rec.total_distance_driven / fuel_used
            else:
                rec.average_fuel_efficiency = 0.0

            # Delay computation (end_time - ETA) in hours
            delays = []
            for trip in completed_trips:
                if trip.end_time and trip.eta:
                    # Difference in hours
                    diff = (trip.end_time - trip.eta).total_seconds() / 3600.0
                    delays.append(max(0.0, diff))
            
            rec.average_delay = sum(delays) / len(delays) if delays else 0.0

    @api.model
    def check_license_expiries(self):
        # Check expiries in next 30 days
        limit_date = fields.Date.add(fields.Date.today(), days=30)
        drivers = self.search([
            ('license_expiry', '<=', limit_date)
        ])
        for d in drivers:
            days = (d.license_expiry - fields.Date.today()).days
            alert_type = 'danger' if days <= 0 else 'warning'
            status_text = "EXPIRED" if days <= 0 else f"expires in {days} days"
            
            # Create notification
            self.env['transitops.notification'].create({
                'title': f"License Warning: {d.name}",
                'message': f"License {d.license_number} {status_text} on {d.license_expiry}. Action required.",
                'alert_type': alert_type,
                'driver_id': d.id
            })
