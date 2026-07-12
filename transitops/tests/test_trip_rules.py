# -*- coding: utf-8 -*-
from odoo.tests.common import TransactionCase
from odoo.exceptions import ValidationError
from datetime import date, datetime

class TestTransitopsTripRules(TransactionCase):

    def setUp(self):
        super(TestTransitopsTripRules, self).setUp()
        
        # Create a test vehicle
        self.vehicle = self.env['transitops.vehicle'].create({
            'registration_number': 'TEST-TRK-99',
            'model': 'Cascadia',
            'manufacturer': 'Freightliner',
            'vehicle_type': 'semi_truck',
            'capacity': 10000.0,  # 10 tons capacity
            'acquisition_cost': 120000.0,
            'purchase_date': '2025-01-01',
            'insurance_expiry': '2027-12-31',
            'fitness_expiry': '2027-12-31',
            'fuel_tank_capacity': 300.0,
            'fuel_type': 'diesel',
        })

        # Create a test driver
        self.driver = self.env['transitops.driver'].create({
            'name': 'Test Driver Pete',
            'license_number': 'LIC-998822',
            'license_category': 'cdl_a',
            'license_expiry': '2027-06-30',
            'phone': '1234567890',
            'emergency_contact': 'Mary Pete',
            'experience': 5,
        })

    def test_01_cargo_weight_limit(self):
        """ Test that cargo weight cannot exceed vehicle capacity """
        with self.assertRaises(ValidationError):
            self.env['transitops.trip'].create({
                'source': 'Hub A',
                'destination': 'Hub B',
                'vehicle_id': self.vehicle.id,
                'driver_id': self.driver.id,
                'distance': 150,
                'cargo_weight': 15000.0,  # Exceeds 10000.0
                'cargo_type': 'general',
            })

    def test_02_driver_license_expiry_block(self):
        """ Test that dispatching a trip fails if the driver license is expired """
        # Set driver license as expired
        self.driver.license_expiry = '2025-01-01'
        
        trip = self.env['transitops.trip'].create({
            'source': 'Hub A',
            'destination': 'Hub B',
            'vehicle_id': self.vehicle.id,
            'driver_id': self.driver.id,
            'distance': 150,
            'cargo_weight': 5000.0,
            'cargo_type': 'general',
        })
        
        # Validating or dispatching should raise validation error
        with self.assertRaises(ValidationError):
            trip.action_validate()
            trip.action_dispatch()

    def test_03_trip_completion_updates_odometer(self):
        """ Test that trip completion releases crew and updates vehicle odometer """
        trip = self.env['transitops.trip'].create({
            'source': 'Hub A',
            'destination': 'Hub B',
            'vehicle_id': self.vehicle.id,
            'driver_id': self.driver.id,
            'distance': 250.0,
            'cargo_weight': 5000.0,
            'cargo_type': 'general',
        })
        
        initial_odo = self.vehicle.current_odometer
        
        # Process trip
        trip.action_validate()
        trip.action_dispatch()
        self.assertEqual(self.vehicle.current_status, 'on_trip')
        self.assertEqual(self.driver.status, 'on_trip')
        
        trip.action_start()
        trip.action_complete()
        
        # Verify post-completion states
        self.assertEqual(self.vehicle.current_status, 'available')
        self.assertEqual(self.driver.status, 'available')
        self.assertEqual(self.vehicle.current_odometer, initial_odo + 250.0)
