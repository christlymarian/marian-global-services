const nodemailer = require("nodemailer");
const Busboy = require("busboy");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return new Promise((resolve) => {
    const busboy = Busboy({ headers: event.headers });
    const fields = {};
    let attachment = null;

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (name, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];

      file.on("data", (d) => chunks.push(d));
      file.on("end", () => {
        attachment = {
          filename,
          content: Buffer.concat(chunks),
          contentType: mimeType,
        };
      });
    });

    busboy.on("finish", async () => {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: "christlymarian17@gmail.com",
          subject: "New Quote Request",
          text: JSON.stringify(fields, null, 2),
          attachments: attachment ? [attachment] : [],
        });

        resolve({
          statusCode: 200,
          body: JSON.stringify({ ok: true }),
        });
      } catch (err) {
        console.error("MAIL ERROR:", err);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ ok: false, error: err.message }),
        });
      }
    });

    busboy.end(Buffer.from(event.body, "base64"));
  });
};
