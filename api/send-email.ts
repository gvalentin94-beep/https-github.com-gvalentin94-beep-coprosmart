
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(request: any, response: any) {
  // CORS headers to allow requests from the frontend
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html } = request.body;

    if (!to || !subject || !html) {
        return response.status(400).json({ error: 'Missing required fields' });
    }

    // Use configured sender email or fallback to Resend testing domain
    // Once you verify your domain in Resend (DNS), add SENDER_EMAIL='ne-pas-repondre@votre-domaine.com' to your environment variables.
    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

    const data = await resend.emails.send({
      from: `CoproSmart <${senderEmail}>`, 
      to: to,
      subject: subject,
      html: html,
    });

    return response.status(200).json(data);
  } catch (error: any) {
    console.error('Email error:', error);
    return response.status(500).json({ error: error.message });
  }
}
