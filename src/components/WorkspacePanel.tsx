import { useState, useMemo, useEffect, Fragment } from 'react';
import { Check, Send, Link2, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { CollapsibleSection } from './ui/CollapsibleSection';
import { ChangeMatchDialog } from './ChangeMatchDialog';
import type { UnmatchedSystem, SystemLine, ExtractLine, Match } from '@/types';

interface WorkspacePanelProps {
  matches: Match[];
  unmatchedSystem: UnmatchedSystem[];
  unmatchedExtract: { extractLineId: string }[];
  systemLines: SystemLine[];
  extractLines: ExtractLine[];
  systemById: Map<string, SystemLine>;
  extractById: Map<string, ExtractLine>;
  excludeConcepts?: string[];
  onAddExcludedConcept?: (concept: string) => Promise<void>;
  onSave?: (items: Array<{ systemLineId: string; area: string; status: 'OVERDUE' | 'DEFERRED' }>) => Promise<void>;
  onFinalize?: () => void;
  onChangeMatchSuccess?: () => void;
  runId?: string;
  token?: string;
  pendingAreaBySystemLineId?: Map<string, string>;
}

const AREAS = ['Dirección', 'Tesorería'];

const TAB_SISTEMA = 'sistema';
const TAB_EXTRACTO = 'extracto';

export function WorkspacePanel({ 
  matches,
  unmatchedSystem, 
  unmatchedExtract,
  systemLines,
  extractLines,
  systemById,
  extractById,
  excludeConcepts = [],
  onAddExcludedConcept,
  onSave,
  onFinalize,
  onChangeMatchSuccess,
  runId,
  token,
  pendingAreaBySystemLineId,
}: WorkspacePanelProps) {
  const [workItems, setWorkItems] = useState<Map<string, { area: string; status: 'OVERDUE' | 'DEFERRED' }>>(new Map());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkArea, setBulkArea] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(TAB_SISTEMA);
  const [changeMatchSystem, setChangeMatchSystem] = useState<SystemLine | null>(null);
  const [newExcludedConcept, setNewExcludedConcept] = useState('');
  const [addingExcluded, setAddingExcluded] = useState(false);
  const [expandedSystemId, setExpandedSystemId] = useState<string | null>(null);
  const [expandedExtractId, setExpandedExtractId] = useState<string | null>(null);

  useEffect(() => {
    setWorkItems((prev) => {
      const next = new Map(prev);
      let changed = false;
      const pendingArea = pendingAreaBySystemLineId ?? new Map<string, string>();
      for (const u of unmatchedSystem) {
        const id = u.systemLineId;
        const status = (u.status === 'OVERDUE' || u.status === 'DEFERRED') ? u.status : 'DEFERRED';
        if (!next.has(id)) {
          next.set(id, { area: pendingArea.get(id) ?? '', status });
          changed = true;
        } else {
          const current = next.get(id)!;
          const areaFromBackend = pendingArea.get(id) ?? '';
          if (current.area === '' && areaFromBackend !== '') {
            next.set(id, { ...current, area: areaFromBackend });
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [unmatchedSystem, pendingAreaBySystemLineId]);

  const uniqueConcepts = useMemo(() => {
    const set = new Set<string>();
    extractLines.forEach((l) => {
      const c = (l.concept ?? '').trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [extractLines]);

  const unmatchedSystemIds = useMemo(() => new Set(unmatchedSystem.map((u) => u.systemLineId)), [unmatchedSystem]);
  const unmatchedExtractIds = useMemo(() => new Set(unmatchedExtract.map((u) => u.extractLineId)), [unmatchedExtract]);
  const systemToExtracts = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const match of matches) {
      const list = m.get(match.systemLineId) || [];
      list.push(match.extractLineId);
      m.set(match.systemLineId, list);
    }
    return m;
  }, [matches]);
  const extractToSystems = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const match of matches) {
      const list = m.get(match.extractLineId) || [];
      list.push(match.systemLineId);
      m.set(match.extractLineId, list);
    }
    return m;
  }, [matches]);

  const allIncorrect = [
    ...unmatchedSystem.map(u => ({
      id: u.systemLineId,
      type: u.status as 'OVERDUE' | 'DEFERRED',
      systemLine: systemById.get(u.systemLineId),
      status: u.status as 'OVERDUE' | 'DEFERRED',
    })),
  ].sort((a, b) => (a.status === 'OVERDUE' && b.status !== 'OVERDUE' ? -1 : a.status !== 'OVERDUE' && b.status === 'OVERDUE' ? 1 : 0));

  const handleToggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedItems.size === allIncorrect.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allIncorrect.map(item => item.id)));
    }
  };

  const handleAreaChange = (id: string, area: string) => {
    const newItems = new Map(workItems);
    const currentItem = allIncorrect.find(item => item.id === id);
    if (currentItem) {
      newItems.set(id, { 
        area, 
        status: workItems.get(id)?.status || currentItem.status 
      });
      setWorkItems(newItems);
    }
  };

  const handleStatusChange = (id: string, status: 'OVERDUE' | 'DEFERRED') => {
    const newItems = new Map(workItems);
    const existing = workItems.get(id);
    newItems.set(id, { 
      area: existing?.area || '', 
      status 
    });
    setWorkItems(newItems);
  };

  const handleBulkAssign = () => {
    if (!bulkArea || selectedItems.size === 0) {
      toast.error('Selecciona un área y al menos un movimiento');
      return;
    }

    const newItems = new Map(workItems);
    selectedItems.forEach(id => {
      const currentItem = allIncorrect.find(item => item.id === id);
      if (currentItem) {
        newItems.set(id, { 
          area: bulkArea, 
          status: workItems.get(id)?.status || currentItem.status 
        });
      }
    });
    setWorkItems(newItems);
    setSelectedItems(new Set());
    toast.success(`${selectedItems.size} movimiento(s) asignado(s) a ${bulkArea}`);
  };

  const handleSave = async () => {
    const itemsToSave = Array.from(workItems.entries())
      .filter(([_, data]) => data.area)
      .map(([systemLineId, data]) => ({
        systemLineId,
        area: data.area,
        status: data.status,
      }));

    if (itemsToSave.length === 0) {
      toast.error('No hay movimientos con área asignada');
      return;
    }
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(itemsToSave);
      toast.success('Cambios guardados exitosamente');
    } catch (err) {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const pendingCount = Array.from(workItems.values()).filter(item => item.area).length;
  const overdueCount = allIncorrect.filter(item => 
    (workItems.get(item.id)?.status || item.status) === 'OVERDUE'
  ).length;
  const deferredCount = allIncorrect.filter(item => 
    (workItems.get(item.id)?.status || item.status) === 'DEFERRED'
  ).length;

  return (
    <>
    <Card className="border-l-4 border-l-indigo-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-indigo-700 dark:text-indigo-400">
              Espacio de Trabajo - Gestión de Movimientos
            </CardTitle>
            <CardDescription>
              Movimientos sin match: asigná áreas a los del sistema (vencidos/diferidos) y revisá los solo en extracto
            </CardDescription>
          </div>
          {onSave != null && onFinalize != null && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving || pendingCount === 0}
              >
                <Check className="mr-2 h-4 w-4" />
                Guardar Cambios ({pendingCount})
              </Button>
              <Button
                onClick={onFinalize}
                disabled={pendingCount === 0}
              >
                <Send className="mr-2 h-4 w-4" />
                Finalizar y Notificar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Total sin match</p>
            <p className="text-2xl font-bold">{allIncorrect.length + unmatchedExtract.length}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Vencidos (sistema)</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueCount}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Diferidos (sistema)</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{deferredCount}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Solo extracto</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{unmatchedExtract.length}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Con área asignada</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{pendingCount}</p>
          </div>
        </div>

        <CollapsibleSection
          title="Vista por archivo (Sistema / Extracto) — colores por estado"
          defaultOpen={true}
          maxHeight="50vh"
        >
          <div className="p-2 space-y-2">
            <div className="flex gap-2">
              <Button
                variant={activeTab === TAB_SISTEMA ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(TAB_SISTEMA)}
              >
                <FileSpreadsheet className="mr-1 h-4 w-4" />
                Sistema
              </Button>
              <Button
                variant={activeTab === TAB_EXTRACTO ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(TAB_EXTRACTO)}
              >
                <Link2 className="mr-1 h-4 w-4" />
                Extracto
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Verde = conciliado, Rojo = vencido, Amarillo = diferido, Azul = solo en extracto. Click en la fila para ver el match.
            </p>

            {activeTab === TAB_SISTEMA && (
              <div className="overflow-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Emisión</TableHead>
                    <TableHead>Venc.</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Estado</TableHead>
                    {runId && token && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemLines.map((sys) => {
                    const isMatched = systemToExtracts.has(sys.id);
                    const un = unmatchedSystem.find((u) => u.systemLineId === sys.id);
                    const rowClass = isMatched
                      ? 'bg-green-100 dark:bg-green-900/50'
                      : un?.status === 'OVERDUE'
                        ? 'bg-red-100 dark:bg-red-900/50'
                        : 'bg-yellow-100 dark:bg-yellow-900/50';
                    const extractIds = systemToExtracts.get(sys.id) || [];
                    const isExpanded = expandedSystemId === sys.id;
                    return (
                      <Fragment key={sys.id}>
                        <TableRow
                          key={sys.id}
                          className={`${rowClass} cursor-pointer`}
                          onClick={() => setExpandedSystemId(isExpanded ? null : sys.id)}
                        >
                          <TableCell className="max-w-[200px] truncate">{sys.description || '-'}</TableCell>
                          <TableCell>{sys.issueDate ? new Date(sys.issueDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{sys.dueDate ? new Date(sys.dueDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>${sys.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            {isMatched ? 'Correcto' : un?.status === 'OVERDUE' ? 'Vencido' : 'Diferido'}
                          </TableCell>
                          {runId && token && (
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setChangeMatchSystem(sys)}
                              >
                                Cambiar match
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                        {isExpanded && extractIds.length > 0 && (
                          <TableRow key={`${sys.id}-exp`} className="bg-muted/50">
                            <TableCell colSpan={runId && token ? 6 : 5} className="py-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Match con extracto:</p>
                              <ul className="space-y-1 text-sm">
                                {extractIds.map((eid) => {
                                  const e = extractById.get(eid);
                                  return e ? (
                                    <li key={eid}>
                                      {e.date ? new Date(e.date).toLocaleDateString() : '-'} — {e.concept || '-'} — ${e.amount.toFixed(2)}
                                    </li>
                                  ) : null;
                                })}
                              </ul>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            )}

            {activeTab === TAB_EXTRACTO && (
              <div className="overflow-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractLines.map((ext) => {
                    const isMatched = extractToSystems.has(ext.id);
                    const rowClass = isMatched
                      ? 'bg-green-100 dark:bg-green-900/50'
                      : 'bg-blue-100 dark:bg-blue-900/50';
                    const systemIds = extractToSystems.get(ext.id) || [];
                    const isExpanded = expandedExtractId === ext.id;
                    return (
                      <Fragment key={ext.id}>
                        <TableRow
                          key={ext.id}
                          className={`${rowClass} cursor-pointer`}
                          onClick={() => setExpandedExtractId(isExpanded ? null : ext.id)}
                        >
                          <TableCell>{ext.date ? new Date(ext.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{ext.concept || '-'}</TableCell>
                          <TableCell>${ext.amount.toFixed(2)}</TableCell>
                          <TableCell>{isMatched ? 'Correcto' : 'Solo extracto'}</TableCell>
                        </TableRow>
                        {isExpanded && systemIds.length > 0 && (
                          <TableRow key={`${ext.id}-exp`} className="bg-muted/50">
                            <TableCell colSpan={4} className="py-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Match con sistema:</p>
                              <ul className="space-y-1 text-sm">
                                {systemIds.map((sid) => {
                                  const s = systemById.get(sid);
                                  return s ? (
                                    <li key={sid}>
                                      {s.description || '-'} — ${s.amount.toFixed(2)}
                                    </li>
                                  ) : null;
                                })}
                              </ul>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {onAddExcludedConcept && (
          <CollapsibleSection
            title={`Conceptos excluidos (${excludeConcepts.length}) — por si se pasaron al crear la conciliación`}
            defaultOpen={excludeConcepts.length === 0}
            maxHeight="40vh"
          >
            <div className="p-3 space-y-3">
              {excludeConcepts.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Ya excluidos (no aparecen en listas ni conteos):</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {excludeConcepts.map((c) => (
                      <li key={c} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2 flex-wrap items-center">
                <Select
                  value={newExcludedConcept}
                  onChange={(e) => setNewExcludedConcept(e.target.value)}
                  className="w-56"
                >
                  <option value="">Agregar concepto a excluir...</option>
                  {uniqueConcepts
                    .filter((c) => !excludeConcepts.some((x) => (x ?? '').trim().toLowerCase() === (c ?? '').trim().toLowerCase()))
                    .map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!newExcludedConcept || addingExcluded}
                  onClick={async () => {
                    if (!newExcludedConcept || !onAddExcludedConcept) return;
                    setAddingExcluded(true);
                    try {
                      await onAddExcludedConcept(newExcludedConcept);
                      setNewExcludedConcept('');
                    } finally {
                      setAddingExcluded(false);
                    }
                  }}
                >
                  {addingExcluded ? 'Excluyendo...' : 'Excluir'}
                </Button>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {onSave != null && selectedItems.size > 0 && (
          <div className="flex gap-2 items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-sm font-medium">
              {selectedItems.size} seleccionado(s)
            </span>
            <Select
              value={bulkArea}
              onChange={(e) => setBulkArea(e.target.value)}
              className="w-48"
            >
              <option value="">Asignar área...</option>
              {AREAS.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </Select>
            <Button size="sm" onClick={handleBulkAssign}>
              Asignar en Lote
            </Button>
          </div>
        )}

        <CollapsibleSection
          title={`Sistema sin match (${allIncorrect.length}) — vencidos y diferidos: asigná área`}
          defaultOpen={allIncorrect.length > 0}
          maxHeight="50vh"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === allIncorrect.length && allIncorrect.length > 0}
                    onChange={handleToggleAll}
                    disabled={!onSave}
                    className="h-4 w-4 rounded border-input"
                  />
                </TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Fecha Emisión</TableHead>
                <TableHead>Fecha Venc.</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Área Asignada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allIncorrect.map((item) => {
                const sys = item.systemLine;
                if (!sys) return null;
                const workData = workItems.get(item.id);
                const rawStatus = workData?.status ?? item.status;
                const currentStatus = rawStatus === 'OVERDUE' || rawStatus === 'DEFERRED' ? rawStatus : 'DEFERRED';
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleToggleItem(item.id)}
                        disabled={!onSave}
                        className="h-4 w-4 rounded border-input"
                      />
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{sys.description || '-'}</TableCell>
                    <TableCell>{sys.issueDate ? new Date(sys.issueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{sys.dueDate ? new Date(sys.dueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>${sys.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as 'OVERDUE' | 'DEFERRED')}
                        className="w-32"
                        disabled={!onSave}
                      >
                        <option value="OVERDUE">Vencido</option>
                        <option value="DEFERRED">Diferido</option>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={workData?.area || ''}
                        onChange={(e) => handleAreaChange(item.id, e.target.value)}
                        className="w-40"
                        disabled={!onSave}
                      >
                        <option value="">Sin asignar</option>
                        {AREAS.map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CollapsibleSection>

        {allIncorrect.length === 0 && unmatchedExtract.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay movimientos sin match para gestionar
          </div>
        )}

        {unmatchedExtract.length > 0 && (
          <CollapsibleSection
            title={`Solo en extracto (${unmatchedExtract.length}) — en el banco pero no en el sistema`}
            defaultOpen={true}
            maxHeight="50vh"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unmatchedExtract.map((row) => {
                  const ext = extractById.get(row.extractLineId);
                  if (!ext) return null;
                  return (
                    <TableRow key={row.extractLineId} className="bg-blue-50 dark:bg-blue-900/30">
                      <TableCell>{ext.date ? new Date(ext.date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{ext.concept || '-'}</TableCell>
                      <TableCell>${ext.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CollapsibleSection>
        )}
      </CardContent>
    </Card>

    {runId && token && changeMatchSystem && (
      <ChangeMatchDialog
        open={!!changeMatchSystem}
        onClose={() => setChangeMatchSystem(null)}
        runId={runId}
        token={token}
        systemLine={changeMatchSystem}
        extractLines={extractLines}
        currentExtractIds={systemToExtracts.get(changeMatchSystem.id) || []}
        onSuccess={() => {
          onChangeMatchSuccess?.();
          setChangeMatchSystem(null);
        }}
      />
    )}
    </>
  );
}
