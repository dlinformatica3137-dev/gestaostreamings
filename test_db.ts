console.log('--- Profiling start ---');
const t0 = Date.now();
import('./server/postgresService.ts').then(() => {
  console.log('postgresService imported in:', Date.now() - t0, 'ms');
  const t1 = Date.now();
  return import('./server/supabaseService.ts').then(() => {
    console.log('supabaseService imported in:', Date.now() - t1, 'ms');
    const t2 = Date.now();
    return import('./server/db.ts').then(({ db }) => {
      console.log('db.ts imported in:', Date.now() - t2, 'ms');
      console.log('Total time:', Date.now() - t0, 'ms');
      process.exit(0);
    });
  });
}).catch(console.error);
