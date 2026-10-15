import {
  mockCreateSignedUrl,
  mockRemove,
  mockUpload,
  mockDownload,
} from '../mocks/supabase.js';

export const resetSupabaseMocks = () => {
  mockUpload.mockReset();
  mockRemove.mockReset();
  mockCreateSignedUrl.mockReset();
  mockDownload.mockReset();

  mockUpload.mockResolvedValue({
    data: {
      path: 'test-path',
    },
    error: null,
  });

  mockRemove.mockResolvedValue({
    data: null,
    error: null,
  });

  mockCreateSignedUrl.mockResolvedValue({
    data: {
      signedUrl: 'https://example.com/signed-resume-url',
    },
    error: null,
  });

  mockDownload.mockResolvedValue({
    data: new Blob(['fake resume content'], {
      type: 'application/pdf',
    }),
    error: null,
  });
};
