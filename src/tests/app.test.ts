import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../app.js';

describe('App', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'OK',
      message: 'JobFolio API is running',
    });
  });

  it('should return 404 for unknown route', async () => {
    const response = await request(app).get('/api/unknown');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  })
});
