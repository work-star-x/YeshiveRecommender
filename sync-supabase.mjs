import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const context = { window: {} };

for (const filename of ['supabase-config.js', 'data.js']) {
  const source = await readFile(new URL(filename, import.meta.url), 'utf8');
  runInNewContext(source, context);
}

const config = context.window.SUPABASE_CONFIG;
const appData = context.window.APP_DATA;
const email = process.env.SUPABASE_ADMIN_EMAIL;
const password = process.env.SUPABASE_ADMIN_PASSWORD;

if (!config?.url || !config?.anonKey) throw new Error('Supabase config is missing.');
if (!email || !password) throw new Error('Set the admin email and password environment variables.');
if (!Array.isArray(appData?.questions) || !Array.isArray(appData?.yeshivot) || !Array.isArray(appData?.parameters)) {
  throw new Error('data.js is missing questions, yeshivot, or parameters.');
}

async function request(path, options) {
  const response = await fetch(new URL(path, config.url), options);
  const text = await response.text();

  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

const auth = await request('/auth/v1/token?grant_type=password', {
  method: 'POST',
  headers: {
    apikey: config.anonKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email, password })
});

try {
  const rows = await request('/rest/v1/site_content?on_conflict=id', {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({
      id: 'main',
      questions: appData.questions,
      yeshivot: appData.yeshivot,
      parameters: appData.parameters,
      updated_at: new Date().toISOString(),
      updated_by: auth.user.id
    })
  });

  console.log(`Updated Supabase content row: ${rows?.[0]?.id ?? 'main'}`);
} finally {
  await fetch(new URL('/auth/v1/logout', config.url), {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${auth.access_token}`
    }
  });
}