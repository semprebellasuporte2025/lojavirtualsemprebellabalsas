import { useState, useEffect, useCallback } from 'react';
import {
  getLoginSecurityState,
  recordFailedAttempt,
  clearFailedAttempts,
  formatRemainingTime,
  MAX_LOGIN_ATTEMPTS,
  type LoginSecurityState,
} from '../utils/loginSecurity';

export function useLoginSecurity(email: string) {
  const [securityState, setSecurityState] = useState<LoginSecurityState>(() =>
    getLoginSecurityState(email)
  );
  const [hasPasswordError, setHasPasswordError] = useState(false);

  // Sincronizar estado quando o email mudar
  useEffect(() => {
    const state = getLoginSecurityState(email);
    setSecurityState(state);
    if (state.failedAttempts === 0) {
      setHasPasswordError(false);
    } else {
      setHasPasswordError(true);
    }
  }, [email]);

  // Timer regressivo a cada 1 segundo se estiver bloqueado
  useEffect(() => {
    if (!securityState.isLocked || !securityState.lockUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= securityState.lockUntil!) {
        // Desbloqueou
        const updated = getLoginSecurityState(email);
        setSecurityState(updated);
        setHasPasswordError(false);
      } else {
        const remainingSeconds = Math.ceil((securityState.lockUntil! - now) / 1000);
        setSecurityState((prev) => ({
          ...prev,
          remainingSeconds,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [securityState.isLocked, securityState.lockUntil, email]);

  const handleFailedAttempt = useCallback(() => {
    const updated = recordFailedAttempt(email);
    setSecurityState(updated);
    setHasPasswordError(true);
    return updated;
  }, [email]);

  const handleSuccess = useCallback(() => {
    clearFailedAttempts(email);
    setSecurityState(getLoginSecurityState(email));
    setHasPasswordError(false);
  }, [email]);

  const resetErrorBorder = useCallback(() => {
    // Permite resetar a borda caso o usuário limpe ou modifique a senha
    if (!securityState.isLocked) {
      setHasPasswordError(false);
    }
  }, [securityState.isLocked]);

  return {
    isLocked: securityState.isLocked,
    attemptsLeft: securityState.attemptsLeft,
    failedAttempts: securityState.failedAttempts,
    remainingSeconds: securityState.remainingSeconds,
    formattedRemainingTime: formatRemainingTime(securityState.remainingSeconds),
    hasPasswordError,
    maxAttempts: MAX_LOGIN_ATTEMPTS,
    handleFailedAttempt,
    handleSuccess,
    resetErrorBorder,
  };
}
