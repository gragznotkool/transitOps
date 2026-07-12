# -*- coding: utf-8 -*-
from odoo.tests.common import TransactionCase
from odoo.exceptions import ValidationError

class TestTransitopsMaintRules(TransactionCase):

    def setUp(self):
        super(TestTransitopsMaintRules, self).setUp()
        
        # Create a test vehicle
        self.vehicle = self.env['transitops.vehicle'].create({
            'registration_number': 'TEST-TRK-88',
            'model': 'VNL',
            'manufacturer': 'Volvo',
            'vehicle_type': 'semi_truck',
            'capacity': 12000.0,
            'acquisition_cost': 130000.0,
            'purchase_date': '2025-01-01',
            'insurance_expiry': '2027-12-31',
            'fitness_expiry': '2027-12-31',
            'fuel_tank_capacity': 400.0,
            'fuel_type': 'diesel',
        })

        # Create a test driver
        self.driver = self.env['transitops.driver'].create({
            'name': 'Test Driver Dave',
            'license_number': 'LIC-554422',
            'license_category': 'cdl_a',
            'license_expiry': '2027-06-30',
            'phone': '0987654321',
            'emergency_contact': 'Mary Dave',
            'experience': 3,
        })

    def test_01_maintenance_status_locking(self):
        """ Test that opening a maintenance ticket puts vehicle in shop, blocking dispatches """
        # Create maintenance log
        maint = self.env['transitops.maintenance'].create({
            'vehicle_id': self.vehicle.id,
            'issue': 'Engine Overheating',
            'maintenance_type': 'breakdown',
            'priority': 'critical',
            'status': 'opened',
        })

        # Vehicle must automatically be moved to 'in_shop'
        self.assertEqual(self.vehicle.current_status, 'in_shop')

        # Creating a trip with this vehicle should now fail validation
        trip = self.env['transitops.trip'].create({
            'source': 'Hub A',
            'destination': 'Hub B',
            'vehicle_id': self.vehicle.id,
            'driver_id': self.driver.id,
            'distance': 100,
            'cargo_weight': 2000,
            'cargo_type': 'general',
        })

        with self.assertRaises(ValidationError):
            trip.action_validate()
            trip.action_dispatch()

        # Complete maintenance log
        maint.write({
            'status': 'completed',
            'closed_date': '2026-07-12',
        })

        # Vehicle status should be unlocked back to 'available'
        self.assertEqual(self.vehicle.current_status, 'available')

        # Dispatch should now succeed
        trip.action_validate()
        trip.action_dispatch()
        self.assertEqual(self.vehicle.current_status, 'on_trip')
