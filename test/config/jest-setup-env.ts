/**
 * Jest setupFiles — dijalankan sebelum ANY import/module di-load.
 * Wajib set NODE_ENV di sini agar IS_TEST_ENV di app.module.ts terbaca benar.
 */
process.env.NODE_ENV = 'test';
