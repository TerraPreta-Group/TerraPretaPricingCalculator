import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailData {
  subject: string;
  text: string;
  html?: string;
}

const NOTIFICATION_EMAIL = process.env.SMTP_FROM_EMAIL!;

// Calculate tote bags needed (1000 lbs per bag, rounded up)
function calculateToteBags(productAmount: number): number {
  return Math.ceil(productAmount / 1000);
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const msg = {
      to: NOTIFICATION_EMAIL,
      from: NOTIFICATION_EMAIL, // Must be verified with SendGrid
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html || emailData.text,
    };

    console.log('Attempting to send email:', {
      to: msg.to,
      from: msg.from,
      subject: msg.subject
    });

    const response = await mailService.send(msg);
    console.log('SendGrid response:', response);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as any).response;
      console.error('SendGrid detailed error:', {
        status: response?.statusCode,
        body: response?.body,
        headers: response?.headers
      });

      const errorBody = response?.body;
      if (errorBody?.errors?.[0]?.message?.includes('sender')) {
        console.error('SendGrid error: Sender verification required. Please verify your sender email in SendGrid dashboard.');
      } else if (errorBody?.errors?.[0]?.message?.includes('permission')) {
        console.error('SendGrid error: API key permissions issue. Please ensure the API key has "Mail Send" permissions.');
      }
    } else {
      console.error('SendGrid error:', error);
    }
    return false;
  }
}

export function formatOrderEmail(formData: any): EmailData {
  const productAmount = parseFloat(formData.product || '0');
  const toteBags = calculateToteBags(productAmount);

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
      <li>Product Amount: ${formData.product || 'Not specified'} lbs</li>
      <li>Total Cost: ${formData.cost ? `$${formData.cost}` : 'Not specified'}</li>
      <li>Tote Bags Required: ${toteBags} (${toteBags * 1000} lbs capacity)</li>
    </ul>
  `;

  return {
    subject: `New Pellet Order - ${formData.company}`,
    text: `New order request from ${formData.name} at ${formData.company}. Product: ${formData.product || 'Not specified'} lbs, Cost: ${formData.cost ? `$${formData.cost}` : 'Not specified'}, Tote Bags: ${toteBags} (${toteBags * 1000} lbs capacity). Contact: ${formData.phone}, ${formData.email}`,
    html,
  };
}

export function formatCallEmail(formData: any): EmailData {
  const html = `
    <h2>New Call Request</h2>
    <p><strong>Contact Information:</strong></p>
    <ul>
      <li>Full Name: ${formData.name}</li>
      <li>Phone Number: ${formData.phone}</li>
      <li>Email: ${formData.email}</li>
      <li>Company Name: ${formData.company}</li>
      <li>Street Address: ${formData.street}</li>
      <li>City: ${formData.city}</li>
      <li>Province: ${formData.province}</li>
      <li>Postal Code: ${formData.postalCode}</li>
      <li>Reason for Call: ${formData.reason || 'Not specified'}</li>
      <li>Message: ${formData.message || 'No message provided'}</li>
    </ul>
  `;

  return {
    subject: `Call Request - ${formData.company}`,
    text: `New call request from ${formData.name} at ${formData.company}. Contact: ${formData.phone}, ${formData.email}`,
    html,
  };
}