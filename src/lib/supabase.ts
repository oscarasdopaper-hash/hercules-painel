import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Variáveis do Supabase não encontradas. Verifique seu arquivo .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com privilégios de administrador (usado apenas em Server Actions/API)
// Nunca exporte o serviceRole para o client-side (navegador)
export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey) {
    throw new Error("Chave secreta (Service Role) não encontrada");
  }
  return createClient(supabaseUrl, serviceKey);
}
