import { TestBed } from '@angular/core/testing';
import { UploadService, storageImagePath, thumbnailUrl } from './upload';
import { SupabaseService } from './supabase';
import { environment } from '../../../environments/environment';
vi.mock('browser-image-compression', () => ({ default: vi.fn(async (file: File) => file) }));
const imageUrl = environment.supabaseUrl + '/storage/v1/object/public/productos/images/v2-11111111-1111-4111-8111-111111111111.webp';
describe('Image lifecycle', () => {
  let service: UploadService;
  const limit = vi.fn(), remove = vi.fn(), upload = vi.fn();
  beforeEach(() => {
    localStorage.clear(); vi.clearAllMocks(); limit.mockResolvedValue({ data: [], error: null }); remove.mockResolvedValue({ error: null }); upload.mockResolvedValue({ error: null });
    const q = { select: vi.fn(), eq: vi.fn(), contains: vi.fn(), limit };
    q.select.mockReturnValue(q); q.eq.mockReturnValue(q); q.contains.mockReturnValue(q);
    TestBed.configureTestingModule({ providers: [{ provide: SupabaseService, useValue: { client: {
      from: () => q, storage: { from: () => ({ remove, upload, getPublicUrl: (path: string) => ({ data: { publicUrl: environment.supabaseUrl + '/storage/v1/object/public/productos/' + path } }) }) },
    } } }] });
    service = TestBed.inject(UploadService);
  });
  it('rejects external and traversal paths', () => {
    expect(storageImagePath('https://evil.example/images/a.webp')).toBeNull();
    expect(storageImagePath(environment.supabaseUrl + '/storage/v1/object/public/productos/images/%2e%2e%2fsecret.webp')).toBeNull();
    expect(thumbnailUrl(imageUrl)).toContain('-thumb.webp');
  });
  it('rejects unsupported and empty files', () => {
    expect(() => service.validateFiles([new File(['x'], 'x.svg', { type: 'image/svg+xml' })])).toThrow();
    expect(() => service.validateFiles([new File([], 'x.webp', { type: 'image/webp' })])).toThrow();
  });
  it('never deletes a referenced image', async () => {
    limit.mockResolvedValueOnce({ data: [{ id: 'product' }], error: null });
    await service.removeUnreferencedImages([imageUrl]); expect(remove).not.toHaveBeenCalled();
  });
  it('deletes unreferenced main and thumbnail together', async () => {
    await service.removeUnreferencedImages([imageUrl]);
    expect(remove).toHaveBeenCalledWith(['images/v2-11111111-1111-4111-8111-111111111111.webp', 'images/v2-11111111-1111-4111-8111-111111111111-thumb.webp']);
  });
  it('queues failed verification and allows a later retry', async () => {
    limit.mockResolvedValueOnce({ data: null, error: new Error('network') });
    expect(await service.removeUnreferencedImages([imageUrl])).toBe(1); expect(remove).not.toHaveBeenCalled();
    expect(await service.retryPendingCleanup()).toBe(0); expect(remove).toHaveBeenCalledOnce();
  });
  it('rolls back previously uploaded images after a later upload failure', async () => {
    vi.spyOn(service, 'uploadProductImage').mockResolvedValueOnce(imageUrl).mockRejectedValueOnce(new Error('failed'));
    const file = new File(['x'], 'x.webp', { type: 'image/webp' });
    await expect(service.uploadProductImages([file, file])).rejects.toThrow('failed'); expect(remove).toHaveBeenCalledOnce();
  });
  it('uses a local worker and cleans up a failed thumbnail upload', async () => {
    upload.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: new Error('failed thumbnail') });
    await expect(service.uploadProductImage(new File(['x'], 'x.webp', { type: 'image/webp' }))).rejects.toThrow();
    expect(remove).toHaveBeenCalledOnce();
    const { default: compress } = await import('browser-image-compression');
    expect(compress).toHaveBeenCalledWith(expect.any(File), expect.objectContaining({ libURL: expect.stringContaining('/assets/vendor/browser-image-compression.js') }));
  });
  it('preserves both queued files when cleanups overlap', async () => {
    limit.mockResolvedValue({ data: null, error: new Error('offline') });
    const second = imageUrl.replace('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');
    await Promise.all([service.removeUnreferencedImages([imageUrl]), service.removeUnreferencedImages([second])]);
    expect(service.pendingCleanup()).toEqual([imageUrl, second]);
  });
});
