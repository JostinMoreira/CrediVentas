import { TestBed } from '@angular/core/testing';
import { MfaService } from './mfa';
import { SupabaseService } from './supabase';

describe('MFA security', () => {
  const api = { getAuthenticatorAssuranceLevel: vi.fn(), listFactors: vi.fn(), enroll: vi.fn(), challengeAndVerify: vi.fn(), unenroll: vi.fn() };
  const refreshSession = vi.fn();
  let service: MfaService;
  beforeEach(() => {
    vi.resetAllMocks();
    api.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null });
    api.unenroll.mockResolvedValue({ error: null }); refreshSession.mockResolvedValue({ error: null });
    TestBed.configureTestingModule({ providers: [{ provide: SupabaseService, useValue: { client: { auth: { mfa: api, refreshSession } } } }] });
    service = TestBed.inject(MfaService);
  });
  it.each([['aal1', 'aal1', false], ['aal1', 'aal2', true], ['aal2', 'aal2', false]])('checks assurance %s -> %s', async (currentLevel, nextLevel, expected) => {
    api.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel, nextLevel }, error: null });
    expect(await service.requiresChallenge()).toBe(expected);
  });
  it('fails closed without a session or on server errors', async () => {
    api.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: null }, error: null });
    await expect(service.requiresChallenge()).rejects.toThrow();
    api.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: null, error: new Error('private') });
    await expect(service.requiresChallenge()).rejects.toThrow('No se pudo');
  });
  it('rejects malformed codes before sending a request', async () => {
    await expect(service.verify('factor', '123')).rejects.toThrow('seis dígitos');
    expect(api.challengeAndVerify).not.toHaveBeenCalled();
  });
  it('never exposes raw server details on a rejected code', async () => {
    api.challengeAndVerify.mockResolvedValue({ error: new Error('secret server details') });
    await expect(service.verify('factor', '123456')).rejects.toThrow('No se pudo verificar');
  });
  it('does not remove the last verified authenticator', async () => {
    api.listFactors.mockResolvedValue({ data: { totp: [{ id: 'one' }] }, error: null });
    await expect(service.remove('one')).rejects.toThrow('otro dispositivo');
    expect(api.unenroll).not.toHaveBeenCalled();
  });
  it('requires AAL2 to remove a verified device', async () => {
    api.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null });
    await expect(service.remove('one')).rejects.toThrow('Verifica primero');
    expect(api.unenroll).not.toHaveBeenCalled();
  });
  it('removes a device with a verified backup and refreshes the session', async () => {
    api.listFactors.mockResolvedValue({ data: { totp: [{ id: 'one' }, { id: 'two' }] }, error: null });
    await service.remove('one');
    expect(api.unenroll).toHaveBeenCalledWith({ factorId: 'one' });
    expect(refreshSession).toHaveBeenCalledOnce();
  });
  it('does not cancel an enrollment already verified in another tab', async () => {
    api.listFactors.mockResolvedValue({ data: { all: [{ id: 'one', status: 'verified' }] }, error: null });
    await expect(service.cancelEnrollment('one')).rejects.toThrow('activado');
    expect(api.unenroll).not.toHaveBeenCalled();
  });
});
