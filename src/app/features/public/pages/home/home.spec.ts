import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home';
import { ProductService } from '../../../../core/services/product';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: ProductService, useValue: { getAll: vi.fn().mockResolvedValue([]) } },
        { provide: SupabaseService, useValue: { client: { auth: {} } } },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {}, data: {} } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
