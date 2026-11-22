
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
