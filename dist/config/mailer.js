"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplates = exports.sendMail = exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
exports.transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendMail = async (to, subject, html) => {
    if (!process.env.SMTP_USER)
        return;
    try {
        await exports.transporter.sendMail({
            from: process.env.MAIL_FROM || 'MIVA Facilities <no-reply@miva.university>',
            to,
            subject,
            html,
        });
    }
    catch (err) {
        console.error('Mail send failed:', err);
    }
};
exports.sendMail = sendMail;
exports.emailTemplates = {
    requestSubmitted: (refNo, title) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Request Submitted Successfully</h2>
      <p>Your maintenance request has been received.</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px; font-weight: bold;">Reference:</td><td style="padding: 8px;">${refNo}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Title:</td><td style="padding: 8px;">${title}</td></tr>
      </table>
      <p>You will be notified when your request is assigned to a maintenance officer.</p>
    </div>
  `,
    requestAssigned: (refNo, officerName) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Request Assigned</h2>
      <p>Request <strong>${refNo}</strong> has been assigned to <strong>${officerName}</strong>.</p>
      <p>Work will begin soon. You will receive updates as the status changes.</p>
    </div>
  `,
    statusChanged: (refNo, status) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Request Status Updated</h2>
      <p>Request <strong>${refNo}</strong> status has changed to <strong>${status}</strong>.</p>
    </div>
  `,
    officerAssigned: (refNo, title, note) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">New Job Assigned</h2>
      <p>You have been assigned a new maintenance request.</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px; font-weight: bold;">Reference:</td><td style="padding: 8px;">${refNo}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Title:</td><td style="padding: 8px;">${title}</td></tr>
        ${note ? `<tr><td style="padding: 8px; font-weight: bold;">Note:</td><td style="padding: 8px;">${note}</td></tr>` : ''}
      </table>
      <p>Please log in to view the full details and begin work.</p>
    </div>
  `,
};
//# sourceMappingURL=mailer.js.map