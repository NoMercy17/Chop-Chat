const nodemailer = require('nodemailer');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('[emailService] EMAIL_USER or EMAIL_PASS not set — email sending will fail.');
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildVerificationLinkEmailHTML({ name, verificationUrl }) {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(verificationUrl);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#FFFFFF;border-radius:16px;overflow:hidden;
                 box-shadow:0 4px 24px rgba(0,0,0,0.06);max-width:520px;">
          <tr>
            <td style="background:#1C1C1C;padding:28px 40px;text-align:center;">
              <span style="color:#F5C97A;font-size:22px;font-weight:700;
                           letter-spacing:2px;text-transform:uppercase;">
                CHOP &amp; CHAT
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:48px 40px 32px;">
              <p style="margin:0 0 8px;font-size:13px;color:#9E8E7A;
                         text-transform:uppercase;letter-spacing:1.5px;">
                Email verification
              </p>
              <h1 style="margin:0 0 16px;font-size:26px;color:#1C1C1C;
                          font-weight:700;line-height:1.2;">
                You're almost in, ${safeName}.
              </h1>
              <p style="margin:0 0 36px;font-size:16px;color:#6B6052;line-height:1.6;">
                Click the button below to verify your email and start sharing
                your recipes with the world.
              </p>
              <div style="text-align:center;margin-bottom:36px;">
                <a href="${safeUrl}"
                   style="display:inline-block;background:#1C1C1C;color:#F5C97A;
                          font-size:16px;font-weight:700;letter-spacing:0.5px;
                          padding:16px 40px;border-radius:12px;text-decoration:none;">
                  Verify my email
                </a>
              </div>
              <p style="margin:0 0 12px;font-size:13px;color:#B0A090;text-align:center;">
                This link expires in <strong>2 hours</strong>
              </p>
              <p style="margin:0;font-size:13px;color:#9E8E7A;line-height:1.6;">
                Button not working? Copy and paste this link into your browser:<br>
                <span style="color:#6B6052;word-break:break-all;">${safeUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #F0EAE0;">
              <p style="margin:0;font-size:12px;color:#C4B8A8;text-align:center;">
                You're receiving this because you created an account on Chop &amp; Chat.<br>
                If this wasn't you, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendVerificationLinkEmail({ to, name, verificationUrl }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service not configured: EMAIL_USER or EMAIL_PASS is missing from environment');
  }

  await transporter.sendMail({
    from: `Chop & Chat <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your Chop & Chat account',
    html: buildVerificationLinkEmailHTML({ name, verificationUrl }),
  });
}

module.exports = { sendVerificationLinkEmail };
