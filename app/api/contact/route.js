import nodemailer from 'nodemailer';

function transporter() {
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

export async function POST(request) {
  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return Response.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const mailOptions = {
      from: `"${name}" <${process.env.GMAIL_USER}>`,
      replyTo: email,
      to: process.env.GMAIL_USER,
      subject: `New Member Login Request from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nThis person has requested access to the family portal.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #C49B1A; margin-bottom: 1rem;">New Member Login Request</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 0.5rem 0; color: rgba(0,0,0,0.45); font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid rgba(212,175,55,0.15);">Name</td>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid rgba(212,175,55,0.15);">${name}</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0; color: rgba(0,0,0,0.45); font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid rgba(212,175,55,0.15);">Email</td>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid rgba(212,175,55,0.15);">${email}</td>
            </tr>
          </table>
          <p style="margin-top: 1.5rem; font-size: 0.875rem; color: rgba(0,0,0,0.5);">This person has requested access to the family portal via the website contact form.</p>
        </div>
      `,
    };

    const transport = transporter();
    await transport.sendMail(mailOptions);

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to send email' }, { status: 500 });
  }
}
