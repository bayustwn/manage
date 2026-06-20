import { Resend } from "resend";
import { RESEND_API_KEY, EMAIL_FROM } from "$env/static/private";

const resend = new Resend(RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!RESEND_API_KEY) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
