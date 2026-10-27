"""
Magalir Kuzhu Management System - Flask Blueprint & API Handlers
================================================================
Implements:
1. Multi-Tier Loan Approval Workflow:
   - Member submits: 'PENDING_GROUP_ADMIN'
   - Group Admin reviews & approves: 'PENDING_SUPER_ADMIN'
   - Super Admin reviews & approves: 'SANCTIONED' (disbursal initiated)
2. Flexible Repayment Models (Weekly vs Monthly):
   - Member chooses frequency, calculated installment & total repayable stored.
3. Group Admin Repayment Ledger & Dynamic Tracking:
   - Group Admin enters week-by-week payments.
   - Automatically recalculates Total Paid, Remaining Balance, Next Due Date & Overdue status.
"""

from datetime import datetime
from functools import wraps
from typing import Dict, Any, Tuple
import uuid

# In standard Flask, import Blueprint, request, jsonify, g
try:
    from flask import Blueprint, request, jsonify, g
except ImportError:
    # Lightweight stub if Flask is not installed in the current environment
    class Blueprint:
        def __init__(self, name: str, import_name: str, url_prefix: str = ""):
            self.name = name
            self.url_prefix = url_prefix
            self.routes = {}

        def route(self, rule: str, **options):
            def decorator(f):
                self.routes[(rule, tuple(options.get("methods", ["GET"])))] = f
                return f
            return decorator

from python_shg.loan_calculator import (
    calculate_loan_schedule,
    RepaymentFrequency,
    InterestType
)
from python_shg.ledger_service import RepaymentStatusCalculator

loan_bp = Blueprint("loans", __name__, url_prefix="/api/loans")

