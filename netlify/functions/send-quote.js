// netlify/functions/send-quote.js
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL;
const SENDER_EMAIL = process.env.SENDER_EMAIL || SMTP_USER;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

const htmlForAdmin = (form) => {
  const rows = Object.entries(form || {})
    .filter(([k]) => k !== 'attachments')
    .map(([k, v]) => `<tr><td style="padding:6px 10px;font-weight:600;border:1px solid #eee;">${k}</td><td style="padding:6px 10px;border:1px solid #eee;">${String(v)}</td></tr>`)
    .join('');
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:700px;">
      <h2>New Quote Request</h2>
      <table style="border-collapse:collapse;width:100%">${rows}</table>
      <p>Attached files (if any) are included below.</p>
      <hr/>
      <footer style="font-size:12px;color:#666">Marian Global Services</footer>
    </div>
  `;
};

const htmlForClient = (form) => {
  const name = form?.name || 'Client';
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:700px;">
      <h2>Thanks, ${name} — we received your request</h2>
      <p>We will respond soon. A summary of your submission:</p>
      <ul>
        ${Object.entries(form || {}).map(([k,v]) => `<li><strong>${k}:</strong> ${String(v)}</li>`).join('')}
      </ul>
      <p>Regards,<br/>Marian Global Services</p>
    </div>
  `;
};

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // handle base64 encoded body or raw JSON
    const raw = event.body && (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body);
    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;

    const { form = {}, attachments = [] } = payload;

    const mailAttachments = Array.isArray(attachments)
      ? attachments.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content, 'base64'),
          contentType: a.contentType || undefined,
        }))
      : [];

    // Send admin email
    await transporter.sendMail({
      from: SENDER_EMAIL,
      to: RECEIVER_EMAIL,
      subject: `New Quote Request — ${form.name || 'No name'}`,
      html: htmlForAdmin(form),
      attachments: mailAttachments,
    });

    // Send confirmation to client if email provided
    if (form.email) {
      await transporter.sendMail({
        from: SENDER_EMAIL,
        to: form.email,
        subject: `We received your quote request — ${form.name || ''}`,
        html: htmlForClient(form),
      });
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, message: 'Emails sent' }) };
  } catch (err) {
    console.error('send-quote error:', err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(err) }) };
  }
};
