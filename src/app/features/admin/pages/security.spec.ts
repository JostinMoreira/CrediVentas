import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Security } from './security';
import { MfaService } from '../../../core/services/mfa';

describe('Account security settings', () => {
  let fixture: ComponentFixture<Security>;
  const mfa = { factors: vi.fn(), pendingFactors: vi.fn(), enroll: vi.fn(), verify: vi.fn(), cancelEnrollment: vi.fn(), remove: vi.fn() };
  beforeEach(async () => {
    vi.resetAllMocks();
    mfa.factors.mockResolvedValue([]); mfa.pendingFactors.mockResolvedValue([]); mfa.cancelEnrollment.mockResolvedValue(undefined);
    mfa.verify.mockResolvedValue(undefined);
    mfa.enroll.mockResolvedValue({ id: 'new', qr: 'data:image/svg+xml,test', secret: 'LOCAL-TEST-ONLY' });
    TestBed.configureTestingModule({ imports: [Security], providers: [provideRouter([]), { provide: MfaService, useValue: mfa }] });
    fixture = TestBed.createComponent(Security); await fixture.whenStable();
  });
  it('validates the device name before requesting enrollment', async () => {
    await fixture.componentInstance.start(); await fixture.whenStable();
    expect(mfa.enroll).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('nombre');
  });
  it('verifies enrollment and clears secret and code from the view', async () => {
    fixture.componentInstance.model.set({ name: 'Phone', code: '' });
    await fixture.componentInstance.start(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.secret').textContent).toBe('LOCAL-TEST-ONLY');
    fixture.componentInstance.model.set({ name: 'Phone', code: '123456' });
    await fixture.componentInstance.verify(); await fixture.whenStable();
    expect(mfa.verify).toHaveBeenCalledWith('new', '123456');
    expect(fixture.nativeElement.querySelector('.secret')).toBeNull();
    expect(fixture.componentInstance.model()).toEqual({ name: '', code: '' });
  });
  it('cancels unfinished enrollment when leaving the page', async () => {
    fixture.componentInstance.model.set({ name: 'Phone', code: '' });
    await fixture.componentInstance.start(); fixture.destroy();
    expect(mfa.cancelEnrollment).toHaveBeenCalledWith('new');
  });
  it('disables removal of the last verified device', async () => {
    mfa.factors.mockResolvedValue([{ id: 'one', name: 'Phone' }]);
    await fixture.componentInstance.load(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[aria-label="Retirar Phone"]').disabled).toBe(true);
  });
});
