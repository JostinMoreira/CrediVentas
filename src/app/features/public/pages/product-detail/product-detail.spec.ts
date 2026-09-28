import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductDetailComponent } from './product-detail';
import { ProductService } from '../../../../core/services/product';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase';

describe('ProductDetail', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        { provide: ProductService, useValue: { getAll: vi.fn().mockResolvedValue([]) } },
        { provide: SupabaseService, useValue: { client: { auth: {} } } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: vi.fn() } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
