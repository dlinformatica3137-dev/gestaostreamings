console.log('--- Profiling Postgres imports ---');
async function run() {
  let t = Date.now();
  await import('pg');
  console.log('pg:', Date.now() - t, 'ms');

  t = Date.now();
  await import('drizzle-orm/node-postgres');
  console.log('drizzle-orm/node-postgres:', Date.now() - t, 'ms');

  t = Date.now();
  await import('./src/db/schema.ts');
  console.log('schema.ts:', Date.now() - t, 'ms');

  t = Date.now();
  await import('./src/db/index.ts');
  console.log('index.ts:', Date.now() - t, 'ms');
}
run();
