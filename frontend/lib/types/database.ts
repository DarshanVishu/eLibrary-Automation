export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4';
  };
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string;
          resource_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          resource_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          resource_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookmarks_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookmarks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          link: string;
          message: string;
          resource_id: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          link?: string;
          message: string;
          resource_id?: string | null;
          title: string;
          type?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          link?: string;
          message?: string;
          resource_id?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          grade: number | null;
          id: string;
          is_active: boolean;
          role: Database['public']['Enums']['app_role'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          grade?: number | null;
          id: string;
          is_active?: boolean;
          role?: Database['public']['Enums']['app_role'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          grade?: number | null;
          id?: string;
          is_active?: boolean;
          role?: Database['public']['Enums']['app_role'];
          updated_at?: string;
        };
        Relationships: [];
      };
      reading_progress: {
        Row: {
          created_at: string;
          last_page: number;
          last_viewed_at: string;
          progress_pct: number;
          resource_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          last_page?: number;
          last_viewed_at?: string;
          progress_pct?: number;
          resource_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          last_page?: number;
          last_viewed_at?: string;
          progress_pct?: number;
          resource_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reading_progress_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reading_progress_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      resource_annotations: {
        Row: {
          annotation_data: Json;
          created_at: string;
          id: string;
          page_number: number | null;
          resource_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          annotation_data: Json;
          created_at?: string;
          id?: string;
          page_number?: number | null;
          resource_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          annotation_data?: Json;
          created_at?: string;
          id?: string;
          page_number?: number | null;
          resource_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'resource_annotations_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resources';
            referencedColumns: ['id'];
          },
        ];
      };
      resource_grade_access: {
        Row: {
          created_at: string;
          grade: number;
          resource_id: string;
        };
        Insert: {
          created_at?: string;
          grade: number;
          resource_id: string;
        };
        Update: {
          created_at?: string;
          grade?: number;
          resource_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'resource_grade_access_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resources';
            referencedColumns: ['id'];
          },
        ];
      };
      resource_views: {
        Row: {
          id: number;
          resource_id: string;
          user_id: string;
          viewed_at: string;
        };
        Insert: {
          id?: number;
          resource_id: string;
          user_id: string;
          viewed_at?: string;
        };
        Update: {
          id?: number;
          resource_id?: string;
          user_id?: string;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'resource_views_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resource_views_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      resources: {
        Row: {
          academic_year: string | null;
          book_id: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          file_mime: string | null;
          file_size_bytes: number | null;
          id: string;
          is_active: boolean;
          material_type: Database['public']['Enums']['material_type'];
          page_count: number | null;
          published: boolean;
          source_url: string | null;
          storage_path: string | null;
          subject_id: number;
          thumbnail_url: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          academic_year?: string | null;
          book_id?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          file_mime?: string | null;
          file_size_bytes?: number | null;
          id?: string;
          is_active?: boolean;
          material_type: Database['public']['Enums']['material_type'];
          page_count?: number | null;
          published?: boolean;
          source_url?: string | null;
          storage_path?: string | null;
          subject_id: number;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          academic_year?: string | null;
          book_id?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          file_mime?: string | null;
          file_size_bytes?: number | null;
          id?: string;
          is_active?: boolean;
          material_type?: Database['public']['Enums']['material_type'];
          page_count?: number | null;
          published?: boolean;
          source_url?: string | null;
          storage_path?: string | null;
          subject_id?: number;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'resources_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resources_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resources_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      subjects: {
        Row: {
          created_at: string;
          id: number;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_demote_students: { Args: never; Returns: undefined };
      admin_promote_students: { Args: never; Returns: undefined };
      can_access_resource: { Args: { p_resource_id: string }; Returns: boolean };
      current_user_grade: { Args: never; Returns: number };
      current_user_role: {
        Args: never;
        Returns: Database['public']['Enums']['app_role'];
      };
      is_admin: { Args: never; Returns: boolean };
      is_teacher: { Args: never; Returns: boolean };
      resource_id_from_storage_path: { Args: { path: string }; Returns: string };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
    };
    Enums: {
      app_role: 'admin' | 'teacher' | 'student';
      material_type:
        | 'textbook'
        | 'guide'
        | 'question_bank'
        | 'reference'
        | 'model_paper'
        | 'sample_paper'
        | 'lab_material'
        | 'school_material';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ['admin', 'teacher', 'student'],
      material_type: [
        'textbook',
        'guide',
        'question_bank',
        'reference',
        'model_paper',
        'sample_paper',
        'lab_material',
        'school_material',
        'others',
      ],
    },
  },
} as const;

export type AppRole = Database['public']['Enums']['app_role'];
export type MaterialType = Database['public']['Enums']['material_type'];
