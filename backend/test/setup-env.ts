// Test-only secrets and environment: integration tests never read backend/.env or touch Supabase.
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.DATABASE_URL = 'postgresql://unused:unused@localhost:5432/unused';
delete process.env.CORS_ORIGIN;
