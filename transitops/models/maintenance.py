# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import date

class TransitopsMaintenance(models.Model):
    _name = 'transitops.maintenance'
    _description = 'TransitOps Maintenance Log'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'issue'

    vehicle_id = fields.Many2one('transitops.vehicle', string='Vehicle', required=True, tracking=True)
    issue = fields.Char(string='Maintenance Issue', required=True, tracking=True)
    
    priority = fields.Selection([
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical / Breakdown')
    ], string='Priority', required=True, default='medium', tracking=True)
    
    maintenance_type = fields.Selection([
        ('routine', 'Routine Inspection'),
        ('preventative', 'Preventative Service'),
        ('breakdown', 'Unscheduled Breakdown Repair'),
        ('accident', 'Accident Damage Recovery')
    ], string='Service Type', required=True, default='routine', tracking=True)
    
    description = fields.Text(string='Problem Description')
    cost = fields.Float(string='Maintenance Cost ($)', default=0.0, required=True, tracking=True)
    
    opened_date = fields.Date(string='Date Opened', required=True, default=fields.Date.today, tracking=True)
    closed_date = fields.Date(string='Date Closed', tracking=True)
    
    status = fields.Selection([
        ('opened', 'Opened'),
        ('in_progress', 'Under Repair'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], string='Service Status', default='opened', required=True, tracking=True)
    
    mechanic = fields.Char(string='Assigned Mechanic/Vendor', tracking=True)

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        for record in records:
            record._sync_vehicle_status()
        return records

    def write(self, vals):
        res = super().write(vals)
        if 'status' in vals or 'vehicle_id' in vals:
            for record in self:
                record._sync_vehicle_status()
        return res

    def _sync_vehicle_status(self):
        self.ensure_one()
        vehicle = self.vehicle_id
        if not vehicle:
            return

        if self.status in ['opened', 'in_progress']:
            # Put vehicle in shop
            vehicle.current_status = 'in_shop'
            # Log notification
            self.env['transitops.notification'].create({
                'title': _("Vehicle In Shop: %s") % vehicle.registration_number,
                'message': _("Vehicle entered maintenance. Reason: %s") % self.issue,
                'alert_type': 'warning',
                'vehicle_id': vehicle.id
            })
        elif self.status in ['completed', 'cancelled']:
            # Set last service date if completed
            if self.status == 'completed':
                vehicle.last_service_date = self.closed_date or fields.Date.today()
                if not self.closed_date:
                    self.closed_date = fields.Date.today()
            
            # Check if there are other open/in_progress maintenance items for this vehicle
            open_logs = self.search_count([
                ('vehicle_id', '=', vehicle.id),
                ('status', 'in', ['opened', 'in_progress']),
                ('id', '!=', self.id)
            ])
            if open_logs == 0:
                # No more open repairs, release the vehicle
                vehicle.current_status = 'available'
                # Log notification
                self.env['transitops.notification'].create({
                    'title': _("Vehicle Service Finished: %s") % vehicle.registration_number,
                    'message': _("Vehicle service completed. Released to Available pool."),
                    'alert_type': 'success',
                    'vehicle_id': vehicle.id
                })
