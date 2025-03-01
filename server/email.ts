import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailData {
  subject: string;
  text: string;
  html?: string;
}

const NOTIFICATION_EMAILS = ['tj@terrapreta.ca', 'lee@terrapreta.ca'];
const SENDER_EMAIL = process.env.SMTP_FROM_EMAIL!;

// Calculate tote bags needed (1000 lbs per bag, rounded up)
function calculateToteBags(productAmount: number): number {
  return Math.ceil(productAmount / 1000);
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const msg = {
      to: NOTIFICATION_EMAILS,
      from: SENDER_EMAIL, // Must be verified with SendGrid
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">New Order Request</h2>
      
      <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3 style="color: #444; margin-top: 0;">Customer Information</h3>
        <p><strong>Name:</strong> ${formData.name}</p>
        <p><strong>Company:</strong> ${formData.company}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Phone:</strong> ${formData.phone}</p>
        <p><strong>Address:</strong> ${formData.street}, ${formData.city}, ${formData.province} ${formData.postalCode}</p>
      </div>

      <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3 style="color: #444; margin-top: 0;">Order Details</h3>
        <p><strong>Total Cost:</strong> ${formData.cost ? `$${Number(formData.cost).toFixed(2)}` : 'Not specified'}</p>
        <p><strong>Product Amount:</strong> ${formData.product ? `${Math.round(Number(formData.product))} lbs` : 'Not specified'}</p>
        <p><strong>Tote Bags Required:</strong> ${toteBags}</p>
      </div>
    </div>
  `;

  return {
    subject: `New Pellet Order - ${formData.company}`,
    text: `New order request from ${formData.name} at ${formData.company}. Product: ${formData.product || 'Not specified'} lbs, Cost: ${formData.cost ? `$${formData.cost}` : 'Not specified'}, Tote Bags: ${toteBags} (${toteBags * 1000} lbs capacity). Contact: ${formData.phone}, ${formData.email}`,
    html,
  };
}

export function formatCallEmail(formData: any): EmailData {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">New Call Request</h2>
      
      <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3 style="color: #444; margin-top: 0;">Primary Contact Details</h3>
        <p><strong>Full Name:</strong> ${formData.name}</p>
        <p><strong>Phone Number:</strong> ${formData.phone}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Company Name:</strong> ${formData.company}</p>
      </div>

      <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3 style="color: #444; margin-top: 0;">Address Information</h3>
        <p><strong>Street Address:</strong> ${formData.street}</p>
        <p><strong>City:</strong> ${formData.city}</p>
        <p><strong>Province:</strong> ${formData.province}</p>
        <p><strong>Postal Code:</strong> ${formData.postalCode}</p>
      </div>

      <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3 style="color: #444; margin-top: 0;">Request Details</h3>
        <p><strong>Reason for Call:</strong> ${
          formData.reason === 'pricing' ? 'Did Justin Trudeau set your prices?' :
          formData.reason === 'impress' ? 'I need more info to impress my boss' :
          formData.reason === 'commitment' ? 'I like it, I just have commitment issues' :
          formData.reason === 'human' ? 'I just want to talk to a human' :
          'Not specified'
        }</p>
        <p><strong>Additional Message:</strong> ${formData.message || 'No message provided'}</p>
      </div>
    </div>
  `;

  return {
    subject: `Call Request - ${formData.company}`,
    text: `New call request from ${formData.name} at ${formData.company}. Contact: ${formData.phone}, ${formData.email}`,
    html,
  };
}