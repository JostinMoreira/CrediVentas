import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { SupabaseService } from './supabase';
import { Router } from '@angular/router';

describe('Auth', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      { provide: SupabaseService, useValue: { client: { auth: {} } } },
      { provide: Router, useValue: { navigate: vi.fn() } },
    ] });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
