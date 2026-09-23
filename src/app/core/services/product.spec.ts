import { TestBed } from '@angular/core/testing';
import { ProductService } from './product';
import { SupabaseService } from './supabase';

describe('Product', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      { provide: SupabaseService, useValue: { client: { from: vi.fn() } } },
    ] });
    service = TestBed.inject(ProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
