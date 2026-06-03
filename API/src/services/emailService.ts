import nodemailer from 'nodemailer';

type EmailPayload = {
    to: string;
    subject: string;
    text: string;
    html: string;
};

function parsePort(value: string | undefined): number | null {
    if (!value) {
        return null;
    }

    const port = Number(value);
    return Number.isInteger(port) && port > 0 ? port : null;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
    const host = process.env.SMTP_HOST?.trim();
    const port = parsePort(process.env.SMTP_PORT);
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const from = process.env.MAIL_FROM?.trim() || user || 'no-reply@field-outreach.local';

    if (!host || !port) {
        console.info('[emailService] SMTP is not configured. Email payload:', {
            to: payload.to,
            subject: payload.subject,
            from
        });
        console.info(payload.text);
        return;
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true',
        auth: user && pass ? { user, pass } : undefined
    });

    await transporter.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html
    });
}
