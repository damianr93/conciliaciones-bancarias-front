import { useState } from 'react';
import { MessageSquare, Plus, ChevronDown, ChevronRight, Send, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { apiCreateIssue, apiUpdateIssue, apiAddIssueComment } from '@/api';
import type { Issue, IssueComment } from '@/types';

interface IssuesPanelProps {
  runId: string;
  token: string | undefined;
  issues: Issue[];
  isOwner: boolean;
  onRefresh: () => void | Promise<unknown>;
}

export function IssuesPanel({ runId, token, issues, isOwner, onRefresh }: IssuesPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCommentForId, setLoadingCommentForId] = useState<string | null>(null);
  const [pendingNewIssues, setPendingNewIssues] = useState<Issue[]>([]);
  const [pendingUpdatedIssues, setPendingUpdatedIssues] = useState<Record<string, Issue>>({});
  const [pendingComments, setPendingComments] = useState<Record<string, IssueComment[]>>({});

  const displayIssues: Issue[] = (() => {
    const base = issues.map((i) => pendingUpdatedIssues[i.id] ?? i);
    return [...base, ...pendingNewIssues];
  })();

  const getDisplayIssue = (issue: Issue): Issue => pendingUpdatedIssues[issue.id] ?? issue;
  const getDisplayComments = (issue: Issue): IssueComment[] => {
    const issueData = getDisplayIssue(issue);
    const extra = pendingComments[issue.id] ?? [];
    return [...issueData.comments, ...extra];
  };

  const selected = displayIssues.find((i) => i.id === selectedId);

  const handleCreate = async () => {
    if (!token || !newTitle.trim()) return;
    setLoading(true);
    try {
      const newIssue = await apiCreateIssue(token, runId, {
        title: newTitle.trim(),
        body: newBody.trim() || undefined,
      });
      toast.success('Issue creado');
      setNewTitle('');
      setNewBody('');
      setCreating(false);
      setPendingNewIssues((prev) => [...prev, newIssue]);
      setLoading(false);
      Promise.resolve(onRefresh()).then(() => setPendingNewIssues([]));
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al crear');
      setLoading(false);
    }
  };

  const handleUpdate = async (issueId: string) => {
    if (!token || !isOwner) return;
    setLoading(true);
    try {
      const updated = await apiUpdateIssue(token, runId, issueId, {
        title: editTitle.trim() || undefined,
        body: editBody,
      });
      toast.success('Issue actualizado');
      setEditingId(null);
      setPendingUpdatedIssues((prev) => ({ ...prev, [issueId]: updated }));
      setLoading(false);
      Promise.resolve(onRefresh()).then(() =>
        setPendingUpdatedIssues((prev) => {
          const next = { ...prev };
          delete next[issueId];
          return next;
        })
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al actualizar');
      setLoading(false);
    }
  };

  const handleAddComment = async (issueId: string) => {
    if (!token || !commentBody.trim()) return;
    setLoadingCommentForId(issueId);
    const bodyToSend = commentBody.trim();
    setCommentBody('');
    try {
      const newComment = await apiAddIssueComment(token, runId, issueId, bodyToSend);
      toast.success('Comentario agregado');
      setPendingComments((prev) => ({
        ...prev,
        [issueId]: [...(prev[issueId] ?? []), newComment],
      }));
      setLoadingCommentForId(null);
      Promise.resolve(onRefresh()).then(() =>
        setPendingComments((prev) => {
          const next = { ...prev };
          delete next[issueId];
          return next;
        })
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al comentar');
      setCommentBody(bodyToSend);
      setLoadingCommentForId(null);
    }
  };

  const startEdit = (issue: Issue) => {
    setEditingId(issue.id);
    setEditTitle(issue.title);
    setEditBody(issue.body ?? '');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Issues ({displayIssues.length})
        </h3>
        {token && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreating(true)}
            disabled={loading}
          >
            <Plus className="mr-1 h-4 w-4" />
            Nuevo issue
          </Button>
        )}
      </div>

      {creating && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <Input
            placeholder="Título"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={loading}
          />
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
            placeholder="Descripción (opcional)"
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            disabled={loading}
          />
          <div className="flex gap-2 items-center">
            <Button size="sm" onClick={handleCreate} disabled={!newTitle.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear'
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setCreating(false); setNewTitle(''); setNewBody(''); }} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <ul className="space-y-1">
        {displayIssues.map((issue) => {
          const displayIssue = getDisplayIssue(issue);
          const comments = getDisplayComments(issue);
          return (
            <li key={issue.id} className="rounded-md border overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/50"
                onClick={() => {
                  const next = selectedId === issue.id ? null : issue.id;
                  setSelectedId(next);
                  if (next !== issue.id) setEditingId(null);
                }}
              >
                {selectedId === issue.id ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                <span className="font-medium truncate flex-1">{displayIssue.title}</span>
                <span className="text-xs text-muted-foreground">
                  {comments.length} comentario{comments.length !== 1 ? 's' : ''}
                </span>
              </button>
              {selectedId === issue.id && (
                <div className="border-t p-4 space-y-4 bg-muted/20">
                  {editingId === issue.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Título"
                      />
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        placeholder="Descripción"
                      />
                      <div className="flex gap-2 items-center">
                        <Button size="sm" onClick={() => handleUpdate(issue.id)} disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            'Guardar'
                          )}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={loading}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isOwner && (
                        <Button variant="outline" size="sm" onClick={() => startEdit(displayIssue)} disabled={loading}>
                          <Pencil className="mr-1 h-3 w-3" />
                          Editar
                        </Button>
                      )}
                      {(displayIssue.body || displayIssue.title) && (
                        <div className="text-sm">
                          <p className="font-medium">{displayIssue.title}</p>
                          {displayIssue.body && <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{displayIssue.body}</p>}
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Comentarios</p>
                        {comments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Sin comentarios aún.</p>
                        ) : (
                          <ul className="space-y-2">
                            {comments.map((c) => (
                              <li key={c.id} className="rounded border p-2 text-sm">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{c.author.email}</span>
                                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="mt-1">{c.body}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                        {token && (
                          <div className="flex gap-2 pt-2 items-start">
                            <textarea
                              className="flex min-h-[60px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
                              placeholder="Escribir comentario..."
                              value={commentBody}
                              onChange={(e) => setCommentBody(e.target.value)}
                              disabled={loadingCommentForId === issue.id}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddComment(issue.id)}
                              disabled={!commentBody.trim() || loadingCommentForId === issue.id}
                            >
                              {loadingCommentForId === issue.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {displayIssues.length === 0 && !creating && (
        <p className="text-muted-foreground text-center py-8">
          No hay issues. Creá uno para abrir un caso y que el equipo comente.
        </p>
      )}
    </div>
  );
}
