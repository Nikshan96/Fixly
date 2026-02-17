const nodemailer = require('nodemailer');

const isProduction = process.env.NODE_ENV === 'production';

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: parseInt(process.env.EMAIL_PORT, 10) || 587,
	secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD
	}
});

const getDefaultFrom = () => {
	const senderName = process.env.EMAIL_SENDER_NAME || 'Fixly';
	const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
	return `"${senderName}" <${senderEmail}>`;
};

const sendEmail = async ({ to, subject, text, html, from }) => {
	if (!to || !subject || (!text && !html)) {
		throw new Error('Missing required email fields: to, subject, and text or html');
	}

	const mailOptions = {
		from: from || getDefaultFrom(),
		to,
		subject,
		text,
		html
	};

	const info = await transporter.sendMail(mailOptions);

	if (!isProduction) {
		console.log(`📧 Email sent to ${to}: ${info.messageId}`);
	}

	return info;
};

module.exports = {
	transporter,
	sendEmail
};
