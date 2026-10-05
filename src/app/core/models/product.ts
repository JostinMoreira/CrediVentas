export const PRODUCT_STATES = ['Activo', 'Oculto'] as const;
export type ProductState = typeof PRODUCT_STATES[number];
export interface Product {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  estado: ProductState;
  imagenUrl?: string;
  imagenes?: string[];
  descripcion?: string;
  especificaciones?: Record<string, string>;
  destacado?: boolean;
  created_at?: string;
}
export type ProductInput = Omit<Product, 'id' | 'created_at'>;
export interface ProductPage { products: Product[]; total: number; }
export interface ProductQuery {
  page?: number; pageSize?: number; search?: string; category?: string; publicOnly?: boolean; featuredOnly?: boolean;
}
export const PRODUCT_LIMITS = { name: 160, category: 80, description: 5000, images: 10, specifications: 40 } as const;
export function productImages(product: Pick<Product, 'imagenUrl' | 'imagenes'>): string[] {
  return [...new Set([product.imagenUrl, ...(product.imagenes ?? [])].filter((url): url is string => !!url))];
}
export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}
export function parseSpecifications(text: string): Record<string, string> {
  const result: Record<string, string> = Object.create(null) as Record<string, string>;
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length > PRODUCT_LIMITS.specifications) throw new Error('Usa como máximo 40 especificaciones.');
  for (const line of lines) {
    const separator = line.indexOf(':');
    const name = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (separator < 1 || !value) throw new Error('Cada especificación debe tener nombre y valor separados por dos puntos.');
    if (name.length > 80 || value.length > 500) throw new Error('Una especificación supera el tamaño permitido.');
    if (Object.keys(result).some(key => normalizeSearch(key) === normalizeSearch(name))) throw new Error('Hay una especificación repetida: ' + name);
    result[name] = value;
  }
  return result;
}
/** Validate the API boundary; older rows may not have gallery or editorial fields. */
export function parseProduct(value: unknown): Product {
  if (!value || typeof value !== 'object') throw new Error('El producto recibido no es válido.');
  const row = value as Record<string, unknown>;
  if (typeof row['id'] !== 'string' || typeof row['nombre'] !== 'string' || typeof row['categoria'] !== 'string' ||
      typeof row['precio'] !== 'number' || !Number.isFinite(row['precio']) || row['precio'] <= 0 ||
      !PRODUCT_STATES.includes(row['estado'] as ProductState)) throw new Error('El producto recibido contiene datos inválidos.');
  const specs = row['especificaciones'];
  if (specs != null && (typeof specs !== 'object' || Array.isArray(specs) || Object.values(specs).some(item => typeof item !== 'string'))) throw new Error('Las especificaciones recibidas no son válidas.');
  const images = row['imagenes'];
  if (images != null && (!Array.isArray(images) || images.some(item => typeof item !== 'string'))) throw new Error('Las imágenes recibidas no son válidas.');
  return {
    id: row['id'], nombre: row['nombre'], categoria: row['categoria'], precio: row['precio'], estado: row['estado'] as ProductState,
    imagenUrl: typeof row['imagenUrl'] === 'string' ? row['imagenUrl'] : '',
    imagenes: (images as string[] | null) ?? [], descripcion: typeof row['descripcion'] === 'string' ? row['descripcion'] : '',
    especificaciones: (specs as Record<string, string> | null) ?? {},
    ...(typeof row['destacado'] === 'boolean' ? { destacado: row['destacado'] } : {}),
    ...(typeof row['created_at'] === 'string' ? { created_at: row['created_at'] } : {}),
  };
}
export function validateProductInput(product: ProductInput): ProductInput {
  const nombre = product.nombre.trim(), categoria = product.categoria.trim(), descripcion = (product.descripcion ?? '').trim();
  if (!nombre || nombre.length > PRODUCT_LIMITS.name || !categoria || categoria.length > PRODUCT_LIMITS.category) throw new Error('Revisa el nombre y la categoría del producto.');
  if (!Number.isFinite(product.precio) || product.precio < 0.01 || product.precio > 999999999.99) throw new Error('Ingresa un precio válido mayor que cero.');
  if (!PRODUCT_STATES.includes(product.estado)) throw new Error('El estado del producto no es válido.');
  if (descripcion.length > PRODUCT_LIMITS.description) throw new Error('La descripción no debe superar 5000 caracteres.');
  const imagenes = productImages(product);
  if (!imagenes.length || imagenes.length > PRODUCT_LIMITS.images || imagenes.some(value => {
    try {
      const url = new URL(value);
      return !!url.username || !!url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)));
    } catch { return true; }
  })) throw new Error('Conserva entre 1 y 10 imágenes válidas.');
  const specifications = product.especificaciones ?? {};
  if (Object.keys(specifications).length > PRODUCT_LIMITS.specifications || Object.entries(specifications).some(([key, val]) => !key.trim() || key.length > 80 || typeof val !== 'string' || !val.trim() || val.length > 500)) throw new Error('Revisa las especificaciones del producto.');
  return { ...product, nombre, categoria, descripcion, precio: Math.round(product.precio * 100) / 100, imagenUrl: imagenes[0], imagenes, especificaciones: specifications };
}
