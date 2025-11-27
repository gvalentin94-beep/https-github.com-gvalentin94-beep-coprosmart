
import { Resend } from 'resend';

export default async function handler(request: any, response: any) {
  // CORS headers
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
    // Trim to avoid copy-paste whitespace issues
    const apiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : "";
    
    if (!apiKey) {
        console.error("Missing RESEND_API_KEY");
        return response.status(500).json({ error: 'Configuration serveur : Clé API Email manquante' });
    }

    const resend = new Resend(apiKey);
    const { to, subject, html } = request.body;

    if (!to || !subject || !html) {
        return response.status(400).json({ error: 'Champs obligatoires manquants (to, subject, html)' });
    }

    // Use configured sender email or fallback to Resend testing domain
    // IMPORTANT: If using a custom domain, SENDER_EMAIL must match the verified domain.
    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

    const { data, error } = await resend.emails.send({
      from: `CoproSmart <${senderEmail}>`, 
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
        console.error('Resend API Error:', error);
        // Pass the specific error message to the frontend
        return response.status(400).json({ error: error.message, details: error });
    }

    return response.status(200).json(data);
  } catch (error: any) {
    console.error('Email handler exception:', error);
    return response.status(500).json({ error: error.message });
  }
}