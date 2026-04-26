import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { content, path: targetPath } = body;
    
    if (!targetPath) {
      return new Response(JSON.stringify({ error: 'Missing path in body' }), { status: 400 });
    }

    const fullPath = path.resolve(process.cwd(), targetPath);
    
    // Security: Prevent path traversal and restrict to project directory
    const isAllowed = fullPath.startsWith(process.cwd()) && (
      fullPath.includes('/src/content/') || 
      fullPath.includes('/public/assets/') || 
      fullPath.endsWith('twilight.config.yaml')
    );

    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Forbidden path' }), { status: 403 });
    }

    const decodedContent = Buffer.from(content, 'base64').toString('utf-8');

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, decodedContent, 'utf8');

    return new Response(JSON.stringify({
      message: 'File saved locally',
      content: { path: targetPath }
    }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
