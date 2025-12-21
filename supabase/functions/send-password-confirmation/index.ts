import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const defaultAllowedOrigins = [
  'https://virtusofficiel.netlify.app',
  'https://www.virtusofficiel.netlify.app',
  'https://virtus-6zp.pages.dev',
  'http://localhost:5173',
  'http://localhost:3000',
];

const allowedOriginCandidates =
  Deno.env
    .get('ALLOWED_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? defaultAllowedOrigins;

function normalizeOrigin(origin: string) {
  return origin ? origin.replace(/\/$/, '').toLowerCase() : '';
}

const allowedOrigins = new Set(allowedOriginCandidates.map((origin) => normalizeOrigin(origin)));

const defaultAllowedHeaders = ['authorization', 'x-client-info', 'apikey', 'content-type'];

const defaultCorsHeaders = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin, Access-Control-Request-Headers',
};

function buildCorsHeaders(req: Request) {
  const rawOrigin = req.headers.get('origin') ?? req.headers.get('Origin') ?? '';
  const trimmedOrigin = rawOrigin.replace(/\/$/, '');
  const normalizedOrigin = normalizeOrigin(rawOrigin);
  const allowedOrigin =
    allowedOrigins.size === 0
      ? trimmedOrigin || '*'
      : normalizedOrigin && allowedOrigins.has(normalizedOrigin)
        ? trimmedOrigin
        : null;

  const requestHeaders = req.headers
    .get('Access-Control-Request-Headers')
    ?.split(',')
    .map((header) => header.trim())
    .filter(Boolean);

  const headerSet = new Map<string, string>();
  for (const header of defaultAllowedHeaders) {
    const key = header.toLowerCase();
    if (!headerSet.has(key)) {
      headerSet.set(key, header);
    }
  }

  if (requestHeaders) {
    for (const header of requestHeaders) {
      const key = header.toLowerCase();
      if (!headerSet.has(key)) {
        headerSet.set(key, header);
      }
    }
  }

  const headers: Record<string, string> = {
    ...defaultCorsHeaders,
    'Access-Control-Allow-Headers': Array.from(headerSet.values()).join(', '),
  };

  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    if (allowedOrigin !== '*') {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  }

  return { headers, allowedOrigin, requestedOrigin: rawOrigin };
}

// Fonction pour envoyer l'email de confirmation via Resend
async function sendPasswordConfirmationEmail(
  email: string,
  firstName: string,
  newPassword: string
): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY non configurée');
    throw new Error('Email service not configured');
  }

  const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de changement de mot de passe - Virtus</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">VIRTUS</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Votre plateforme de coaching personnalisé</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 22px; font-weight: 600;">
                ✅ Mot de passe modifié avec succès
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${firstName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Votre mot de passe a été modifié avec succès. Voici vos nouveaux identifiants de connexion :
              </p>
              
              <!-- Credentials Box -->
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #6366f1;">
                <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">
                  <strong>Email :</strong><br>
                  <span style="color: #6366f1; font-size: 16px;">${email}</span>
                </p>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong>Nouveau mot de passe :</strong><br>
                  <span style="font-family: monospace; background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 16px; color: #1f2937;">${newPassword}</span>
                </p>
              </div>
              
              <!-- Security Notice -->
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  🔒 <strong>Conseil de sécurité :</strong> Ne partagez jamais vos identifiants avec d'autres personnes. Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement votre coach.
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://virtus-6zp.pages.dev/login" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Se connecter à Virtus
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.5;">
                Cet email a été envoyé automatiquement par Virtus.<br>
                © ${new Date().getFullYear()} Virtus - Tous droits réservés
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Virtus <noreply@mktraining.fr>',
      to: [email],
      subject: '✅ Confirmation de changement de mot de passe - Virtus',
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Erreur Resend:', errorData);
    throw new Error(`Failed to send email: ${response.status}`);
  }

  console.log('Email de confirmation envoyé avec succès à:', email);
}

serve(async (req) => {
  const { headers: corsHeaders, allowedOrigin, requestedOrigin } = buildCorsHeaders(req);
  
  if (!allowedOrigin || allowedOrigin === '') {
    console.warn('Requête refusée pour une origine non autorisée:', requestedOrigin || '(aucune)');
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 403,
    });
  }

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 405,
    });
  }

  try {
    const { email, firstName, newPassword } = await req.json();

    if (!email || !newPassword) {
      return new Response(JSON.stringify({ error: 'email and newPassword are required' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 400,
      });
    }

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 401,
      });
    }

    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Access Token missing' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 401,
      });
    }

    // Vérifier que l'utilisateur est bien authentifié
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired access token' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 401,
      });
    }

    // Vérifier que l'email correspond à l'utilisateur authentifié
    if (user.email !== email) {
      return new Response(JSON.stringify({ error: 'Email mismatch' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 403,
      });
    }

    // Envoyer l'email de confirmation
    await sendPasswordConfirmationEmail(email, firstName || 'Utilisateur', newPassword);

    return new Response(
      JSON.stringify({ message: 'Email de confirmation envoyé avec succès' }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erreur dans send-password-confirmation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 500,
    });
  }
});
