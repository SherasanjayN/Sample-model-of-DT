import jsPDF from 'jspdf';
import { Loan } from '../types';

export function generateLoanSanctionPdf(loan: Loan, language: 'en' | 'ta' = 'en') {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MAGALIR KUZHU MANAGEMENT SYSTEM (SHG PORTAL)', pageWidth / 2, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Tamil Nadu Rural Livelihood & Micro-Finance Mission', pageWidth / 2, 19, { align: 'center' });
  doc.text('OFFICIAL LOAN SANCTION CERTIFICATE', pageWidth / 2, 25, { align: 'center' });

  // Reset text color
  doc.setTextColor(30, 41, 59); // slate-800

  // Reference & Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Certificate Ref: MK-SANCTION-${loan.id.toUpperCase().slice(-8)}`, 14, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(`Issue Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 14, 38, { align: 'right' });

  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(14, 42, pageWidth - 14, 42);

  // Beneficiary Section
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 47, pageWidth - 28, 48, 2, 2, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text('BENEFICIARY & SELF-HELP GROUP DETAILS', 18, 55);

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  doc.setFont('helvetica', 'bold');
  doc.text('Member Name:', 18, 63);
  doc.setFont('helvetica', 'normal');
  doc.text(loan.user_name, 55, 63);

  doc.setFont('helvetica', 'bold');
  doc.text('Contact Mobile:', 18, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(loan.user_phone, 55, 70);

  doc.setFont('helvetica', 'bold');
  doc.text('Registered Email:', 18, 77);
  doc.setFont('helvetica', 'normal');
  doc.text(loan.user_email, 55, 77);

  doc.setFont('helvetica', 'bold');
  doc.text('Assigned Kuzhu:', 18, 84);
  doc.setFont('helvetica', 'normal');
  doc.text(loan.group_name, 55, 84);

  // Loan Sanction Summary
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(14, 102, pageWidth - 28, 45, 2, 2, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('MICRO-CREDIT SANCTION PARTICULARS', 18, 110);

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  doc.setFont('helvetica', 'bold');
  doc.text('Sanctioned Amount:', 18, 119);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`INR ${loan.amount.toLocaleString('en-IN')} (Statutory Cap: INR 10,000)`, 62, 119);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Disbursal Method:', 18, 127);
  doc.setFont('helvetica', 'normal');
  doc.text(
    loan.payment_mode === 'UPI'
      ? `UPI Direct Disbursal (${loan.upi_email || loan.user_email})`
      : 'Cash Disbursal at Kuzhu Weekly Meeting',
    62,
    127
  );

  doc.setFont('helvetica', 'bold');
  doc.text('Repayment Model:', 18, 135);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${loan.repayment_frequency || 'WEEKLY'} (${loan.tenure_period || 10} Installment Cycles)`,
    62,
    135
  );

  if (loan.purpose) {
    doc.setFont('helvetica', 'bold');
    doc.text('Sanctioned Purpose:', 18, 142);
    doc.setFont('helvetica', 'normal');
    doc.text(loan.purpose.slice(0, 75), 62, 142);
  }

  // 3-Tier Approval Workflow Audit
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('3-TIER VERIFICATION AUDIT TRAIL', 14, 156);

  let currentY = 164;
  loan.status_history.forEach((step, idx) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, pageWidth - 28, 14, 1, 1, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`Step ${idx + 1}: ${step.status}`, 18, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const dateStr = new Date(step.updated_at).toLocaleString('en-IN');
    doc.text(`By: ${step.updated_by_name} (${step.updated_by_role}) | Date: ${dateStr}`, 18, currentY + 10);

    currentY += 16;
  });

  // Terms and conditions
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('Note: This micro-credit loan is disbursed under Tamil Nadu Magalir Kuzhu Self-Help guidelines.', 14, currentY + 8);
  doc.text('Repayment installments must be deposited during weekly/monthly group meetings.', 14, currentY + 13);

  // Signatures
  currentY += 32;
  doc.setDrawColor(203, 213, 225);
  doc.line(18, currentY, 65, currentY);
  doc.line(pageWidth - 75, currentY, pageWidth - 18, currentY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Group Admin Signature', 22, currentY + 5);
  doc.text('Super Admin Final Sanction', pageWidth - 70, currentY + 5);
  doc.text('Mylapore / Central SHG Unit', pageWidth - 68, currentY + 9);

  // Save PDF
  doc.save(`Magalir_Kuzhu_Sanction_Certificate_${loan.id.slice(-6)}.pdf`);
}

export function generateRepaymentPassbookPdf(loan: Loan) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('MAGALIR KUZHU MICRO-LOAN REPAYMENT PASSBOOK', pageWidth / 2, 11, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Installment Ledger & Receipt Record', pageWidth / 2, 18, { align: 'center' });

  // Beneficiary Summary
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.text(`Member: ${loan.user_name} (${loan.user_phone})`, 14, 34);
  doc.text(`SHG Group: ${loan.group_name}`, 14, 40);
  doc.text(`Sanctioned Loan: INR ${loan.amount.toLocaleString('en-IN')}`, pageWidth - 14, 34, { align: 'right' });
  doc.text(`Total Paid: INR ${(loan.total_paid || 0).toLocaleString('en-IN')} | Balance: INR ${(loan.remaining_balance !== undefined ? loan.remaining_balance : loan.amount).toLocaleString('en-IN')}`, pageWidth - 14, 40, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 44, pageWidth - 14, 44);

  // Table Header
  let y = 52;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 4, pageWidth - 28, 8, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Cycle #', 16, y);
  doc.text('Due Date', 34, y);
  doc.text('Due (INR)', 62, y);
  doc.text('Paid (INR)', 86, y);
  doc.text('Payment Date', 114, y);
  doc.text('Mode', 148, y);
  doc.text('Status', 168, y);

  y += 7;
  doc.setFont('helvetica', 'normal');

  const installments = loan.installments || [];
  installments.forEach((inst) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Cycle ${inst.installment_number}`, 16, y);
    doc.text(inst.due_date, 34, y);
    doc.text(inst.due_amount.toString(), 62, y);
    doc.text(inst.paid_amount ? inst.paid_amount.toString() : '-', 86, y);
    doc.text(inst.paid_date ? inst.paid_date.split('T')[0] : '-', 114, y);
    doc.text(inst.payment_mode || '-', 148, y);

    if (inst.status === 'PAID') {
      doc.setTextColor(5, 150, 105);
      doc.setFont('helvetica', 'bold');
      doc.text('PAID', 168, y);
    } else if (inst.status === 'OVERDUE') {
      doc.setTextColor(225, 29, 72);
      doc.setFont('helvetica', 'bold');
      doc.text('OVERDUE', 168, y);
    } else if (inst.status === 'PARTIAL') {
      doc.setTextColor(217, 119, 6);
      doc.setFont('helvetica', 'bold');
      doc.text('PARTIAL', 168, y);
    } else {
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('PENDING', 168, y);
    }

    y += 7;
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y - 2, pageWidth - 14, y - 2);
  });

  // Footer Note
  y += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('This passbook is an electronic record authorized by the Magalir Kuzhu Management System.', 14, y);

  doc.save(`Magalir_Kuzhu_Passbook_${loan.id.slice(-6)}.pdf`);
}
