-- ============================================================================
-- Magalir Kuzhu Management System (Women's Self-Help Group Platform)
-- Relational Database Schema (PostgreSQL / SQLite compatible)
-- ============================================================================

-- 1. Self-Help Groups (Kuzhu) Table
CREATE TABLE IF NOT EXISTS shg_groups (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    area VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Users Table (Members, Group Admins, Super Admin)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(10) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    area VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    group_id VARCHAR(64) REFERENCES shg_groups(id) ON DELETE SET NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER'
        CHECK (role IN ('SUPER_ADMIN', 'GROUP_ADMIN', 'USER')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Loans Table (Multi-Tier Approval Workflow)
CREATE TABLE IF NOT EXISTS loans (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id VARCHAR(64) NOT NULL REFERENCES shg_groups(id) ON DELETE CASCADE,
    principal_amount NUMERIC(10, 2) NOT NULL 
        CHECK (principal_amount > 0 AND principal_amount <= 10000.00),
    annual_interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    repayment_frequency VARCHAR(10) NOT NULL
        CHECK (repayment_frequency IN ('WEEKLY', 'MONTHLY')),
    tenure_cycles INTEGER NOT NULL 
        CHECK (tenure_cycles > 0),
    disbursal_mode VARCHAR(10) NOT NULL DEFAULT 'UPI'
        CHECK (disbursal_mode IN ('UPI', 'CASH')),
    upi_id VARCHAR(150),
    purpose VARCHAR(255) NOT NULL,
    
    -- Status Workflow: PENDING_GROUP_ADMIN -> PENDING_SUPER_ADMIN -> SANCTIONED (or REJECTED)
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_GROUP_ADMIN'
        CHECK (status IN ('PENDING_GROUP_ADMIN', 'PENDING_SUPER_ADMIN', 'SANCTIONED', 'REJECTED')),
    
    -- Financial Computed Invariants
    calculated_installment NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_repayable NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Multi-Tier Approval Audit Timestamps & Actors
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    group_admin_approved_at TIMESTAMP WITH TIME ZONE,
    group_admin_id VARCHAR(64) REFERENCES users(id),
    group_admin_remarks TEXT,
    
    super_admin_sanctioned_at TIMESTAMP WITH TIME ZONE,
    super_admin_id VARCHAR(64) REFERENCES users(id),
    super_admin_remarks TEXT,
    
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_by_id VARCHAR(64) REFERENCES users(id),
    rejection_reason TEXT,
    
    -- Disbursal Details (populated on SANCTIONED)
    disbursed_at TIMESTAMP WITH TIME ZONE,
    disbursal_reference VARCHAR(100),
    is_fully_paid BOOLEAN DEFAULT FALSE
);

-- 4. Dynamic Repayment Ledger Table (Week-by-Week / Month-by-Month tracking)
CREATE TABLE IF NOT EXISTS loan_repayment_ledger (
    id VARCHAR(64) PRIMARY KEY,
    loan_id VARCHAR(64) NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    cycle_number INTEGER NOT NULL CHECK (cycle_number >= 1),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    amount_paid NUMERIC(10, 2) NOT NULL CHECK (amount_paid > 0),
    payment_mode VARCHAR(15) NOT NULL DEFAULT 'CASH'
        CHECK (payment_mode IN ('CASH', 'UPI', 'BANK_TRANSFER')),
    reference_id VARCHAR(100),
    collected_by_id VARCHAR(64) NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit Log Table for Loan Status Transitions
CREATE TABLE IF NOT EXISTS loan_status_audit_log (
    id VARCHAR(64) PRIMARY KEY,
    loan_id VARCHAR(64) NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    from_status VARCHAR(30) NOT NULL,
    to_status VARCHAR(30) NOT NULL,
    actor_id VARCHAR(64) NOT NULL REFERENCES users(id),
    actor_role VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Query Performance & Lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_group ON loans(group_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_ledger_loan ON loan_repayment_ledger(loan_id);
CREATE INDEX IF NOT EXISTS idx_ledger_cycle ON loan_repayment_ledger(loan_id, cycle_number);
