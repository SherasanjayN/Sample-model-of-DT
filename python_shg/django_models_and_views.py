"""
Magalir Kuzhu Management System - Django Models & ViewSet Implementation
========================================================================
Production-ready Django ORM Models and REST Framework ViewSets.
"""

from decimal import Decimal
from datetime import datetime, timedelta
from typing import Dict, Any

# In standard Django projects:
# from django.db import models
# from django.contrib.auth.models import AbstractUser
# from rest_framework import viewsets, status, permissions
# from rest_framework.decorators import action
# from rest_framework.response import Response

DJANGO_MODELS_CODE = '''
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal

class SHGGroup(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    name = models.CharField(max_length=150)
    area = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.district})"

class UserRole(models.TextChoices):
    SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
    GROUP_ADMIN = "GROUP_ADMIN", "Group Admin"
    USER = "USER", "Member"

class UserStatus(models.TextChoices):
    PENDING = "PENDING", "Pending Approval"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"

class KuzhuUser(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=10, unique=True)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    area = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    group = models.ForeignKey(SHGGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name="members")
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.USER)
    status = models.CharField(max_length=20, choices=UserStatus.choices, default=UserStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

class LoanStatus(models.TextChoices):
    PENDING_GROUP_ADMIN = "PENDING_GROUP_ADMIN", "Pending Group Admin Review"
    PENDING_SUPER_ADMIN = "PENDING_SUPER_ADMIN", "Pending Super Admin Sanction"
    SANCTIONED = "SANCTIONED", "Sanctioned & Disbursed"
    REJECTED = "REJECTED", "Rejected"

class RepaymentFrequency(models.TextChoices):
    WEEKLY = "WEEKLY", "Weekly"
    MONTHLY = "MONTHLY", "Monthly"

class Loan(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    user = models.ForeignKey(KuzhuUser, on_delete=models.CASCADE, related_name="loans")
    group = models.ForeignKey(SHGGroup, on_delete=models.CASCADE, related_name="group_loans")
    principal_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal("1.00")), MaxValueValidator(Decimal("10000.00"))]
    )
    annual_interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("12.00"))
    repayment_frequency = models.CharField(max_length=10, choices=RepaymentFrequency.choices, default=RepaymentFrequency.WEEKLY)
    tenure_cycles = models.PositiveIntegerField(default=10)
    disbursal_mode = models.CharField(max_length=10, default="UPI")
    upi_id = models.CharField(max_length=150, blank=True, null=True)
    purpose = models.CharField(max_length=255)
    
    # Invariant: Starts at PENDING_GROUP_ADMIN
    status = models.CharField(max_length=30, choices=LoanStatus.choices, default=LoanStatus.PENDING_GROUP_ADMIN)
    
    calculated_installment = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total_repayable = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    
    submitted_at = models.DateTimeField(auto_now_add=True)
    group_admin_approved_at = models.DateTimeField(null=True, blank=True)
    group_admin = models.ForeignKey(KuzhuUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="group_approved_loans")
    group_admin_remarks = models.TextField(blank=True, null=True)
    
    super_admin_sanctioned_at = models.DateTimeField(null=True, blank=True)
    super_admin = models.ForeignKey(KuzhuUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="super_sanctioned_loans")
    super_admin_remarks = models.TextField(blank=True, null=True)
    
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey(KuzhuUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="rejected_loans")
    rejection_reason = models.TextField(blank=True, null=True)
    
    disbursed_at = models.DateTimeField(null=True, blank=True)
    disbursal_reference = models.CharField(max_length=100, blank=True, null=True)
    is_fully_paid = models.BooleanField(default=False)

class LoanRepaymentLedger(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name="ledger_entries")
    cycle_number = models.PositiveIntegerField()
    payment_date = models.DateTimeField(default=timezone.now)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("1.00"))])
    payment_mode = models.CharField(max_length=15, default="CASH")
    reference_id = models.CharField(max_length=100, blank=True, null=True)
    collected_by = models.ForeignKey(KuzhuUser, on_delete=models.PROTECT, related_name="collected_repayments")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["cycle_number"]
'''
