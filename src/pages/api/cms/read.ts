import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const filePath = url.searchParams.get('path');
  
  if (!filePath) {
    return new Response(JSON.stringify({ error: 'Missing path parameter' }), { status: 400 });
  }

  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    
    // Security: Prevent path traversal and restrict to project directory
    const isAllowed = fullPath.startsWith(process.cwd()) && (
      fullPath.includes('/src/content/') || 
      fullPath.includes('/public/assets/') || 
      fullPath.endsWith('twilight.config.yaml')
    );

    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Forbidden path' }), { status: 403 });
    }
    try {
      await fs.access(fullPath);
    } catch {
      return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 });
    }
    const content = await fs.readFile(fullPath, 'utf8');
    const base64Content = Buffer.from(content).toString('base64');

    return new Response(JSON.stringify({
      content: base64Content,
      sha: 'local',
      size: content.length,
      path: filePath
    }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
