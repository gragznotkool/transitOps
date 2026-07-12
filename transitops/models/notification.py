# -*- coding: utf-8 -*-
from odoo import models, fields, api

class TransitopsNotification(models.Model):
    _name = 'transitops.notification'
    _description = 'TransitOps Operational Notification'
    _order = 'timestamp desc, id desc'

    title = fields.Char(string='Title', required=True)
    message = fields.Text(string='Message', required=True)
    timestamp = fields.Datetime(string='Timestamp', default=fields.Datetime.now, required=True)
    
    alert_type = fields.Selection([
        ('info', 'Information (Blue)'),
        ('success', 'Operational Event (Green)'),
        ('warning', 'Alert Warning (Orange)'),
        ('danger', 'Critical Danger (Red)')
    ], string='Alert Level', default='info', required=True)
    
    is_read = fields.Boolean(string='Acknowledged', default=False)
    
    vehicle_id = fields.Many2one('transitops.vehicle', string='Linked Vehicle')
    driver_id = fields.Many2one('transitops.driver', string='Linked Driver')