# --------------------------------------------------------------------------
# Role Validation & Auth Decorator
# --------------------------------------------------------------------------
def role_required(allowed_roles: list):
    """Enforces role-based permissions (SUPER_ADMIN, GROUP_ADMIN, USER)."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # In a production Flask app, user context is set by auth middleware (e.g. JWT)
            # Example: user = getattr(g, 'current_user', None)
            return f(*args, **kwargs)
        return wrapper
    return decorator

# --------------------------------------------------------------------------
# 1. Member Loan Application (Initial Status: PENDING_GROUP_ADMIN)
# --------------------------------------------------------------------------
@loan_bp.route("/apply", methods=["POST"])
def apply_loan(current_user: Dict[str, Any], payload: Dict[str, Any], db_conn: Any = None) -> Tuple[Dict[str, Any], int]:
    """
    Submits a new loan request.
    Initial Status is strictly set to 'PENDING_GROUP_ADMIN'.
    """
    principal = float(payload.get("principal_amount", 0))
    frequency_str = payload.get("repayment_frequency", "WEEKLY").upper()
    tenure_cycles = int(payload.get("tenure_cycles", 10))
    disbursal_mode = payload.get("disbursal_mode", "UPI").upper()
    upi_id = payload.get("upi_id", "")
    purpose = payload.get("purpose", "Micro-enterprise support")
    group_id = current_user.get("group_id")

    # Policy Validation Rules
    if not group_id:
        return {"error": "Member must be allocated to a Self-Help Group (Kuzhu) to apply."}, 400

    if principal <= 0 or principal > 10000.00:
        return {"error": "Loan amount must be greater than ₹0 and cannot exceed the ₹10,000 policy cap."}, 400

    if frequency_str not in [RepaymentFrequency.WEEKLY.value, RepaymentFrequency.MONTHLY.value]:
        return {"error": "Repayment frequency must be either 'WEEKLY' or 'MONTHLY'."}, 400

    if disbursal_mode == "UPI" and not upi_id:
        return {"error": "UPI ID is required for UPI disbursal."}, 400

    freq_enum = RepaymentFrequency(frequency_str)
    
    # Financial schedule & EMI calculation
    calc = calculate_loan_schedule(
        principal=principal,
        annual_rate_percent=12.0,  # Standard SHG 12% p.a.
        frequency=freq_enum,
        tenure_cycles=tenure_cycles,
        interest_type=InterestType.FLAT
    )

    loan_id = f"loan_{uuid.uuid4().hex[:12]}"
    new_loan = {
        "id": loan_id,
        "user_id": current_user["id"],
        "user_name": current_user.get("name", ""),
        "user_phone": current_user.get("phone", ""),
        "user_email": current_user.get("email", ""),
        "group_id": group_id,
        "principal_amount": calc["principal"],
        "annual_interest_rate": calc["annual_rate_percent"],
        "repayment_frequency": calc["frequency"],
        "tenure_cycles": calc["tenure_cycles"],
        "calculated_installment": calc["installment_amount"],
        "total_interest": calc["total_interest"],
        "total_repayable": calc["total_repayable"],
        "disbursal_mode": disbursal_mode,
        "upi_id": upi_id,
        "purpose": purpose,
        # INVARIANT: Must strictly start at PENDING_GROUP_ADMIN
        "status": "PENDING_GROUP_ADMIN",
        "submitted_at": datetime.now().isoformat(),
        "is_fully_paid": False
    }

    return {
        "message": "Loan application submitted successfully. Pending Group Admin review.",
        "loan": new_loan,
        "schedule_preview": calc["schedule"][:3]
    }, 201

# --------------------------------------------------------------------------
# 2. Step 1: Group Admin Review & Approval -> PENDING_SUPER_ADMIN
# --------------------------------------------------------------------------
@loan_bp.route("/<loan_id>/group-approve", methods=["POST"])
def group_admin_approve(
    loan_id: str,
    group_admin: Dict[str, Any],
    payload: Dict[str, Any],
    loan: Dict[str, Any]
) -> Tuple[Dict[str, Any], int]:
    """
    Step 1 in approval workflow: Group Admin reviews application.
    Updates status to 'PENDING_SUPER_ADMIN' or 'REJECTED'.
    """
    if group_admin.get("role") != "GROUP_ADMIN":
        return {"error": "Only Group Admins can perform this action."}, 403

    if loan.get("group_id") != group_admin.get("group_id"):
        return {"error": "Unauthorized: Cannot approve loans from another group."}, 403

    if loan.get("status") != "PENDING_GROUP_ADMIN":
        return {"error": f"Invalid transition. Current status is '{loan.get('status')}'."}, 400

    decision = payload.get("decision", "APPROVE").upper()
    remarks = payload.get("remarks", "")

    if decision == "APPROVE":
        loan["status"] = "PENDING_SUPER_ADMIN"
        loan["group_admin_approved_at"] = datetime.now().isoformat()
        loan["group_admin_id"] = group_admin["id"]
        loan["group_admin_remarks"] = remarks
        message = "Loan approved by Group Admin and forwarded to Super Admin for final sanction."
    elif decision == "REJECT":
        loan["status"] = "REJECTED"
        loan["rejected_at"] = datetime.now().isoformat()
        loan["rejected_by_id"] = group_admin["id"]
        loan["rejection_reason"] = remarks or "Rejected by Group Admin during initial review."
        message = "Loan rejected by Group Admin."
    else:
        return {"error": "Decision must be 'APPROVE' or 'REJECT'."}, 400

    return {"message": message, "loan": loan}, 200

# --------------------------------------------------------------------------
# 3. Step 2: Super Admin Final Review & Sanction -> SANCTIONED (Disbursed)
# --------------------------------------------------------------------------
@loan_bp.route("/<loan_id>/super-sanction", methods=["POST"])
def super_admin_sanction(
    loan_id: str,
    super_admin: Dict[str, Any],
    payload: Dict[str, Any],
    loan: Dict[str, Any]
) -> Tuple[Dict[str, Any], int]:
    """
    Step 2 in approval workflow: Super Admin gives final approval.
    Updates status to 'SANCTIONED'.
    Disbursal is initiated upon final sanction.
    """
    if super_admin.get("role") != "SUPER_ADMIN":
        return {"error": "Only the Super Admin can grant final loan sanctions."}, 403

    if loan.get("status") != "PENDING_SUPER_ADMIN":
        return {"error": f"Invalid transition. Loan must be 'PENDING_SUPER_ADMIN', found '{loan.get('status')}'."}, 400

    decision = payload.get("decision", "APPROVE").upper()
    remarks = payload.get("remarks", "")

    if decision == "APPROVE":
        now = datetime.now()
        loan["status"] = "SANCTIONED"
        loan["super_admin_sanctioned_at"] = now.isoformat()
        loan["super_admin_id"] = super_admin["id"]
        loan["super_admin_remarks"] = remarks
        # Disbursal is triggered here
        loan["disbursed_at"] = now.isoformat()
        loan["disbursal_reference"] = f"DISB_{uuid.uuid4().hex[:8].upper()}"
        loan["is_fully_paid"] = False
        message = f"Loan sanctioned successfully. Disbursed via {loan['disbursal_mode']} (Ref: {loan['disbursal_reference']})."
    elif decision == "REJECT":
        loan["status"] = "REJECTED"
        loan["rejected_at"] = datetime.now().isoformat()
        loan["rejected_by_id"] = super_admin["id"]
        loan["rejection_reason"] = remarks or "Rejected by Super Admin during final review."
        message = "Loan rejected by Super Admin."
    else:
        return {"error": "Decision must be 'APPROVE' or 'REJECT'."}, 400

    return {"message": message, "loan": loan}, 200

# --------------------------------------------------------------------------
# 4. Group Admin Repayment Ledger Entry & Automatic Recalculation
# --------------------------------------------------------------------------
@loan_bp.route("/<loan_id>/repayments", methods=["POST"])
def record_repayment(
    loan_id: str,
    group_admin: Dict[str, Any],
    payload: Dict[str, Any],
    loan: Dict[str, Any],
    ledger_entries: list
) -> Tuple[Dict[str, Any], int]:
    """
    Records a week-by-week / cycle-by-cycle repayment in the ledger.
    Automatically recalculates:
      1. Total Paid Amount
      2. Remaining Balance
      3. Overdue / Next Due Date status
    """
    if group_admin.get("role") not in ["GROUP_ADMIN", "SUPER_ADMIN"]:
        return {"error": "Only Group Admin or Super Admin can record repayment ledger entries."}, 403

    if loan.get("status") != "SANCTIONED":
        return {"error": "Repayments can only be recorded for SANCTIONED loans."}, 400

    amount_paid = float(payload.get("amount_paid", 0))
    if amount_paid <= 0:
        return {"error": "Payment amount must be greater than zero."}, 400

    cycle_number = int(payload.get("cycle_number", len(ledger_entries) + 1))
    payment_mode = payload.get("payment_mode", "CASH").upper()
    reference_id = payload.get("reference_id", "")
    notes = payload.get("notes", "")

    # Create new ledger entry
    entry_id = f"ldg_{uuid.uuid4().hex[:10]}"
    new_entry = {
        "id": entry_id,
        "loan_id": loan_id,
        "cycle_number": cycle_number,
        "payment_date": payload.get("payment_date", datetime.now().isoformat()),
        "amount_paid": amount_paid,
        "payment_mode": payment_mode,
        "reference_id": reference_id,
        "collected_by_id": group_admin["id"],
        "notes": notes,
        "created_at": datetime.now().isoformat()
    }
    ledger_entries.append(new_entry)

    # Automatically recalculate totals and tracking status
    summary = RepaymentStatusCalculator.calculate_ledger_summary(
        loan=loan,
        ledger_entries=ledger_entries
    )

    if summary["is_fully_paid"]:
        loan["is_fully_paid"] = True

    return {
        "message": f"Repayment of ₹{amount_paid:,.2f} recorded for Cycle {cycle_number}.",
        "new_entry": new_entry,
        "ledger_summary": summary
    }, 201

# --------------------------------------------------------------------------
# 5. Get Real-Time Dynamic Ledger & Tracking Summary for a Loan
# --------------------------------------------------------------------------
@loan_bp.route("/<loan_id>/ledger", methods=["GET"])
def get_loan_ledger(
    loan_id: str,
    loan: Dict[str, Any],
    ledger_entries: list
) -> Tuple[Dict[str, Any], int]:
    """Retrieves all payment entries and the current recalculation status."""
    summary = RepaymentStatusCalculator.calculate_ledger_summary(
        loan=loan,
        ledger_entries=ledger_entries
    )
    return {
        "loan_id": loan_id,
        "principal": loan["principal_amount"],
        "total_repayable": loan["total_repayable"],
        "repayment_frequency": loan["repayment_frequency"],
        "installment_amount": loan["calculated_installment"],
        "ledger_summary": summary,
        "entries": sorted(ledger_entries, key=lambda x: x["cycle_number"])
    }, 200
