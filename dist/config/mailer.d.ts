import nodemailer from 'nodemailer';
export declare const transporter: nodemailer.Transporter<import("nodemailer/lib/smtp-transport").SentMessageInfo, import("nodemailer/lib/smtp-transport").Options>;
export declare const sendMail: (to: string, subject: string, html: string) => Promise<void>;
export declare const emailTemplates: {
    requestSubmitted: (refNo: string, title: string) => string;
    requestAssigned: (refNo: string, officerName: string) => string;
    statusChanged: (refNo: string, status: string) => string;
    officerAssigned: (refNo: string, title: string, note?: string) => string;
};
