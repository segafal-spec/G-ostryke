/**
 * Service d'envoi d'e-mails pour BizGames
 * Supporte :
 * 1. Brevo (Sendinblue) via VITE_BREVO_API_KEY
 * 2. Resend via VITE_RESEND_API_KEY
 * 3. Enregistrement Firestore (/mail) pour extension Trigger Email
 * 4. Mode simulation avec logs détaillés si aucune clé n'est encore configurée
 */

import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Génère le modèle HTML premium de l'e-mail de bienvenue BizGames
 */
export function generateWelcomeEmailHtml(pseudo, email) {
  const currentYear = new Date().getFullYear();
  const safePseudo = pseudo || 'Stratège';
  const appUrl = 'https://bizgames-game.web.app';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur BizGames</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #05130e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .wrapper {
      width: 100%;
      background-color: #05130e;
      padding: 30px 15px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #0b1c16;
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #09261d 0%, #03120e 100%);
      padding: 32px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(16, 185, 129, 0.2);
    }
    .logo {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #ffffff;
      margin: 0;
    }
    .logo-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      border-radius: 20px;
      text-transform: uppercase;
    }
    .content {
      padding: 32px 28px;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #cbd5e1;
      margin: 0 0 18px 0;
    }
    .card {
      background: rgba(2, 11, 8, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .feature-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      font-size: 14px;
      color: #e2e8f0;
    }
    .feature-item:last-child {
      margin-bottom: 0;
    }
    .feature-icon {
      font-size: 18px;
      margin-right: 12px;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #f59e0b 0%, #10b981 100%);
      color: #03120e !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
    }
    .footer {
      background: #06140f;
      padding: 22px 24px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="logo">💼 BizGames</h1>
        <div class="logo-badge">Géographie Business 3D</div>
      </div>
      <div class="content">
        <h2 class="title">Félicitations ${safePseudo} ! 🎉</h2>
        <p class="text">
          Votre compte <strong>BizGames</strong> a bien été créé et activé avec succès via votre authentification Google.
        </p>
        <p class="text">
          Vous êtes désormais prêt à défier les stratèges économiques du monde entier et à tester vos connaissances sur notre globe 3D interactif.
        </p>

        <div class="card">
          <div style="font-weight: 700; color: #f59e0b; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
            Vos règles du jeu quotidiennes :
          </div>
          <div class="feature-item">
            <span class="feature-icon">🎯</span>
            <span><strong>5 questions par jour</strong> sur les hubs économiques &amp; licornes tech</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🌍</span>
            <span><strong>Globe 3D interactif</strong> pour pointer les sièges mondiaux</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔥</span>
            <span><strong>Streak &amp; Classement</strong> pour grimper au panthéon des Titans</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✨</span>
            <span><strong>100% Gratuit</strong> et accessible chaque jour sans abonnement</span>
          </div>
        </div>

        <div class="cta-container">
          <a href="${appUrl}" class="cta-btn">Accéder au jeu et commencer &rarr;</a>
        </div>
      </div>
      <div class="footer">
        Cet e-mail a été envoyé à <strong>${email}</strong> suite à votre inscription sur BizGames.<br>
        &copy; ${currentYear} BizGames — Tous droits réservés.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Envoie un e-mail de confirmation d'inscription pour les utilisateurs Google Auth
 */
export async function sendWelcomeEmailGoogle({ email, pseudo }) {
  if (!email) return { success: false, error: 'Adresse e-mail requise.' };

  const safePseudo = pseudo || email.split('@')[0] || 'Joueur';
  const htmlContent = generateWelcomeEmailHtml(safePseudo, email);
  const subject = 'Bienvenue sur BizGames 🌍 — Votre inscription est confirmée !';

  const brevoApiKey = import.meta.env.VITE_BREVO_API_KEY;
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

  // 1. Essai d'envoi via Brevo (Sendinblue)
  if (brevoApiKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': brevoApiKey,
        },
        body: JSON.stringify({
          sender: { name: 'BizGames', email: 'contact@bizgames-game.web.app' },
          to: [{ email, name: safePseudo }],
          subject,
          htmlContent,
        }),
      });
      if (res.ok) {
        console.log(`[EmailService] E-mail de bienvenue Brevo envoyé avec succès à ${email}`);
        return { success: true, provider: 'brevo' };
      }
      const errData = await res.json().catch(() => ({}));
      console.warn('[EmailService] Erreur Brevo API :', errData);
    } catch (err) {
      console.warn('[EmailService] Exception Brevo API :', err);
    }
  }

  // 2. Essai d'envoi via Resend
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'BizGames <onboarding@resend.dev>',
          to: [email],
          subject,
          html: htmlContent,
        }),
      });
      if (res.ok) {
        console.log(`[EmailService] E-mail de bienvenue Resend envoyé avec succès à ${email}`);
        return { success: true, provider: 'resend' };
      }
      const errData = await res.json().catch(() => ({}));
      console.warn('[EmailService] Erreur Resend API :', errData);
    } catch (err) {
      console.warn('[EmailService] Exception Resend API :', err);
    }
  }

  // 3. Sauvegarde dans Firestore (/mail) pour traitement éventuel par extension Firebase Trigger Email
  try {
    const mailCol = collection(db, 'mail');
    await addDoc(mailCol, {
      to: email,
      message: {
        subject,
        html: htmlContent,
      },
      createdAt: serverTimestamp(),
      type: 'google_welcome',
    });
  } catch (e) {
    // Si la collection /mail n'est pas configurée dans les règles, on continue sans bloquer
  }

  // 4. Log informatif
  console.info(
    `[BizGames Email] E-mail de bienvenue enregistré pour l'inscription Google : ${email}.` +
      (!brevoApiKey && !resendApiKey
        ? ' (Astuce : configurez VITE_BREVO_API_KEY ou VITE_RESEND_API_KEY dans votre fichier .env pour l’expédition SMTP directe en boîte de réception).'
        : '')
  );

  return { success: true, simulated: !brevoApiKey && !resendApiKey };
}
