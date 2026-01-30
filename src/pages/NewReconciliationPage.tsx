import { useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setExtractFile,
  setExtractSheet,
  setExtractHeaderRow,
  setSystemFile,
  setSystemSheet,
  setSystemHeaderRow,
  updateExtractMapping,
  updateSystemMapping,
  setWindowDays,
  setCutDate,
  setExcludeConcepts,
  resetReconciliation,
} from '@/store/slices/reconciliationsSlice';
import {
  parseExtractFileThunk,
  parseSystemFileThunk,
  runReconciliationThunk,
} from '@/store/thunks/reconciliationsThunks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

export function NewReconciliationPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const token = useAppSelector((state) => state.auth.token);
  const { extract, system, mapping, windowDays, cutDate, excludeConcepts, currentRun } = 
    useAppSelector((state) => state.reconciliations);

  useEffect(() => {
    return () => {
      dispatch(resetReconciliation());
    };
  }, [dispatch]);

  useEffect(() => {
    if (token && extract.file) {
      dispatch(parseExtractFileThunk(token, extract.file, extract.selectedSheet, extract.headerRow));
    }
  }, [dispatch, token, extract.file, extract.selectedSheet, extract.headerRow]);

  useEffect(() => {
    if (token && system.file) {
      dispatch(parseSystemFileThunk(token, system.file, system.selectedSheet, system.headerRow));
    }
  }, [dispatch, token, system.file, system.selectedSheet, system.headerRow]);

  const handleExtractFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    dispatch(setExtractFile(file));
  };

  const handleSystemFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    dispatch(setSystemFile(file));
  };

  const handleRun = async () => {
    if (!token) return;
    try {
      await dispatch(runReconciliationThunk(token));
      toast.success('Conciliación completada exitosamente');
      if (currentRun.summary) {
        navigate(`/run/${currentRun.summary.runId}`);
      }
    } catch (err) {
      toast.error('Error al ejecutar la conciliación');
    }
  };

  const conceptOptions = (() => {
    if (!mapping.extract.conceptCol) return [];
    const set = new Set<string>();
    for (const row of extract.rows) {
      const raw = row[mapping.extract.conceptCol];
      if (raw === null || raw === undefined) continue;
      const text = String(raw).trim();
      if (text) set.add(text);
    }
    return Array.from(set).sort();
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nueva Conciliación</h1>
        <p className="text-muted-foreground">Cargá los archivos y configurá el proceso de conciliación</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Cargar Extracto Bancario</CardTitle>
          <CardDescription>Archivo Excel o CSV del extracto bancario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExtractFile}
          />
          {extract.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {extract.error}
            </div>
          )}
          {extract.isLoading && <p className="text-sm text-muted-foreground">Procesando...</p>}
          {extract.sheets.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Hoja</Label>
                <Select
                  value={extract.selectedSheet}
                  onChange={(e) => dispatch(setExtractSheet(e.target.value))}
                >
                  {extract.sheets.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fila de encabezados</Label>
                <Input
                  type="number"
                  min={1}
                  value={extract.headerRow}
                  onChange={(e) => dispatch(setExtractHeaderRow(Number(e.target.value)))}
                />
              </div>
            </div>
          )}
          {extract.rows.length > 0 && (
            <div className="rounded-md border">
              <div className="max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {extract.columns.map((col) => (
                        <TableHead key={col}>{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extract.rows.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        {extract.columns.map((col) => (
                          <TableCell key={`${idx}-${col}`}>{String(row[col] ?? '')}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="p-2 text-sm text-muted-foreground border-t">
                Mostrando 5 de {extract.rows.length} filas
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Cargar Sistema</CardTitle>
          <CardDescription>Archivo Excel o CSV del sistema interno</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleSystemFile}
          />
          {system.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {system.error}
            </div>
          )}
          {system.isLoading && <p className="text-sm text-muted-foreground">Procesando...</p>}
          {system.sheets.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Hoja</Label>
                <Select
                  value={system.selectedSheet}
                  onChange={(e) => dispatch(setSystemSheet(e.target.value))}
                >
                  {system.sheets.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fila de encabezados</Label>
                <Input
                  type="number"
                  min={1}
                  value={system.headerRow}
                  onChange={(e) => dispatch(setSystemHeaderRow(Number(e.target.value)))}
                />
              </div>
            </div>
          )}
          {system.rows.length > 0 && (
            <div className="rounded-md border">
              <div className="max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {system.columns.map((col) => (
                        <TableHead key={col}>{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {system.rows.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        {system.columns.map((col) => (
                          <TableCell key={`${idx}-${col}`}>{String(row[col] ?? '')}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="p-2 text-sm text-muted-foreground border-t">
                Mostrando 5 de {system.rows.length} filas
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Mapeo de Columnas</CardTitle>
          <CardDescription>Selecciona las columnas correspondientes de cada archivo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold">Extracto</h3>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Select
                  value={mapping.extract.dateCol}
                  onChange={(e) => dispatch(updateExtractMapping({ dateCol: e.target.value }))}
                >
                  <option value="">Seleccionar</option>
                  {extract.columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Concepto</Label>
                <Select
                  value={mapping.extract.conceptCol}
                  onChange={(e) => dispatch(updateExtractMapping({ conceptCol: e.target.value }))}
                >
                  <option value="">Seleccionar</option>
                  {extract.columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modo Importe</Label>
                <Select
                  value={mapping.extract.amountMode}
                  onChange={(e) => dispatch(updateExtractMapping({ 
                    amountMode: e.target.value as 'single' | 'debe-haber' 
                  }))}
                >
                  <option value="single">Columna única</option>
                  <option value="debe-haber">Debe / Haber</option>
                </Select>
              </div>
              {mapping.extract.amountMode === 'single' ? (
                <div className="space-y-2">
                  <Label>Importe</Label>
                  <Select
                    value={mapping.extract.amountCol}
                    onChange={(e) => dispatch(updateExtractMapping({ amountCol: e.target.value }))}
                  >
                    <option value="">Seleccionar</option>
                    {extract.columns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </Select>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Debe</Label>
                    <Select
                      value={mapping.extract.debeCol}
                      onChange={(e) => dispatch(updateExtractMapping({ debeCol: e.target.value }))}
                    >
                      <option value="">Seleccionar</option>
                      {extract.columns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Haber</Label>
                    <Select
                      value={mapping.extract.haberCol}
                      onChange={(e) => dispatch(updateExtractMapping({ haberCol: e.target.value }))}
                    >
                      <option value="">Seleccionar</option>
                      {extract.columns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </Select>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Sistema</h3>
              <div className="space-y-2">
                <Label>Fecha Emisión</Label>
                <Select
                  value={mapping.system.issueDateCol}
                  onChange={(e) => dispatch(updateSystemMapping({ issueDateCol: e.target.value }))}
                >
                  <option value="">Seleccionar</option>
                  {system.columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha Vencimiento</Label>
                <Select
                  value={mapping.system.dueDateCol}
                  onChange={(e) => dispatch(updateSystemMapping({ dueDateCol: e.target.value }))}
                >
                  <option value="">Seleccionar</option>
                  {system.columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modo Importe</Label>
                <Select
                  value={mapping.system.amountMode}
                  onChange={(e) => dispatch(updateSystemMapping({ 
                    amountMode: e.target.value as 'single' | 'debe-haber' 
                  }))}
                >
                  <option value="single">Columna única</option>
                  <option value="debe-haber">Debe / Haber</option>
                </Select>
              </div>
              {mapping.system.amountMode === 'single' ? (
                <div className="space-y-2">
                  <Label>Importe</Label>
                  <Select
                    value={mapping.system.amountCol}
                    onChange={(e) => dispatch(updateSystemMapping({ amountCol: e.target.value }))}
                  >
                    <option value="">Seleccionar</option>
                    {system.columns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </Select>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Debe</Label>
                    <Select
                      value={mapping.system.debeCol}
                      onChange={(e) => dispatch(updateSystemMapping({ debeCol: e.target.value }))}
                    >
                      <option value="">Seleccionar</option>
                      {system.columns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Haber</Label>
                    <Select
                      value={mapping.system.haberCol}
                      onChange={(e) => dispatch(updateSystemMapping({ haberCol: e.target.value }))}
                    >
                      <option value="">Seleccionar</option>
                      {system.columns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Parámetros de Conciliación</CardTitle>
          <CardDescription>Configura las opciones de conciliación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Ventana de días</Label>
              <Input
                type="number"
                min={0}
                value={windowDays}
                onChange={(e) => dispatch(setWindowDays(Number(e.target.value)))}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de corte</Label>
              <Input
                type="date"
                value={cutDate}
                onChange={(e) => dispatch(setCutDate(e.target.value))}
              />
            </div>
          </div>
          {conceptOptions.length > 0 && (
            <div className="space-y-3">
              <div>
                <Label>Excluir conceptos del extracto</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Seleccioná los conceptos que querés excluir de la conciliación
                </p>
              </div>
              <div className="rounded-md border bg-card">
                <div className="max-h-[200px] overflow-y-auto p-4 space-y-2">
                  {conceptOptions.map((concept) => (
                    <label
                      key={concept}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={excludeConcepts.includes(concept)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            dispatch(setExcludeConcepts([...excludeConcepts, concept]));
                          } else {
                            dispatch(setExcludeConcepts(excludeConcepts.filter(c => c !== concept)));
                          }
                        }}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                      <span className="text-sm flex-1">{concept}</span>
                    </label>
                  ))}
                </div>
                {excludeConcepts.length > 0 && (
                  <div className="border-t bg-muted/50 px-4 py-2">
                    <p className="text-xs text-muted-foreground">
                      {excludeConcepts.length} concepto{excludeConcepts.length !== 1 ? 's' : ''} excluido{excludeConcepts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {currentRun.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {currentRun.error}
            </div>
          )}
          <Button 
            onClick={handleRun} 
            disabled={currentRun.isLoading || extract.rows.length === 0 || system.rows.length === 0}
            className="w-full"
          >
            {currentRun.isLoading ? 'Procesando...' : 'Ejecutar Conciliación'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
