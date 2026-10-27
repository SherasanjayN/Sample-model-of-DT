"""
Magalir Kuzhu Management System - Ledger Tracking Service
=========================================================
Implements the dynamic ledger entry logic where the Group Admin records payments
week-by-week or month-by-month and the system automatically recalculates:
  1. Total Paid Amount
  2. Remaining Balance
  3. Overdue / Next Due Date status based on the selected frequency (WEEKLY or MONTHLY)
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

def round_curr(val: float | Decimal) -> Decimal:
    return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

class RepaymentStatusCalculator:
    """Calculates real-time ledger balance, next due date, and overdue metrics."""

    @staticmethod
    def calculate_ledger_summary(
        loan: Dict[str, Any],
        ledger_entries: List[Dict[str, Any]],
        current_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Recalculates dynamic ledger totals and schedule compliance.

        Args:
            loan: Loan record dictionary containing:
                - total_repayable: float
                - principal_amount: float
                - calculated_installment: float
                - repayment_frequency: 'WEEKLY' or 'MONTHLY'
                - tenure_cycles: int
                - disbursed_at: str or datetime (mandatory for sanctioned loans)
                - status: 'SANCTIONED', etc.
            ledger_entries: List of payments recorded so far:
                - cycle_number: int
                - amount_paid: float
                - payment_date: str or datetime
            current_time: Reference time for calculation (defaults to now)

        Returns:
            Dict containing:
                - total_paid_amount: float
                - remaining_balance: float
                - is_fully_paid: bool
                - cycles_recorded: int
                - next_cycle_number: int
                - next_due_date: str (YYYY-MM-DD)
                - is_overdue: bool
                - overdue_days: int
                - overdue_amount: float
                - repayment_health: 'PAID_OFF' | 'ON_TRACK' | 'OVERDUE' | 'AWAITING_FIRST_CYCLE'
        """
        now = current_time or datetime.now()
        total_repayable = round_curr(loan.get("total_repayable", loan.get("principal_amount", 0)))
        installment = round_curr(loan.get("calculated_installment", 0))
        freq = loan.get("repayment_frequency", "WEEKLY").upper()
        tenure_cycles = int(loan.get("tenure_cycles", 1))

        # Cycle interval days
        interval_days = 7 if freq == "WEEKLY" else 30

        # Parse disbursed_at
        disbursed_at = loan.get("disbursed_at")
        if isinstance(disbursed_at, str):
            try:
                disbursed_dt = datetime.fromisoformat(disbursed_at.replace("Z", "+00:00"))
            except Exception:
                disbursed_dt = datetime.strptime(disbursed_at[:10], "%Y-%m-%d")
        elif isinstance(disbursed_dt_val := disbursed_at, datetime):
            disbursed_dt = disbursed_dt_val
        else:
            disbursed_dt = now

        # Remove timezone offset for clean relative date calculations
        if disbursed_dt.tzinfo is not None:
            disbursed_dt = disbursed_dt.replace(tzinfo=None)
        if now.tzinfo is not None:
            now = now.replace(tzinfo=None)

        # 1. Total Paid Amount
        total_paid = Decimal("0.00")
        cycles_recorded = 0
        sorted_entries = sorted(ledger_entries, key=lambda x: x.get("cycle_number", 0))

        for entry in sorted_entries:
            amt = round_curr(entry.get("amount_paid", 0))
            total_paid += amt
            cycles_recorded = max(cycles_recorded, int(entry.get("cycle_number", 0)))

        # 2. Remaining Balance
        remaining_balance = max(Decimal("0.00"), total_repayable - total_paid)
        is_fully_paid = (remaining_balance <= Decimal("0.00"))

        if is_fully_paid:
            return {
                "total_paid_amount": float(total_paid),
                "remaining_balance": 0.00,
                "is_fully_paid": True,
                "cycles_recorded": cycles_recorded,
                "next_cycle_number": None,
                "next_due_date": None,
                "is_overdue": False,
                "overdue_days": 0,
                "overdue_amount": 0.00,
                "repayment_health": "PAID_OFF"
            }

        # 3. Next Due Date and Overdue calculation
        # Cycle index that should be paid next
        next_cycle_number = cycles_recorded + 1
        if next_cycle_number > tenure_cycles:
            next_cycle_number = tenure_cycles

        next_due_datetime = disbursed_dt + timedelta(days=next_cycle_number * interval_days)
        next_due_date_str = next_due_datetime.strftime("%Y-%m-%d")

        # Time elapsed since disbursal
        days_since_disbursal = max(0, (now - disbursed_dt).days)
        expected_cycles_due = min(tenure_cycles, max(1, (days_since_disbursal // interval_days) + 1))
        
        # Expected cumulative amount due up to the current cycle
        expected_cumulative_due = round_curr(min(total_repayable, Decimal(expected_cycles_due) * installment))
        overdue_amount_raw = max(Decimal("0.00"), expected_cumulative_due - total_paid)

        is_overdue = False
        overdue_days = 0

        # If current time is past next_due_datetime or expected cycles exceed cycles paid
        if now > next_due_datetime and remaining_balance > 0:
            is_overdue = True
            overdue_days = (now - next_due_datetime).days

        repayment_health = "OVERDUE" if is_overdue else "ON_TRACK"
        if cycles_recorded == 0 and not is_overdue:
            repayment_health = "AWAITING_FIRST_CYCLE"

        return {
            "total_paid_amount": float(total_paid),
            "remaining_balance": float(remaining_balance),
            "is_fully_paid": False,
            "cycles_recorded": cycles_recorded,
            "next_cycle_number": next_cycle_number,
            "next_due_date": next_due_date_str,
            "is_overdue": is_overdue,
            "overdue_days": overdue_days,
            "overdue_amount": float(overdue_amount_raw),
            "repayment_health": repayment_health
        }
