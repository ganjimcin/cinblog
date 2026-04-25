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
    
    // Security: Prevent path traversal and restrict to project directory
    const isAllowed = fullPath.startsWith(process.cwd()) && (
      fullPath.includes('/src/content') || 
      fullPath.includes('/public/assets') ||
      fullPath === process.cwd()
    );

    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Forbidden path' }), { status: 403 });
    }
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
