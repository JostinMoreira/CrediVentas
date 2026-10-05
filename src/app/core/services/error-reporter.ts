import { DOCUMENT } from '@angular/common';
import { ErrorHandler, Injectable, inject, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ErrorReporter implements ErrorHandler {
  private readonly document = inject(DOCUMENT);
  readonly hasUnhandledError = signal(false);
  handleError(error: unknown): void {
    const allowed = ['TypeError', 'RangeError', 'ReferenceError', 'SyntaxError'];
    const type = error instanceof Error && allowed.includes(error.name) ? error.name : 'ApplicationError';
    const path = this.document.location.pathname;
    const screen = path.startsWith('/admin') ? 'admin' : path === '/login' ? 'login' : path.startsWith('/producto/') ? 'product' : 'catalog';
    // Deliberately omit messages, stack traces, URLs, IDs, credentials and form values.
    const event = { time: new Date().toISOString(), type, screen };
    try {
      const previous: unknown = JSON.parse(localStorage.getItem('crediventas:diagnostics') ?? '[]');
      const events = Array.isArray(previous) ? previous.filter(item => item && typeof item === 'object' && Object.keys(item).every(key => ['time', 'type', 'screen'].includes(key))).slice(-19) : [];
      localStorage.setItem('crediventas:diagnostics', JSON.stringify([...events, event]));
    } catch { /* Diagnostics must never interrupt the application. */ }
    console.error('CrediVentas: error inesperado.', event);
    this.hasUnhandledError.set(true);
  }
  reload(): void { this.document.location.reload(); }
}
