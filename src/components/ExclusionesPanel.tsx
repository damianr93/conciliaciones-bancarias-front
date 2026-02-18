import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { ExcludeConceptsModal } from './ExcludeConceptsModal';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiListCategories } from '@/api';
import type { ExtractLine } from '@/types';
import type { ExpenseCategory } from '@/types';

const norm = (s: string | null | undefined) =>
  (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

interface ExclusionesPanelProps {
  excludeConcepts: string[];
  extractLines: ExtractLine[];
  canEdit: boolean;
  isClosed: boolean;
  runId?: string;
  token?: string;
  onRemoveExcludedConcept?: (concept: string) => Promise<void>;
  onExcludeConcepts?: (concepts: string[]) => Promise<void>;
  onExcludeByCategory?: (categoryId: string) => Promise<void>;
  onSuccess?: () => void;
}

export function ExclusionesPanel({
  excludeConcepts,
  extractLines,
  canEdit,
  isClosed,
  runId,
  token,
  onRemoveExcludedConcept,
  onExcludeConcepts,
  onExcludeByCategory,
  onSuccess,
}: ExclusionesPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  useEffect(() => {
    if (token && excludeConcepts.length > 0) {
      apiListCategories(token).then(setCategories).catch(() => setCategories([]));
    } else {
      setCategories([]);
    }
  }, [token, excludeConcepts.length]);

  const categoryNamesSet = useMemo(
    () => new Set(categories.map((c) => norm(c.name))),
    [categories],
  );

  const canAdd = canEdit && !isClosed && runId && token && onExcludeConcepts && onExcludeByCategory && onSuccess;
  const canRemove = canEdit && !isClosed && onRemoveExcludedConcept;

  const handleRemove = async (concept: string) => {
    if (!onRemoveExcludedConcept) return;
    setRemoving(concept);
    try {
      await onRemoveExcludedConcept(concept);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.message ?? 'No se pudo quitar la exclusión');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Reglas en uso (exclusiones)</CardTitle>
          <CardDescription>
            Conceptos o categorías excluidos de listas y conteos. Agregá más con &quot;Excluir por categoría&quot;; quitá una regla con el botón al lado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {excludeConcepts.length > 0 ? (
            <ul className="space-y-2">
              {excludeConcepts.map((c) => {
                const isRemoving = removing === c;
                return (
                  <li
                    key={c}
                    className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${
                      isRemoving ? 'bg-muted/60 opacity-80' : 'bg-muted/30'
                    }`}
                  >
                    <span className="text-sm font-medium truncate">
                      {c}
                      {categoryNamesSet.has(norm(c)) && (
                        <span className="text-muted-foreground font-normal"> (categoría)</span>
                      )}
                    </span>
                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-8 gap-1.5"
                        disabled={removing !== null}
                        onClick={() => handleRemove(c)}
                        title="Quitar esta exclusión"
                      >
                        {isRemoving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs">Quitando...</span>
                          </>
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay reglas de exclusión. Usá el botón de abajo para excluir por categoría.
            </p>
          )}

          {canAdd ? (
            <Button onClick={() => setModalOpen(true)}>
              Excluir concepto(s)
            </Button>
          ) : isClosed ? (
            <p className="text-sm text-muted-foreground">
              La conciliación está cerrada. No se pueden agregar más exclusiones.
            </p>
          ) : !canEdit ? (
            <p className="text-sm text-muted-foreground">
              Solo quien edita la conciliación puede agregar conceptos excluidos.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {canAdd && runId && token && onExcludeConcepts && onExcludeByCategory && onSuccess && (
        <ExcludeConceptsModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          extractLines={extractLines}
          excludeConcepts={excludeConcepts}
          runId={runId}
          token={token}
          onExcludeConcepts={onExcludeConcepts}
          onExcludeByCategory={onExcludeByCategory}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}
