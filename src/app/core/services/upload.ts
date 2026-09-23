import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';
import imageCompression from 'browser-image-compression';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Comprime y sube un archivo de imagen al bucket público 'productos'
   * @param file Archivo de imagen a subir
   * @returns URL pública de la imagen, o null en caso de error
   */
  async uploadProductImage(file: File): Promise<string | null> {
    try {
      // Opciones de compresión especificadas
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      };

      // 1. Comprimir la imagen
      const compressedFile = await imageCompression(file, options);

      // 2. Generar una ruta de archivo única para evitar sobreescrituras
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      // 3. Subir el archivo comprimido a Supabase Storage
      const { error: uploadError } = await this.supabaseService.client
        .storage
        .from('productos')
        .upload(filePath, compressedFile);

      if (uploadError) {
        throw uploadError;
      }

      // 4. Obtener y retornar la URL pública del archivo subido
      const { data } = this.supabaseService.client
        .storage
        .from('productos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error en el proceso de compresión/subida:', error);
      return null;
    }
  }
}
