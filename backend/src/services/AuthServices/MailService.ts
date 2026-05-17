const nodemailer = require("nodemailer");

import AppError from "../../errors/AppError";

type SendMailData = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let transporter = null;

const parseBoolean = (value?: string): boolean => {
  return ["1", "true", "yes", "on"].includes(
    String(value || "").toLowerCase()
  );
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new AppError("ERR_SMTP_NOT_CONFIGURED", 503);
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: parseBoolean(process.env.SMTP_SECURE),
    auth: {
      user,
      pass
    }
  });

  return transporter;
};

const MailService = async ({ to, subject, html, text }: SendMailData) => {
  const from = process.env.SMTP_FROM || process.env.EMAIL_ADDRESS;

  if (!from) {
    throw new AppError("ERR_SMTP_FROM_NOT_CONFIGURED", 503);
  }

  const smtpTransporter = getTransporter();

  await smtpTransporter.sendMail({
    from,
    to,
    subject,
    html,
    text
  });
};

export default MailService;