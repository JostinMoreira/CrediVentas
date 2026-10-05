import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { LoginComponent } from './login';
import { MfaService } from '../../../../core/services/mfa';
describe('Login behavior', () => {
  let fixture: ComponentFixture<LoginComponent>;
  const signIn = vi.fn();
  const mfa = { requiresChallenge: vi.fn(), factors: vi.fn(), verify: vi.fn() };
  beforeEach(async () => {
    signIn.mockReset();
    mfa.requiresChallenge.mockReset().mockResolvedValue(false);
    mfa.factors.mockReset().mockResolvedValue([{ id: 'factor-1', name: 'Phone' }]);
    mfa.verify.mockReset().mockResolvedValue(undefined);
    TestBed.configureTestingModule({ imports: [LoginComponent], providers: [
      provideRouter([]), { provide: AuthService, useValue: { signIn, isAdministrator: async () => false } },
      { provide: MfaService, useValue: mfa },
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => 'https://example.com' } } } },
    ] });
    fixture = TestBed.createComponent(LoginComponent); await fixture.whenStable();
  });
  it('renders an asynchronous error and reenables submit without manual change detection', async () => {
    signIn.mockResolvedValue('Correo o contraseña incorrectos.');
    fixture.componentInstance.form.setValue({ email: 'test@example.com', password: 'invalid' });
    await fixture.componentInstance.submit(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('incorrectos');
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(false);
  });
  it('recovers from thrown network errors', async () => {
    signIn.mockRejectedValue(new Error('network'));
    fixture.componentInstance.form.setValue({ email: 'test@example.com', password: 'invalid' });
    await fixture.componentInstance.submit(); await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Revisa tu conexión');
  });
  it('blocks duplicate submissions and external return URLs', async () => {
    let done!: (value: null) => void; signIn.mockReturnValue(new Promise(resolve => done = resolve));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({ email: 'test@example.com', password: 'valid' });
    const first = fixture.componentInstance.submit(); await fixture.componentInstance.submit();
    expect(signIn).toHaveBeenCalledOnce(); done(null); await first;
    expect(navigate).toHaveBeenCalledWith('/admin');
  });
  it('marks invalid input accessibly without contacting Auth', async () => {
    await fixture.componentInstance.submit(); await fixture.whenStable();
    expect(signIn).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#email').getAttribute('aria-invalid')).toBe('true');
  });
  it('requires a valid second factor before entering and clears the password', async () => {
    signIn.mockResolvedValue(null); mfa.requiresChallenge.mockResolvedValue(true);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({ email: 'test@example.com', password: 'valid' });
    await fixture.componentInstance.submit(); await fixture.whenStable();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.password.value).toBe('');
    expect(fixture.nativeElement.querySelector('#mfa-code').getAttribute('autocomplete')).toBe('one-time-code');
    fixture.componentInstance.codeModel.set({ code: '123456' });
    await fixture.componentInstance.verifyCode();
    expect(mfa.verify).toHaveBeenCalledWith('factor-1', '123456');
    expect(navigate).toHaveBeenCalledWith('/admin');
    expect(fixture.componentInstance.codeModel().code).toBe('');
  });
  it('does not navigate on a rejected MFA code', async () => {
    fixture.componentInstance.challenge.set(true); fixture.componentInstance.selectedFactor.set('factor-1');
    fixture.componentInstance.codeModel.set({ code: '123456' });
    mfa.verify.mockRejectedValue(new Error('private server detail'));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    await fixture.componentInstance.verifyCode(); await fixture.whenStable();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Usa el código actual');
    expect(fixture.nativeElement.textContent).not.toContain('private server detail');
  });
});
