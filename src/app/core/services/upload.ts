import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { environment } from '../../../environments/environment';
import { PRODUCT_LIMITS } from '../models/product';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export function storageImagePath(url: string): string | null {
  try {
    const image = new URL(url), base = new URL(environment.supabaseUrl);
    const prefix = '/storage/v1/object/public/productos/';
    if (image.origin !== base.origin || !image.pathname.startsWith(prefix) || image.search) return null;
    const path = decodeURIComponent(image.pathname.slice(prefix.length));
    return /^images\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|avif)$/.test(path) ? path : null;
  } catch { return null; }
}
export function thumbnailUrl(url: string): string {
  return storageImagePath(url)?.match(/^images\/v2-[0-9a-f-]+\.webp$/i) ? url.replace(/\.webp$/, '-thumb.webp') : url;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  readonly pendingCleanup = signal<string[]>([]);
  private cleanupQueue: Promise<number> = Promise.resolve(0);
  private readonly queueKey = 'crediventas:image-cleanup:' + new URL(environment.supabaseUrl).hostname;
  constructor(private readonly supabaseService: SupabaseService) {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(this.queueKey) ?? '[]');
      if (Array.isArray(stored)) this.pendingCleanup.set(stored.filter((url): url is string => typeof url === 'string' && !!storageImagePath(url)));
    } catch { /* Storage is optional, e.g. private browsing. */ }
  }
  validateFiles(files: File[]): void {
    if (files.length > PRODUCT_LIMITS.images) throw new Error('Selecciona como máximo 10 imágenes.');
    if (files.some(file => !IMAGE_TYPES.includes(file.type))) throw new Error('Usa imágenes JPEG, PNG, WebP o AVIF.');
    if (files.some(file => file.size === 0 || file.size > 20 * 1024 * 1024)) throw new Error('Cada imagen debe tener entre 1 byte y 20 MB.');
  }
  async uploadProductImage(file: File): Promise<string> {
    this.validateFiles([file]);
    const { default: compress } = await import('browser-image-compression');
    const options = {
      fileType: 'image/webp', useWebWorker: true,
      libURL: new URL('assets/vendor/browser-image-compression.js', document.baseURI).href,
    };
    const main = await compress(file, { ...options, maxSizeMB: 0.2, maxWidthOrHeight: 1200 });
    const thumbnail = await compress(main, { ...options, maxSizeMB: 0.025, maxWidthOrHeight: 180 });
    const path = 'images/v2-' + crypto.randomUUID() + '.webp';
    const bucket = this.supabaseService.client.storage.from('productos');
    const url = bucket.getPublicUrl(path).data.publicUrl;
    try {
      for (const [name, image] of [[path, main], [path.replace('.webp', '-thumb.webp'), thumbnail]] as const) {
        const { error } = await bucket.upload(name, image, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
        if (error) throw error;
      }
      return url;
    } catch (error) {
      await this.removeUnreferencedImages([url]);
      throw error;
    }
  }
  async uploadProductImages(files: File[]): Promise<string[]> {
    this.validateFiles(files);
    const urls: string[] = [];
    try {
      for (const file of files) urls.push(await this.uploadProductImage(file));
      return urls;
    } catch (error) {
      await this.removeUnreferencedImages(urls);
      throw error;
    }
  }
  /** Never remove an object when its references cannot be verified. RLS also guards deletions. */
  removeUnreferencedImages(urls: string[]): Promise<number> {
    const work = this.cleanupQueue.then(() => this.cleanImages(urls));
    this.cleanupQueue = work.catch(() => this.pendingCleanup().length);
    return work;
  }
  private async cleanImages(urls: string[]): Promise<number> {
    const pending = new Set(this.pendingCleanup());
    for (const url of new Set(urls)) {
      const path = storageImagePath(url);
      if (!path) continue;
      try {
        const client = this.supabaseService.client;
        const [cover, gallery] = await Promise.all([
          client.from('productos').select('id').eq('imagenUrl', url).limit(1),
          client.from('productos').select('id').contains('imagenes', [url]).limit(1),
        ]);
        if (cover.error || gallery.error) throw new Error('No se pudieron comprobar las referencias.');
        if (cover.data?.length || gallery.data?.length) { pending.delete(url); continue; }
        const paths = [path];
        if (/^images\/v2-[0-9a-f-]+\.webp$/i.test(path)) paths.push(path.replace('.webp', '-thumb.webp'));
        const { error } = await client.storage.from('productos').remove(paths);
        if (error) throw error;
        pending.delete(url);
      } catch { pending.add(url); }
    }
    this.pendingCleanup.set([...pending]);
    try { localStorage.setItem(this.queueKey, JSON.stringify([...pending])); } catch { /* Retry remains available for this session. */ }
    return pending.size;
  }
  retryPendingCleanup(): Promise<number> { return this.removeUnreferencedImages(this.pendingCleanup()); }
}
