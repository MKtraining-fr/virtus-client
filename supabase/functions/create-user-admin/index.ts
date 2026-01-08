import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

interface CreateUserRequest {
  email: string;
  password?: string; // Optionnel - sera généré si non fourni
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'admin' | 'coach' | 'client';
  coachId?: string;
  affiliationCode?: string;
  status?: 'active' | 'prospect';
  sendCredentialsEmail?: boolean; // Envoyer un email avec les identifiants
  // Champs additionnels du bilan - Informations générales
  sex?: string;
  dateOfBirth?: string;
  height?: number;
  weight?: number;
  activityLevel?: string;
  // Champs additionnels - Objectif et notes
  objective?: string;
  notes?: string;
  // Champs additionnels - Données JSON
  lifestyle?: Record<string, unknown>;
  medicalInfo?: Record<string, unknown>;
  nutrition?: Record<string, unknown>;
  bilans?: unknown[];
  // Champs additionnels - Section Training (conditions d'entraînement)
  trainingInfo?: {
    experience?: string;
    trainingSince?: string;
    sessionsPerWeek?: number;
    sessionDuration?: number;
    trainingType?: string;
    issues?: string;
  };
}

/**
 * Génère un mot de passe temporaire sécurisé
 * Respecte les exigences : 8+ caractères, majuscule, minuscule, chiffre, caractère spécial
 */
function generateTemporaryPassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%&*';
  
  // Garantir au moins un caractère de chaque type
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Compléter avec des caractères aléatoires pour atteindre 12 caractères
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mélanger le mot de passe
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Envoie un email avec les identifiants au nouveau client
 */
