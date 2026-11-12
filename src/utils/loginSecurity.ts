// ==============================================================================
// Utilitário de Segurança para Bloqueio de Tentativas de Login
// ==============================================================================

export const MAX_LOGIN_ATTEMPTS = 3;
export const LOCKOUT_DURATION_MINUTES = 15;
const STORAGE_PREFIX = 'sb_login_sec_';

export interface LoginSecurityState {
  isLocked: boolean;
  attemptsLeft: number;
  failedAttempts: number;
  remainingSeconds: number;
  lockUntil: number | null;
}

function getSecurityKey(email: string): string {
  const clean = (email || '').trim().toLowerCase();
  return `${STORAGE_PREFIX}${clean || 'global'}`;
}

/**
 * Consulta o estado atual de tentativas e bloqueio para o email informado.
 */
export function getLoginSecurityState(email: string): LoginSecurityState {
  if (typeof window === 'undefined') {
    return {
      isLocked: false,
      attemptsLeft: MAX_LOGIN_ATTEMPTS,
      failedAttempts: 0,
      remainingSeconds: 0,
      lockUntil: null,
    };
  }

  const key = getSecurityKey(email);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {
        isLocked: false,
        attemptsLeft: MAX_LOGIN_ATTEMPTS,
        failedAttempts: 0,
        remainingSeconds: 0,
        lockUntil: null,
      };
    }

    const data = JSON.parse(raw);
    const now = Date.now();

    // Bloqueado ativo
    if (data.lockUntil && now < data.lockUntil) {
      const remainingSeconds = Math.ceil((data.lockUntil - now) / 1000);
      return {
        isLocked: true,
        attemptsLeft: 0,
        failedAttempts: MAX_LOGIN_ATTEMPTS,
        remainingSeconds,
        lockUntil: data.lockUntil,
      };
    }

    // Se o tempo de bloqueio expirou, limpa o registro
    if (data.lockUntil && now >= data.lockUntil) {
      localStorage.removeItem(key);
      return {
        isLocked: false,
        attemptsLeft: MAX_LOGIN_ATTEMPTS,
        failedAttempts: 0,
        remainingSeconds: 0,
        lockUntil: null,
      };
    }

    const failed = typeof data.failedAttempts === 'number' ? data.failedAttempts : 0;
    const attemptsLeft = Math.max(0, MAX_LOGIN_ATTEMPTS - failed);

    return {
      isLocked: failed >= MAX_LOGIN_ATTEMPTS,
      attemptsLeft,
      failedAttempts: failed,
      remainingSeconds: 0,
      lockUntil: null,
    };
  } catch {
    return {
      isLocked: false,
      attemptsLeft: MAX_LOGIN_ATTEMPTS,
      failedAttempts: 0,
      remainingSeconds: 0,
      lockUntil: null,
    };
  }
}

/**
 * Registra uma tentativa com senha errada e aplica bloqueio se atingir 3 vezes.
 */
export function recordFailedAttempt(email: string): LoginSecurityState {
  const key = getSecurityKey(email);
  const current = getLoginSecurityState(email);
  const newFailed = current.failedAttempts + 1;
  const now = Date.now();

  let lockUntil: number | null = null;
  let isLocked = false;
  let remainingSeconds = 0;

  if (newFailed >= MAX_LOGIN_ATTEMPTS) {
    lockUntil = now + LOCKOUT_DURATION_MINUTES * 60 * 1000;
    isLocked = true;
    remainingSeconds = LOCKOUT_DURATION_MINUTES * 60;
  }

  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        failedAttempts: newFailed,
        lockUntil,
      })
    );
  } catch (err) {
    console.error('Erro ao salvar tentativas de login:', err);
  }

  return {
    isLocked,
    attemptsLeft: Math.max(0, MAX_LOGIN_ATTEMPTS - newFailed),
    failedAttempts: newFailed,
    remainingSeconds,
    lockUntil,
  };
}

/**
 * Limpa o histórico de tentativas com falha após um login bem-sucedido.
 */
export function clearFailedAttempts(email: string): void {
  try {
    localStorage.removeItem(getSecurityKey(email));
  } catch {}
}

/**
 * Formata segundos restantes em mm:ss
 */
export function formatRemainingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
