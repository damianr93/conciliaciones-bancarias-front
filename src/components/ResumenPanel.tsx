import { useState, Fragment } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { CollapsibleSection } from './ui/CollapsibleSection';
import type { RunDetail, PendingItem, SystemLine, ExtractLine } from '@/types';

interface ResumenPanelProps {
  detail: RunDetail;
  pendingItems: PendingItem[];
  systemById: Map<string, SystemLine>;
  extractById: Map<string, ExtractLine>;
  isClosed: boolean;
  canEdit: boolean;
  onResolvePending: (pendingId: string) => void;
  onOpenAddPending: (systemLineId: string) => void;
}

export function ResumenPanel({
  detail,
  pendingItems,
  systemById,
  extractById,
  isClosed,
  canEdit,
  onResolvePending,
  onOpenAddPending,
}: ResumenPanelProps) {
  const activePending = pendingItems.filter((p) => p.status !== 'RESOLVED');
  const [expandedMatchKey, setExpandedMatchKey] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Correctos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">{detail.matches.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Solo Extracto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">{detail.unmatchedExtract.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-500">
              {detail.unmatchedSystem.filter((u) => u.status === 'OVERDUE').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Diferidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
              {detail.unmatchedSystem.filter((u) => u.status === 'DEFERRED').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">{activePending.length}</div>
          </CardContent>
        </Card>
      </div>

      {activePending.length > 0 && (
        <CollapsibleSection
          title={`Movimientos Pendientes por Área (${activePending.length})`}
          defaultOpen={true}
          maxHeight="50vh"
          className="border-l-4 border-l-orange-500 border-orange-200 dark:border-orange-800"
        >
          <div className="p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Área</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead>Fecha Venc.</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePending.map((pending) => {
                  const sys = pending.systemLine || systemById.get(pending.systemLineId || '');
                  return (
                    <TableRow key={pending.id}>
                      <TableCell>
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                          {pending.area}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{sys?.description || '-'}</TableCell>
                      <TableCell>{sys?.issueDate ? new Date(sys.issueDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{sys?.dueDate ? new Date(sys.dueDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>${sys?.amount.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Badge variant={pending.status === 'OPEN' ? 'destructive' : 'secondary'}>
                          {pending.status === 'OPEN' ? 'Abierto' : 'En Progreso'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{pending.note || '-'}</TableCell>
                      <TableCell>
                        {!isClosed && canEdit && (
                          <Button variant="outline" size="sm" onClick={() => onResolvePending(pending.id)}>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Resolver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title={`Correctos (${detail.matches.length})`}
        defaultOpen={false}
        maxHeight="50vh"
        className="border-l-4 border-l-green-500 border-green-200 dark:border-green-800"
      >
        {detail.matches.length === 0 ? (
          <p className="p-4 text-center text-muted-foreground">No hay registros</p>
        ) : (
          <div className="rounded-md border m-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Extracto</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Importe Extracto</TableHead>
                  <TableHead>Descripción Sistema</TableHead>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead>Fecha Venc.</TableHead>
                  <TableHead>Importe Sistema</TableHead>
                  <TableHead>Delta Días</TableHead>
                  <TableHead>Categoría</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.matches.map((match) => {
                  const ext = extractById.get(match.extractLineId);
                  const sys = systemById.get(match.systemLineId);
                  if (!ext || !sys) return null;
                  const matchKey = `${match.extractLineId}-${match.systemLineId}`;
                  const isExpanded = expandedMatchKey === matchKey;
                  return (
                    <Fragment key={matchKey}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedMatchKey(isExpanded ? null : matchKey)}
                      >
                        <TableCell>{ext.date ? new Date(ext.date).toLocaleDateString() : ''}</TableCell>
                        <TableCell>{ext.concept}</TableCell>
                        <TableCell>${ext.amount.toFixed(2)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{sys.description || '-'}</TableCell>
                        <TableCell>{sys.issueDate ? new Date(sys.issueDate).toLocaleDateString() : ''}</TableCell>
                        <TableCell>{sys.dueDate ? new Date(sys.dueDate).toLocaleDateString() : ''}</TableCell>
                        <TableCell>${sys.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={match.deltaDays === 0 ? 'default' : 'secondary'}>{match.deltaDays}</Badge>
                        </TableCell>
                        <TableCell>{ext.category?.name || '-'}</TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={9} className="py-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Extracto</p>
                                <p>{ext.date ? new Date(ext.date).toLocaleDateString() : '-'} — {ext.concept || '-'}</p>
                                <p>${ext.amount.toFixed(2)} · {ext.category?.name || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Sistema</p>
                                <p>{sys.description || '-'}</p>
                                <p>{sys.issueDate ? new Date(sys.issueDate).toLocaleDateString() : '-'} / {sys.dueDate ? new Date(sys.dueDate).toLocaleDateString() : '-'} — ${sys.amount.toFixed(2)}</p>
                              </div>
                            </div>
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
      </CollapsibleSection>

      <CollapsibleSection
        title={`Solo Extracto (${detail.unmatchedExtract.length})`}
        defaultOpen={false}
        maxHeight="50vh"
        className="border-l-4 border-l-blue-500 border-blue-200 dark:border-blue-800"
      >
        {detail.unmatchedExtract.length === 0 ? (
          <p className="p-4 text-center text-muted-foreground">No hay registros</p>
        ) : (
          <div className="rounded-md border m-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Categoría</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.unmatchedExtract.map((row) => {
                  const ext = extractById.get(row.extractLineId);
                  if (!ext) return null;
                  return (
                    <TableRow key={row.extractLineId}>
                      <TableCell>{ext.date ? new Date(ext.date).toLocaleDateString() : ''}</TableCell>
                      <TableCell>{ext.concept}</TableCell>
                      <TableCell>${ext.amount.toFixed(2)}</TableCell>
                      <TableCell>{ext.category?.name || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CollapsibleSection>

      <div className="grid gap-6 md:grid-cols-2">
        <CollapsibleSection
          title={`Sistema Vencidos (${detail.unmatchedSystem.filter((r) => r.status === 'OVERDUE').length})`}
          defaultOpen={false}
          maxHeight="50vh"
          className="border-l-4 border-l-red-500 border-red-200 dark:border-red-800"
        >
          {detail.unmatchedSystem.filter((r) => r.status === 'OVERDUE').length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">No hay registros</p>
          ) : (
            <div className="rounded-md border m-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Emisión</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.unmatchedSystem
                    .filter((r) => r.status === 'OVERDUE')
                    .map((row) => {
                      const sys = systemById.get(row.systemLineId);
                      if (!sys) return null;
                      const hasPending = activePending.some(
                        (p) => p.systemLineId === sys.id
                      );
                      return (
                        <TableRow key={row.systemLineId}>
                          <TableCell className="max-w-[200px] truncate">{sys.description || '-'}</TableCell>
                          <TableCell>{sys.issueDate ? new Date(sys.issueDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{sys.dueDate ? new Date(sys.dueDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>${sys.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            {hasPending ? (
                              <Badge variant="secondary">Ya pendiente</Badge>
                            ) : (
                              !isClosed && canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onOpenAddPending(sys.id)}
                                >
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Marcar Pendiente
                                </Button>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title={`Sistema Diferidos (${detail.unmatchedSystem.filter((r) => r.status === 'DEFERRED').length})`}
          defaultOpen={false}
          maxHeight="50vh"
          className="border-l-4 border-l-yellow-500 border-yellow-200 dark:border-yellow-800"
        >
          {detail.unmatchedSystem.filter((r) => r.status === 'DEFERRED').length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">No hay registros</p>
          ) : (
            <div className="rounded-md border m-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Emisión</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.unmatchedSystem
                    .filter((r) => r.status === 'DEFERRED')
                    .map((row) => {
                      const sys = systemById.get(row.systemLineId);
                      if (!sys) return null;
                      const hasPending = activePending.some(
                        (p) => p.systemLineId === sys.id
                      );
                      return (
                        <TableRow key={row.systemLineId}>
                          <TableCell className="max-w-[200px] truncate">{sys.description || '-'}</TableCell>
                          <TableCell>{sys.issueDate ? new Date(sys.issueDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{sys.dueDate ? new Date(sys.dueDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>${sys.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            {hasPending ? (
                              <Badge variant="secondary">Ya pendiente</Badge>
                            ) : (
                              !isClosed && canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onOpenAddPending(sys.id)}
                                >
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Marcar Pendiente
                                </Button>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}
