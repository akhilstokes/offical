const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        let transporter;
        let fromAddress = process.env.EMAIL_FROM || 'Holy Family Polymers <noreply@hfp.com>';

        // Prefer real SMTP if configured; otherwise fall back to Ethereal (dev only)
        if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT || 587,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
                tls: {
                    rejectUnauthorized: false // Accept self-signed certificates
                }
            });
        } else {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            fromAddress = 'Holy Family Polymers <test@ethereal.email>';
            console.log('Using Ethereal test SMTP. Messages are not delivered to real inboxes.');
        }

        // 2. Define the email options
        const mailOptions = {
            from: fromAddress,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html || options.message, // Support HTML emails
        };

        // 3. Actually send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        const preview = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
        if (preview) {
            console.log('Preview URL:', preview);
        }
        return { ...info, previewUrl: preview };
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};

module.exports = sendEmail;