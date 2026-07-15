import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });
}

const SITE_NAME = 'Perinba Vilas';
const LOGIN_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://pvtweb.vercel.app'}/login`;

export async function sendWelcomeEmail({ email, displayName, password }) {
  const transport = createTransport();

  const mailOptions = {
    from: `"${SITE_NAME}" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Welcome to ${SITE_NAME} – Your Account Has Been Created`,
    text: `Hello ${displayName},\n\nYour account has been created on ${SITE_NAME}.\n\nYou can log in at: ${LOGIN_URL}\n\nYour login credentials:\nEmail: ${email}\nTemporary Password: ${password}\n\nPlease change your password after logging in.\n\nBest regards,\n${SITE_NAME} Team`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1a1a2e; padding: 24px; text-align: center;">
          <h1 style="color: #C49B1A; margin: 0; font-size: 1.25rem;">${SITE_NAME}</h1>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="color: #1a1a2e; font-size: 1.125rem; margin: 0 0 16px;">Welcome, ${displayName}!</h2>
          <p style="color: #444; line-height: 1.6; margin: 0 0 20px;">Your account has been created. Use the credentials below to sign in and access the family portal.</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 12px; background: #f0f0f5; border-radius: 6px 6px 0 0; font-size: 0.75rem; color: #888; letter-spacing: 0.05em; text-transform: uppercase;">Email</td>
            </tr>
            <tr>
              <td style="padding: 0 12px 10px; border-bottom: 1px solid #e0e0e0; font-size: 0.95rem; color: #1a1a2e;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; font-size: 0.75rem; color: #888; letter-spacing: 0.05em; text-transform: uppercase;">Temporary Password</td>
            </tr>
            <tr>
              <td style="padding: 0 12px 10px; border-bottom: 1px solid #e0e0e0; font-size: 0.95rem; color: #1a1a2e;">${password}</td>
            </tr>
          </table>
          <a href="${LOGIN_URL}" style="display: block; text-align: center; background: #C49B1A; color: #fff; text-decoration: none; padding: 12px; border-radius: 6px; font-weight: 600; font-size: 0.95rem;">Sign In to Your Account</a>
          <p style="color: #888; font-size: 0.8rem; margin: 16px 0 0; text-align: center;">For security, please change your password after signing in.</p>
        </div>
        <div style="background: #f0f0f5; padding: 16px; text-align: center; font-size: 0.75rem; color: #aaa;">
          ${SITE_NAME} &bull; Family Portal
        </div>
      </div>
    `,
  };

  await transport.sendMail(mailOptions);
}
