import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const sendMail = async (to: string, subject: string, html: string) => {
  if (!process.env.SMTP_USER) return
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'MIVA Facilities <no-reply@miva.university>',
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error('Mail send failed:', err)
  }
}

export const emailTemplates = {
  requestSubmitted: (refNo: string, title: string) => `
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
  requestAssigned: (refNo: string, officerName: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Request Assigned</h2>
      <p>Request <strong>${refNo}</strong> has been assigned to <strong>${officerName}</strong>.</p>
      <p>Work will begin soon. You will receive updates as the status changes.</p>
    </div>
  `,
  statusChanged: (refNo: string, status: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Request Status Updated</h2>
      <p>Request <strong>${refNo}</strong> status has changed to <strong>${status}</strong>.</p>
    </div>
  `,
  officerAssigned: (refNo: string, title: string, note?: string) => `
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
}
