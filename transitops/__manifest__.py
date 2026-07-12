# -*- coding: utf-8 -*-
{
    'name': 'TransitOps',
    'version': '1.0.0',
    'summary': 'Premium Fleet, Logistics & Driver Performance ERP Command Center',
    'description': """
        State-of-the-art fleet management, dispatch operations, route simulator,
        real-time command center events, driver leaderboards, and vehicle health intelligence.
    """,
    'category': 'Operations/Fleet',
    'author': 'Antigravity',
    'depends': ['base', 'mail', 'web'],
    'data': [
        'security/security.xml',
        'security/ir.model.access.csv',
        'data/cron.xml',
        'data/demo_data.xml',
        'views/vehicle_views.xml',
        'views/driver_views.xml',
        'views/trip_views.xml',
        'views/maintenance_views.xml',
        'views/fuel_log_views.xml',
        'views/expense_views.xml',
        'views/notification_views.xml',
        'views/menus.xml',
        'reports/reports.xml',
        'reports/vehicle_report.xml',
        'reports/trip_report.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'transitops/static/src/components/dashboard/dashboard.js',
            'transitops/static/src/components/dashboard/dashboard.xml',
            'transitops/static/src/components/dashboard/dashboard.css',
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
