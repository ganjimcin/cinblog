// src/components/admin-cms/utils/github.js
const REPO_OWNER = 'ganjimcin';
const REPO_NAME = 'cinblog';

/**
 * Fetches data from the GitHub API.
 */
export async function ghFetch(path, githubToken, options = {}) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/${path}`;
  
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers
      }
    });

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch (e) {
        errorData = { message: res.statusText };
      }
      
      if (res.status === 401) {
        console.error('GitHub API Error: Session expired or invalid token.');
      }
      
      // Construir un mensaje de error más detallado para GitHub
      const githubMessage = errorData.message || `Error ${res.status}`;
      const detailedError = errorData.errors ? `: ${JSON.stringify(errorData.errors)}` : '';
      const error = new Error(`${githubMessage}${detailedError}`);
      error.status = res.status;
      throw error;
    }
    
    return res.json();
  } catch (err) {
    console.error("ghFetch Error:", err);
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      const error = new Error('Error de red: No se pudo conectar con GitHub. Verifica tu conexión o el estado de la API.');
      error.status = 0;
      throw error;
    }
    throw err;
  }
}

export { REPO_OWNER, REPO_NAME };
