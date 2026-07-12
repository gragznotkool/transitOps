# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class TransitopsFuelLog(models.Model):
    _name = 'transitops.fuel.log'
    _description = 'TransitOps Fuel Log'
    _order = 'current_odometer desc, id desc'

    vehicle_id = fields.Many2one('transitops.vehicle', string='Vehicle', required=True)
    trip_id = fields.Many2one('transitops.trip', string='Associated Trip')
    
    fuel_added = fields.Float(string='Fuel Added (Liters/kWh)', required=True)
    cost = fields.Float(string='Total Fuel Cost ($)', required=True)
    current_odometer = fields.Float(string='Odometer at Fill-in (km)', required=True)
    
    fuel_station = fields.Char(string='Fuel Station / Charging Hub')
    mileage = fields.Float(string='Computed Mileage (km/Unit)', compute='_compute_mileage', store=True)

    @api.depends('current_odometer', 'fuel_added', 'vehicle_id')
    def _compute_mileage(self):
        for rec in self:
            if rec.vehicle_id and rec.current_odometer > 0 and rec.fuel_added > 0:
                # Search for previous odometer record
                prev_log = self.search([
                    ('vehicle_id', '=', rec.vehicle_id.id),
                    ('current_odometer', '<', rec.current_odometer)
                ], order='current_odometer desc', limit=1)
                
                if prev_log:
                    distance = rec.current_odometer - prev_log.current_odometer
                    rec.mileage = distance / rec.fuel_added if rec.fuel_added > 0 else 0.0
                else:
                    rec.mileage = 0.0
            else:
                rec.mileage = 0.0

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        for record in records:
            # Sync odometer back to the vehicle if it's higher than the current value
            if record.vehicle_id and record.current_odometer > record.vehicle_id.current_odometer:
                record.vehicle_id.current_odometer = record.current_odometer
        return records
