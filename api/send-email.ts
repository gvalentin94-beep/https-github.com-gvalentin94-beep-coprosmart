
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
    
    // Server-side logging to debug Vercel Env Vars (Does not expose the full key)
    console.log(`[Email Service] Tentative d'envoi. Clé API présente : ${!!apiKey}, Longueur : ${apiKey.length}`);

    if (!apiKey) {
        console.error("[Email Service] Erreur critique : RESEND_API_KEY est vide.");
        return response.status(500).json({ error: 'Configuration serveur : Clé API Email manquante (Vérifiez les variables d\'environnement Vercel)' });
    }

    const resend = new Resend(apiKey);
    const { to, subject, html } = request.body;

    if (!to || !subject || !html) {
        return response.status(400).json({ error: 'Champs obligatoires manquants (to, subject, html)' });
    }

    // Use configured sender email or fallback to Resend testing domain
    // IMPORTANT: If using a custom domain, SENDER_EMAIL must match the verified domain.
    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
    console.log(`[Email Service] Expéditeur configuré : ${senderEmail}`);

    const { data, error } = await resend.emails.send({
      from: `CoproSmart <${senderEmail}>`, 
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
        console.error('[Email Service] Erreur Resend API :', error);
        // Pass the specific error message to the frontend
        return response.status(400).json({ error: error.message, details: error });
    }

    console.log('[Email Service] Email envoyé avec succès:', data);
    return response.status(200).json(data);
  } catch (error: any) {
    console.error('[Email Service] Exception non gérée :', error);
    return response.status(500).json({ error: error.message });
  }
}
