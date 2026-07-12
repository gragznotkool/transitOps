# -*- coding: utf-8 -*-
from odoo import models, fields, api

class TransitopsExpense(models.Model):
    _name = 'transitops.expense'
    _description = 'TransitOps Operational Expense'
    _order = 'date desc'

    vehicle_id = fields.Many2one('transitops.vehicle', string='Vehicle', required=True)
    trip_id = fields.Many2one('transitops.trip', string='Associated Trip')
    
    expense_type = fields.Selection([
        ('toll', 'Road Tolls'),
        ('permit', 'Permits & Clearances'),
        ('driver_allowance', 'Driver Allowance (Meals/Stays)'),
        ('fine', 'Traffic / Compliance Fines'),
        ('maintenance_extra', 'Emergency Roadside Repairs'),
        ('other', 'Other Expenses')
    ], string='Expense Category', required=True, default='toll')
    
    amount = fields.Float(string='Amount ($)', required=True)
    description = fields.Text(string='Details/Description')
    date = fields.Date(string='Expense Date', required=True, default=fields.Date.today)
