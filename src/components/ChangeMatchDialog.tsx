import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { apiSetMatch } from '@/api';
import type { ExtractLine, SystemLine } from '@/types';

interface ChangeMatchDialogProps {
  open: boolean;
  onClose: () => void;
  runId: string;
  token: string;
  systemLine: SystemLine;
  extractLines: ExtractLine[];
  currentExtractIds: string[];
  onSuccess: () => void;
}

export function ChangeMatchDialog({
  open,
  onClose,
  runId,
  token,
  systemLine,
  extractLines,
  currentExtractIds,
  onSuccess,
}: ChangeMatchDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentExtractIds));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setSelected(new Set(currentExtractIds));
  }, [open, currentExtractIds]);

  const sum = useMemo(() => {
    let s = 0;
    selected.forEach((id) => {
      const ext = extractLines.find((e) => e.id === id);
      if (ext) s += ext.amount;
    });
    return s;
  }, [selected, extractLines]);

  const isValid = Math.abs(sum - systemLine.amount) < 0.02;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error('La suma debe coincidir con el importe del sistema');
      return;
    }
    setLoading(true);
    try {
      await apiSetMatch(token, runId, systemLine.id, Array.from(selected));
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} title="Cambiar match">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sistema: {systemLine.description || '-'} — ${systemLine.amount.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">
          Seleccioná una o más filas del extracto cuya suma coincida con el importe del sistema.
        </p>
        <div className="max-h-64 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 p-2"></th>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Concepto</th>
                <th className="p-2 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {extractLines.map((ext) => (
                <tr
                  key={ext.id}
                  className="border-b last:border-0 cursor-pointer hover:bg-muted/30"
                  onClick={() => toggle(ext.id)}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.has(ext.id)}
                      onChange={() => toggle(ext.id)}
                      className="h-4 w-4 rounded border-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="p-2">{ext.date ? new Date(ext.date).toLocaleDateString() : '-'}</td>
                  <td className="p-2 max-w-[180px] truncate">{ext.concept || '-'}</td>
                  <td className="p-2 text-right">${ext.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">
            Suma seleccionada: <strong>${sum.toFixed(2)}</strong>
            {isValid ? (
              <span className="ml-2 text-green-600 dark:text-green-400">✓ Coincide</span>
            ) : (
              <span className="ml-2 text-destructive">(debe ser ${systemLine.amount.toFixed(2)})</span>
            )}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || loading}>
              {loading ? 'Guardando...' : 'Guardar match'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
