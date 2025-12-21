import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

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

  console.log('Envoi de l\'email de confirmation à:', email);

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
                <a href="https://virtus-6zp.pages.dev/#/login" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
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

  const result = await response.json();
  console.log('Email de confirmation envoyé avec succès à:', email, 'ID:', result.id);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: corsHeaders,
      status: 405,
    });
  }

  console.log('Requête reçue par send-password-confirmation');

  try {
    const { email, firstName, newPassword } = await req.json();
    console.log('Données reçues - email:', email, 'firstName:', firstName);

    if (!email || !newPassword) {
      return new Response(JSON.stringify({ error: 'email and newPassword are required' }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Authorization header manquant');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        headers: corsHeaders,
        status: 401,
      });
    }

    // Créer un client Supabase avec la clé service pour les opérations admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Extraire le token JWT du header Authorization
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extrait, vérification de l\'utilisateur...');

    // Vérifier que l'utilisateur est bien authentifié (même méthode que create-user-admin)
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('Erreur de vérification utilisateur:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid user' }), {
        headers: corsHeaders,
        status: 401,
      });
    }

    console.log('Utilisateur vérifié:', user.id, user.email);

    // Vérifier que l'email correspond à l'utilisateur authentifié
    if (user.email !== email) {
      console.error('Email mismatch:', user.email, '!=', email);
      return new Response(JSON.stringify({ error: 'Email mismatch' }), {
        headers: corsHeaders,
        status: 403,
      });
    }

    // Envoyer l'email de confirmation
    await sendPasswordConfirmationEmail(email, firstName || 'Utilisateur', newPassword);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email de confirmation envoyé avec succès' 
      }),
      {
        headers: corsHeaders,
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erreur dans send-password-confirmation:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
