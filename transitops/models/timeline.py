# -*- coding: utf-8 -*-
from odoo import models, fields, api

class TransitopsTripTimeline(models.Model):
    _name = 'transitops.trip.timeline'
    _description = 'TransitOps Trip Timeline Event'
    _order = 'timestamp desc'

    trip_id = fields.Many2one('transitops.trip', string='Trip', required=True, ondelete='cascade')
    timestamp = fields.Datetime(string='Timestamp', default=fields.Datetime.now, required=True)
    user_id = fields.Many2one('res.users', string='Triggered By', default=lambda self: self.env.user, required=True)
    
    action_status = fields.Selection([
        ('draft', 'Draft Created'),
        ('validated', 'Validated / Approved'),
        ('dispatched', 'Dispatched / En Route'),
        ('started', 'Transit Started'),
        ('completed', 'Completed'),
        ('archived', 'Archived')
    ], string='Status Stage', required=True)
    
    comment = fields.Text(string='Comments/Audit Logs')
