
import { Resend } from 'resend';

export default async function handler(request: any, response: any) {
  // CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') return response.status(200).end();
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
        console.error("[Email] Erreur : Clé RESEND_API_KEY absente.");
        return response.status(500).json({ error: 'Configuration serveur incomplète (Clé API)' });
    }

    const resend = new Resend(apiKey);
    const { to, subject, html } = request.body;

    if (!to || !subject || !html) return response.status(400).json({ error: 'Champs manquants' });

    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
    
    const { data, error } = await resend.emails.send({
      from: `CoproSmart <${senderEmail}>`,
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
        console.error('[Email] Erreur Resend :', error);
        return response.status(400).json({ error: error.message });
    }

    return response.status(200).json(data);
  } catch (error: any) {
    console.error('[Email] Exception :', error);
    return response.status(500).json({ error: error.message });
  }
}
