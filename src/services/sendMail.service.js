const nodemailer = require('nodemailer');
require('dotenv').config();

//
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

const sendEmail = async (to, mailData) => {
    const mailConfig = {
        from: {
            name: 'Newpee',
            address: process.env.SMTP_USER,
        },
        to: [to],
        subject: mailData.subject,
        text: mailData.text,
        html: mailData.html,
    };
    try {
        await transporter.sendMail(mailConfig);
    } catch (e) {
        console.error(e);
        throw new Error(e);
    }
};