async function sendCredentialsEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
  password: string,
  firstName: string,
  coachName: string
): Promise<void> {
  const siteUrl = Deno.env.get('SITE_URL') || 'https://virtus-6zp.pages.dev';
  const loginUrl = `${siteUrl}/#/login`;
  
  // Utiliser Resend pour envoyer l'email
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured, skipping credentials email');
    return;
  }
  
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
    .credential-item { margin: 10px 0; }
    .credential-label { font-weight: bold; color: #6366f1; }
    .credential-value { font-family: monospace; background: #f3f4f6; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bienvenue sur Virtus !</h1>
    </div>
    <div class="content">
      <p>Bonjour ${firstName},</p>
      <p>Votre coach <strong>${coachName}</strong> vous a créé un compte sur la plateforme Virtus.</p>
      
      <div class="credentials">
        <h3 style="margin-top: 0;">Vos identifiants de connexion</h3>
        <div class="credential-item">
          <div class="credential-label">Email :</div>
          <div class="credential-value">${email}</div>
        </div>
        <div class="credential-item">
          <div class="credential-label">Mot de passe temporaire :</div>
          <div class="credential-value">${password}</div>
        </div>
      </div>
      
      <div class="warning">
        <strong>⚠️ Important :</strong> Pour des raisons de sécurité, vous devrez changer votre mot de passe lors de votre première connexion.
      </div>
      
      <p style="text-align: center;">
        <a href="${loginUrl}" class="button">Se connecter à Virtus</a>
      </p>
      
      <div class="footer">
        <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
        <p>© ${new Date().getFullYear()} Virtus - Tous droits réservés</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Virtus <noreply@mktraining.fr>',
        to: [email],
        subject: 'Bienvenue sur Virtus - Vos identifiants de connexion',
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error sending email via Resend:', errorData);
    } else {
      console.log(`Credentials email sent successfully to ${email}`);
    }
  } catch (error) {
    console.error('Error sending credentials email:', error);
    // Ne pas faire échouer la création de l'utilisateur si l'email échoue
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Vérifier que la requête provient d'un utilisateur authentifié
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
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

    // Vérifier que l'utilisateur actuel est un admin ou coach
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized: Invalid user');
    }

    // Récupérer le profil de l'utilisateur pour vérifier son rôle
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('clients')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Unauthorized: Profile not found');
    }

    // Permettre aux admins ET aux coachs de créer des utilisateurs
    if (profile.role !== 'admin' && profile.role !== 'coach') {
      throw new Error('Unauthorized: Admin or Coach access required');
    }

    // Parser les données de la requête
    const userData: CreateUserRequest = await req.json();
    
    // Log des données reçues pour le debugging
    console.log('Received userData:', JSON.stringify(userData, null, 2));

    // Valider les données requises (mot de passe optionnel maintenant)
    if (!userData.email || !userData.firstName || !userData.lastName) {
      console.error('Missing required fields:', {
        hasEmail: !!userData.email,
        hasFirstName: !!userData.firstName,
        hasLastName: !!userData.lastName,
        receivedData: userData
      });
      throw new Error(`Missing required fields: email=${!!userData.email}, firstName=${!!userData.firstName}, lastName=${!!userData.lastName}`);
    }

    // Générer un mot de passe temporaire si non fourni
    const password = userData.password || generateTemporaryPassword();
    const isTemporaryPassword = !userData.password;

    // Créer l'utilisateur dans Supabase Auth sans envoyer d'email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: password,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone || '',
        role: userData.role || 'client',
        affiliation_code: userData.affiliationCode || null,
        // Pour un coach, associer automatiquement le client au coach qui le crée
        coach_id: profile.role === 'coach' ? user.id : (userData.coachId && userData.coachId !== '' ? userData.coachId : null),
        // Flag pour indiquer que l'utilisateur a été créé par un admin/coach
        // et doit changer son mot de passe à la première connexion
        created_by_admin: true,
        password_changed: !isTemporaryPassword, // false si mot de passe temporaire
        created_at: new Date().toISOString(),
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      
      // Fournir des messages d'erreur plus clairs pour les erreurs courantes
      let errorMessage = authError.message;
      
      if (authError.message.includes('Password')) {
        errorMessage = 'Le mot de passe ne respecte pas les exigences de sécurité. Il doit contenir au moins 8 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.';
      } else if (authError.message.includes('email')) {
        errorMessage = 'Cette adresse email est déjà utilisée ou invalide.';
      }
      
      throw new Error(errorMessage);
    }

    if (!authData.user) {
      throw new Error('No user returned from auth creation');
    }

    // Créer le profil dans la table clients avec TOUS les champs du bilan
    const clientProfile: Record<string, unknown> = {
      id: authData.user.id,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone || '',
      role: userData.role || 'client',
      affiliation_code: userData.affiliationCode || null,
      coach_id: profile.role === 'coach' ? user.id : (userData.coachId && userData.coachId !== '' ? userData.coachId : null),
      status: userData.status || 'active',
      // Champs additionnels du bilan - Informations générales
      sex: userData.sex || null,
      dob: userData.dateOfBirth || null,
      height: userData.height || null,
      weight: userData.weight || null,
      energy_expenditure_level: userData.activityLevel || null,
      // Champs additionnels - Objectif et notes
      objective: userData.objective || null,
      notes: userData.notes || null,
      // Champs additionnels - Données JSON
      lifestyle: userData.lifestyle || {},
      medical_info: userData.medicalInfo || {},
      nutrition: userData.nutrition || {},
      bilans: userData.bilans || [],
      must_change_password: isTemporaryPassword, // Doit changer le mot de passe si temporaire
    };

    // Utiliser UPSERT pour éviter les erreurs de clé dupliquée
    const { data: profileData, error: profileInsertError } = await supabaseAdmin
      .from('clients')
      .upsert([clientProfile], { onConflict: 'id' })
      .select()
      .single();

    if (profileInsertError) {
      console.error('Error creating profile:', profileInsertError);
      // Si la création du profil échoue, supprimer l'utilisateur Auth créé
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user profile: ${profileInsertError.message}`);
    }

    // Créer les informations d'entraînement dans la table client_training_info si fournies
    let trainingInfoCreated = false;
    let trainingInfoError: string | null = null;
    
    if (userData.trainingInfo) {
      const trainingData = {
        client_id: authData.user.id,
        experience: userData.trainingInfo.experience || null,
        training_since: userData.trainingInfo.trainingSince || null,
        sessions_per_week: userData.trainingInfo.sessionsPerWeek || null,
        session_duration: userData.trainingInfo.sessionDuration || null,
        training_type: userData.trainingInfo.trainingType || null,
        issues: userData.trainingInfo.issues || null,
        created_by: user.id,
        updated_by: user.id,
      };

      console.log('Creating training info:', JSON.stringify(trainingData, null, 2));

      const { error: trainingInsertError } = await supabaseAdmin
        .from('client_training_info')
        .insert([trainingData]);

      if (trainingInsertError) {
        console.error('Error creating training info:', trainingInsertError);
        trainingInfoError = trainingInsertError.message;
        // Ne pas faire échouer la création du client si l'insertion des infos d'entraînement échoue
        // On log juste l'erreur
      } else {
        console.log('Training info created successfully for client:', authData.user.id);
        trainingInfoCreated = true;
      }
    } else {
      console.log('No training info provided, skipping client_training_info creation');
    }

    // Envoyer l'email avec les identifiants si c'est un mot de passe temporaire
    // ou si explicitement demandé
    if (isTemporaryPassword || userData.sendCredentialsEmail) {
      const coachName = `${profile.first_name} ${profile.last_name}`;
      await sendCredentialsEmail(
        supabaseAdmin,
        userData.email,
        password,
        userData.firstName,
        coachName
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          profile: profileData,
        },
        temporaryPassword: isTemporaryPassword,
        emailSent: isTemporaryPassword || userData.sendCredentialsEmail,
        trainingInfo: {
          provided: !!userData.trainingInfo,
          created: trainingInfoCreated,
          error: trainingInfoError,
        },
      }),
      {
        headers: corsHeaders,
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-user-admin function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: corsHeaders,
        status: 400,
      }
    );
  }
});
