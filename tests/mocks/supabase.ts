import { vi } from 'vitest';

export const mockUpload = vi.fn();
export const mockRemove = vi.fn();
export const mockCreateSignedUrl = vi.fn();

export const mockSupabaseStorage = {
  from: vi.fn(() => ({
    upload: mockUpload,
    remove: mockRemove,
    createSignedUrl: mockCreateSignedUrl,
  })),
};

export const supabase = {
  storage: mockSupabaseStorage,
};
