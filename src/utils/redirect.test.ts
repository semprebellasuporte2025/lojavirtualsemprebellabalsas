import { describe, it, expect } from 'vitest';
import { determinePostLoginRedirect } from './redirect';

describe('determinePostLoginRedirect', () => {
  it('envia admin para /paineladmin', () => {
    const target = determinePostLoginRedirect({
      isAdmin: true,
      isAtendente: false,
      isUsuario: false,
      fromPath: '/checkout',
      cartHasItems: true,
      currentPath: '/',
    });
    expect(target).toBe('/paineladmin');
  });

  it('cliente vindo do checkout com itens volta ao /checkout', () => {
    const target = determinePostLoginRedirect({
      isAdmin: false,
      isAtendente: false,
      isUsuario: false,
      fromPath: '/checkout',
      cartHasItems: true,
      currentPath: '/auth/login',
    });
    expect(target).toBe('/checkout');
  });

  it('cliente vindo do checkout sem itens vai para /minha-conta', () => {
    const target = determinePostLoginRedirect({
      isAdmin: false,
      isAtendente: false,
      isUsuario: false,
      fromPath: '/checkout',
      cartHasItems: false,
      currentPath: '/auth/login',
    });
    expect(target).toBe('/minha-conta');
  });

  it('cliente vindo do carrinho vai para /carrinho', () => {
    const target = determinePostLoginRedirect({
      isAdmin: false,
      isAtendente: false,
      isUsuario: false,
      fromPath: '/carrinho',
      cartHasItems: true,
      currentPath: '/auth/login',
    });
    expect(target).toBe('/carrinho');
  });

  it('cliente sem from vai para /minha-conta', () => {
    const target = determinePostLoginRedirect({
      isAdmin: false,
      isAtendente: false,
      isUsuario: false,
      fromPath: undefined,
      cartHasItems: true,
      currentPath: '/auth/login',
    });
    expect(target).toBe('/minha-conta');
  });
});