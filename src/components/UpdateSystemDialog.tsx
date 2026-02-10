import { useState, ChangeEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { apiParseFile, apiUpdateSystemData } from '@/api';
import type { Mapping } from '@/types';

interface UpdateSystemDialogProps {
  open: boolean;
  onClose: () => void;
  runId: string;
  token: string;
  onSuccess: () => void;
}

const defaultMapping: Mapping['system'] = {
  issueDateCol: 'Emisión',
  dueDateCol: 'Vencim.',
  descriptionCol: 'Comentario',
  amountMode: 'debe-haber',
  amountCol: '',
  debeCol: 'Debe',
  haberCol: 'Haber',
};

export function UpdateSystemDialog({
  open,
  onClose,
  runId,
  token,
  onSuccess,
}: UpdateSystemDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [headerRow, setHeaderRow] = useState(6);
  const [mapping, setMapping] = useState<Mapping['system']>(defaultMapping);
  const [loading, setLoading] = useState(false);
  const [parseLoading, setParseLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParseLoading(true);
    setError(null);
    try {
      const result = await apiParseFile(token, f, undefined, 6);
      setSheets(result.sheets);
      setRows(result.rows);
      setColumns(result.rows.length ? Object.keys(result.rows[0] as object) : []);
      setSelectedSheet(result.sheets[0] || '');
      setHeaderRow(6);
    } catch (err: any) {
      setError(err.message || 'Error al leer archivo');
    } finally {
      setParseLoading(false);
    }
  };

  const reparse = async (sheet: string, row: number) => {
    if (!file) return;
    setParseLoading(true);
    setError(null);
    try {
      const result = await apiParseFile(token, file, sheet || undefined, row);
      setRows(result.rows);
      setColumns(result.rows.length ? Object.keys(result.rows[0] as object) : []);
    } catch (err: any) {
      setError(err.message || 'Error al leer archivo');
    } finally {
      setParseLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!file || rows.length === 0) {
      setError('Cargá un archivo y elegí hoja/fila de encabezados');
      return;
    }
    if (!mapping.amountCol && mapping.amountMode === 'single') {
      setError('Seleccioná la columna de importe del sistema');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiUpdateSystemData(token, runId, { rows, mapping });
      onSuccess();
      onClose();
      setFile(null);
      setRows([]);
      setMapping(defaultMapping);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Actualizar Excel de sistema">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Subí el nuevo Excel del sistema. Los valores se actualizarán sin perder el estado del trabajo (matches, pendientes).
        </p>
        <div>
          <Label>Archivo</Label>
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
        </div>
        {sheets.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hoja</Label>
                <Select
                  value={selectedSheet}
                  onChange={(e) => {
                    const s = e.target.value;
                    setSelectedSheet(s);
                    reparse(s, headerRow);
                  }}
                >
                  {sheets.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Fila de encabezados</Label>
                <Input
                  type="number"
                  min={1}
                  value={headerRow}
                  onChange={(e) => setHeaderRow(Number(e.target.value))}
                  onBlur={() => reparse(selectedSheet, headerRow)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mapeo de columnas</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Select
                  value={mapping.issueDateCol}
                  onChange={(e) => setMapping((m) => ({ ...m, issueDateCol: e.target.value }))}
                >
                  <option value="">Fecha emisión</option>
                  {columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
                <Select
                  value={mapping.dueDateCol}
                  onChange={(e) => setMapping((m) => ({ ...m, dueDateCol: e.target.value }))}
                >
                  <option value="">Fecha venc.</option>
                  {columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
                <Select
                  value={mapping.descriptionCol}
                  onChange={(e) => setMapping((m) => ({ ...m, descriptionCol: e.target.value }))}
                >
                  <option value="">Descripción / Comentario</option>
                  {columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
                <Select
                  value={mapping.amountMode}
                  onChange={(e) => setMapping((m) => ({ ...m, amountMode: e.target.value as 'single' | 'debe-haber' }))}
                >
                  <option value="single">Importe única</option>
                  <option value="debe-haber">Debe / Haber</option>
                </Select>
                {mapping.amountMode === 'single' ? (
                  <Select
                    value={mapping.amountCol}
                    onChange={(e) => setMapping((m) => ({ ...m, amountCol: e.target.value }))}
                  >
                    <option value="">Importe</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                ) : (
                  <>
                    <Select
                      value={mapping.debeCol}
                      onChange={(e) => setMapping((m) => ({ ...m, debeCol: e.target.value }))}
                    >
                      <option value="">Debe</option>
                      {columns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                    <Select
                      value={mapping.haberCol}
                      onChange={(e) => setMapping((m) => ({ ...m, haberCol: e.target.value }))}
                    >
                      <option value="">Haber</option>
                      {columns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{rows.length} filas</p>
          </>
        )}
        {parseLoading && <p className="text-sm text-muted-foreground">Procesando archivo...</p>}
        {error && (
          <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || rows.length === 0}>
            {loading ? 'Actualizando...' : 'Actualizar sistema'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
