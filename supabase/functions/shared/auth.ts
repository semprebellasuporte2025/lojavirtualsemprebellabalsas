import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthContext {
  user: User;
  token: string;
}

const ADMIN_ROLES = new Set(['admin', 'administrador', 'administrator']);
const STAFF_ROLES = new Set(['admin', 'administrador', 'administrator', 'atendente']);

export function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function authenticateUser(
  req: Request,
  supabaseUrl: string,
  anonKey: string,
): Promise<AuthContext | null> {
  const token = getBearerToken(req);
  if (!token || !supabaseUrl || !anonKey) {
    return null;
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }

  return { user: data.user, token };
}

export async function getActiveStaffRole(
  serviceClient: SupabaseClient,
  user: User,
): Promise<string | null> {
  const email = (user.email || '').trim().toLowerCase();

  let query = serviceClient
    .from('usuarios_admin')
    .select('tipo, ativo')
    .eq('ativo', true);

  if (email) {
    query = query.or(`id.eq.${user.id},user_id.eq.${user.id},email.eq.${email}`);
  } else {
    query = query.or(`id.eq.${user.id},user_id.eq.${user.id}`);
  }

  const { data, error } = await query.limit(1);
  if (error || !data || data.length === 0) {
    return null;
  }

  const role = String(data[0].tipo || '').trim().toLowerCase();
  return STAFF_ROLES.has(role) ? role : null;
}

export async function isActiveAdmin(
  serviceClient: SupabaseClient,
  user: User,
): Promise<boolean> {
  const role = await getActiveStaffRole(serviceClient, user);
  return role !== null && ADMIN_ROLES.has(role);
}

export async function userOwnsOrder(
  serviceClient: SupabaseClient,
  user: User,
  clienteId: string | null | undefined,
): Promise<boolean> {
  if (!clienteId) {
    return false;
  }
  if (clienteId === user.id) {
    return true;
  }

  const { data: cliente, error } = await serviceClient
    .from('clientes')
    .select('id, user_id, email')
    .eq('id', clienteId)
    .maybeSingle();

  if (error || !cliente) {
    return false;
  }

  if (cliente.user_id && cliente.user_id === user.id) {
    return true;
  }

  const userEmail = (user.email || '').trim().toLowerCase();
  const clienteEmail = (cliente.email || '').trim().toLowerCase();
  return Boolean(userEmail && clienteEmail && userEmail === clienteEmail);
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
