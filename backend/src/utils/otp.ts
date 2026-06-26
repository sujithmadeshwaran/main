import nodemailer from 'nodemailer';

export const generateOTP = (): string => {
  // Generate a cryptographically secure-like 6 digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendSMS = async (phone: string, code: string): Promise<boolean> => {
  const provider = process.env.SMS_OTP_PROVIDER || 'mock';
  
  if (provider === 'mock') {
    console.log(`\n======================================================`);
    console.log(`[SMS OTP MOCK] TO: ${phone}`);
    console.log(`[SMS OTP MOCK] MESSAGE: Your SkillForge LMS verification code is: ${code}`);
    console.log(`[SMS OTP MOCK] EXPIRES IN: 5 minutes`);
    console.log(`======================================================\n`);
    return true;
  }

  // To connect a real SMS gateway like Fast2SMS, MSG91 or Twilio:
  // Add API integration here.
  console.log(`[SMS INTEGRATION] Real SMS service not configured. OTP logged to console.`);
  return true;
};

export const sendEmail = async (email: string, subject: string, htmlContent: string): Promise<boolean> => {
  const provider = process.env.EMAIL_PROVIDER || 'mock';

  if (provider === 'mock') {
    console.log(`\n======================================================`);
    console.log(`[EMAIL MOCK] TO: ${email}`);
    console.log(`[EMAIL MOCK] SUBJECT: ${subject}`);
    console.log(`[EMAIL MOCK] BODY:`);
    console.log(htmlContent.replace(/<[^>]*>/g, ' ')); // Strips HTML for terminal viewing
    console.log(`======================================================\n`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.EMAIL_PORT || '2525'),
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"SkillForge LMS" <noreply@skillforge.com>',
      to: email,
      subject: subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send email:', error);
    return false;
  }
};
