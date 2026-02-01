export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          github_id: number | null;
          github_username: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      connected_repositories: {
        Row: {
          id: string;
          user_id: string;
          owner: string;
          repo: string;
          default_branch: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['connected_repositories']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['connected_repositories']['Insert']>;
      };
      repo_analysis_results: {
        Row: {
          id: string;
          repo_id: string;
          project_type: string | null;
          tech_stack: Json;
          entry_points: Json;
          config_files: Json;
          summary: string | null;
          raw_tree: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['repo_analysis_results']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['repo_analysis_results']['Insert']>;
      };
      repo_secrets: {
        Row: {
          id: string;
          repo_id: string;
          user_id: string;
          key_name: string;
          encrypted_value: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['repo_secrets']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['repo_secrets']['Insert']>;
      };
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type ConnectedRepo = Database['public']['Tables']['connected_repositories']['Row'];
export type RepoAnalysis = Database['public']['Tables']['repo_analysis_results']['Row'];
export type RepoSecret = Database['public']['Tables']['repo_secrets']['Row'];
