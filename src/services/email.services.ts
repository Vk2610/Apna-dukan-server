
import transporter from "../config/email.js";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (input: SendEmailInput) => {
  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    console.log("Email sent successfully:", result.messageId);

    return result;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("EMAIL_SEND_FAILED");
  }
};

interface SendVerificationEmailInput {
  to: string;
  name: string;
  verificationUrl: string;
}

export const sendVerificationEmail = async ({
  to,
  name,
  verificationUrl,
}: SendVerificationEmailInput) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email address</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F3E9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #303630;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F7F3E9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border: 1px solid #E2DDD4; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(36, 70, 56, 0.06);">
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #244638; padding: 28px 32px; text-align: left;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 36px; height: 36px; background-color: #2E5746; border-radius: 10px; text-align: center; line-height: 36px;">
                      <span style="color: #F7F3E9; font-size: 20px;">🏪</span>
                    </div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 12px;">
                    <span style="color: #F7F3E9; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">ApnaDukan</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h1 style="color: #244638; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.3px;">
                Verify your email address
              </h1>
              <p style="color: #303630; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
                Hello <strong>${name || "Shopkeeper"}</strong>,
              </p>
              <p style="color: #556255; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
                Thank you for creating an account on ApnaDukan. Please verify your email address to confirm your registration and begin managing your shop with ease.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" target="_blank" style="display: block; width: 100%; max-width: 280px; background-color: #244638; color: #F7F3E9; text-align: center; padding: 14px 20px; border-radius: 12px; font-size: 15px; font-weight: 600; text-decoration: none; box-sizing: border-box;">
                      Verify Email Address →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice on Expiry -->
              <div style="background-color: #F4EFE6; border-left: 4px solid #C8AD7F; padding: 12px 16px; border-radius: 6px; margin: 0 0 24px 0;">
                <p style="color: #606C62; font-size: 13.5px; margin: 0; line-height: 1.5;">
                  ⏱ <strong>Note:</strong> This verification link expires in <strong>15 minutes</strong>.
                </p>
              </div>

              <!-- Fallback Link -->
              <p style="color: #7A877B; font-size: 12.5px; line-height: 1.6; margin: 0 0 20px 0; word-break: break-all;">
                If the button above does not work, copy and paste this link into your browser:<br/>
                <a href="${verificationUrl}" style="color: #416B52; text-decoration: underline;">${verificationUrl}</a>
              </p>

              <!-- Security Disclaimer -->
              <p style="color: #8C968C; font-size: 12px; line-height: 1.5; margin: 0; border-top: 1px solid #E2DDD4; padding-top: 20px;">
                If you did not create an ApnaDukan account, you can safely ignore this email. No shop will be created with your email address.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FDFBF7; padding: 18px 32px; border-top: 1px solid #E2DDD4; text-align: center;">
              <p style="color: #8C968C; font-size: 12px; margin: 0;">
                © 2025 ApnaDukan · Built for India’s neighbourhood businesses
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Verify your email address - ApnaDukan

Hello ${name || "Shopkeeper"},

Thank you for creating an account on ApnaDukan. Please verify your email address by visiting the link below:

${verificationUrl}

This verification link expires in 15 minutes.

If you did not create an account on ApnaDukan, please ignore this email.

© 2025 ApnaDukan
`;

  return sendEmail({
    to,
    subject: "Verify your email address — ApnaDukan",
    html,
    text,
  });
};
