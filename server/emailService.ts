import nodemailer, { type Transporter } from 'nodemailer';
import { db, EmailLog, SmtpConfig } from './db';

interface SendLoanSanctionParams {
  userName: string;
  userEmail: string;
  amount: number;
}

let etherealTransporter: Transporter | null = null;
let etherealUser: string | null = null;

export function getActiveTransportMode(): {
  mode: 'REAL_SMTP' | 'DEV_ETHEREAL';
  provider: 'gmail' | 'custom' | 'ethereal';
  user: string;
  host: string;
  port: number;
  isConfigured: boolean;
} {
  const dbConfig = db.getSmtpConfig();
  if (dbConfig && dbConfig.enabled && dbConfig.user && dbConfig.pass) {
    return {
      mode: 'REAL_SMTP',
      provider: dbConfig.provider || (dbConfig.host.includes('gmail') ? 'gmail' : 'custom'),
      user: dbConfig.user,
      host: dbConfig.host || 'smtp.gmail.com',
      port: Number(dbConfig.port) || 465,
      isConfigured: true,
    };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      mode: 'REAL_SMTP',
      provider: process.env.SMTP_HOST.includes('gmail') ? 'gmail' : 'custom',
      user: process.env.SMTP_USER,
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      isConfigured: true,
    };
  }

  return {
    mode: 'DEV_ETHEREAL',
    provider: 'ethereal',
    user: etherealUser || 'sandbox@ethereal.email',
    host: 'smtp.ethereal.email',
    port: 587,
    isConfigured: false,
  };
}

