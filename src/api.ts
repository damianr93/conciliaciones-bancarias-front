import type {
  RunSummary,
  ReconciliationRun,
  RunPayload,
  RunDetail,
  ExpenseCategory,
  Message,
} from './types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error('Credenciales inválidas');
  }
  return res.json();
}

export async function apiRunReconciliation(
  token: string,
  payload: RunPayload,
): Promise<RunSummary> {
  const res = await fetch(`${BASE_URL}/reconciliations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error');
  }
  return res.json();
}

export async function apiGetRun(token: string, id: string): Promise<RunDetail> {
  const res = await fetch(`${BASE_URL}/reconciliations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('No se pudo cargar el run');
  return res.json();
}

export async function apiListRuns(token: string): Promise<ReconciliationRun[]> {
  const res = await fetch(`${BASE_URL}/reconciliations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('No se pudo cargar runs');
  return res.json();
}

export async function apiExportRun(token: string, id: string) {
  const res = await fetch(`${BASE_URL}/reconciliations/${id}/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('No se pudo exportar');
  return res.blob();
}

export async function apiShareRun(
  token: string,
  id: string,
  email: string,
  role: 'OWNER' | 'EDITOR' | 'VIEWER',
) {
  const res = await fetch(`${BASE_URL}/reconciliations/${id}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) throw new Error('No se pudo compartir');
  return res.json();
}

export async function apiAddMessage(
  token: string,
  id: string,
  body: string,
): Promise<Message> {
  const res = await fetch(`${BASE_URL}/reconciliations/${id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error('No se pudo enviar mensaje');
  return res.json();
}

export async function apiParseFile(
  token: string,
  file: File,
  sheetName?: string,
  headerRow?: number,
): Promise<{ sheets: string[]; rows: Record<string, unknown>[] }> {
  const form = new FormData();
  form.append('file', file);
  if (sheetName) form.append('sheetName', sheetName);
  if (headerRow) form.append('headerRow', String(headerRow));
  const res = await fetch(`${BASE_URL}/reconciliations/parse`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      throw new Error(data.message || 'No se pudo parsear archivo');
    } catch {
      throw new Error(text || 'No se pudo parsear archivo');
    }
  }
  return res.json();
}

export async function apiListCategories(token: string): Promise<ExpenseCategory[]> {
  const res = await fetch(`${BASE_URL}/expenses/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('No se pudo cargar categorías');
  return res.json();
}

export async function apiCreateCategory(token: string, name: string) {
  const res = await fetch(`${BASE_URL}/expenses/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('No se pudo crear categoría');
  return res.json();
}

export async function apiDeleteCategory(token: string, id: string) {
  const res = await fetch(`${BASE_URL}/expenses/categories/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('No se pudo borrar categoría');
  return res.json();
}

export async function apiCreateRule(
  token: string,
  payload: {
    categoryId: string;
    pattern: string;
    isRegex?: boolean;
    caseSensitive?: boolean;
  },
) {
  const res = await fetch(`${BASE_URL}/expenses/rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('No se pudo crear regla');
  return res.json();
}

export async function apiDeleteRule(token: string, id: string) {
  const res = await fetch(`${BASE_URL}/expenses/rules/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('No se pudo borrar regla');
  return res.json();
}
