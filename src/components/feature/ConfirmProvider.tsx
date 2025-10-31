import type { ReactNode } from 'react';

interface ConfirmProviderProps {
  children: ReactNode;
}

// Placeholder provider to keep API stable. Can be expanded later.
export function ConfirmProvider({ children }: ConfirmProviderProps) {
  return <>{children}</>;
}