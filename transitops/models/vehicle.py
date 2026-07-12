# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import date, datetime

class TransitopsVehicle(models.Model):
    _name = 'transitops.vehicle'
    _description = 'TransitOps Vehicle'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'registration_number'

    registration_number = fields.Char(string='Registration Number', required=True, tracking=True)
    model = fields.Char(string='Model', required=True, tracking=True)
    manufacturer = fields.Char(string='Manufacturer', required=True, tracking=True)
    vehicle_type = fields.Selection([
        ('semi_truck', 'Semi-Truck (Class 8)'),
        ('box_truck', 'Box Truck'),
        ('delivery_van', 'Delivery Van'),
        ('electric_van', 'Electric Delivery Van'),
        ('flatbed', 'Flatbed Truck'),
        ('refrigerated', 'Refrigerated Semi (Reefer)')
    ], string='Vehicle Type', required=True, default='semi_truck', tracking=True)
    
    capacity = fields.Float(string='Cargo Capacity (kg)', required=True, tracking=True)
    current_odometer = fields.Float(string='Current Odometer (km)', default=0.0, tracking=True)
    acquisition_cost = fields.Float(string='Acquisition Cost ($)', required=True, tracking=True)
    purchase_date = fields.Date(string='Purchase Date', required=True, default=fields.Date.today, tracking=True)
    
    current_status = fields.Selection([
        ('available', 'Available'),
        ('on_trip', 'On Trip'),
        ('in_shop', 'In Shop'),
        ('retired', 'Retired')
    ], string='Current Status', default='available', required=True, tracking=True)
    
    fuel_type = fields.Selection([
        ('diesel', 'Diesel'),
        ('petrol', 'Petrol'),
        ('electric', 'Electric'),
        ('hybrid', 'Hybrid')
    ], string='Fuel Type', required=True, default='diesel', tracking=True)
    
    fuel_tank_capacity = fields.Float(string='Fuel Capacity (L/kWh)', required=True, default=100.0, tracking=True)
    assigned_driver_id = fields.Many2one('transitops.driver', string='Assigned Driver', tracking=True)
    
    last_service_date = fields.Date(string='Last Service Date', tracking=True)
    insurance_expiry = fields.Date(string='Insurance Expiry Date', required=True, tracking=True)
    fitness_expiry = fields.Date(string='Fitness Expiry Date', required=True, tracking=True)
    
    rc_document = fields.Binary(string='Registration Certificate (RC)')
    rc_document_name = fields.Char(string='RC Document Name')
    vehicle_image = fields.Binary(string='Vehicle Image')
    
    depot = fields.Selection([
        ('depot_north', 'North Terminal Hub'),
        ('depot_south', 'South Logistics Depot'),
        ('depot_east', 'East Express Gateway'),
        ('depot_west', 'West Coast Hub')
    ], string="Home Depot", default='depot_north', required=True, tracking=True)

    # Computed fields
    total_trips = fields.Integer(string='Total Trips', compute='_compute_trip_stats')
    total_fuel_cost = fields.Float(string='Total Fuel Cost ($)', compute='_compute_fuel_stats')
    total_maintenance_cost = fields.Float(string='Total Maintenance Cost ($)', compute='_compute_maintenance_stats')
    fuel_efficiency = fields.Float(string='Fuel Efficiency (km/L or km/kWh)', compute='_compute_efficiency')
    vehicle_roi = fields.Float(string='Vehicle ROI (%)', compute='_compute_roi')
    health_score = fields.Integer(string='Health Score (0-100)', compute='_compute_health_score', store=True)
    qr_code = fields.Html(string='QR Passport', compute='_compute_qr_code')

    _sql_constraints = [
        ('registration_number_unique', 'unique(registration_number)', 'The vehicle registration number must be unique!')
    ]

    @api.depends('registration_number')
    def _compute_qr_code(self):
        for rec in self:
            base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
            if rec.id:
                # Direct link to vehicle form view in Odoo
                record_url = f"{base_url}/web#id={rec.id}&model=transitops.vehicle&view_type=form"
                qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=180x180&data={record_url}"
                rec.qr_code = f'<div style="text-align: center;"><img src="{qr_url}" alt="QR Passport" style="width: 140px; height: 140px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"/><p style="margin-top: 8px; font-size: 11px; color: #64748b; font-weight: 500;">Scan to View Passport</p></div>'
            else:
                rec.qr_code = False

    def _compute_trip_stats(self):
        for rec in self:
            rec.total_trips = self.env['transitops.trip'].search_count([('vehicle_id', '=', rec.id)])

    def _compute_fuel_stats(self):
        for rec in self:
            logs = self.env['transitops.fuel.log'].search([('vehicle_id', '=', rec.id)])
            rec.total_fuel_cost = sum(logs.mapped('cost'))

    def _compute_maintenance_stats(self):
        for rec in self:
            logs = self.env['transitops.maintenance'].search([('vehicle_id', '=', rec.id)])
            rec.total_maintenance_cost = sum(logs.mapped('cost'))

    @api.depends('current_odometer')
    def _compute_efficiency(self):
        for rec in self:
            # We search for fuel logs to compute average fuel efficiency (odometer / fuel added)
            # Or average mileage from fuel logs.
            logs = self.env['transitops.fuel.log'].search([('vehicle_id', '=', rec.id)], order='current_odometer desc')
            if len(logs) > 1:
                # Net distance between first and last logged fuel fills
                total_distance = logs[0].current_odometer - logs[-1].current_odometer
                total_fuel = sum(logs[:-1].mapped('fuel_added')) # Exclude the initial baseline
                rec.fuel_efficiency = (total_distance / total_fuel) if total_fuel > 0 else 0.0
            elif logs:
                # If only one log, use its stored mileage or a default calculation
                rec.fuel_efficiency = sum(logs.mapped('mileage')) / len(logs)
            else:
                # Default average baseline depending on type
                defaults = {'semi_truck': 3.5, 'box_truck': 6.0, 'delivery_van': 10.0, 'electric_van': 4.0}
                rec.fuel_efficiency = defaults.get(rec.vehicle_type, 5.0)

    @api.depends('acquisition_cost', 'total_fuel_cost', 'total_maintenance_cost')
    def _compute_roi(self):
        for rec in self:
            # Calculate total earnings from trips.
            # Revenue = sum of trip billed costs.
            trips = self.env['transitops.trip'].search([('vehicle_id', '=', rec.id), ('trip_status', '=', 'completed')])
            total_revenue = sum(trips.mapped('actual_cost')) * 1.5 # standard logistics margin
            total_costs = rec.total_fuel_cost + rec.total_maintenance_cost
            net_profit = total_revenue - total_costs
            if rec.acquisition_cost > 0:
                rec.vehicle_roi = (net_profit / rec.acquisition_cost) * 100.0
            else:
                rec.vehicle_roi = 0.0

    @api.depends('purchase_date', 'last_service_date', 'current_odometer')
    def _compute_health_score(self):
        for rec in self:
            score = 100
            
            # Deduct for breakdowns (high-priority maintenance / breakdown issue)
            breakdowns = self.env['transitops.maintenance'].search_count([
                ('vehicle_id', '=', rec.id),
                ('maintenance_type', '=', 'breakdown')
            ])
            score -= (breakdowns * 12)

            # Deduct for age (years since purchase)
            if rec.purchase_date:
                years = (date.today() - rec.purchase_date).days / 365.25
                score -= int(years * 2.5)

            # Deduct for mileage wear
            score -= int(rec.current_odometer / 12000.0)

            # Deduct for delayed maintenance
            if rec.last_service_date:
                days_since_service = (date.today() - rec.last_service_date).days
                if days_since_service > 180:
                    score -= int((days_since_service - 180) / 10)
            else:
                # No service history
                score -= 15

            # Limit boundaries
            rec.health_score = max(0, min(100, score))

    @api.model
    def check_document_expiries(self):
        limit_date = fields.Date.add(fields.Date.today(), days=30)
        vehicles = self.search(['|', ('insurance_expiry', '<=', limit_date), ('fitness_expiry', '<=', limit_date)])
        for v in vehicles:
            if v.insurance_expiry and v.insurance_expiry <= limit_date:
                days_ins = (v.insurance_expiry - fields.Date.today()).days
                ins_text = "EXPIRED" if days_ins <= 0 else f"expires in {days_ins} days"
                self.env['transitops.notification'].create({
                    'title': f"Insurance Alert: {v.registration_number}",
                    'message': f"Vehicle Insurance policy {ins_text} on {v.insurance_expiry}.",
                    'alert_type': 'danger' if days_ins <= 0 else 'warning',
                    'vehicle_id': v.id
                })
            if v.fitness_expiry and v.fitness_expiry <= limit_date:
                days_fit = (v.fitness_expiry - fields.Date.today()).days
                fit_text = "EXPIRED" if days_fit <= 0 else f"expires in {days_fit} days"
                self.env['transitops.notification'].create({
                    'title': f"Fitness Permit Alert: {v.registration_number}",
                    'message': f"Vehicle Road Fitness permit {fit_text} on {v.fitness_expiry}.",
                    'alert_type': 'danger' if days_fit <= 0 else 'warning',
                    'vehicle_id': v.id
                })

    @api.model
    def generate_daily_fleet_summary(self):
        total = self.search_count([])
        available = self.search_count([('current_status', '=', 'available')])
        in_shop = self.search_count([('current_status', '=', 'in_shop')])
        on_trip = self.search_count([('current_status', '=', 'on_trip')])
        
        self.env['transitops.notification'].create({
            'title': "Daily Fleet Dispatch Briefing",
            'message': f"Fleet capacity indices: {total} total trucks. Available: {available}, In Transit: {on_trip}, In Service: {in_shop}.",
            'alert_type': 'info'
        })
