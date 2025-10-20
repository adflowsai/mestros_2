import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'asesor' | 'plantilla' | 'contador';

export type ServiceStatus = 'asignado' | 'en_camino' | 'realizando' | 'finalizado' | 'cancelado' | 'reprogramado';

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta';

export type PaymentStatus = 'pendiente' | 'pagado' | 'parcial' | 'verificado';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  user_id: string | null;
  active: boolean;
  created_at: string;
}

export interface ServiceType {
  id: string;
  name: string;
  category: string;
  base_price: number;
  description: string;
  created_at: string;
}

export interface Service {
  id: string;
  service_type_id: string;
  team_id: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  scheduled_date: string;
  scheduled_time: string;
  status: ServiceStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  service_types?: ServiceType;
  teams?: Team;
}

export interface Payment {
  id: string;
  service_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  receipt_url: string | null;
  verified_at: string | null;
  verified_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface ServiceHistory {
  id: string;
  service_id: string;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}
