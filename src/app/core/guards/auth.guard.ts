import { inject, Injector } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
export const authGuard: CanActivateFn = async (_route, state) => {
  const injector = inject(Injector);
  const router = inject(Router);
  const { AuthService } = await import('../services/auth');
  try {
    if (await injector.get(AuthService).isAdministrator()) {
      const { MfaService } = await import('../services/mfa');
      if (!await injector.get(MfaService).requiresChallenge()) return true;
    }
  } catch {
    // Unverifiable sessions must not open the administrative interface.
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
