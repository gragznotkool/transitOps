# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import date, datetime

class TransitopsTrip(models.Model):
    _name = 'transitops.trip'
    _description = 'TransitOps Logistics Trip'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'trip_number'

    trip_number = fields.Char(string='Trip Number', required=True, copy=False, default='/', index=True)
    source = fields.Char(string='Source Location', required=True, tracking=True)
    destination = fields.Char(string='Destination Location', required=True, tracking=True)
    
    vehicle_id = fields.Many2one('transitops.vehicle', string='Vehicle', required=True, tracking=True)
    driver_id = fields.Many2one('transitops.driver', string='Driver', required=True, tracking=True)
    
    cargo_weight = fields.Float(string='Cargo Weight (kg)', required=True, tracking=True)
    cargo_type = fields.Selection([
        ('general', 'General Dry Cargo'),
        ('perishable', 'Perishables / Cold Chain'),
        ('hazmat', 'Hazardous Materials (Hazmat)'),
        ('valuable', 'High-Value Goods'),
        ('oversized', 'Oversized / Heavy Machinery')
    ], string='Cargo Type', required=True, default='general', tracking=True)
    
    distance = fields.Float(string='Distance (km)', required=True, tracking=True)
    
    estimated_fuel = fields.Float(string='Est Fuel (L/kWh)', compute='_compute_estimates', store=True, readonly=False)
    estimated_cost = fields.Float(string='Est Trip Cost ($)', compute='_compute_estimates', store=True, readonly=False)
    
    actual_fuel = fields.Float(string='Actual Fuel Used (L/kWh)', tracking=True)
    actual_cost = fields.Float(string='Actual Cost ($)', tracking=True)
    revenue = fields.Float(string='Revenue ($)', tracking=True)
    
    trip_status = fields.Selection([
        ('draft', 'Draft'),
        ('validated', 'Validated'),
        ('dispatched', 'Dispatched'),
        ('started', 'In Transit'),
        ('completed', 'Completed'),
        ('archived', 'Archived')
    ], string='Trip Status', default='draft', required=True, tracking=True)
    
    start_time = fields.Datetime(string='Departure Time', tracking=True)
    end_time = fields.Datetime(string='Arrival Time', tracking=True)
    eta = fields.Datetime(string='Estimated Arrival (ETA)', tracking=True)
    
    weather = fields.Selection([
        ('clear', 'Clear Sky'),
        ('rainy', 'Rainy'),
        ('snowy', 'Snowy / Ice'),
        ('foggy', 'Dense Fog'),
        ('stormy', 'Severe Storm')
    ], string='Weather Forecast', default='clear', tracking=True)
    
    priority = fields.Selection([
        ('low', 'Low'),
        ('medium', 'Normal'),
        ('high', 'High'),
        ('critical', 'Critical / Expedited')
    ], string='Priority Level', default='medium', tracking=True)

    timeline_ids = fields.One2many('transitops.trip.timeline', 'trip_id', string='Trip Timeline')

    @api.depends('vehicle_id', 'distance', 'cargo_weight')
    def _compute_estimates(self):
        for rec in self:
            if rec.vehicle_id and rec.distance > 0:
                # Get base vehicle fuel efficiency (km/L or km/kWh)
                efficiency = rec.vehicle_id.fuel_efficiency or 5.0
                # Fuel adjustment factor based on cargo weight load
                # Max capacity adds 20% fuel consumption
                load_ratio = rec.cargo_weight / rec.vehicle_id.capacity if rec.vehicle_id.capacity > 0 else 0.0
                adjusted_efficiency = efficiency * (1.0 - (min(0.20, load_ratio * 0.20)))
                
                rec.estimated_fuel = rec.distance / adjusted_efficiency if adjusted_efficiency > 0 else 0.0
                
                # Compute estimated cost: Fuel + Driver wage per km + Maintenance wear factor
                fuel_price = 1.50 if rec.vehicle_id.fuel_type in ['diesel', 'petrol'] else 0.15
                fuel_cost = rec.estimated_fuel * fuel_price
                driver_wage = rec.distance * 0.45 # $0.45/km wage rate
                maint_cost = rec.distance * 0.08 # $0.08/km maintenance wear
                
                rec.estimated_cost = fuel_cost + driver_wage + maint_cost
                # Estimate a default revenue
                if not rec.revenue:
                    rec.revenue = rec.estimated_cost * 1.5 # 50% markup
            else:
                rec.estimated_fuel = 0.0
                rec.estimated_cost = 0.0

    @api.constrains('cargo_weight', 'vehicle_id')
    def _check_vehicle_capacity(self):
        for rec in self:
            if rec.vehicle_id and rec.cargo_weight > rec.vehicle_id.capacity:
                raise ValidationError(_("Cargo weight (%s kg) cannot exceed vehicle capacity (%s kg)!") % 
                                      (rec.cargo_weight, rec.vehicle_id.capacity))

    @api.constrains('driver_id', 'trip_status', 'vehicle_id')
    def _check_dispatch_rules(self):
        for rec in self:
            if rec.trip_status in ['validated', 'dispatched', 'started']:
                # Driver checks
                driver = rec.driver_id
                if driver:
                    if driver.license_expiry and driver.license_expiry < date.today():
                        raise ValidationError(_("Cannot assign driver %s because their driver license is expired!") % driver.name)
                    if driver.status == 'suspended':
                        raise ValidationError(_("Cannot assign driver %s because they are suspended!") % driver.name)
                    
                    # Already on another trip: look for other active trips
                    active_trips_driver = self.search_count([
                        ('driver_id', '=', driver.id),
                        ('trip_status', 'in', ['dispatched', 'started']),
                        ('id', '!=', rec.id)
                    ])
                    if active_trips_driver > 0:
                        raise ValidationError(_("Driver %s is already assigned to another active trip!") % driver.name)

                # Vehicle checks
                vehicle = rec.vehicle_id
                if vehicle:
                    if vehicle.current_status == 'retired':
                        raise ValidationError(_("Vehicle %s is retired and cannot be dispatched!") % vehicle.registration_number)
                    if vehicle.current_status == 'in_shop':
                        raise ValidationError(_("Vehicle %s is currently in maintenance and cannot be dispatched!") % vehicle.registration_number)
                    
                    active_trips_vehicle = self.search_count([
                        ('vehicle_id', '=', vehicle.id),
                        ('trip_status', 'in', ['dispatched', 'started']),
                        ('id', '!=', rec.id)
                    ])
                    if active_trips_vehicle > 0:
                        raise ValidationError(_("Vehicle %s is already assigned to another active trip!") % vehicle.registration_number)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get('trip_number') or vals.get('trip_number') == '/':
                seq = self.env['ir.sequence'].next_by_code('transitops.trip')
                if not seq:
                    last_trip = self.search([], order='id desc', limit=1)
                    last_num = int(last_trip.trip_number.split('-')[-1]) if last_trip and '-' in last_trip.trip_number else 0
                    seq = f"TRP-{last_num + 1:05d}"
                vals['trip_number'] = seq
        
        records = super().create(vals_list)
        for record in records:
            # Create initial timeline entry
            record.write_timeline_event('draft', _("Trip draft created."))
        return records

    def write(self, vals):
        old_status = {rec.id: rec.trip_status for rec in self}
        res = super().write(vals)
        
        # Check for status changes
        if 'trip_status' in vals:
            new_status = vals['trip_status']
            for rec in self:
                if old_status[rec.id] != new_status:
                    comment = _("Status changed from %s to %s.") % (old_status[rec.id].upper(), new_status.upper())
                    rec.write_timeline_event(new_status, comment)
                    rec._handle_status_transition(new_status)
        return res

    def write_timeline_event(self, action_status, comment=""):
        self.ensure_one()
        self.env['transitops.trip.timeline'].create({
            'trip_id': self.id,
            'action_status': action_status,
            'user_id': self.env.user.id,
            'timestamp': fields.Datetime.now(),
            'comment': comment
        })

    def _handle_status_transition(self, status):
        self.ensure_one()
        # Create live command center notification
        notification_obj = self.env['transitops.notification']

        if status == 'dispatched':
            # Changes Driver Status -> 'on_trip'
            if self.driver_id:
                self.driver_id.status = 'on_trip'
            # Changes Vehicle Status -> 'on_trip'
            if self.vehicle_id:
                self.vehicle_id.current_status = 'on_trip'
            
            notification_obj.create({
                'title': _("Trip Dispatched - %s") % self.trip_number,
                'message': _("Vehicle %s with Driver %s has been dispatched to %s.") % 
                           (self.vehicle_id.registration_number, self.driver_id.name, self.destination),
                'alert_type': 'info',
                'vehicle_id': self.vehicle_id.id,
                'driver_id': self.driver_id.id
            })

        elif status == 'started':
            if not self.start_time:
                self.start_time = fields.Datetime.now()
            
            notification_obj.create({
                'title': _("Trip Started - %s") % self.trip_number,
                'message': _("Vehicle %s has left the source location towards %s.") % 
                           (self.vehicle_id.registration_number, self.destination),
                'alert_type': 'success',
                'vehicle_id': self.vehicle_id.id,
                'driver_id': self.driver_id.id
            })

        elif status == 'completed':
            if not self.end_time:
                self.end_time = fields.Datetime.now()
            
            # Release driver and vehicle
            if self.driver_id:
                self.driver_id.status = 'available'
            if self.vehicle_id:
                # Add odometer
                self.vehicle_id.current_odometer += self.distance
                self.vehicle_id.current_status = 'available'

            # Calculate actual costs if empty
            if not self.actual_cost:
                self.actual_cost = self.estimated_cost
            if not self.actual_fuel:
                self.actual_fuel = self.estimated_fuel

            notification_obj.create({
                'title': _("Trip Completed - %s") % self.trip_number,
                'message': _("Vehicle %s has arrived successfully at %s. Trip duration: %s km.") % 
                           (self.vehicle_id.registration_number, self.destination, self.distance),
                'alert_type': 'success',
                'vehicle_id': self.vehicle_id.id,
                'driver_id': self.driver_id.id
            })

    def action_validate(self):
        for rec in self:
            if rec.trip_status == 'draft':
                rec.trip_status = 'validated'

    def action_dispatch(self):
        for rec in self:
            if rec.trip_status == 'validated':
                rec.trip_status = 'dispatched'

    def action_start(self):
        for rec in self:
            if rec.trip_status == 'dispatched':
                rec.trip_status = 'started'

    def action_complete(self):
        for rec in self:
            if rec.trip_status == 'started':
                rec.trip_status = 'completed'

    def action_archive(self):
        for rec in self:
            if rec.trip_status == 'completed':
                rec.trip_status = 'archived'
