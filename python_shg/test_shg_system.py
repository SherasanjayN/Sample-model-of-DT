"""
Magalir Kuzhu Management System - Comprehensive Verification Test Suite
=======================================================================
Verifies:
1. Multi-tier loan workflow status transitions:
   PENDING_GROUP_ADMIN -> PENDING_SUPER_ADMIN -> SANCTIONED (Disbursal)
2. Flexible repayment models (WEEKLY vs MONTHLY calculations & schedules)
3. Dynamic ledger entry logic week-by-week:
   - Week 1: ₹500, Week 2: ₹500 against ₹5,000 loan
   - Automatic recalculation of:
     * Total Paid Amount
     * Remaining Balance
     * Next Due Date / Overdue status
"""

import sys
import unittest
from datetime import datetime, timedelta
from decimal import Decimal

from python_shg.loan_calculator import (
    calculate_loan_schedule,
    RepaymentFrequency,
    InterestType
)
from python_shg.ledger_service import RepaymentStatusCalculator
from python_shg.routes_flask import apply_loan, group_admin_approve, super_admin_sanction, record_repayment

class TestMagalirKuzhuSystem(unittest.TestCase):

    def setUp(self):
        # Mock users
        self.member = {
            "id": "usr_member_01",
            "name": "Meenakshi Devi",
            "phone": "9876543210",
            "email": "meenakshi@example.com",
            "group_id": "grp_erode_01",
            "role": "USER",
            "status": "APPROVED"
        }
        self.group_admin = {
            "id": "usr_gadmin_01",
            "name": "Lakshmi Ammal",
            "phone": "9876543211",
            "email": "lakshmi@example.com",
            "group_id": "grp_erode_01",
            "role": "GROUP_ADMIN",
            "status": "APPROVED"
        }
        self.super_admin = {
            "id": "usr_super_01",
            "name": "Sanjay N",
            "phone": "9876543212",
            "email": "sherasanjayn@gmail.com",
            "role": "SUPER_ADMIN",
            "status": "APPROVED"
        }

    def test_flexible_repayment_models_weekly_and_monthly(self):
        """Test calculation logic for both WEEKLY and MONTHLY frequencies."""
        # 1. Weekly: ₹5,000 over 10 weeks at 12% p.a. flat
        calc_weekly = calculate_loan_schedule(
            principal=5000.0,
            annual_rate_percent=12.0,
            frequency=RepaymentFrequency.WEEKLY,
            tenure_cycles=10,
            interest_type=InterestType.FLAT
        )
        self.assertEqual(calc_weekly["frequency"], "WEEKLY")
        self.assertEqual(calc_weekly["tenure_cycles"], 10)
        self.assertEqual(calc_weekly["interval_days"], 7)
        # Interest = 5000 * 0.12 * (10 / 52) = 115.38
        self.assertAlmostEqual(calc_weekly["total_interest"], 115.38, places=1)
        self.assertAlmostEqual(calc_weekly["total_repayable"], 5115.38, places=1)
        self.assertEqual(len(calc_weekly["schedule"]), 10)

        # 2. Monthly: ₹10,000 (cap) over 6 months at 12% p.a. flat
        calc_monthly = calculate_loan_schedule(
            principal=10000.0,
            annual_rate_percent=12.0,
            frequency=RepaymentFrequency.MONTHLY,
            tenure_cycles=6,
            interest_type=InterestType.FLAT
        )
        self.assertEqual(calc_monthly["frequency"], "MONTHLY")
        self.assertEqual(calc_monthly["tenure_cycles"], 6)
        self.assertEqual(calc_monthly["interval_days"], 30)
        # Interest = 10000 * 0.12 * (6 / 12) = 600.00
        self.assertEqual(calc_monthly["total_interest"], 600.0)
        self.assertEqual(calc_monthly["total_repayable"], 10600.0)
        self.assertAlmostEqual(calc_monthly["installment_amount"], 1766.67, places=1)
        self.assertEqual(len(calc_monthly["schedule"]), 6)

        # 3. Validation: Amount > 10,000 must raise ValueError
        with self.assertRaises(ValueError):
            calculate_loan_schedule(
                principal=15000.0,
                annual_rate_percent=12.0,
                frequency=RepaymentFrequency.WEEKLY,
                tenure_cycles=10
            )

    def test_multi_tier_approval_workflow(self):
        """Test strict transition: PENDING_GROUP_ADMIN -> PENDING_SUPER_ADMIN -> SANCTIONED"""
        # Step 0: Member applies
        payload = {
            "principal_amount": 5000.0,
            "repayment_frequency": "WEEKLY",
            "tenure_cycles": 10,
            "disbursal_mode": "UPI",
            "upi_id": "meenakshi@upi",
            "purpose": "Organic Vegetable Vendor Setup"
        }
        res, code = apply_loan(self.member, payload)
        self.assertEqual(code, 201)
        loan = res["loan"]
        
        # Verify initial status
        self.assertEqual(loan["status"], "PENDING_GROUP_ADMIN")
        self.assertIsNone(loan.get("disbursed_at"))

        # Step 1: Group Admin reviews & approves
        res_ga, code_ga = group_admin_approve(
            loan_id=loan["id"],
            group_admin=self.group_admin,
            payload={"decision": "APPROVE", "remarks": "Documents verified. Passed in weekly meeting."},
            loan=loan
        )
        self.assertEqual(code_ga, 200)
        self.assertEqual(loan["status"], "PENDING_SUPER_ADMIN")
        self.assertEqual(loan["group_admin_id"], self.group_admin["id"])

        # Step 2: Super Admin final review & sanction
        res_sa, code_sa = super_admin_sanction(
            loan_id=loan["id"],
            super_admin=self.super_admin,
            payload={"decision": "APPROVE", "remarks": "Approved by district directorate."},
            loan=loan
        )
        self.assertEqual(code_sa, 200)
        self.assertEqual(loan["status"], "SANCTIONED")
        self.assertIsNotNone(loan["disbursed_at"])
        self.assertIsNotNone(loan["disbursal_reference"])

    def test_group_admin_repayment_ledger_and_tracking(self):
        """
        Test week-by-week ledger recording:
        e.g. Week 1: ₹500, Week 2: ₹500 against ₹5,000 loan.
        Verify Total Paid, Remaining Balance, and Next Due Date recalculations.
        """
        # Create a sanctioned loan with ₹5,000 principal and total repayable ₹5,000 (flat demo)
        disbursal_date = datetime(2026, 1, 1, 10, 0, 0)
        loan = {
            "id": "loan_demo_001",
            "principal_amount": 5000.00,
            "total_repayable": 5000.00,
            "calculated_installment": 500.00,
            "repayment_frequency": "WEEKLY",
            "tenure_cycles": 10,
            "status": "SANCTIONED",
            "disbursed_at": disbursal_date.isoformat(),
            "is_fully_paid": False
        }
        ledger_entries = []

        # Before any payments:
        summary_0 = RepaymentStatusCalculator.calculate_ledger_summary(
            loan=loan,
            ledger_entries=ledger_entries,
            current_time=disbursal_date + timedelta(days=2)
        )
        self.assertEqual(summary_0["total_paid_amount"], 0.0)
        self.assertEqual(summary_0["remaining_balance"], 5000.0)
        self.assertEqual(summary_0["next_due_date"], "2026-01-08") # 7 days after Jan 1
        self.assertFalse(summary_0["is_overdue"])

        # Entry 1: Group Admin records Week 1 (₹500)
        res1, code1 = record_repayment(
            loan_id=loan["id"],
            group_admin=self.group_admin,
            payload={"cycle_number": 1, "amount_paid": 500.0, "payment_mode": "CASH", "notes": "Week 1 installment paid"},
            loan=loan,
            ledger_entries=ledger_entries
        )
        self.assertEqual(code1, 201)
        sum1 = res1["ledger_summary"]
        self.assertEqual(sum1["total_paid_amount"], 500.0)
        self.assertEqual(sum1["remaining_balance"], 4500.0)
        self.assertEqual(sum1["next_cycle_number"], 2)
        self.assertEqual(sum1["next_due_date"], "2026-01-15") # 14 days after Jan 1

        # Entry 2: Group Admin records Week 2 (₹500)
        res2, code2 = record_repayment(
            loan_id=loan["id"],
            group_admin=self.group_admin,
            payload={"cycle_number": 2, "amount_paid": 500.0, "payment_mode": "CASH", "notes": "Week 2 installment paid"},
            loan=loan,
            ledger_entries=ledger_entries
        )
        self.assertEqual(code2, 201)
        sum2 = res2["ledger_summary"]
        # Invariant 1: Total Paid Amount = ₹1,000
        self.assertEqual(sum2["total_paid_amount"], 1000.0)
        # Invariant 2: Remaining Balance = ₹4,000
        self.assertEqual(sum2["remaining_balance"], 4000.0)
        # Invariant 3: Next cycle is 3, due date Jan 22
        self.assertEqual(sum2["next_cycle_number"], 3)
        self.assertEqual(sum2["next_due_date"], "2026-01-22")

        # Overdue check: Fast-forward time past Jan 22 (e.g. Feb 1)
        sum_overdue = RepaymentStatusCalculator.calculate_ledger_summary(
            loan=loan,
            ledger_entries=ledger_entries,
            current_time=datetime(2026, 2, 1, 10, 0, 0)
        )
        self.assertTrue(sum_overdue["is_overdue"])
        self.assertGreater(sum_overdue["overdue_days"], 0)
        self.assertEqual(sum_overdue["repayment_health"], "OVERDUE")

        # Full payoff check: Pay remaining ₹4,000
        res_final, _ = record_repayment(
            loan_id=loan["id"],
            group_admin=self.group_admin,
            payload={"cycle_number": 3, "amount_paid": 4000.0, "payment_mode": "UPI", "notes": "Lump sum settlement"},
            loan=loan,
            ledger_entries=ledger_entries
        )
        sum_final = res_final["ledger_summary"]
        self.assertEqual(sum_final["total_paid_amount"], 5000.0)
        self.assertEqual(sum_final["remaining_balance"], 0.0)
        self.assertTrue(sum_final["is_fully_paid"])
        self.assertEqual(sum_final["repayment_health"], "PAID_OFF")

if __name__ == "__main__":
    unittest.main()
