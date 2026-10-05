import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { LoginComponent } from './login';
describe('Login behavior', () => {
  let fixture: ComponentFixture<LoginComponent>;
  const signIn = vi.fn();
  beforeEach(async () => {
    signIn.mockReset();
    TestBed.configureTestingModule({ imports: [LoginComponent], providers: [
      provideRouter([]), { provide: AuthService, useValue: { signIn } },
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
});
