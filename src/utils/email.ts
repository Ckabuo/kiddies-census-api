import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendInviteEmail = async (email: string, token: string): Promise<void> => {
  const transporter = createTransporter();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const inviteLink = `${frontendUrl}/onboarding?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Invitation to Join Kiddies - Counting God\'s Army',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">Welcome to Kiddies!</h2>
        <p>You have been invited to join the Kiddies census application.</p>
        <p>Click the button below to complete your registration:</p>
        <a href="${inviteLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Complete Registration
        </a>
        <p style="color: #718096; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${inviteLink}">${inviteLink}</a>
        </p>
        <p style="color: #718096; font-size: 12px; margin-top: 30px;">
          This invitation will expire in 7 days.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invite email sent to ${email}`);
  } catch (error) {
    console.error('Error sending invite email:', error);
    throw error;
  }
};
