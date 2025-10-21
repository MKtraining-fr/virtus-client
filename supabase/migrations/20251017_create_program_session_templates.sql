-- Création de la table `programs` (matrices de programmes)
CREATE TABLE public.programs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    objective text,
    week_count integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches can view their programs." ON public.programs FOR SELECT USING (coach_id = auth.uid());
CREATE POLICY "Coaches can insert their programs." ON public.programs FOR INSERT WITH CHECK (coach_id = auth.uid());
CREATE POLICY "Coaches can update their programs." ON public.programs FOR UPDATE USING (coach_id = auth.uid());
CREATE POLICY "Coaches can delete their programs." ON public.programs FOR DELETE USING (coach_id = auth.uid());

-- Création de la table `sessions` (matrices de séances)
CREATE TABLE public.sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
    coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    week_number integer NOT NULL DEFAULT 1,
    session_order integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches can view their sessions." ON public.sessions FOR SELECT USING (coach_id = auth.uid());
CREATE POLICY "Coaches can insert their sessions." ON public.sessions FOR INSERT WITH CHECK (coach_id = auth.uid());
CREATE POLICY "Coaches can update their sessions." ON public.sessions FOR UPDATE USING (coach_id = auth.uid());
CREATE POLICY "Coaches can delete their sessions." ON public.sessions FOR DELETE USING (coach_id = auth.uid());

-- Création de la table `session_exercises` (exercices dans les matrices de séances)
CREATE TABLE public.session_exercises (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
    exercise_id uuid REFERENCES public.exercises(id) ON DELETE CASCADE,
    coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_order integer NOT NULL DEFAULT 1,
    sets integer,
    reps text, -- Peut être '8-12', 'AMRAP', etc.
    load text, -- Peut être '50kg', 'BW', etc.
    tempo text,
    rest_time text,
    intensification text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches can view their session exercises." ON public.session_exercises FOR SELECT USING (coach_id = auth.uid());
CREATE POLICY "Coaches can insert their session exercises." ON public.session_exercises FOR INSERT WITH CHECK (coach_id = auth.uid());
CREATE POLICY "Coaches can update their session exercises." ON public.session_exercises FOR UPDATE USING (coach_id = auth.uid());
CREATE POLICY "Coaches can delete their session exercises." ON public.session_exercises FOR DELETE USING (coach_id = auth.uid());

-- Mise à jour de la table `profiles` pour inclure les informations client (notes, historique)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS medical_info text,
ADD COLUMN IF NOT EXISTS coach_notes text;

-- RLS pour les nouvelles colonnes dans `profiles`
-- Les coaches peuvent voir et modifier les infos médicales et notes de leurs clients
CREATE POLICY "Coaches can view medical info of their clients." ON public.profiles FOR SELECT USING (id IN (SELECT client_id FROM public.client_coach_relationships WHERE coach_id = auth.uid()));
CREATE POLICY "Coaches can update medical info of their clients." ON public.profiles FOR UPDATE USING (id IN (SELECT client_id FROM public.client_coach_relationships WHERE coach_id = auth.uid()));

-- Création de la table `client_coach_relationships` pour gérer les relations coach-client
CREATE TABLE public.client_coach_relationships (
    client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (client_id, coach_id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.client_coach_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches can manage their client relationships." ON public.client_coach_relationships FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "Clients can view their coach relationship." ON public.client_coach_relationships FOR SELECT USING (client_id = auth.uid());

-- Création de la table `client_programs` (instances de programmes assignés aux clients)
CREATE TABLE public.client_programs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_template_id uuid REFERENCES public.programs(id) ON DELETE SET NULL, -- Référence au template, peut être NULL si programme unique
    client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    objective text,
    week_count integer NOT NULL DEFAULT 1,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    start_date date,
    end_date date,
    status text DEFAULT 'active' NOT NULL, -- 'active', 'completed', 'paused'
    current_week integer DEFAULT 1,
    current_session_index integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.client_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view their assigned programs." ON public.client_programs FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Coaches can manage programs assigned to their clients." ON public.client_programs FOR ALL USING (coach_id = auth.uid());

-- Création de la table `client_sessions` (instances de séances assignées aux clients)
CREATE TABLE public.client_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_template_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL, -- Référence au template, peut être NULL si séance unique
    client_program_id uuid REFERENCES public.client_programs(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    week_number integer NOT NULL DEFAULT 1,
    session_order integer NOT NULL DEFAULT 1,
    status text DEFAULT 'pending' NOT NULL, -- 'pending', 'completed', 'skipped'
    completed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view their assigned sessions." ON public.client_sessions FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Coaches can manage sessions assigned to their clients." ON public.client_sessions FOR ALL USING (coach_id = auth.uid());

-- Création de la table `client_session_exercises` (exercices dans les instances de séances client)
CREATE TABLE public.client_session_exercises (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_session_id uuid REFERENCES public.client_sessions(id) ON DELETE CASCADE,
    exercise_template_id uuid REFERENCES public.session_exercises(id) ON DELETE SET NULL, -- Référence à l'exercice template, peut être NULL si unique
    exercise_id uuid REFERENCES public.exercises(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_order integer NOT NULL DEFAULT 1,
    sets integer,
    reps text,
    load text,
    tempo text,
    rest_time text,
    intensification text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.client_session_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view their session exercises." ON public.client_session_exercises FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Coaches can manage session exercises assigned to their clients." ON public.client_session_exercises FOR ALL USING (coach_id = auth.uid());

-- Création de la table `client_exercise_performance` (performances enregistrées par le client)
CREATE TABLE public.client_exercise_performance (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_session_exercise_id uuid REFERENCES public.client_session_exercises(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    set_number integer NOT NULL,
    reps_achieved integer,
    load_achieved text,
    rpe integer, -- Rating of Perceived Exertion
    notes text,
    performed_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.client_exercise_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view and insert their performance." ON public.client_exercise_performance FOR ALL USING (client_id = auth.uid());
CREATE POLICY "Coaches can view their clients' performance." ON public.client_exercise_performance FOR SELECT USING (coach_id = auth.uid());

