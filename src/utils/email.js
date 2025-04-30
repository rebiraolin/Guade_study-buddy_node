const nodemailer = require('nodemailer');

exports.sendResetPasswordEmail = async (email, resetLink) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address from .env
        pass: process.env.EMAIL_PASS, // Your App Password from .env
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>You are receiving this email because you (or someone else) have requested the reset of your account password.</p>
                   <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                   <p><a href="${resetLink}">${resetLink}</a></p>
                   <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                   <p>This link will expire in 1 hour.</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully to', email);
  } catch (error) {
    console.error('Error sending reset password email:', error);
  }
};
