export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      additionality_scores: {
        Row: {
          assessment_id: string
          barrier_analysis_score: number | null
          baseline_approach_score: number | null
          baseline_assumptions_score: number | null
          baseline_reasonableness_score: number | null
          baseline_transparency_score: number | null
          common_practice_score: number | null
          created_at: string
          financial_attractiveness_score: number | null
          green_flags: string[] | null
          id: string
          incentives_score: number | null
          legal_considerations_score: number | null
          market_penetration_score: number | null
          overall_additionality_score: number | null
          red_flags: string[] | null
          red_green_flags_score: number | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          barrier_analysis_score?: number | null
          baseline_approach_score?: number | null
          baseline_assumptions_score?: number | null
          baseline_reasonableness_score?: number | null
          baseline_transparency_score?: number | null
          common_practice_score?: number | null
          created_at?: string
          financial_attractiveness_score?: number | null
          green_flags?: string[] | null
          id?: string
          incentives_score?: number | null
          legal_considerations_score?: number | null
          market_penetration_score?: number | null
          overall_additionality_score?: number | null
          red_flags?: string[] | null
          red_green_flags_score?: number | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          barrier_analysis_score?: number | null
          baseline_approach_score?: number | null
          baseline_assumptions_score?: number | null
          baseline_reasonableness_score?: number | null
          baseline_transparency_score?: number | null
          common_practice_score?: number | null
          created_at?: string
          financial_attractiveness_score?: number | null
          green_flags?: string[] | null
          id?: string
          incentives_score?: number | null
          legal_considerations_score?: number | null
          market_penetration_score?: number | null
          overall_additionality_score?: number | null
          red_flags?: string[] | null
          red_green_flags_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "additionality_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_responses: {
        Row: {
          assessment_id: string
          created_at: string
          criterion_code: string
          data_sources: string[] | null
          evidence_text: string | null
          id: string
          question_key: string
          response_boolean: boolean | null
          response_numeric: number | null
          response_value: string | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          criterion_code: string
          data_sources?: string[] | null
          evidence_text?: string | null
          id?: string
          question_key: string
          response_boolean?: boolean | null
          response_numeric?: number | null
          response_value?: string | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          criterion_code?: string
          data_sources?: string[] | null
          evidence_text?: string | null
          id?: string
          question_key?: string
          response_boolean?: boolean | null
          response_numeric?: number | null
          response_value?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessment_type: string | null
          completed_at: string | null
          created_at: string
          id: string
          integrity_rating: string | null
          name: string
          overall_score: number | null
          project_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_type?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          integrity_rating?: string | null
          name: string
          overall_score?: number | null
          project_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_type?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          integrity_rating?: string | null
          name?: string
          overall_score?: number | null
          project_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          income_level: string | null
          name: string
          region: string | null
        }
        Insert: {
          code: string
          income_level?: string | null
          name: string
          region?: string | null
        }
        Update: {
          code?: string
          income_level?: string | null
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      financial_metrics: {
        Row: {
          calculation_date: string
          created_at: string
          id: string
          metric_name: string
          model_id: string
          value: number | null
        }
        Insert: {
          calculation_date?: string
          created_at?: string
          id?: string
          metric_name: string
          model_id: string
          value?: number | null
        }
        Update: {
          calculation_date?: string
          created_at?: string
          id?: string
          metric_name?: string
          model_id?: string
          value?: number | null
        }
        Relationships: []
      }
      financial_models: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          end_year: number
          id: string
          name: string
          project_name: string | null
          start_year: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          end_year: number
          id?: string
          name: string
          project_name?: string | null
          start_year: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          end_year?: number
          id?: string
          name?: string
          project_name?: string | null
          start_year?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_statements: {
        Row: {
          created_at: string
          id: string
          line_item: string
          model_id: string
          statement_type: string
          updated_at: string
          value: number | null
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_item: string
          model_id: string
          statement_type: string
          updated_at?: string
          value?: number | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          line_item?: string
          model_id?: string
          statement_type?: string
          updated_at?: string
          value?: number | null
          year?: number
        }
        Relationships: []
      }
      model_inputs: {
        Row: {
          category: string
          created_at: string
          id: string
          input_key: string
          input_value: Json | null
          model_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          input_key: string
          input_value?: Json | null
          model_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          input_key?: string
          input_value?: Json | null
          model_id?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      model_scenarios: {
        Row: {
          created_at: string
          id: string
          is_base_case: boolean | null
          model_id: string
          scenario_data: Json
          scenario_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_base_case?: boolean | null
          model_id: string
          scenario_data: Json
          scenario_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_base_case?: boolean | null
          model_id?: string
          scenario_data?: Json
          scenario_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          organization: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          organization?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          organization?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          country: string
          created_at: string
          description: string | null
          developer_type: string | null
          id: string
          location_type: string | null
          name: string
          project_size: string | null
          project_type: Database["public"]["Enums"]["project_type"]
          start_date: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country: string
          created_at?: string
          description?: string | null
          developer_type?: string | null
          id?: string
          location_type?: string | null
          name: string
          project_size?: string | null
          project_type: Database["public"]["Enums"]["project_type"]
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string
          description?: string | null
          developer_type?: string | null
          id?: string
          location_type?: string | null
          name?: string
          project_size?: string | null
          project_type?: Database["public"]["Enums"]["project_type"]
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sensitivity_analyses: {
        Row: {
          base_value: number
          created_at: string
          id: string
          model_id: string
          sensitivity_range: Json
          variable_name: string
        }
        Insert: {
          base_value: number
          created_at?: string
          id?: string
          model_id: string
          sensitivity_range: Json
          variable_name: string
        }
        Update: {
          base_value?: number
          created_at?: string
          id?: string
          model_id?: string
          sensitivity_range?: Json
          variable_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_overall_additionality_score: {
        Args: {
          baseline_approach_score: number
          baseline_reasonableness_score: number
          baseline_transparency_score: number
          common_practice_score: number
          green_flags: string[]
          incentives_score: number
          legal_considerations_score: number
          red_flags: string[]
          red_green_flags_score: number
        }
        Returns: number
      }
    }
    Enums: {
      project_type:
        | "redd_plus"
        | "renewables"
        | "arr"
        | "cookstoves"
        | "biochar"
        | "landfill_gas"
        | "safe_water"
        | "ifm"
        | "waste_mgmt"
        | "blue_carbon"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      project_type: [
        "redd_plus",
        "renewables",
        "arr",
        "cookstoves",
        "biochar",
        "landfill_gas",
        "safe_water",
        "ifm",
        "waste_mgmt",
        "blue_carbon",
      ],
    },
  },
} as const
