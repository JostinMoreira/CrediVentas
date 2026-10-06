import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth';
import { SupabaseService } from './supabase';
import { MfaService } from './mfa';
describe('Auth permissions', () => {
  const auth = { getUser: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn(), onAuthStateChange: vi.fn() };
  let service: AuthService;
  let callback: (event: string, session: unknown) => void;
  const unsubscribe = vi.fn(), navigate = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    auth.onAuthStateChange.mockImplementation(fn => { callback = fn; return { data: { subscription: { unsubscribe } } }; });
    auth.signOut.mockResolvedValue({ error: null });
    TestBed.configureTestingModule({ providers: [
      { provide: SupabaseService, useValue: { client: { auth } } },
      { provide: Router, useValue: { url: '/admin', navigate } },
      { provide: MfaService, useValue: { requiresChallenge: async () => false } },
    ] });
    service = TestBed.inject(AuthService);
  });
  it('checks a server-validated user and trusted metadata', async () => {
    auth.getUser.mockResolvedValue({ data: { user: { app_metadata: { is_admin: true } } }, error: null });
    expect(await service.isAdministrator()).toBe(true);
    auth.getUser.mockResolvedValue({ data: { user: { app_metadata: {}, user_metadata: { is_admin: true } } }, error: null });
    expect(await service.isAdministrator()).toBe(false);
  });
  it('fails closed on user validation errors', async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('offline') });
    expect(await service.isAdministrator()).toBe(false);
  });
  it('signs out non-administrators', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: { app_metadata: {} } }, error: null });
    expect(await service.signIn('test@example.com', 'test')).toContain('permisos');
    expect(auth.signOut).toHaveBeenCalledOnce();
  });
  it('reports rejected credentials without raw server details', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'invalid_credentials', message: 'sensitive detail' } });
    expect(await service.signIn('test@example.com', 'test')).toBe('Correo o contraseña incorrectos.');
  });
  it('explains how to recover when the current password no longer meets the policy', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'weak_password', message: 'sensitive detail' } });
    expect(await service.signIn('test@example.com', 'test')).toContain('Contacta al propietario');
  });
  it('redirects after session loss and releases the subscription', async () => {
    callback('SIGNED_OUT', null); await Promise.resolve();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    TestBed.resetTestingModule(); expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
