"""
Magalir Kuzhu Management System - Loan Calculation Engine
=========================================================
Implements flexible repayment models (WEEKLY vs. MONTHLY)
with accurate financial formulas for reducing balance EMI and flat interest models.
"""

from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
from typing import Dict, List, Any
from datetime import datetime, timedelta

class RepaymentFrequency(str, Enum):
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"

class InterestType(str, Enum):
    FLAT = "FLAT"              # Standard for grassroots micro-finance / SHG
    REDUCING = "REDUCING"      # Standard reducing balance amortized EMI

def round_curr(value: Decimal) -> Decimal:
    """Rounds currency to 2 decimal places using standard financial round-half-up."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def calculate_loan_schedule(
    principal: float,
    annual_rate_percent: float,
    frequency: RepaymentFrequency,
    tenure_cycles: int,
    interest_type: InterestType = InterestType.FLAT,
    start_date: datetime = None
) -> Dict[str, Any]:
    """
    Computes periodic installment, total interest, total repayable amount,
    and the cycle-by-cycle amortization schedule for Weekly or Monthly frequency.

    Args:
        principal: Principal amount in INR (e.g. 5000.00, max 10000.00)
        annual_rate_percent: Annual interest rate (e.g. 12.0 for 12% p.a.)
        frequency: RepaymentFrequency.WEEKLY or RepaymentFrequency.MONTHLY
        tenure_cycles: Total number of cycles (e.g. 10 weeks or 6 months)
        interest_type: FLAT or REDUCING
        start_date: Starting date (defaults to datetime.now())
    """
    if principal <= 0:
        raise ValueError("Principal must be greater than zero.")
    if principal > 10000.00:
        raise ValueError("SHG loan amount cannot exceed the ₹10,000 policy cap.")
    if tenure_cycles <= 0:
        raise ValueError("Tenure cycles must be at least 1.")

    P = Decimal(str(principal))
    R_annual = Decimal(str(annual_rate_percent)) / Decimal("100")
    start = start_date or datetime.now()

    # Determine frequency parameters
    if frequency == RepaymentFrequency.WEEKLY:
        cycles_per_year = Decimal("52")
        interval_days = 7
    elif frequency == RepaymentFrequency.MONTHLY:
        cycles_per_year = Decimal("12")
        interval_days = 30
    else:
        raise ValueError(f"Unsupported frequency: {frequency}")

    # Periodic rate
    r_periodic = R_annual / cycles_per_year
    n = tenure_cycles

    schedule: List[Dict[str, Any]] = []

    if interest_type == InterestType.FLAT:
        # Micro-finance flat interest formula:
        # Total Interest = P * Annual Rate * (cycles / cycles_per_year)
        total_interest = round_curr(P * R_annual * (Decimal(n) / cycles_per_year))
        total_repayable = round_curr(P + total_interest)
        
        # Base installment per cycle
        raw_installment = total_repayable / Decimal(n)
        installment = round_curr(raw_installment)
        
        # Principal and interest split per installment
        principal_per_cycle = round_curr(P / Decimal(n))
        interest_per_cycle = round_curr(total_interest / Decimal(n))

        balance = total_repayable
        for cycle in range(1, n + 1):
            cycle_date = start + timedelta(days=cycle * interval_days)
            # Adjust final cycle rounding difference
            if cycle == n:
                cycle_payment = balance
            else:
                cycle_payment = installment
            
            balance = round_curr(max(Decimal("0.00"), balance - cycle_payment))
            schedule.append({
                "cycle": cycle,
                "due_date": cycle_date.strftime("%Y-%m-%d"),
                "installment": float(cycle_payment),
                "principal_component": float(principal_per_cycle),
                "interest_component": float(interest_per_cycle),
                "remaining_balance": float(balance)
            })

    else:
        # Standard Amortization (Reducing Balance EMI):
        # EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
        if r_periodic == 0:
            installment = round_curr(P / Decimal(n))
        else:
            r_float = float(r_periodic)
            emi_factor = (r_float * ((1 + r_float) ** n)) / (((1 + r_float) ** n) - 1)
            installment = round_curr(P * Decimal(str(emi_factor)))

        current_balance = P
        total_interest = Decimal("0.00")

        for cycle in range(1, n + 1):
            cycle_date = start + timedelta(days=cycle * interval_days)
            interest_for_cycle = round_curr(current_balance * r_periodic)
            principal_for_cycle = round_curr(installment - interest_for_cycle)

            if cycle == n or principal_for_cycle > current_balance:
                principal_for_cycle = current_balance
                installment = round_curr(principal_for_cycle + interest_for_cycle)

            total_interest += interest_for_cycle
            current_balance = round_curr(max(Decimal("0.00"), current_balance - principal_for_cycle))

            schedule.append({
                "cycle": cycle,
                "due_date": cycle_date.strftime("%Y-%m-%d"),
                "installment": float(installment),
                "principal_component": float(principal_for_cycle),
                "interest_component": float(interest_for_cycle),
                "remaining_balance": float(current_balance)
            })

        total_repayable = round_curr(P + total_interest)

    return {
        "principal": float(P),
        "annual_rate_percent": float(R_annual * 100),
        "frequency": frequency.value,
        "tenure_cycles": n,
        "interval_days": interval_days,
        "installment_amount": float(installment),
        "total_interest": float(total_interest),
        "total_repayable": float(total_repayable),
        "schedule": schedule
    }
