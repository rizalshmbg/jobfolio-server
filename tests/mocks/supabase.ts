import { vi } from 'vitest';

export const mockUpload = vi.fn();
export const mockRemove = vi.fn();
export const mockCreateSignedUrl = vi.fn();
export const mockDownload = vi.fn();

export const mockSupabaseStorage = {
  from: vi.fn(() => ({
    upload: mockUpload,
    remove: mockRemove,
    createSignedUrl: mockCreateSignedUrl,
    download: mockDownload,
  })),
};

export const supabase = {
  storage: mockSupabaseStorage,
};
