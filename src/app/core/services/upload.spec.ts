import { TestBed } from '@angular/core/testing';
import { UploadService } from './upload';
import { SupabaseService } from './supabase';

describe('Upload', () => {
  let service: UploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      { provide: SupabaseService, useValue: { client: { storage: {} } } },
    ] });
    service = TestBed.inject(UploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
