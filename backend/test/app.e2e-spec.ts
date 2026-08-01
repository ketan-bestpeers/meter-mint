import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('/test-auth (GET)', () => {
    it('should return 401 Unauthorized if x-api-key header is missing', () => {
      return request(app.getHttpServer())
        .get('/test-auth')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('API key is missing');
        });
    });

    it('should return 401 Unauthorized if x-api-key is invalid', () => {
      return request(app.getHttpServer())
        .get('/test-auth')
        .set('x-api-key', 'sk_invalid_999')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid API key');
        });
    });

    it('should return 200 OK with free tenant if x-api-key is sk_test_free_123', () => {
      return request(app.getHttpServer())
        .get('/test-auth')
        .set('x-api-key', 'sk_test_free_123')
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Authentication successful');
          expect(res.body.tenant.name).toBe('Free Tenant');
          expect(res.body.tenant.apiKey).toBe('sk_test_free_123');
          expect(res.body.tenant.plan.name).toBe('Free');
        });
    });

    it('should return 200 OK with pro tenant if x-api-key is sk_test_pro_456', () => {
      return request(app.getHttpServer())
        .get('/test-auth')
        .set('x-api-key', 'sk_test_pro_456')
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Authentication successful');
          expect(res.body.tenant.name).toBe('Pro Tenant');
          expect(res.body.tenant.apiKey).toBe('sk_test_pro_456');
          expect(res.body.tenant.plan.name).toBe('Pro');
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
