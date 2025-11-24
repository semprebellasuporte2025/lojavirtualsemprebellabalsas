// Script simples para verificar produtos via API REST do Supabase

import { config } from 'dotenv';
config(); // Carrega variáveis do .env

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;