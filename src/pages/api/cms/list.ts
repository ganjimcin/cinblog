import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const folderPath = url.searchParams.get('path');
  
  if (!folderPath) {
    return new Response(JSON.stringify({ error: 'Missing path parameter' }), { status: 400 });
  }

  try {
    const fullPath = path.resolve(process.cwd(), folderPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    const files = entries.map(entry => ({
      name: entry.name,
      path: path.join(folderPath, entry.name),
      type: entry.isDirectory() ? 'dir' : 'file',
      sha: 'local'
    }));

    return new Response(JSON.stringify(files), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
