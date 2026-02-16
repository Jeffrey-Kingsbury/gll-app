const nodemailer = require("nodemailer");

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    host: "mail.lyhfdy52.mywhc.ca",
    port: 465,
    secure: true,
    auth: {
        user: process.env.NEXT_PUBLIC_WYATT_SENDER_EMAIL,
        pass: process.env.NEXT_PUBLIC_WYATT_SENDER_PW,
    },
});

try {
    await transporter.verify();
    console.log("SMTP connection successful");
} catch (error) {
    console.error("SMTP connection failed:", error);
}

export async function sendEmail(to, cc, bcc, subject, body) {
    try {
        await transporter.sendMail({
            from: `"Wyatt Software" <${process.env.NEXT_PUBLIC_WYATT_SENDER_EMAIL}>`,
            to,
            cc,
            bcc,
            subject,
            text: body,
        });
        console.log("Email sent successfully");
    } catch (error) {
        console.error("Email sending failed:", error);
    }
}