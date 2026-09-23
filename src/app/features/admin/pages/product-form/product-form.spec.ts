import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductFormComponent } from './product-form';
import { ProductService } from '../../../../core/services/product';
import { UploadService } from '../../../../core/services/upload';
import { ActivatedRoute, Router } from '@angular/router';

describe('ProductForm', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [
        { provide: ProductService, useValue: {} },
        { provide: UploadService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {}, data: {} } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
