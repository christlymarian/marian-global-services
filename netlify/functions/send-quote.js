// netlify/functions/send-quote.js
const nodemailer = require('nodemailer');
const Busboy = require('busboy');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  return new Promise((resolve) => {
    // Normalize headers for Busboy
    const headers = {};
    for (const k in event.headers) headers[k.toLowerCase()] = event.headers[k];

    const busboy = new Busboy({ headers });
    const fields = {};
    const files = [];

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const buffers = [];
      file.on('data', (data) => buffers.push(data));
      file.on('end', () => {
        files.push({
          fieldname,
          filename,
          content: Buffer.concat(buffers),
          contentType: mimetype
        });
      });
    });

    busboy.on('field', (fieldname, val) => {
      // keep last value if duplicated
      fields[fieldname] = val;
    });

    busboy.on('finish', async () => {
      try {
        // Setup transporter via SMTP environment variables (set these in Netlify)
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        // Email to site owner (Zoho address)
        const mailOptionsToYou = {
          from: `"Marian Global Services" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: process.env.TO_EMAIL,
          subject: `New Quote Request from ${fields.name || fields.email || 'Website'}`,
          text: [
            `Name: ${fields.name || ''}`,
            `Email: ${fields.email || ''}`,
            `Phone: ${fields.country_code || ''} ${fields.phone || ''}`,
            `Target languages: ${fields.target_languages || ''}`,
            `Details: ${fields.details || ''}`
          ].join('\n\n'),
          attachments: files.map(f => ({
            filename: f.filename,
            content: f.content,
            contentType: f.contentType
          }))
        };

        await transporter.sendMail(mailOptionsToYou);

        // Optional autoresponder to submitter
        if (fields.email) {
          try {
            await transporter.sendMail({
              from: `"Marian Global Services" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
              to: fields.email,
              subject: 'Thanks — we received your quote request',
              text: `Hi ${fields.name || ''},\n\nThanks for contacting Marian Global Services. We have received your request and will reply shortly.\n\nRegards,\nMarian Global Services`
            });
          } catch (autErr) {
            console.warn('Autoresponder failed:', autErr && autErr.message);
          }
        }

        resolve({ statusCode: 200, body: JSON.stringify({ message: 'Form submitted successfully.' }) });
      } catch (err) {
        console.error('send error', err && (err.stack || err.message || err));
        resolve({ statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal error' }) });
      }
    });

    // Support Netlify base64-encoded body
    const bodyBuffer = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'utf8');
    busboy.end(bodyBuffer);
  });
};
