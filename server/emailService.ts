import nodemailer, { type Transporter } from 'nodemailer';
import { db, EmailLog } from './db';

interface SendLoanSanctionParams {
  userName: string;
  userEmail: string;
  amount: number;
}

let testTransporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  if (testTransporter) {
    return testTransporter;
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[EmailService] Created Ethereal test mail account:', testAccount.user);
    return testTransporter;
  } catch (err) {
    console.warn('[EmailService] Could not create Ethereal test account, using JSON transport fallback:', err);
    testTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return testTransporter;
  }
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

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: '"Magalir Kuzhu Management System" <no-reply@magalirkuzhu.org>',
      to: userEmail,
      subject,
      text: body,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #0b192c; margin: 0; font-size: 20px;">Magalir Kuzhu Management System</h2>
            <p style="color: #64748b; margin: 4px 0 0; font-size: 13px;">Official Self-Help Group (SHG) Loan Sanction Notice</p>
          </div>
          <div style="font-size: 15px; line-height: 1.6; color: #1e293b;">
            <p style="font-weight: 600; color: #0f172a; margin-bottom: 16px;">${body}</p>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Member Name:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Sanctioned Amount:</td>
                  <td style="padding: 6px 0; color: #059669; font-weight: 700; font-size: 16px;">₹${amount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Registered Email:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${userEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Sanction Timestamp:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
                </tr>
              </table>
            </div>
            <p style="color: #475569; font-size: 13px;">The funds have been approved for disbursal in accordance with your chosen disbursal mode. Please check your Magalir Kuzhu portal account for tracking.</p>
          </div>
          <div style="margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 12px; color: #94a3b8; text-align: center;">
            This is an automated notification from the Magalir Kuzhu Management System.
          </div>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    console.log(`[EmailService] Sanction email sent to ${userEmail}. Message ID: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[EmailService] Ethereal live preview URL: ${previewUrl}`);
    }

    const logEntry: EmailLog = {
      id: emailId,
      to: userEmail,
      subject,
      body,
      sent_at: now,
      status: 'SENT',
      preview_url: typeof previewUrl === 'string' ? previewUrl : undefined,
      info: `Delivered via nodemailer. MessageId: ${info.messageId}`,
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
      sent_at: now,
      status: 'SIMULATED',
      info: `Dispatch recorded (offline mode: ${err.message || 'SMTP fallback'})`,
    };
    db.addEmailLog(logEntry);
    return logEntry;
  }
}
