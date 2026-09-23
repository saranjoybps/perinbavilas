import nodemailer from 'nodemailer';

const SITE_NAME = 'Perinba Vilas';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pvtweb.vercel.app').replace(/\/$/, '');
const LOGIN_URL = `${SITE_URL}/login`;

let cachedTransport = null;

function createTransport() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
    throw new Error('Gmail SMTP is not configured (GMAIL_USER / GMAIL_PASSWORD).');
  }

  if (cachedTransport) return cachedTransport;

  cachedTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
    rateDelta: 1000,
    rateLimit: 2,
  });

  return cachedTransport;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildMailOptions({ email, displayName, password }) {
  const safeName = escapeHtml(displayName || 'Family Member');
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);

  return {
    from: `"${SITE_NAME}" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Welcome to ${SITE_NAME} – Your Member Portal Access`,
    text: [
      `Hello ${displayName || 'Family Member'},`,
      '',
      `Welcome to ${SITE_NAME}.`,
      '',
      `Our family website brings our heritage, memories, and family records together in one place. You now have access to the Member Portal, where you can view your family profile and stay connected with the Perinba Vilas community.`,
      '',
      `Website: ${SITE_URL}`,
      `Portal login: ${LOGIN_URL}`,
      '',
      'Your login details:',
      `Name: ${displayName || 'Family Member'}`,
      `Email: ${email}`,
      `Temporary password: ${password}`,
      '',
      'Please sign in and change your password after your first login.',
      '',
      'With warm regards,',
      `${SITE_NAME} Team`,
    ].join('\n'),
    html: `
      <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; background: #FFF7ED; border: 1px solid rgba(15, 42, 31,0.25); overflow: hidden;">
        <div style="background: #1A1008; padding: 28px 24px; text-align: center;">
          <p style="margin: 0 0 6px; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 0.68rem; letter-spacing: 0.28em; text-transform: uppercase; color: rgba(15, 42, 31,0.85);">Family Portal</p>
          <h1 style="color: #0F2A1F; margin: 0; font-size: 1.45rem; font-weight: 400;">${SITE_NAME}</h1>
        </div>

        <div style="padding: 32px 28px;">
          <h2 style="color: #1A1008; font-size: 1.2rem; font-weight: 400; margin: 0 0 14px;">Welcome, ${safeName}</h2>

          <p style="font-family: 'Segoe UI', Tahoma, sans-serif; color: rgba(26,16,8,0.72); line-height: 1.7; margin: 0 0 14px; font-size: 0.92rem;">
            Thank you for joining our family website. ${SITE_NAME} is a home for our shared heritage, stories, and family records — a place to stay connected across generations.
          </p>
          <p style="font-family: 'Segoe UI', Tahoma, sans-serif; color: rgba(26,16,8,0.72); line-height: 1.7; margin: 0 0 22px; font-size: 0.92rem;">
            Your Member Portal account is ready. Use the details below to sign in and view your family profile.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-family: 'Segoe UI', Tahoma, sans-serif;">
            <tr>
              <td style="padding: 10px 12px; background: rgba(15, 42, 31,0.08); font-size: 0.68rem; color: rgba(26,16,8,0.45); letter-spacing: 0.12em; text-transform: uppercase; border: 1px solid rgba(15, 42, 31,0.15);">Name</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px 12px; color: #1A1008; font-size: 0.95rem; border: 1px solid rgba(15, 42, 31,0.15); border-top: none;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; background: rgba(15, 42, 31,0.08); font-size: 0.68rem; color: rgba(26,16,8,0.45); letter-spacing: 0.12em; text-transform: uppercase; border: 1px solid rgba(15, 42, 31,0.15); border-top: none;">Email</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px 12px; color: #1A1008; font-size: 0.95rem; border: 1px solid rgba(15, 42, 31,0.15); border-top: none;">${safeEmail}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; background: rgba(15, 42, 31,0.08); font-size: 0.68rem; color: rgba(26,16,8,0.45); letter-spacing: 0.12em; text-transform: uppercase; border: 1px solid rgba(15, 42, 31,0.15); border-top: none;">Temporary Password</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px 12px; color: #1A1008; font-size: 0.95rem; border: 1px solid rgba(15, 42, 31,0.15); border-top: none; font-family: Consolas, Monaco, monospace;">${safePassword}</td>
            </tr>
          </table>

          <p style="font-family: 'Segoe UI', Tahoma, sans-serif; color: rgba(26,16,8,0.55); font-size: 0.82rem; margin: 0 0 8px;">
            Website: <a href="${SITE_URL}" style="color: #0F2A1F; text-decoration: none;">${SITE_URL}</a>
          </p>
          <p style="font-family: 'Segoe UI', Tahoma, sans-serif; color: rgba(26,16,8,0.55); font-size: 0.82rem; margin: 0 0 22px;">
            Portal login: <a href="${LOGIN_URL}" style="color: #0F2A1F; text-decoration: none;">${LOGIN_URL}</a>
          </p>

          <a href="${LOGIN_URL}" style="display: block; text-align: center; background: #0F2A1F; color: #FFF7ED; text-decoration: none; padding: 13px 16px; font-family: 'Segoe UI', Tahoma, sans-serif; font-weight: 600; font-size: 0.88rem; letter-spacing: 0.06em; text-transform: uppercase;">
            Sign In to Member Portal
          </a>

          <p style="font-family: 'Segoe UI', Tahoma, sans-serif; color: rgba(26,16,8,0.45); font-size: 0.78rem; margin: 18px 0 0; text-align: center; line-height: 1.5;">
            For your security, please change your temporary password after signing in.
          </p>
        </div>

        <div style="background: rgba(26,16,8,0.04); padding: 16px; text-align: center; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 0.72rem; color: rgba(26,16,8,0.4);">
          ${SITE_NAME} &bull; <a href="${SITE_URL}" style="color: #0F2A1F; text-decoration: none;">${SITE_URL}</a>
        </div>
      </div>
    `,
  };
}

/**
 * Sends an onboarding email after an admin creates a member account
 * (single add or bulk import).
 */
export async function sendWelcomeEmail({ email, displayName, password }) {
  const transport = createTransport();
  await transport.sendMail(buildMailOptions({ email, displayName, password }));
}

/**
 * Send welcome email with retries. Throws only after all attempts fail.
 */
export async function sendWelcomeEmailWithRetry(
  { email, displayName, password },
  { attempts = 3, baseDelayMs = 600 } = {},
) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      await sendWelcomeEmail({ email, displayName, password });
      return { ok: true, attempts: i + 1 };
    } catch (err) {
      lastError = err;
      console.error(
        `Welcome email attempt ${i + 1}/${attempts} failed for ${email}:`,
        err?.message || err,
      );
      // Reset pooled transport on connection errors so the next try gets a fresh socket
      if (/ECONN|ETIMEDOUT|ECONNRESET|socket|TLS|Greeting/i.test(String(err?.message || ''))) {
        try {
          cachedTransport?.close?.();
        } catch {
          /* ignore */
        }
        cachedTransport = null;
      }
      if (i < attempts - 1) {
        await sleep(baseDelayMs * (i + 1));
      }
    }
  }
  throw lastError || new Error('Failed to send welcome email');
}
