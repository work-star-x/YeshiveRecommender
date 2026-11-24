import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const context = { window: {} };
runInNewContext(await readFile(new URL('supabase-config.js', import.meta.url), 'utf8'), context);
const config = context.window.SUPABASE_CONFIG;
if (!config?.url || !config?.anonKey) throw new Error('Supabase config is missing.');

const response = await fetch(new URL('/rest/v1/site_content?select=id&id=eq.main', config.url), {
  headers: {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`
  },
  signal: AbortSignal.timeout(30000)
});
if (!response.ok) throw new Error(`Supabase database read failed: HTTP ${response.status}`);
console.log('Supabase database read succeeded.');
