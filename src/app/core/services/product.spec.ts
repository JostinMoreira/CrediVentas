import { TestBed } from '@angular/core/testing';
import { ProductService } from './product';
import { SupabaseService } from './supabase';
const row = { id: '11111111-1111-4111-8111-111111111111', nombre: 'Café', categoria: 'Hogar', precio: 10, estado: 'Activo', destacado: true };
describe('Product queries', () => {
  let service: ProductService;
  const rpc = vi.fn(), from = vi.fn();
  function query(result: object) {
    const q = { order: vi.fn(), range: vi.fn(), select: vi.fn(), eq: vi.fn(), or: vi.fn(), maybeSingle: vi.fn(), delete: vi.fn() };
    q.order.mockReturnValue(q); q.select.mockReturnValue(q); q.eq.mockReturnValue(q); q.or.mockReturnValue(q); q.delete.mockReturnValue(q);
    q.range.mockResolvedValue(result); q.maybeSingle.mockResolvedValue(result);
    return q;
  }
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: SupabaseService, useValue: { client: { rpc, from } } }] });
    service = TestBed.inject(ProductService);
  });
  it('paginates in the database and normalizes searches', async () => {
    const q = query({ data: [row], count: 75, error: null }); rpc.mockReturnValue(q);
    const result = await service.getPage({ page: 2, pageSize: 24, search: 'CAFÉ' });
    expect(rpc).toHaveBeenCalledWith('catalog_products', expect.objectContaining({ search_term: 'cafe', active_only: true }), { count: 'exact' });
    expect(q.range).toHaveBeenCalledWith(48, 71); expect(result.total).toBe(75);
  });
  it('does not mask permission or network failures with a fallback', async () => {
    rpc.mockReturnValue(query({ data: null, error: { code: '42501' } }));
    await expect(service.getPage()).rejects.toEqual({ code: '42501' }); expect(from).not.toHaveBeenCalled();
  });
  it('uses a bounded fallback only if the migration is missing', async () => {
    rpc.mockReturnValue(query({ error: { code: 'PGRST202' } }));
    const q = query({ data: [row], count: 1, error: null }); from.mockReturnValue(q);
    expect((await service.getPage()).products).toHaveLength(1);
    expect(q.eq).toHaveBeenCalledWith('estado', 'Activo'); expect(q.range).toHaveBeenCalledWith(0, 23);
  });
  it('loads a public detail by ID and active state', async () => {
    const q = query({ data: row, error: null }); from.mockReturnValue(q);
    expect((await service.getById(row.id, true))?.id).toBe(row.id);
    expect(q.eq).toHaveBeenCalledWith('id', row.id); expect(q.eq).toHaveBeenCalledWith('estado', 'Activo');
    expect(q.range).not.toHaveBeenCalled();
  });
  it('rejects malformed IDs without a request', async () => {
    expect(await service.getById('bad')).toBeNull(); expect(from).not.toHaveBeenCalled();
  });
});
