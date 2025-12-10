// server.js - complete ready-to-run server
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json()); // for JSON body
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 4000;

// Simple transporter factory (centralized)
function createTransporter() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // using STARTTLS on 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false // allow provider certs (helpful during dev)
    }
  });

  transporter.verify((err, success) => {
    if (err) console.error('Transporter verify error:', err);
    else console.log('Server is ready to send messages');
  });

  return transporter;
}

// ---------- JSON-only endpoint (no file) ----------
app.post('/send-quote', async (req, res) => {
  try {
    console.log('/send-quote called with body:', req.body);
    const { name='', email='', company='', country_code='', phone='', target_lang='', message='' } = req.body || {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email address' });

    const transporter = createTransporter();

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width:700px;">
        <h2 style="color:#0F1D3C;">New Quote Request</h2>
        <table style="width:100%; border-collapse: collapse;">
          <tr><td><strong>Name:</strong></td><td>${escapeHtml(name)}</td></tr>
          <tr><td><strong>Company:</strong></td><td>${escapeHtml(company)}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${escapeHtml(email)}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${escapeHtml(country_code)} ${escapeHtml(phone)}</td></tr>
          <tr><td><strong>Target Languages:</strong></td><td>${escapeHtml(target_lang)}</td></tr>
          <tr><td><strong>Message:</strong></td><td>${escapeHtml(message).replace(/\n/g,'<br>')}</td></tr>
        </table>
        <p>Received at ${new Date().toLocaleString()}</p>
      </div>
    `;

    const adminMail = {
      from: `"Marian Global Services" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL || process.env.SMTP_USER,
      replyTo: email,
      subject: `Quote Request: ${name || email}`,
      html: adminHtml
    };

    const infoAdmin = await transporter.sendMail(adminMail);
    console.log('Admin mail sent:', infoAdmin.messageId);

    // confirmation email to client
    const clientHtml = `
      <div style="font-family: Arial, sans-serif; max-width:700px;">
        <h2 style="color:#0F1D3C;">Thank you for contacting Marian Global Services, ${escapeHtml(name)}!</h2>
        <p>We have received your request and will review it. We will contact you shortly.</p>
        <p><strong>Summary:</strong></p>
        <ul>
          <li>Email: ${escapeHtml(email)}</li>
          <li>Target Languages: ${escapeHtml(target_lang)}</li>
        </ul>
        <p style="font-size:0.9em;color:#666;">Marian Global Services</p>
      </div>
    `;

    const clientMail = {
      from: `"Marian Global Services" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Marian Global Services — We received your request`,
      html: clientHtml,
      replyTo: process.env.TO_EMAIL || process.env.SMTP_USER
    };

    const infoClient = await transporter.sendMail(clientMail);
    console.log('Client mail sent:', infoClient.messageId);

    return res.json({ success: true });
  } catch (err) {
    console.error('/send-quote error:', err);
    return res.status(500).json({ error: err && err.message ? err.message : 'Unable to send email' });
  }
});

// ---------- Multipart handler (file uploads) ----------
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) {
    const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g,'_');
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    // allow all types here; restrict if desired
    cb(null, true);
  }
});

app.post('/send-quote-multipart', upload.single('file_upload'), async (req, res) => {
  try {
    console.log('/send-quote-multipart called. body:', req.body, 'file:', req.file && req.file.path);
    const { name='', email='', company='', country_code='', phone='', target_lang='', message='' } = req.body || {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email address' });

    const transporter = createTransporter();

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width:700px;">
        <h2 style="color:#0F1D3C;">New Quote Request (with attachment)</h2>
        <table style="width:100%; border-collapse: collapse;">
          <tr><td><strong>Name:</strong></td><td>${escapeHtml(name)}</td></tr>
          <tr><td><strong>Company:</strong></td><td>${escapeHtml(company)}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${escapeHtml(email)}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${escapeHtml(country_code)} ${escapeHtml(phone)}</td></tr>
          <tr><td><strong>Target Languages:</strong></td><td>${escapeHtml(target_lang)}</td></tr>
          <tr><td><strong>Message:</strong></td><td>${escapeHtml(message).replace(/\n/g,'<br>')}</td></tr>
        </table>
        <p>Received at ${new Date().toLocaleString()}</p>
      </div>
    `;

    const mailOptionsAdmin = {
      from: `"Marian Global Services" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL || process.env.SMTP_USER,
      replyTo: email,
      subject: `Quote Request (Attachment): ${name || email}`,
      html: adminHtml
    };

    if (req.file && req.file.path) {
      mailOptionsAdmin.attachments = [{ filename: req.file.originalname, path: req.file.path }];
    }

    const infoAdmin = await transporter.sendMail(mailOptionsAdmin);
    console.log('Admin mail sent (with attachment):', infoAdmin.messageId);

    const clientHtml = `
      <div style="font-family: Arial, sans-serif; max-width:700px;">
        <h2 style="color:#0F1D3C;">Thank you for contacting Marian Global Services, ${escapeHtml(name)}!</h2>
        <p>We have received your request and the attached sample. Our team will review it and contact you shortly.</p>
        <p style="font-size:0.9em;color:#666;">Marian Global Services</p>
      </div>
    `;

    const infoClient = await transporter.sendMail({
      from: `"Marian Global Services" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Marian Global Services — We received your request`,
      html: clientHtml,
      replyTo: process.env.TO_EMAIL || process.env.SMTP_USER
    });
    console.log('Client mail sent:', infoClient.messageId);

    // cleanup uploaded file
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.warn('Could not delete temp file:', req.file.path, err.message);
        else console.log('Temp file removed:', req.file.path);
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('/send-quote-multipart error:', err);
    if (req.file && req.file.path) try { fs.unlinkSync(req.file.path); } catch(e){}
    return res.status(500).json({ error: err && err.message ? err.message : 'Unable to send email' });
  }
});

// helper: escape HTML
function escapeHtml(str='') {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

app.listen(PORT, () => {
  console.log(`🚀 Email server running on http://localhost:${PORT}`);
});
