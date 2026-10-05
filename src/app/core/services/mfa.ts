import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';

export interface MfaFactor { id: string; name: string; }
export interface MfaEnrollment { id: string; qr: string; secret: string; }

@Injectable({ providedIn: 'root' })
export class MfaService {
  private readonly auth = inject(SupabaseService).client.auth;

  async requiresChallenge(): Promise<boolean> {
    const { data, error } = await this.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data.currentLevel) throw new Error('No se pudo comprobar el segundo factor.');
    return data.nextLevel === 'aal2' && data.currentLevel !== 'aal2';
  }

  async factors(): Promise<MfaFactor[]> {
    const { data, error } = await this.auth.mfa.listFactors();
    if (error) throw new Error('No se pudieron consultar los dispositivos.');
    return data.totp.map(factor => ({ id: factor.id, name: factor.friendly_name || 'Autenticador' }));
  }

  async pendingFactors(): Promise<MfaFactor[]> {
    const { data, error } = await this.auth.mfa.listFactors();
    if (error) throw new Error('No se pudieron consultar las configuraciones pendientes.');
    return data.all.filter(factor => factor.factor_type === 'totp' && factor.status === 'unverified')
      .map(factor => ({ id: factor.id, name: factor.friendly_name || 'Autenticador pendiente' }));
  }

  async enroll(name: string): Promise<MfaEnrollment> {
    const { data, error } = await this.auth.mfa.enroll({
      factorType: 'totp', friendlyName: name.trim(), issuer: 'CrediVentas',
    });
    if (error) throw new Error('No se pudo añadir el autenticador. Revisa el nombre y la configuración de MFA.');
    return { id: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
  }

  async verify(factorId: string, code: string): Promise<void> {
    if (!/^\d{6}$/.test(code.trim())) throw new Error('Ingresa el código de seis dígitos.');
    const { error } = await this.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (error) throw new Error('No se pudo verificar el código. Usa el código actual y comprueba la hora de tu dispositivo.');
  }

  async cancelEnrollment(factorId: string): Promise<void> {
    // Never allow a stale UI action to remove a factor that was already verified.
    const { data, error } = await this.auth.mfa.listFactors();
    if (error) throw new Error('No se pudo comprobar el dispositivo pendiente.');
    const factor = data.all.find(item => item.id === factorId);
    if (!factor) return;
    if (factor.status !== 'unverified') throw new Error('Este dispositivo ya está activado.');
    const result = await this.auth.mfa.unenroll({ factorId });
    if (result.error) throw new Error('No se pudo cancelar la configuración. Reintenta.');
  }

  async remove(factorId: string): Promise<void> {
    if (await this.requiresChallenge()) throw new Error('Verifica primero tu segundo factor.');
    const factors = await this.factors();
    if (!factors.some(factor => factor.id === factorId) || factors.length < 2) {
      throw new Error('Añade y verifica otro dispositivo antes de retirar este.');
    }
    const { error } = await this.auth.mfa.unenroll({ factorId });
    if (error) throw new Error('No se pudo retirar el dispositivo.');
    const refreshed = await this.auth.refreshSession();
    if (refreshed.error) throw new Error('Dispositivo retirado. Vuelve a iniciar sesión para actualizar el acceso.');
  }
}
