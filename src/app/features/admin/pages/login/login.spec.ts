import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login';

describe('Login', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: (await import('../../../../core/services/auth')).AuthService, useValue: { signIn: vi.fn() } },
        { provide: (await import('@angular/router')).ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: vi.fn() } } } },
        { provide: (await import('@angular/router')).Router, useValue: { navigateByUrl: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
