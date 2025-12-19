
import { Resend } from 'resend';

export default async function handler(request: any, response: any) {
  // Configuration des en-têtes CORS pour Vercel
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') return response.status(200).end();
  if (request.method !== 'POST') return response.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
        console.error("[EmailService] Clé API absente.");
        return response.status(500).json({ error: 'Configuration serveur manquante (RESEND_API_KEY).' });
    }

    const resend = new Resend(apiKey);
    const { to, subject, html } = request.body;

    if (!to || !subject || !html) return response.status(400).json({ error: 'Données manquantes (to, subject ou html).' });

    // Note importante : En mode test Resend, vous ne pouvez envoyer qu'à l'email du propriétaire du compte.
    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
    
    const { data, error } = await resend.emails.send({
      from: `CoproSmart <${senderEmail}>`,
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
        console.error('[ResendError]', error);
        // On retourne 202 car l'app ne doit pas bloquer si l'email échoue (souvent cas de test)
        return response.status(202).json({ warning: error.message });
    }

    return response.status(200).json(data);
  } catch (error: any) {
    console.error('[EmailServiceException]', error);
    return response.status(500).json({ error: error.message });
  }
}
