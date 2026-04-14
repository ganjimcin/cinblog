import { ghFetch } from './github';

const IS_DEV = import.meta.env.DEV;

export async function cmsFetch(path, githubToken, options = {}) {
  // Solo usamos API local si no hay token, o el token es 'mock-token', o estamos en desarrollo
  if (IS_DEV && (!githubToken || githubToken === 'mock-token')) {
    let localUrl = '';
    const method = options.method || 'GET';
    
    if (method === 'GET') {
      const type = path.includes('contents/') ? (path.split('contents/')[1].includes('.') ? 'read' : 'list') : 'read';
      const actualPath = path.includes('contents/') ? path.split('contents/')[1] : path;
      localUrl = `/api/cms/${type}/?path=${encodeURIComponent(actualPath)}`;
    } else if (method === 'PUT') {
      const actualPath = path.includes('contents/') ? path.split('contents/')[1] : path;
      localUrl = `/api/cms/save/`;
      const body = JSON.parse(options.body);
      options.body = JSON.stringify({
        ...body,
        path: actualPath
      });
    }

    try {
      const res = await fetch(localUrl, options);
      if (!res.ok) throw new Error(`Local API Error: ${res.status}`);
      const data = await res.json();
      
      // Mapear respuesta local a formato GitHub para no romper Dashboard/Editor
      if (Array.isArray(data)) {
        return data.map(f => ({
          ...f,
          type: f.type === 'dir' ? 'dir' : 'file',
          download_url: `/api/cms/read?path=${f.path}`
        }));
      }
      return data;
    } catch (err) {
      console.error("Local Mode Error:", err);
      // fallback to GitHub if local fails?
    }
  }

  // Si no, usamos GitHub normal
  return ghFetch(path, githubToken, options);
}