async function getTransporter(): Promise<{ transporter: Transporter; mode: 'REAL_SMTP' | 'DEV_ETHEREAL'; fromAddress: string }> {
  const dbConfig = db.getSmtpConfig();

  // 1. Check database-saved SMTP configuration (e.g. Gmail App Password entered in UI)
  if (dbConfig && dbConfig.enabled && dbConfig.user && dbConfig.pass) {
    const fromName = dbConfig.from_name || 'Magalir Kuzhu Management System';
    const fromEmail = dbConfig.from_email || dbConfig.user;
    const transporter = nodemailer.createTransport({
      host: dbConfig.host || 'smtp.gmail.com',
      port: Number(dbConfig.port) || 465,
      secure: dbConfig.secure !== false,
      auth: {
        user: dbConfig.user,
        pass: dbConfig.pass.replace(/\s+/g, ''), // Strip whitespace in 16-character app passwords
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    return {
      transporter,
      mode: 'REAL_SMTP',
      fromAddress: `"${fromName}" <${fromEmail}>`,
    };
  }

  // 2. Check process.env SMTP credentials
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const fromName = process.env.SMTP_FROM_NAME || 'Magalir Kuzhu Management System';
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS.replace(/\s+/g, ''),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    return {
      transporter,
      mode: 'REAL_SMTP',
      fromAddress: `"${fromName}" <${fromEmail}>`,
    };
  }

  // 3. Fallback to Ethereal sandbox test account for development/safe test delivery
  if (etherealTransporter) {
    return {
      transporter: etherealTransporter,
      mode: 'DEV_ETHEREAL',
      fromAddress: `"Magalir Kuzhu Test Mailer" <${etherealUser || 'no-reply@magalirkuzhu.org'}>`,
    };
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    etherealUser = testAccount.user;
    etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[EmailService] Created Ethereal test mail account:', testAccount.user);
    return {
      transporter: etherealTransporter,
      mode: 'DEV_ETHEREAL',
      fromAddress: `"Magalir Kuzhu Test Mailer" <${testAccount.user}>`,
    };
  } catch (err) {
    console.warn('[EmailService] Could not create Ethereal test account, using JSON transport fallback:', err);
    etherealTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return {
      transporter: etherealTransporter,
      mode: 'DEV_ETHEREAL',
      fromAddress: '"Magalir Kuzhu System" <no-reply@magalirkuzhu.org>',
    };
  }
}

export async function verifySmtp(customConfig?: Partial<SmtpConfig>): Promise<{
  success: boolean;
  message: string;
  error?: string;
  code?: string;
}> {
  let transporter: Transporter;

  if (customConfig && customConfig.user && customConfig.pass) {
    transporter = nodemailer.createTransport({
      host: customConfig.host || 'smtp.gmail.com',
      port: Number(customConfig.port) || 465,
      secure: customConfig.secure !== false,
      auth: {
        user: customConfig.user,
        pass: customConfig.pass.replace(/\s+/g, ''),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  } else {
    const active = await getTransporter();
    transporter = active.transporter;
  }

  try {
    await transporter.verify();
    return {
      success: true,
      message: 'SMTP connection verified successfully! Ready to dispatch real emails.',
    };
  } catch (err: any) {
    console.error('[EmailService] SMTP verification failed:', err);
    let errorHelp = err.message || 'Connection failed';
    if (err.message && (err.message.includes('535') || err.message.includes('Username and Password not accepted') || err.message.includes('BadCredentials'))) {
      errorHelp = 'Authentication failed (535): For Gmail, your standard account password is not accepted. Please generate a 16-character Google App Password under Google Account -> Security -> 2-Step Verification -> App Passwords.';
    } else if (err.message && (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED'))) {
      errorHelp = `Connection timed out to ${customConfig?.host || 'SMTP host'}:${customConfig?.port || 465}. Check host and port (465 SSL or 587 TLS).`;
    }

    return {
      success: false,
      message: errorHelp,
      error: err.message,
      code: err.code,
    };
  }
}

export function buildLoanSanctionHtml(userName: string, userEmail: string, amount: number, nowIst: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #d1fae5; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 20px 24px; border-radius: 8px; color: #ffffff; margin-bottom: 24px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.9; font-weight: 700;">Tamil Nadu Women Self-Help Group Network</div>
        <h1 style="margin: 6px 0 2px; font-size: 22px; font-weight: 800; color: #ffffff;">Magalir Kuzhu Management System</h1>
        <p style="margin: 0; font-size: 13px; opacity: 0.9;">Official Self-Help Group (SHG) Loan Sanction Certificate</p>
      </div>

      <div style="padding: 0 4px; font-size: 15px; line-height: 1.6;">
        <p style="font-size: 16px; font-weight: 700; color: #065f46; margin: 0 0 16px;">
          Dear ${userName}, Your loan request of ₹${amount.toLocaleString('en-IN')} has been sanctioned successfully!
        </p>
        
        <p style="color: #334155; margin-bottom: 20px;">
          We are pleased to inform you that your Self-Help Group micro-credit loan application has successfully completed the 3-tier clearance process and has received final approval and sanction from the Super Admin.
        </p>

        <div style="background-color: #f0fdf4; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #047857; width: 45%; font-weight: 600;">Applicant Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #047857; font-weight: 600;">Sanctioned Loan Amount:</td>
              <td style="padding: 8px 0; color: #059669; font-weight: 800; font-size: 18px;">₹${amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #047857; font-weight: 600;">Registered Email:</td>
              <td style="padding: 8px 0; color: #0f172a; font-family: monospace;">${userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #047857; font-weight: 600;">Sanction Status:</td>
              <td style="padding: 8px 0;">
                <span style="display: inline-block; background-color: #d1fae5; color: #065f46; font-weight: 700; font-size: 12px; padding: 3px 10px; border-radius: 12px; border: 1px solid #10b981;">
                  SANCTIONED & APPROVED
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #047857; font-weight: 600;">Approval Timestamp:</td>
              <td style="padding: 8px 0; color: #334155; font-size: 13px;">${nowIst}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #475569;">
          <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Next Steps for Disbursal:</strong>
          Funds are now released for immediate transfer. If you opted for UPI transfer, the sanctioned amount will credit to your linked account. If you selected Cash disbursal, please collect it during your group's upcoming weekly meeting.
        </div>
      </div>

      <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        <p style="margin: 0 0 4px;">This is an automated notification from the <strong>Magalir Kuzhu Management System</strong>.</p>
        <p style="margin: 0;">Preserving financial transparency & women empowerment across Self-Help Groups.</p>
      </div>
    </div>
  `;
}

export async function sendLoanSanctionEmail(params: SendLoanSanctionParams): Promise<EmailLog> {
  const { userName, userEmail, amount } = params;

  // Exact subject and body per PRD specification:
  // subject: 'Loan Sanctioned - Magalir Kuzhu Management System'
  // body: 'Dear [User Name], Your loan request of ₹[Amount] has been sanctioned successfully!'
  const subject = 'Loan Sanctioned - Magalir Kuzhu Management System';
  const body = `Dear ${userName}, Your loan request of ₹${amount.toLocaleString('en-IN')} has been sanctioned successfully!`;
  const emailId = 'email_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();
  const nowIst = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
  const html = buildLoanSanctionHtml(userName, userEmail, amount, nowIst);

  try {
    const { transporter, mode, fromAddress } = await getTransporter();

    const info = await transporter.sendMail({
      from: fromAddress,
      to: userEmail,
      subject,
      text: body,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    console.log(`[EmailService] [${mode}] Sanction email sent to ${userEmail}. Message ID: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[EmailService] Ethereal preview URL: ${previewUrl}`);
    }

    const logEntry: EmailLog = {
      id: emailId,
      to: userEmail,
      subject,
      body,
      html,
      sent_at: now,
      status: 'SENT',
      delivery_mode: mode,
      preview_url: typeof previewUrl === 'string' ? previewUrl : undefined,
      info: mode === 'REAL_SMTP'
        ? `Delivered to real inbox via SMTP (${info.messageId})`
        : `Virtual sandbox dispatch (Ethereal test account). Configure SMTP to receive in Gmail.`,
    };

    db.addEmailLog(logEntry);
    return logEntry;
  } catch (err: any) {
    console.error('[EmailService] Error sending email:', err);
    const logEntry: EmailLog = {
      id: emailId,
      to: userEmail,
      subject,
      body,
      html,
      sent_at: now,
      status: 'FAILED',
      delivery_mode: 'SIMULATED',
      info: `Dispatch failed: ${err.message || 'SMTP delivery error'}`,
      error_details: err.stack || err.message,
    };

    db.addEmailLog(logEntry);
    return logEntry;
  }
}
