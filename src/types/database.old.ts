export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          role: 'admin' | 'coach' | 'client';
          coach_id: string | null;
          dob: string | null;
          age: number | null;
          sex: string | null;
          height: number | null;
          weight: number | null;
          address: string | null;
          energy_expenditure_level: string | null;
          objective: string | null;
          notes: string | null;
          status: string | null;
          lifestyle: Json | null;
          medical_info: Json | null;
          nutrition: Json | null;
          bilans: Json | null;
          assigned_bilans: Json | null;
          nutrition_logs: Json | null;
          performance_logs: Json | null;
          assigned_nutrition_plans: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          role?: 'admin' | 'coach' | 'client';
          coach_id?: string | null;
          dob?: string | null;
          age?: number | null;
          sex?: string | null;
          height?: number | null;
          weight?: number | null;
          address?: string | null;
          energy_expenditure_level?: string | null;
          objective?: string | null;
          notes?: string | null;
          status?: string | null;
          lifestyle?: Json | null;
          medical_info?: Json | null;
          nutrition?: Json | null;
          bilans?: Json | null;
          assigned_bilans?: Json | null;
          nutrition_logs?: Json | null;
          performance_logs?: Json | null;
          assigned_nutrition_plans?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          role?: 'admin' | 'coach' | 'client';
          coach_id?: string | null;
          dob?: string | null;
          age?: number | null;
          sex?: string | null;
          height?: number | null;
          weight?: number | null;
          address?: string | null;
          energy_expenditure_level?: string | null;
          objective?: string | null;
          notes?: string | null;
          status?: string | null;
          lifestyle?: Json | null;
          medical_info?: Json | null;
          nutrition?: Json | null;
          bilans?: Json | null;
          assigned_bilans?: Json | null;
          nutrition_logs?: Json | null;
          performance_logs?: Json | null;
          assigned_nutrition_plans?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          muscle_group: string | null;
          equipment: string | null;
          difficulty: string | null;
          video_url: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: string | null;
          muscle_group?: string | null;
          equipment?: string | null;
          difficulty?: string | null;
          video_url?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          muscle_group?: string | null;
          equipment?: string | null;
          difficulty?: string | null;
          video_url?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      programs: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          client_id: string | null;
          coach_id: string | null;
          duration_weeks: number | null;
          goal: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          client_id?: string | null;
          coach_id?: string | null;
          duration_weeks?: number | null;
          goal?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          client_id?: string | null;
          coach_id?: string | null;
          duration_weeks?: number | null;
          goal?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          program_id: string | null;
          name: string;
          day_of_week: number | null;
          exercises: Json | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_id?: string | null;
          name: string;
          day_of_week?: number | null;
          exercises?: Json | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          program_id?: string | null;
          name?: string;
          day_of_week?: number | null;
          exercises?: Json | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      nutrition_plans: {
        Row: {
          id: string;
          client_id: string | null;
          name: string;
          description: string | null;
          calories_target: number | null;
          protein_target: number | null;
          carbs_target: number | null;
          fat_target: number | null;
          meals: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          name: string;
          description?: string | null;
          calories_target?: number | null;
          protein_target?: number | null;
          carbs_target?: number | null;
          fat_target?: number | null;
          meals?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          name?: string;
          description?: string | null;
          calories_target?: number | null;
          protein_target?: number | null;
          carbs_target?: number | null;
          fat_target?: number | null;
          meals?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string | null;
          recipient_id: string | null;
          subject: string | null;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id?: string | null;
          recipient_id?: string | null;
          subject?: string | null;
          content: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string | null;
          recipient_id?: string | null;
          subject?: string | null;
          content?: string;
          read?: boolean;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          message: string;
          type: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          message: string;
          type?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          message?: string;
          type?: string | null;
          read?: boolean;
          created_at?: string;
        };
      };
      food_items: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          calories: number | null;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          serving_size: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          serving_size?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          serving_size?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
