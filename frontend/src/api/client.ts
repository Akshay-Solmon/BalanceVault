const API_BASE = '';

function getToken(): string | null {
  return localStorage.getItem('bv_token');
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    let json: any = null;
    const text = await res.text();
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text };
    }

    if (!res.ok) {
      return {
        data: null,
        error: json?.message || json?.error || `Request failed with status ${res.status}`,
        status: res.status,
      };
    }

    return { data: json as T, error: null, status: res.status };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || 'Network connection failed.',
      status: 0,
    };
  }
}
