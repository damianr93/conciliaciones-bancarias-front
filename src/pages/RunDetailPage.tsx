import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Share2, MessageSquare, AlertCircle, CheckCircle2, Send, Briefcase, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRunDetailThunk, exportRunThunk, shareRunThunk, addMessageThunk } from '@/store/thunks/reconciliationsThunks';
import { apiUpdateRun, apiAddExcludedConcept } from '@/api';
import { apiCreatePending, apiResolvePending, apiNotifyPending } from '@/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { AddPendingDialog } from '@/components/AddPendingDialog';
import { NotifyDialog } from '@/components/NotifyDialog';
import { UpdateSystemDialog } from '@/components/UpdateSystemDialog';
import { WorkspacePanel } from '@/components/WorkspacePanel';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

export function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const { detail, isLoading } = useAppSelector((state) => state.reconciliations.currentRun);
  const isClosed = detail?.status === 'CLOSED';
  const isCreator = detail?.createdById != null && user?.id != null && detail.createdById === user.id;

  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [messageBody, setMessageBody] = useState('');
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [pendingSystemLineId, setPendingSystemLineId] = useState('');
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateSystemDialogOpen, setUpdateSystemDialogOpen] = useState(false);

  useEffect(() => {
    if (token && id) {
      dispatch(fetchRunDetailThunk(token, id));
    }
  }, [dispatch, token, id]);

  const refreshDetail = () => {
    if (token && id) return dispatch(fetchRunDetailThunk(token, id));
  };

  const handleExport = async () => {
    if (!token || !id) return;
    try {
      await dispatch(exportRunThunk(token, id));
      toast.success('Archivo descargado');
    } catch (err) {
      toast.error('Error al exportar');
    }
  };

  const handleShare = async () => {
    if (!token || !id || !shareEmail.trim()) return;
    try {
      await dispatch(shareRunThunk(token, id, shareEmail.trim(), shareRole));
      setShareEmail('');
      toast.success('Compartido correctamente');
    } catch (err) {
      toast.error('Error al compartir');
    }
  };

  const handleMessage = async () => {
    if (!token || !id || !messageBody.trim()) return;
    try {
      await dispatch(addMessageThunk(token, id, messageBody.trim()));
      setMessageBody('');
      toast.success('Mensaje enviado');
    } catch (err) {
      toast.error('Error al enviar mensaje');
    }
  };

  const handleAddPending = async (area: string, note: string) => {
    if (!token || !id) return;
    await apiCreatePending(token, id, {
      area,
      systemLineId: pendingSystemLineId,
      note: note || undefined,
    });
    refreshDetail();
  };

  const handleResolvePending = async (pendingId: string) => {
    if (!token || !id) return;
    const note = prompt('Nota de resolución:');
    if (!note) return;
    try {
      await apiResolvePending(token, id, pendingId, note);
      refreshDetail();
      toast.success('Pendiente resuelto');
    } catch (err) {
      toast.error('Error al resolver');
    }
  };

  const handleNotify = async (areas: string[], customMessage: string) => {
    if (!token || !id) return;
    await apiNotifyPending(token, id, {
      areas,
      customMessage: customMessage || undefined,
    });
  };

  const handleWorkspaceSave = async (items: Array<{ systemLineId: string; area: string; status: 'OVERDUE' | 'DEFERRED' }>) => {
    if (!token || !id) return;
    
    for (const item of items) {
      await apiCreatePending(token, id, {
        area: item.area,
        systemLineId: item.systemLineId,
        note: `Estado: ${item.status}`,
      });
    }
    
    refreshDetail();
  };

  const handleToggleStatus = async () => {
    if (!token || !id || !detail) return;
    const next = detail.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
    setUpdatingStatus(true);
    try {
      await apiUpdateRun(token, id, { status: next });
      refreshDetail();
      toast.success(next === 'CLOSED' ? 'Conciliación cerrada' : 'Conciliación reabierta');
    } catch (err) {
      toast.error('Error al cambiar estado');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const BANK_OPTIONS = ['Banco Nación', 'Banco Galicia', 'Banco Santander', 'Banco Provincia', 'Banco ICBC'];
  const handleBankChange = async (bankName: string) => {
    if (!token || !id || !detail) return;
    try {
      await apiUpdateRun(token, id, { bankName: bankName || null });
      await refreshDetail();
      toast.success('Banco actualizado');
    } catch (err) {
      toast.error('Error al actualizar banco');
    }
  };

  const handleWorkspaceFinalize = async () => {
    if (!token || !id || !detail) return;
    
    const pendingByArea = pendingItems
      .filter(p => p.status !== 'RESOLVED')
      .reduce((acc, p) => {
        acc[p.area] = (acc[p.area] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const areasWithPending = Object.keys(pendingByArea);
    
    if (areasWithPending.length === 0) {
      toast.error('No hay movimientos pendientes para notificar');
      return;
    }

    try {
      await apiNotifyPending(token, id, {
        areas: areasWithPending,
      });
      toast.success(`Notificaciones enviadas a ${areasWithPending.length} área(s)`);
      setShowWorkspace(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar notificaciones');
    }
  };

  if (isLoading || !detail) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const extractLinesActive = detail.extractLines.filter((l) => !l.excluded);
  const extractById = new Map(extractLinesActive.map((line) => [line.id, line]));
  const systemById = new Map(detail.systemLines.map((line) => [line.id, line]));

  const pendingItems = detail.pendingItems || [];

  const pendingByArea = pendingItems
    .filter(p => p.status !== 'RESOLVED')
    .reduce((acc, p) => {
      acc[p.area] = (acc[p.area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{detail.title || 'Conciliación'}</h1>
            <Badge className={detail.status === 'CLOSED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'}>
              {detail.status === 'CLOSED' ? 'Cerrada' : 'Abierta'}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>{new Date(detail.createdAt).toLocaleDateString()}</span>
            <span>—</span>
            {!isClosed && showWorkspace ? (
              <>
                <Label className="text-muted-foreground font-normal">Banco:</Label>
                <Select
                  value={BANK_OPTIONS.includes(detail.bankName || '') ? (detail.bankName ?? '') : ''}
                  onChange={(e) => handleBankChange(e.target.value)}
                  className="w-48 h-8 text-sm"
                >
                  <option value="">Sin definir</option>
                  {BANK_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </>
            ) : (
              <span>{detail.bankName || 'Sin banco'}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {!isClosed && (
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              disabled={updatingStatus}
            >
              Cerrar conciliación
            </Button>
          )}
          {isClosed && isCreator && (
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              disabled={updatingStatus}
            >
              Reabrir conciliación
            </Button>
          )}
          {!isClosed && (
            <Button 
              variant={showWorkspace ? "default" : "outline"}
              onClick={() => setShowWorkspace(!showWorkspace)}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              {showWorkspace ? 'Ver Detalle' : 'Espacio de Trabajo'}
            </Button>
          )}
          {!isClosed && !showWorkspace && pendingItems.filter(p => p.status !== 'RESOLVED').length > 0 && (
            <Button variant="outline" onClick={() => setNotifyDialogOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Notificar Pendientes
            </Button>
          )}
          {!isClosed && (
            <Button variant="outline" onClick={() => setUpdateSystemDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Actualizar Excel sistema
            </Button>
          )}
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Descargar Excel
          </Button>
        </div>
      </div>

      {!isClosed && showWorkspace && (
        <WorkspacePanel
          matches={detail.matches}
          unmatchedSystem={detail.unmatchedSystem}
          unmatchedExtract={detail.unmatchedExtract}
          systemLines={detail.systemLines}
          extractLines={extractLinesActive}
          extractById={extractById}
          systemById={systemById}
          excludeConcepts={detail.excludeConcepts ?? []}
          onAddExcludedConcept={async (concept) => {
            if (!token || !id) return;
            try {
              await apiAddExcludedConcept(token, id, concept);
              await refreshDetail();
              toast.success(`Concepto "${concept}" excluido: se quitaron de listas y conteos`);
            } catch (e: any) {
              toast.error(e?.message ?? 'Error al excluir concepto');
            }
          }}
          onSave={handleWorkspaceSave}
          onFinalize={handleWorkspaceFinalize}
          onChangeMatchSuccess={refreshDetail}
          runId={id}
          token={token ?? undefined}
        />
      )}

      {(isClosed || !showWorkspace) && (
        <>
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
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">
              {pendingItems.filter(p => p.status !== 'RESOLVED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {pendingItems.filter(p => p.status !== 'RESOLVED').length > 0 && (
        <CollapsibleSection
          title={`Movimientos Pendientes por Área (${pendingItems.filter(p => p.status !== 'RESOLVED').length})`}
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
                {pendingItems
                  .filter(p => p.status !== 'RESOLVED')
                  .map((pending) => {
                    const sys = pending.systemLine || systemById.get(pending.systemLineId || '');
                    return (
                      <TableRow key={pending.id}>
                        <TableCell>
                          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">{pending.area}</Badge>
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
                          {!isClosed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolvePending(pending.id)}
                            >
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
                    return (
                      <TableRow key={`${match.extractLineId}-${match.systemLineId}`}>
                        <TableCell>{ext.date ? new Date(ext.date).toLocaleDateString() : ''}</TableCell>
                        <TableCell>{ext.concept}</TableCell>
                        <TableCell>${ext.amount.toFixed(2)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{sys.description || '-'}</TableCell>
                        <TableCell>{sys.issueDate ? new Date(sys.issueDate).toLocaleDateString() : ''}</TableCell>
                        <TableCell>{sys.dueDate ? new Date(sys.dueDate).toLocaleDateString() : ''}</TableCell>
                        <TableCell>${sys.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={match.deltaDays === 0 ? 'default' : 'secondary'}>
                            {match.deltaDays}
                          </Badge>
                        </TableCell>
                        <TableCell>{ext.category?.name || '-'}</TableCell>
                      </TableRow>
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
          title={`Sistema Vencidos (${detail.unmatchedSystem.filter((row) => row.status === 'OVERDUE').length})`}
          defaultOpen={false}
          maxHeight="50vh"
          className="border-l-4 border-l-red-500 border-red-200 dark:border-red-800"
        >
          {detail.unmatchedSystem.filter((row) => row.status === 'OVERDUE').length === 0 ? (
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
                      .filter((row) => row.status === 'OVERDUE')
                      .map((row) => {
                        const sys = systemById.get(row.systemLineId);
                        if (!sys) return null;
                        const hasPending = pendingItems.some(
                          p => p.systemLineId === sys.id && p.status !== 'RESOLVED'
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPendingSystemLineId(sys.id);
                                    setPendingDialogOpen(true);
                                  }}
                                >
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Marcar Pendiente
                                </Button>
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
          title={`Sistema Diferidos (${detail.unmatchedSystem.filter((row) => row.status === 'DEFERRED').length})`}
          defaultOpen={false}
          maxHeight="50vh"
          className="border-l-4 border-l-yellow-500 border-yellow-200 dark:border-yellow-800"
        >
          {detail.unmatchedSystem.filter((row) => row.status === 'DEFERRED').length === 0 ? (
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
                      .filter((row) => row.status === 'DEFERRED')
                      .map((row) => {
                        const sys = systemById.get(row.systemLineId);
                        if (!sys) return null;
                        const hasPending = pendingItems.some(
                          p => p.systemLineId === sys.id && p.status !== 'RESOLVED'
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPendingSystemLineId(sys.id);
                                    setPendingDialogOpen(true);
                                  }}
                                >
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Marcar Pendiente
                                </Button>
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

      <CollapsibleSection title="Colaboración" defaultOpen={false} maxHeight="50vh">
        <div className="p-4 space-y-4">
          {!isClosed && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Email del usuario</Label>
                  <Input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={shareRole} onChange={(e) => setShareRole(e.target.value as any)}>
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </Select>
                </div>
              </div>
              <Button onClick={handleShare} disabled={!shareEmail.trim()}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartir
              </Button>
            </>
          )}

          {detail.members.length > 0 && (
            <div className="space-y-2">
              <Label>Miembros</Label>
              <div className="space-y-1">
                {detail.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-md border p-2">
                    <span className="text-sm">{member.user.email}</span>
                    <Badge variant="secondary">{member.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={`Mensajes (${detail.messages.length})`} defaultOpen={false} maxHeight="50vh">
        <div className="p-4 space-y-4">
          {detail.messages.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {detail.messages.map((msg) => (
                <div key={msg.id} className="rounded-md border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{msg.author.email}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{msg.body}</p>
                </div>
              ))}
            </div>
          )}
          {!isClosed && (
            <div className="space-y-2">
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Escribe un mensaje..."
              />
              <Button onClick={handleMessage} disabled={!messageBody.trim()}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Enviar Mensaje
              </Button>
            </div>
          )}
        </div>
      </CollapsibleSection>

        </>
      )}

      <AddPendingDialog
        open={pendingDialogOpen}
        onClose={() => setPendingDialogOpen(false)}
        systemLineId={pendingSystemLineId}
        onSuccess={refreshDetail}
        onSubmit={handleAddPending}
      />

      <NotifyDialog
        open={notifyDialogOpen}
        onClose={() => setNotifyDialogOpen(false)}
        pendingByArea={pendingByArea}
        onSubmit={handleNotify}
      />

      {token && id && (
        <UpdateSystemDialog
          open={updateSystemDialogOpen}
          onClose={() => setUpdateSystemDialogOpen(false)}
          runId={id}
          token={token}
          onSuccess={refreshDetail}
        />
      )}
    </div>
  );
}
