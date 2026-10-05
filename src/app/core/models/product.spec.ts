import { normalizeSearch, parseProduct, parseSpecifications, productImages, validateProductInput } from './product';
const product = { id: '11111111-1111-4111-8111-111111111111', nombre: 'Café', categoria: 'Hogar', precio: 10, estado: 'Activo' as const, imagenUrl: 'https://example.com/a.webp' };
describe('Product validation', () => {
  it('normalizes accents and case', () => expect(normalizeSearch('  REFRIGERACIÓN ')).toBe('refrigeracion'));
  it('keeps the cover first and deduplicates photos', () => expect(productImages({ imagenUrl: 'a', imagenes: ['b', 'a'] })).toEqual(['a', 'b']));
  it('rejects malformed API data', () => {
    expect(() => parseProduct({ ...product, precio: '10' })).toThrow();
    expect(() => parseProduct({ ...product, estado: 'Agotado' })).toThrow();
    expect(() => parseProduct({ ...product, especificaciones: { Marca: 1 } })).toThrow();
  });
  it('preserves colons inside specification values', () => expect(parseSpecifications('Marca: A\nHora: 10:30')).toEqual({ Marca: 'A', Hora: '10:30' }));
  it.each(['Marca sin valor', 'Marca:', 'Marca: A\nMÁRCA: B'])('rejects invalid specifications: %s', text => expect(() => parseSpecifications(text)).toThrow());
  it('rejects invalid prices and excessive photos', () => {
    expect(() => validateProductInput({ ...product, precio: NaN })).toThrow();
    expect(() => validateProductInput({ ...product, precio: 0 })).toThrow();
    expect(() => validateProductInput({ ...product, imagenes: Array.from({ length: 11 }, (_, i) => 'https://example.com/' + i) })).toThrow();
  });
  it('trims and rounds valid input', () => expect(validateProductInput({ ...product, nombre: ' Café ', precio: 10.129 }).precio).toBe(10.13));
});
