import type {
  RunSummary,
  ReconciliationRun,
  RunPayload,
  RunDetail,
  ExpenseCategory,
  Message,
  Issue,
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

export async function apiMe(token: string): Promise<{ id: string; email: string; role: string }> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Sesión inválida');
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

export async function apiUpdateRun(
  token: string,
  id: string,
  data: { status?: 'OPEN' | 'CLOSED'; bankName?: string | null; enabledCategoryIds?: string[] },
): Promise<RunDetail> {
  const res = await fetch(`${BASE_URL}/reconciliations/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('No se pudo actualizar');
  return res.json();
}

export async function apiUpdateSystemData(
  token: string,
  runId: string,
  data: { rows: Record<string, unknown>[]; mapping: RunPayload['system']['mapping'] },
): Promise<RunDetail> {
  const res = await fetch(`${BASE_URL}/reconciliations/${runId}/system`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rows: data.rows, mapping: data.mapping }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'No se pudo actualizar el Excel de sistema');
  }
  return res.json();
}

export async function apiAddExcludedConcept(
  token: string,
  runId: string,
  concept: string,
): Promise<RunDetail> {
  const res = await fetch(`${BASE_URL}/reconciliations/${runId}/exclude-concept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ concept }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'No se pudo excluir concepto');
  }
  return res.json();
}

export async function apiExcludeConcepts(
  token: string,
  runId: string,
  concepts: string[],
): Promise<RunDetail> {
  const res = await fetch(`${BASE_URL}/reconciliations/${runId}/exclude-concepts`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ concepts }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'No se pudo excluir conceptos');
  }
  return res.json();
}

export async function apiExcludeByCategory(
  token: string,
  runId: string,
  categoryId: string,
): Promise<RunDetail> {
  const res = await fetch(`${BASE_URL}/reconciliations/${runId}/exclude-by-category`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ categoryId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'No se pudo excluir por categoría');
  }
  return res.json();
}

export async function apiRemoveExcludedConcept(
  token: string,
  runId: string,
  concept: string,
): Promise<RunDetail> {
  const res = await fetch(`${BASE_URL}/reconciliations/${runId}/remove-excluded-concept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ concept }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'No se pudo quitar la exclusión');
  }
  return res.json();
}

export async function apiSetMatch(
  token: string,
  runId: string,
  systemLineId: string,
  extractLineIds: string[],
): Promise<RunDetail> {
  const res = await fetch(`${BASE_URL}/reconciliations/${runId}/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ systemLineId, extractLineIds }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'No se pudo asignar el match');
  }
  return res.json();
}

export async function apiListRuns(token: string): Promise<ReconciliationRun[]> {
  const res = await fetch(`${BASE_URL}/reconciliations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('No se pudo cargar runs');
  return res.json();
}

export async function apiDeleteRun(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/reconciliations/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'No se pudo borrar');
  }
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

export async function apiRemoveMember(
  token: string,
  runId: string,
  userId: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/reconciliations/${runId}/members/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || 'No se pudo quitar el usuario');
  }
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

export async function apiCreatePending(
  token: string,
  runId: string,
  data: { area: string; systemLineId: string; note?: string }
) {
  const res = await fetch(`${BASE_URL}/reconciliations/${runId}/pending`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('No se pudo crear pendiente');
  return res.json();
}

export async function apiResolvePending(
  token: string,
  runId: string,
  pendingId: string,
  note: string
) {
  const res = await fetch(`${BASE_URL}/reconciliations/${runId}/pending/${pendingId}/resolve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error('No se pudo resolver pendiente');
  return res.json();
}

export async function apiNotifyPending(
  token: string,
  runId: string,
  data: { areas: string[]; customMessage?: string }
): Promise<Array<{ area: string; email: string; sent: boolean; error?: string }>> {
  const res = await fetch(`${BASE_URL}/reconciliations/${runId}/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof body.message === 'string' ? body.message : body.message?.join?.(' ') || 'No se pudo enviar notificación');
  }
  const results: Array<{ area: string; email: string; sent: boolean; error?: string }> = body || [];
  const failed = results.filter((r: { sent: boolean }) => !r.sent);
  if (failed.length > 0) {
    const msg = failed.map((r: { area: string; error?: string }) => `${r.area}: ${r.error || 'Error'}`).join('; ');
    throw new Error(msg);
  }
  return results;
}

export async function apiCreateIssue(
  token: string,
  runId: string,
  data: { title: string; body?: string }
): Promise<Issue> {
  const res = await fetch(`${BASE_URL}/reconciliations/${runId}/issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || 'No se pudo crear el issue');
  }
  return res.json();
}

export async function apiUpdateIssue(
  token: string,
  runId: string,
  issueId: string,
  data: { title?: string; body?: string }
): Promise<Issue> {
  const res = await fetch(`${BASE_URL}/reconciliations/${runId}/issues/${issueId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || 'No se pudo actualizar el issue');
  }
  return res.json();
}

export async function apiAddIssueComment(
  token: string,
  runId: string,
  issueId: string,
  body: string
): Promise<Issue['comments'][0]> {
  const res = await fetch(`${BASE_URL}/reconciliations/${runId}/issues/${issueId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || 'No se pudo agregar el comentario');
  }
  return res.json();
}
