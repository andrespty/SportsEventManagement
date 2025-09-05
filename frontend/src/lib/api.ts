const API_URL = process.env.REACT_APP_API_URL!;

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json();
  
  return data;
}
