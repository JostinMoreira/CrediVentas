import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { authGuard } from './auth.guard';
import { MfaService } from '../services/mfa';
describe('Administrator guard', () => {
  const isAdministrator = vi.fn();
  const requiresChallenge = vi.fn();
  beforeEach(() => {
    requiresChallenge.mockReset().mockResolvedValue(false);
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: { isAdministrator } }, { provide: MfaService, useValue: { requiresChallenge } }] });
  });
  it.each([false, true])('uses the trusted administrator result: %s', async admin => {
    isAdministrator.mockResolvedValue(admin);
    const result = await TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, { url: '/admin/productos' } as RouterStateSnapshot));
    if (admin) expect(result).toBe(true);
    else expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>)).toContain('/login?returnUrl=');
  });
  it('redirects on validation failure', async () => {
    isAdministrator.mockRejectedValueOnce(new Error('offline'));
    const result = await TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, { url: '/admin' } as RouterStateSnapshot));
    expect(result).not.toBe(true);
  });
  it('redirects an administrator who still needs the second factor', async () => {
    isAdministrator.mockResolvedValue(true); requiresChallenge.mockResolvedValue(true);
    const result = await TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, { url: '/admin' } as RouterStateSnapshot));
    expect(result).not.toBe(true);
  });
  it('fails closed if the MFA check is unavailable', async () => {
    isAdministrator.mockResolvedValue(true); requiresChallenge.mockRejectedValue(new Error('offline'));
    const result = await TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, { url: '/admin' } as RouterStateSnapshot));
    expect(result).not.toBe(true);
  });
});
