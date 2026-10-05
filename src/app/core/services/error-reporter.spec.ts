import { TestBed } from '@angular/core/testing';
import { ErrorReporter } from './error-reporter';
describe('Private diagnostics', () => {
  it('records a bounded event without sensitive error details', () => {
    localStorage.clear(); const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const service = TestBed.inject(ErrorReporter);
    for (let i = 0; i < 25; i++) service.handleError(new Error('password=secret token=private email=person@example.com'));
    const stored = localStorage.getItem('crediventas:diagnostics')!;
    expect(JSON.parse(stored)).toHaveLength(20); expect(stored).not.toMatch(/password|secret|token|private|email|person/);
    expect(service.hasUnhandledError()).toBe(true); consoleError.mockRestore(); localStorage.clear();
  });
});
