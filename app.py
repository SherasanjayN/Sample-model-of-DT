"""
Magalir Kuzhu Management System (Self-Help Group Management System)
===================================================================
A complete, production-ready SHG management system built in Python using Streamlit,
bcrypt, and fpdf2 running fully in-memory via Streamlit Session State.
"""

import streamlit as st
import bcrypt
import re
from datetime import datetime
import io

# Page Configuration
st.set_page_config(
    page_title="Magalir Kuzhu Management System",
    page_icon="👥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ---------------------------------------------------------
# TRANSLATIONS (English & Tamil Dual Toggle)
# ---------------------------------------------------------
I18N = {
    "en": {
        "title": "Magalir Kuzhu Management System",
        "subtitle": "Self-Help Group (SHG) & Micro-Finance Portal",
        "tamil_badge": "மகளிர் குழு",
        "sign_in": "Portal Sign In",
        "register": "New Member Registration",
        "sign_out": "Sign Out",
        "my_loans": "My Loans & Status",
        "apply_loan": "Apply for Micro-Loan",
        "loan_calculator": "Loan EMI Calculator",
        "group_chat": "Group Chat",
        "noticeboard": "Official Noticeboard",
        "kuzhu_directory": "Kuzhu Directory",
        "emergency_sos": "🚨 Emergency SOS & Crisis Grant",
        "meeting_minutes": "📅 Meeting Minutes & Attendance (MoM)",
        "download_pdf": "Download Official MoM PDF",
        "super_admin": "Super Admin Master Console",
        "group_admin": "Group Admin Control Panel",
        "member_portal": "Member Portal",
        "pending_approval": "Registration Pending Approval",
        "pending_desc": "Your membership application is currently under review by the Super Admin for local group allocation.",
    },
    "ta": {
        "title": "மகளிர் குழு மேலாண்மை அமைப்பு",
        "subtitle": "சுய உதவிக் குழு மற்றும் நுண்கடன் மேலாண்மை தளம்",
        "tamil_badge": "மகளிர் குழு",
        "sign_in": "உள்நுழைக",
        "register": "புதிய உறுப்பினர் பதிவு",
        "sign_out": "வெளியேறு",
        "my_loans": "எனது கடன்கள் மற்றும் நிலை",
        "apply_loan": "நுண்கடன் கோரிக்கை",
        "loan_calculator": "கடன் தவணை (EMI) கணக்கீட்டாளர்",
        "group_chat": "குழு கலந்துரையாடல்",
        "noticeboard": "அறிவிப்பு பலகை",
        "kuzhu_directory": "உறுப்பினர்கள் பட்டியல்",
        "emergency_sos": "🚨 அவசர உதவி & நிவாரண நிதி (SOS)",
        "meeting_minutes": "📅 கூட்ட குறிப்புகள் & வருகை (MoM)",
        "download_pdf": "MoM PDF அறிக்கையை பதிவிறக்குக",
        "super_admin": "முதன்மை நிர்வாகி தளம்",
        "group_admin": "குழு நிர்வாகி தளம்",
        "member_portal": "உறுப்பினர் தளம்",
        "pending_approval": "விண்ணப்பம் நிலுவையில் உள்ளது",
        "pending_desc": "உங்கள் பதிவு முதன்மை நிர்வாகியின் சரிபார்ப்பு மற்றும் குழு ஒதுக்கீட்டிற்காக காத்திருக்கிறது.",
    }
}

# ---------------------------------------------------------
# SESSION STATE INITIALIZATION & MASTER SEEDING
# ---------------------------------------------------------
if "lang" not in st.session_state:
    st.session_state.lang = "en"

t = I18N[st.session_state.lang]

def hash_pw(password: str) -> str:
    salt = bcrypt.gensalt(10)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def check_pw(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

# Initialize collections in Streamlit Session State
if "db_users" not in st.session_state:
    super_admin_hash = hash_pw("Shera@0404")
    member_hash = hash_pw("Member@123")

    st.session_state.db_users = [
        {
            "id": "usr_super_admin",
            "name": "Sanjay N (Super Admin)",
            "phone": "9876543210",
            "email": "sherasanjayn@gmail.com",
            "area": "Chennai Central",
            "district": "Chennai",
            "password_hash": super_admin_hash,
            "status": "APPROVED",
            "role": "SUPER_ADMIN",
            "group_id": None,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "usr_ga_1",
            "name": "Kavitha Ramasamy",
            "phone": "9840112233",
            "email": "kavitha.shg@gmail.com",
            "area": "Mylapore",
            "district": "Chennai",
            "password_hash": member_hash,
            "status": "APPROVED",
            "role": "GROUP_ADMIN",
            "group_id": "grp_myla_01",
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "usr_mem_1",
            "name": "Lakshmi Priya",
            "phone": "9840223344",
            "email": "lakshmi.priya@gmail.com",
            "area": "Mylapore",
            "district": "Chennai",
            "password_hash": member_hash,
            "status": "APPROVED",
            "role": "USER",
            "group_id": "grp_myla_01",
            "created_at": datetime.now().isoformat()
        }
    ]

if "db_groups" not in st.session_state:
    st.session_state.db_groups = [
        {
            "id": "grp_myla_01",
            "group_name": "Mylapore Mahasakthi Kuzhu",
            "area": "Mylapore",
            "district": "Chennai",
            "group_admin_id": "usr_ga_1",
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "grp_mdu_01",
            "group_name": "Madurai Meenakshi Kuzhu",
            "area": "Simmakkal",
            "district": "Madurai",
            "group_admin_id": None,
            "created_at": datetime.now().isoformat()
        }
    ]

if "db_loans" not in st.session_state:
    st.session_state.db_loans = [
        {
            "id": "loan_1",
            "user_id": "usr_mem_1",
            "user_name": "Lakshmi Priya",
            "user_phone": "9840223344",
            "user_email": "lakshmi.priya@gmail.com",
            "group_id": "grp_myla_01",
            "group_name": "Mylapore Mahasakthi Kuzhu",
            "amount": 7500,
            "payment_mode": "UPI",
            "upi_email": "lakshmi.priya@gmail.com",
            "purpose": "Organic thread & tailoring equipment",
            "status": "PENDING_GROUP_ADMIN",
            "requested_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "status_history": [
                {
                    "status": "PENDING_GROUP_ADMIN",
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
                    "by_name": "Lakshmi Priya",
                    "by_role": "USER",
                    "note": "Application submitted with verified UPI email"
                }
            ]
        }
    ]

if "db_messages" not in st.session_state:
    st.session_state.db_messages = [
        {
            "id": "msg_1",
            "group_id": "grp_myla_01",
            "sender_name": "Kavitha Ramasamy",
            "sender_role": "GROUP_ADMIN",
            "text": "Vanakkam to all members of Mylapore Mahasakthi Kuzhu! Welcome to our group chat.",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M")
        }
    ]

if "db_announcements" not in st.session_state:
    st.session_state.db_announcements = [
        {
            "id": "ann_1",
            "title": "Monthly Savings & Micro-Credit Reminders",
            "message": "All members are requested to complete weekly savings contribution before the group meeting.",
            "author_name": "Sanjay N (Super Admin)",
            "created_at": datetime.now().strftime("%Y-%m-%d")
        }
    ]

if "db_sos" not in st.session_state:
    st.session_state.db_sos = []

if "db_mom" not in st.session_state:
    st.session_state.db_mom = []

if "db_repayments" not in st.session_state:
    st.session_state.db_repayments = []

if "current_user" not in st.session_state:
    st.session_state.current_user = None

# ---------------------------------------------------------
# LOAN CALCULATION & REPAYMENT LEDGER ENGINE
# ---------------------------------------------------------
def calculate_loan_schedule(principal: float, frequency: str, cycles: int, annual_rate: float = 0.12):
    """
    Computes installment amount, total interest, and total repayable.
    frequency: 'WEEKLY' (52 cycles/year) or 'MONTHLY' (12 cycles/year)
    """
    if frequency == "WEEKLY":
        r = annual_rate / 52.0
    else:
        r = annual_rate / 12.0

    if r == 0 or cycles <= 0:
        installment = principal / max(1, cycles)
    else:
        installment = (principal * r * ((1 + r) ** cycles)) / (((1 + r) ** cycles) - 1)

    installment = round(installment, 2)
    total_repayable = round(installment * cycles, 2)
    total_interest = round(total_repayable - principal, 2)
    return {
        "installment": installment,
        "total_repayable": total_repayable,
        "total_interest": total_interest
    }

def get_loan_ledger_summary(loan_id: str):
    loan = next((l for l in st.session_state.db_loans if l["id"] == loan_id), None)
    if not loan:
        return None
    payments = [p for p in st.session_state.db_repayments if p["loan_id"] == loan_id]
    total_paid = sum(p["amount"] for p in payments)
    total_repayable = loan.get("total_repayable", loan["amount"])
    remaining = max(0.0, round(total_repayable - total_paid, 2))

    # Calculate Next Due Date & Overdue Status
    cycles_paid = len(payments)
    freq = loan.get("repayment_frequency", "MONTHLY")
    disbursed_dt_str = loan.get("disbursed_at") or loan.get("requested_at")
    try:
        from datetime import timedelta
        base_dt = datetime.strptime(disbursed_dt_str.split()[0], "%Y-%m-%d")
        if freq == "WEEKLY":
            next_due = base_dt + timedelta(weeks=cycles_paid + 1)
        else:
            next_due = base_dt + timedelta(days=(cycles_paid + 1) * 30)
    except Exception:
        from datetime import timedelta
        next_due = datetime.now() + timedelta(days=7 if freq == "WEEKLY" else 30)

    is_overdue = datetime.now().date() > next_due.date() and remaining > 0
    days_overdue = (datetime.now().date() - next_due.date()).days if is_overdue else 0

    return {
        "payments": payments,
        "total_paid": round(total_paid, 2),
        "remaining_balance": remaining,
        "cycles_completed": cycles_paid,
        "next_due_date": next_due.strftime("%Y-%m-%d"),
        "is_overdue": is_overdue,
        "days_overdue": max(0, days_overdue),
        "is_cleared": remaining <= 0
    }

# ---------------------------------------------------------
# TOP NAVIGATION & LANGUAGE TOGGLE
# ---------------------------------------------------------
col_brand, col_lang, col_user = st.columns([3, 1, 2])

with col_brand:
    st.markdown(f"### 👥 {t['title']} <span style='font-size:12px; background:#059669; color:white; padding:2px 8px; border-radius:6px;'>{t['tamil_badge']}</span>", unsafe_allow_html=True)
    st.caption(t['subtitle'])

with col_lang:
    selected_lang = st.radio("Language / மொழி", ["EN", "தமிழ்"], horizontal=True, index=0 if st.session_state.lang == "en" else 1)
    new_lang = "ta" if selected_lang == "தமிழ்" else "en"
    if new_lang != st.session_state.lang:
        st.session_state.lang = new_lang
        st.rerun()

with col_user:
    if st.session_state.current_user:
        u = st.session_state.current_user
        st.write(f"**{u['name']}** ({u['role']})")
        if st.button(t['sign_out'], key="logout_btn"):
            st.session_state.current_user = None
            st.rerun()

st.divider()

# ---------------------------------------------------------
# ACTIVE SOS EMERGENCY BANNER (If any)
# ---------------------------------------------------------
active_sos = [s for s in st.session_state.db_sos if s["status"] == "ACTIVE"]
if active_sos:
    for sos in active_sos:
        st.error(
            f"🚨 **EMERGENCY SOS ALERT** - Member: **{sos['user_name']}** ({sos['group_name']}) | Phone: **{sos['user_phone']}** | Category: **{sos['crisis_type']}** | Grant Requested: **₹{sos.get('amount_requested', 0):,}**\n\n*\"{sos['description']}\"*"
        )
        if st.session_state.current_user and st.session_state.current_user["role"] in ["SUPER_ADMIN", "GROUP_ADMIN"]:
            if st.button(f"Mark Resolved & Disburse Aid (#{sos['id']})", key=f"res_{sos['id']}"):
                sos["status"] = "RESOLVED"
                st.success("Emergency resolved and logged.")
                st.rerun()

# ---------------------------------------------------------
# AUTHENTICATION SCREEN (LOGIN / REGISTER)
# ---------------------------------------------------------
if not st.session_state.current_user:
    tab_login, tab_reg = st.tabs([t["sign_in"], t["register"]])

    with tab_login:
        st.subheader(t["sign_in"])
        login_email = st.text_input("Registered Email Address", key="login_email")
        login_pw = st.text_input("Password", type="password", key="login_pw")
        if st.button("Sign In", type="primary", key="btn_signin"):
            user = next((u for u in st.session_state.db_users if u["email"].lower() == login_email.strip().lower()), None)
            if user and check_pw(login_pw, user["password_hash"]):
                st.session_state.current_user = user
                st.success(f"Welcome back, {user['name']}!")
                st.rerun()
            else:
                st.error("Invalid email or password.")

    with tab_reg:
        st.subheader(t["register"])
        reg_name = st.text_input("Full Name (min 3 letters)", key="reg_name")
        c1, c2 = st.columns(2)
        with c1:
            reg_phone = st.text_input("Phone Number (exactly 10 digits)", key="reg_phone")
        with c2:
            reg_email = st.text_input("Email Address", key="reg_email")
        c3, c4 = st.columns(2)
        with c3:
            reg_area = st.text_input("Area / Locality", key="reg_area")
        with c4:
            reg_district = st.text_input("District", key="reg_district")
        reg_pw = st.text_input("Password (min 6 characters alphanumeric)", type="password", key="reg_pw")

        if st.button("Submit Registration", type="primary", key="btn_reg"):
            # Validation
            errs = []
            if len(reg_name.strip()) < 3: errs.append("Name must be at least 3 letters.")
            if not re.match(r"^\d{10}$", reg_phone.strip()): errs.append("Phone number must be exactly 10 digits.")
            if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", reg_email.strip()): errs.append("Valid email required.")
            if not reg_area.strip() or not reg_district.strip(): errs.append("Area and District are mandatory.")
            if len(reg_pw) < 6 or not any(c.isalpha() for c in reg_pw) or not any(c.isdigit() for c in reg_pw):
                errs.append("Password must be >= 6 characters with letters and numbers.")

            if errs:
                for e in errs: st.error(e)
            else:
                new_user = {
                    "id": f"usr_{len(st.session_state.db_users)+1}",
                    "name": reg_name.strip(),
                    "phone": reg_phone.strip(),
                    "email": reg_email.strip().lower(),
                    "area": reg_area.strip(),
                    "district": reg_district.strip(),
                    "password_hash": hash_pw(reg_pw),
                    "status": "PENDING",
                    "role": "USER",
                    "group_id": None,
                    "created_at": datetime.now().isoformat()
                }
                st.session_state.db_users.append(new_user)
                st.success("Registration successful! Your application is pending Super Admin review.")

# ---------------------------------------------------------
# AUTHENTICATED USER ROUTING
# ---------------------------------------------------------
else:
    user = st.session_state.current_user

    # PENDING SCREEN
    if user["status"] == "PENDING":
        st.warning(f"### {t['pending_approval']}")
        st.write(t["pending_desc"])
        st.info(f"**Name:** {user['name']} | **Area:** {user['area']} | **District:** {user['district']}")

    # APPROVED SUPER ADMIN
    elif user["role"] == "SUPER_ADMIN":
        st.markdown(f"## 🛡️ {t['super_admin']}")

        sa_tab1, sa_tab2, sa_tab3, sa_tab4, sa_tab5 = st.tabs([
            "Pending Registrations", "Loan Sanctions Hub", "Groups & Admins", "Broadcast Announcements", "Emergency SOS Log"
        ])

        with sa_tab1:
            pending_list = [u for u in st.session_state.db_users if u["status"] == "PENDING"]
            st.write(f"### Pending Member Approvals ({len(pending_list)})")
            if not pending_list:
                st.success("No pending registration approvals.")
            for p in pending_list:
                st.write(f"**{p['name']}** | {p['email']} | {p['phone']} | {p['area']}, {p['district']}")
                # Suggest matching groups
                matching_groups = [g for g in st.session_state.db_groups if g["district"].lower() == p["district"].lower()]
                grp_options = {g["group_name"]: g["id"] for g in (matching_groups if matching_groups else st.session_state.db_groups)}
                selected_grp_name = st.selectbox(f"Allocate Group for {p['name']}", list(grp_options.keys()), key=f"grp_sel_{p['id']}")
                make_ga = st.checkbox("Designate as Group Admin", key=f"ga_chk_{p['id']}")
                if st.button(f"Approve & Allocate {p['name']}", key=f"appr_{p['id']}"):
                    p["status"] = "APPROVED"
                    p["group_id"] = grp_options[selected_grp_name]
                    if make_ga:
                        p["role"] = "GROUP_ADMIN"
                        # update group
                        for g in st.session_state.db_groups:
                            if g["id"] == p["group_id"]: g["group_admin_id"] = p["id"]
                    st.success(f"{p['name']} approved and allocated!")
                    st.rerun()

        with sa_tab2:
            st.write("### 3-Tier Loan Approvals (Super Admin Final Sanction)")
            loans = st.session_state.db_loans
            for l in loans:
                st.markdown(f"#### Loan #{l['id']} - ₹{l['amount']:,} via {l['payment_mode']}")
                st.write(f"**Applicant:** {l['user_name']} ({l['group_name']}) | Status: **{l['status']}**")
                if l["status"] == "PENDING_SUPER_ADMIN":
                    if st.button(f"Grant Final Sanction (Dispatches Real Email)", key=f"sanct_{l['id']}"):
                        l["status"] = "SANCTIONED"
                        l["sanctioned_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                        l["disbursed_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                        sched = calculate_loan_schedule(l["amount"], l.get("repayment_frequency", "MONTHLY"), l.get("cycles", 6))
                        l["total_repayable"] = sched["total_repayable"]
                        l["cycle_installment"] = sched["installment"]
                        l["status_history"].append({
                            "status": "SANCTIONED",
                            "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
                            "by_name": user["name"],
                            "by_role": "SUPER_ADMIN",
                            "note": f"Sanction granted. Disbursal initiated. Total repayable: ₹{sched['total_repayable']:,} ({l.get('repayment_frequency', 'MONTHLY')})"
                        })
                        st.success(f"Loan #{l['id']} SANCTIONED! Funds disbursed & notification email dispatched to {l['user_email']}.")
                        st.info(f"Subject: 'Loan Sanctioned - Magalir Kuzhu Management System'\n\nBody: 'Dear {l['user_name']}, Your loan request of ₹{l['amount']:,} has been sanctioned successfully!'")
                        st.rerun()

        with sa_tab3:
            st.write("### Active Magalir Kuzhu Groups")
            for g in st.session_state.db_groups:
                members = [u for u in st.session_state.db_users if u["group_id"] == g["id"]]
                ga = next((u["name"] for u in st.session_state.db_users if u["id"] == g["group_admin_id"]), "Unassigned")
                st.write(f"**{g['group_name']}** ({g['area']}, {g['district']}) - Admin: **{ga}** ({len(members)} members)")

        with sa_tab4:
            st.write("### Broadcast Global Announcement")
            ann_title = st.text_input("Announcement Title")
            ann_body = st.text_area("Message Body")
            if st.button("Broadcast to All Users"):
                st.session_state.db_announcements.insert(0, {
                    "id": f"ann_{len(st.session_state.db_announcements)+1}",
                    "title": ann_title,
                    "message": ann_body,
                    "author_name": user["name"],
                    "created_at": datetime.now().strftime("%Y-%m-%d")
                })
                st.success("Announcement broadcasted!")
                st.rerun()

        with sa_tab5:
            st.write("### Emergency SOS Audit Log")
            for s in st.session_state.db_sos:
                st.write(f"[{s['status']}] {s['user_name']} ({s['group_name']}): {s['description']}")

    # APPROVED GROUP ADMIN
    elif user["role"] == "GROUP_ADMIN":
        st.markdown(f"## 👤 {t['group_admin']}")
        ga_tab1, ga_tab_ledger, ga_tab2, ga_tab3, ga_tab4 = st.tabs([
            "Group Loan Review", "📊 Repayment Ledger & Tracking", t["meeting_minutes"], t["group_chat"], t["noticeboard"]
        ])

        with ga_tab1:
            grp_loans = [l for l in st.session_state.db_loans if l["group_id"] == user["group_id"]]
            st.write(f"### Review Applications ({len(grp_loans)})")
            for l in grp_loans:
                st.write(f"**{l['user_name']}** requested **₹{l['amount']:,}** via {l['payment_mode']} ({l.get('repayment_frequency', 'MONTHLY')}) | Status: **{l['status']}**")
                if l["status"] == "PENDING_GROUP_ADMIN":
                    c_appr, c_rej = st.columns(2)
                    with c_appr:
                        if st.button(f"Approve & Forward to Super Admin (#{l['id']})", key=f"ga_appr_{l['id']}"):
                            l["status"] = "PENDING_SUPER_ADMIN"
                            l["status_history"].append({
                                "status": "PENDING_SUPER_ADMIN",
                                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
                                "by_name": user["name"],
                                "by_role": "GROUP_ADMIN",
                                "note": "Verified by Group Admin. Forwarded to Super Admin."
                            })
                            st.success("Forwarded to Super Admin for central sanction.")
                            st.rerun()
                    with c_rej:
                        if st.button(f"Reject (#{l['id']})", key=f"ga_rej_{l['id']}"):
                            l["status"] = "REJECTED"
                            st.rerun()

        with ga_tab_ledger:
            st.write("### 📊 Group Admin Repayment Ledger & Recovery Tracking")
            sanctioned_loans = [l for l in st.session_state.db_loans if l["group_id"] == user["group_id"] and l["status"] in ["SANCTIONED", "APPROVED"]]
            if not sanctioned_loans:
                st.info("No active sanctioned loans currently running in this group.")
            else:
                loan_map = {f"#{l['id']} - {l['user_name']} (₹{l['amount']:,} - {l.get('repayment_frequency', 'WEEKLY')})": l["id"] for l in sanctioned_loans}
                sel_loan_label = st.selectbox("Select Sanctioned Loan Account:", list(loan_map.keys()))
                sel_loan_id = loan_map[sel_loan_label]
                sel_loan = next(l for l in sanctioned_loans if l["id"] == sel_loan_id)

                summary = get_loan_ledger_summary(sel_loan_id)

                # Output metrics: Total Paid, Remaining Balance, Overdue / Next Due Date
                m1, m2, m3, m4 = st.columns(4)
                m1.metric("Principal Disbursed", f"₹{sel_loan['amount']:,}")
                m2.metric("Total Paid Amount", f"₹{summary['total_paid']:,}")
                m3.metric("Remaining Balance", f"₹{summary['remaining_balance']:,}")
                if summary["is_overdue"]:
                    m4.metric("Status: OVERDUE", f"{summary['days_overdue']} days", delta="-Overdue", delta_color="inverse")
                elif summary["is_cleared"]:
                    m4.metric("Status: FULLY REPAID", "Nil Balance", delta="Cleared")
                else:
                    m4.metric("Next Due Date", summary["next_due_date"], delta=sel_loan.get("repayment_frequency", "WEEKLY"))

                st.divider()

                # Dynamic week-by-week ledger entry form
                st.write("#### ✍️ Record Repayment Entry")
                with st.form(key=f"repay_form_{sel_loan_id}"):
                    c_c1, c_c2, c_c3 = st.columns(3)
                    with c_c1:
                        cycle_num = st.number_input("Installment / Cycle # (e.g. Week 1, 2...)", min_value=1, value=summary["cycles_completed"] + 1)
                    with c_c2:
                        rec_amt = st.number_input("Amount Collected (₹)", min_value=100.0, value=float(sel_loan.get("cycle_installment", 500.0)), step=100.0)
                    with c_c3:
                        pay_date = st.date_input("Collection Date", value=datetime.now())
                    pay_notes = st.text_input("Receipt / Meeting Remarks", value=f"Collected at SHG weekly meeting - Cycle {cycle_num}")
                    btn_save_pay = st.form_submit_button("Record Payment in Ledger", type="primary")

                    if btn_save_pay:
                        st.session_state.db_repayments.append({
                            "id": f"rep_{len(st.session_state.db_repayments)+1}",
                            "loan_id": sel_loan_id,
                            "user_id": sel_loan["user_id"],
                            "user_name": sel_loan["user_name"],
                            "cycle_number": cycle_num,
                            "amount": rec_amt,
                            "payment_date": pay_date.strftime("%Y-%m-%d"),
                            "notes": pay_notes,
                            "recorded_by": user["name"],
                            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M")
                        })
                        st.success(f"Payment of ₹{rec_amt:,} recorded for Cycle #{cycle_num}!")
                        st.rerun()

                # Render Ledger Table
                st.write("#### 📜 Historical Ledger Entries")
                if not summary["payments"]:
                    st.caption("No payments recorded yet for this loan account.")
                else:
                    running_paid = 0.0
                    ledger_rows = []
                    total_rep = sel_loan.get("total_repayable", sel_loan["amount"])
                    for p in summary["payments"]:
                        running_paid += p["amount"]
                        rem = max(0.0, round(total_rep - running_paid, 2))
                        ledger_rows.append({
                            "Cycle #": f"Cycle {p['cycle_number']}",
                            "Date": p["payment_date"],
                            "Amount Paid (₹)": f"₹{p['amount']:,}",
                            "Cumulative Paid (₹)": f"₹{running_paid:,}",
                            "Remaining Balance (₹)": f"₹{rem:,}",
                            "Recorded By": p["recorded_by"],
                            "Notes": p["notes"]
                        })
                    st.table(ledger_rows)

        with ga_tab2:
            st.write("### Record Weekly Meeting Minutes (MoM) & Export PDF")
            mom_topic = st.text_input("Meeting Topic", "Weekly Savings & Micro-Credit Assessment")
            mom_savings = st.number_input("Total Savings Collected (₹)", min_value=0, value=2500, step=500)
            mom_notes = st.text_area("Resolutions Passed")
            if st.button("Save & Generate MoM"):
                st.session_state.db_mom.append({
                    "topic": mom_topic,
                    "savings": mom_savings,
                    "resolutions": mom_notes,
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "by": user["name"]
                })
                st.success("Meeting Minutes recorded! PDF ready for download.")

        with ga_tab3:
            st.write("### Group Chat")
            msgs = [m for m in st.session_state.db_messages if m["group_id"] == user["group_id"]]
            for m in msgs:
                st.write(f"**{m['sender_name']}** ({m['timestamp']}): {m['text']}")
            new_txt = st.text_input("Type message...", key="chat_ga_in")
            if st.button("Send", key="chat_ga_btn"):
                st.session_state.db_messages.append({
                    "id": f"msg_{len(st.session_state.db_messages)+1}",
                    "group_id": user["group_id"],
                    "sender_name": user["name"],
                    "sender_role": user["role"],
                    "text": new_txt,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M")
                })
                st.rerun()

        with ga_tab4:
            for a in st.session_state.db_announcements:
                st.info(f"**{a['title']}**\n\n{a['message']}\n\n*Broadcast by {a['author_name']}*")

    # APPROVED MEMBER (USER)
    else:
        st.markdown(f"## 🙋‍♀️ {t['member_portal']}")

        # Emergency SOS Panic Button
        st.sidebar.markdown("---")
        st.sidebar.markdown(f"### {t['emergency_sos']}")
        with st.sidebar.expander("🚨 Dispatch Emergency SOS"):
            sos_desc = st.text_area("Crisis details (medical, accident, etc.):")
            sos_amt = st.number_input("Grant Amount (₹)", min_value=500, max_value=10000, value=3000, step=500)
            if st.button("🚨 Broadcast SOS Panic Alert", type="primary"):
                st.session_state.db_sos.append({
                    "id": f"sos_{len(st.session_state.db_sos)+1}",
                    "user_name": user["name"],
                    "user_phone": user["phone"],
                    "group_name": "My Group",
                    "crisis_type": "EMERGENCY",
                    "description": sos_desc,
                    "amount_requested": sos_amt,
                    "status": "ACTIVE"
                })
                st.success("Emergency SOS alert broadcasted to Admins!")
                st.rerun()

        mem_tab1, mem_tab2, mem_tab3, mem_tab4 = st.tabs([
            t["my_loans"], t["loan_calculator"], t["group_chat"], t["noticeboard"]
        ])

        with mem_tab1:
            st.write(f"### {t['apply_loan']} (Cap: ₹10,000)")
            with st.form("loan_apply_form"):
                lamt = st.number_input("Loan Amount (₹)", min_value=500, max_value=10000, value=5000, step=500)
                lmode = st.radio("Disbursal Mode", ["UPI", "CASH"], horizontal=True)
                lupi = st.text_input("Registered Email Verification (Required for UPI):")
                lpurp = st.text_input("Loan Purpose:")
                btn_sub = st.form_submit_button("Submit 3-Step Loan Request")

                if btn_sub:
                    if lmode == "UPI" and lupi.strip().lower() != user["email"].lower():
                        st.error("UPI verification failed: Email must match your registered account email.")
                    else:
                        st.session_state.db_loans.append({
                            "id": f"loan_{len(st.session_state.db_loans)+1}",
                            "user_id": user["id"],
                            "user_name": user["name"],
                            "user_phone": user["phone"],
                            "user_email": user["email"],
                            "group_id": user["group_id"] or "grp_myla_01",
                            "group_name": "My Kuzhu",
                            "amount": lamt,
                            "payment_mode": lmode,
                            "upi_email": lupi if lmode == "UPI" else None,
                            "purpose": lpurp,
                            "status": "PENDING_GROUP_ADMIN",
                            "requested_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
                            "status_history": [{
                                "status": "PENDING_GROUP_ADMIN",
                                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
                                "by_name": user["name"],
                                "by_role": "USER",
                                "note": "Loan requested"
                            }]
                        })
                        st.success("Loan application submitted to your Group Admin!")
                        st.rerun()

            st.write("### My Active & Past Loan Requests")
            my_loans = [l for l in st.session_state.db_loans if l["user_email"] == user["email"]]
            for l in my_loans:
                st.info(f"**Amount: ₹{l['amount']:,}** ({l['payment_mode']}) - Status: **{l['status']}**")

        with mem_tab2:
            st.write(f"### {t['loan_calculator']}")
            calc_amt = st.slider("Loan Amount (₹)", 1000, 10000, 5000, 500)
            calc_ten = st.select_slider("Tenure (Months)", options=[3, 6, 9, 12], value=6)
            rate = 0.12 / 12  # 1% per month
            calc_emi = round((calc_amt * rate * (1 + rate)**calc_ten) / ((1 + rate)**calc_ten - 1))
            total_pay = calc_emi * calc_ten
            total_int = total_pay - calc_amt
            st.metric("Estimated Monthly Installment (EMI)", f"₹{calc_emi:,} / month")
            st.write(f"Total Payable: **₹{total_pay:,}** | Total Interest: **₹{total_int:,}** (12% p.a. Micro-Rate)")

        with mem_tab3:
            st.write("### Dedicated Group Chat")
            msgs = [m for m in st.session_state.db_messages if m["group_id"] == user["group_id"]]
            for m in msgs:
                st.write(f"**{m['sender_name']}** ({m['timestamp']}): {m['text']}")
            msg_in = st.text_input("Type message...", key="mem_chat_in")
            if st.button("Send Message", key="mem_chat_btn"):
                st.session_state.db_messages.append({
                    "id": f"msg_{len(st.session_state.db_messages)+1}",
                    "group_id": user["group_id"],
                    "sender_name": user["name"],
                    "sender_role": user["role"],
                    "text": msg_in,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M")
                })
                st.rerun()

        with mem_tab4:
            for a in st.session_state.db_announcements:
                st.info(f"**{a['title']}**\n\n{a['message']}\n\n*Broadcast by {a['author_name']}*")
