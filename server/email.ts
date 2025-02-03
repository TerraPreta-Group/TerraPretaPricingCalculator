import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// In this application, all form submissions are sent as notifications
// to a single email address (SMTP_FROM_EMAIL), which serves as both
// the sender and recipient of these notification emails
const NOTIFICATION_EMAIL = process.env.SMTP_FROM_EMAIL!;

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    await mailService.send({
      to: NOTIFICATION_EMAIL, // All notifications go to this email
      from: NOTIFICATION_EMAIL, // SendGrid requires verified sender
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function formatOrderEmail(formData: any) {
  const html = `
    <h2>New Order Request</h2>
    <p><strong>Customer Information:</strong></p>
    <ul>
      <li>Name: ${formData.name}</li>
      <li>Company: ${formData.company}</li>
      <li>Email: ${formData.email}</li>
      <li>Phone: ${formData.phone}</li>
      <li>Address: ${formData.address}</li>
    </ul>
    <p><strong>Order Details:</strong></p>
    <ul>
      <li>Product Amount: ${formData.product} lbs</li>
      <li>Total Cost: $${formData.cost}</li>
    </ul>
  `;

  return {
    subject: `New Pellet Order - ${formData.company}`,
    text: `New order request from ${formData.name} at ${formData.company}. Product: ${formData.product} lbs, Cost: $${formData.cost}. Contact: ${formData.phone}, ${formData.email}`,
    html,
  };
}

export function formatCallEmail(formData: any) {
  const html = `
    <h2>New Call Request</h2>
    <p><strong>Contact Information:</strong></p>
    <ul>
      <li>Name: ${formData.name}</li>
      <li>Company: ${formData.company}</li>
      <li>Email: ${formData.email}</li>
      <li>Phone: ${formData.phone}</li>
      <li>Address: ${formData.address}</li>
    </ul>
  `;

  return {
    subject: `Call Request - ${formData.company}`,
    text: `New call request from ${formData.name} at ${formData.company}. Contact: ${formData.phone}, ${formData.email}`,
    html,
  };
}