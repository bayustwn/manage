import { Resend } from "resend";
import { serverConfig } from "$lib/server/config";

const resend = serverConfig.RESEND_API_KEY
  ? new Resend(serverConfig.RESEND_API_KEY)
  : null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!EMAIL_RE.test(to)) {
    throw new Error(`Invalid email address: ${to}`);
  }

  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!serverConfig.EMAIL_FROM) {
    throw new Error("EMAIL_FROM is not configured");
  }

  const { error } = await resend.emails.send({
    from: serverConfig.EMAIL_FROM,
    to,
    subject,
    text,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
