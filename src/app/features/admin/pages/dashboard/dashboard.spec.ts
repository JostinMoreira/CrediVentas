import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { ProductService } from '../../../../core/services/product';
import { AuthService } from '../../../../core/services/auth';
import { ActivatedRoute } from '@angular/router';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: ProductService, useValue: { getAll: vi.fn().mockResolvedValue([]) } },
        { provide: AuthService, useValue: { signOut: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {}, data: {} } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
