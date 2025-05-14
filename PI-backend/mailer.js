require('dotenv').config();
const nodemailer = require('nodemailer');

// Créer le transporteur SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail', // Utiliser le service Gmail
    auth: {
        user: process.env.EMAIL_USER, // Votre adresse email
        pass: process.env.EMAIL_PASS // Votre mot de passe d'application
    }
});

// Fonction pour envoyer un email
function sendEmail(to, subject, text) {
    const mailOptions = {
        from: process.env.EMAIL_USER, // Adresse de l'expéditeur
        to: to,
        subject: subject,
        text: text
    };

    return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };