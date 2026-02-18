import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Loader2, Send, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRunDetailThunk, exportRunThunk } from '@/store/thunks/reconciliationsThunks';
import { setCurrentRunDetail, setCurrentRunStatus, clearCurrentRun } from '@/store/slices/reconciliationsSlice';
import { apiUpdateRun, apiExcludeConcepts, apiExcludeByCategory, apiRemoveExcludedConcept } from '@/api';
import { apiCreatePending, apiResolvePending, apiNotifyPending } from '@/api';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { AddPendingDialog } from '@/components/AddPendingDialog';
import { NotifyDialog } from '@/components/NotifyDialog';
import { UpdateSystemDialog } from '@/components/UpdateSystemDialog';
import { WorkspacePanel } from '@/components/WorkspacePanel';
import { RunDetailSidebar, type RunDetailSection } from '@/components/RunDetailSidebar';
import { ResumenPanel } from '@/components/ResumenPanel';
import { ExclusionesPanel } from '@/components/ExclusionesPanel';
import { IssuesPanel } from '@/components/IssuesPanel';
import { PermissionsPanel } from '@/components/PermissionsPanel';

export function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const { detail, isLoading } = useAppSelector((state) => state.reconciliations.currentRun);
  const isClosed = detail?.status === 'CLOSED';
  const isCreator = detail?.createdById != null && user?.id != null && detail.createdById === user.id;
  const canEdit =
    isCreator ||
    (detail?.members?.some((m) => m.userId === user?.id && m.role === 'EDITOR') ?? false);

  const [section, setSection] = useState<RunDetailSection>('resumen');
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [pendingSystemLineId, setPendingSystemLineId] = useState('');
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateSystemDialogOpen, setUpdateSystemDialogOpen] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    dispatch(clearCurrentRun());
    dispatch(fetchRunDetailThunk(token, id));
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
        note: `Estado: ${item.status === 'OVERDUE' ? 'Vencido' : 'Diferido'}`,
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
      dispatch(setCurrentRunStatus(next));
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

  const pendingAreaBySystemLineId = useMemo(() => {
    const m = new Map<string, string>();
    const items = detail?.pendingItems ?? [];
    for (const p of items) {
      if (p.status !== 'RESOLVED' && p.systemLineId && p.area) m.set(p.systemLineId, p.area);
    }
    return m;
  }, [detail?.pendingItems]);

  const handleWorkspaceFinalize = async () => {
    if (!token || !id || !detail) return;
    
    const pendingByArea = (detail.pendingItems || [])
      .filter((p: { status: string }) => p.status !== 'RESOLVED')
      .reduce((acc: Record<string, number>, p: { area: string }) => {
        acc[p.area] = (acc[p.area] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const VALID_AREAS = ['Dirección', 'Tesorería'];
    const areasWithPending = Object.keys(pendingByArea).filter((a) => VALID_AREAS.includes(a));

    if (areasWithPending.length === 0) {
      toast.error('No hay movimientos pendientes para notificar');
      return;
    }

    try {
      await apiNotifyPending(token, id, {
        areas: areasWithPending,
      });
      toast.success(`Notificaciones enviadas a ${areasWithPending.length} área(s)`);
      setSection('resumen');
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

  const pendingCount = pendingItems.filter((p) => p.status !== 'RESOLVED').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{detail.title || 'Conciliación'}</h1>
            <Badge className={detail.status === 'CLOSED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'}>
              {detail.status === 'CLOSED' ? 'Cerrada' : 'Abierta'}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
            <span>{new Date(detail.createdAt).toLocaleDateString()}</span>
            <span>—</span>
            {!isClosed && canEdit ? (
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
        <div className="flex gap-2 flex-wrap items-center">
          {canEdit && !isClosed && (
            <Button variant="default" onClick={handleToggleStatus} disabled={updatingStatus}>
              {updatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cerrando...
                </>
              ) : (
                'Cerrar conciliación'
              )}
            </Button>
          )}
          {isClosed && isCreator && (
            <Button variant="default" onClick={handleToggleStatus} disabled={updatingStatus}>
              {updatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reabriendo...
                </>
              ) : (
                'Reabrir conciliación'
              )}
            </Button>
          )}
          {!isClosed && pendingCount > 0 && (
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
          {canEdit && (
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Descargar Excel
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-0 rounded-lg border bg-card overflow-hidden min-h-[calc(100vh-12rem)]">
        <RunDetailSidebar
          active={section}
          onSelect={setSection}
          issuesCount={detail?.issues?.length ?? 0}
          showPermisos={isCreator}
        />
        <div className="flex-1 overflow-auto p-4">
          {section === 'resumen' && (
            <ResumenPanel
              detail={detail}
              pendingItems={pendingItems}
              systemById={systemById}
              extractById={extractById}
              isClosed={isClosed}
              canEdit={canEdit}
              onResolvePending={handleResolvePending}
              onOpenAddPending={(systemLineId) => {
                setPendingSystemLineId(systemLineId);
                setPendingDialogOpen(true);
              }}
            />
          )}
          {section === 'workspace' && !isClosed && (
            <WorkspacePanel
              matches={detail.matches}
              unmatchedSystem={detail.unmatchedSystem}
              unmatchedExtract={detail.unmatchedExtract}
              systemLines={detail.systemLines}
              extractLines={extractLinesActive}
              extractById={extractById}
              systemById={systemById}
              excludeConcepts={detail.excludeConcepts ?? []}
              pendingAreaBySystemLineId={pendingAreaBySystemLineId}
              onSave={canEdit ? handleWorkspaceSave : undefined}
              onFinalize={canEdit ? handleWorkspaceFinalize : undefined}
              onChangeMatchSuccess={refreshDetail}
              runId={canEdit ? id : undefined}
              token={canEdit ? token ?? undefined : undefined}
            />
          )}
          {section === 'workspace' && isClosed && (
            <p className="text-muted-foreground py-8 text-center">La conciliación está cerrada. Solo lectura.</p>
          )}
          {section === 'exclusiones' && (
            <ExclusionesPanel
              excludeConcepts={detail.excludeConcepts ?? []}
              extractLines={detail.extractLines}
              canEdit={canEdit}
              isClosed={isClosed}
              runId={id}
              token={token ?? undefined}
              onRemoveExcludedConcept={
                canEdit && !isClosed && token && id
                  ? async (concept) => {
                      const updated = await apiRemoveExcludedConcept(token, id, concept);
                      dispatch(setCurrentRunDetail(updated));
                      toast.success('Exclusión quitada');
                    }
                  : undefined
              }
              onExcludeConcepts={
                canEdit && !isClosed && token && id
                  ? async (concepts) => {
                      await apiExcludeConcepts(token, id, concepts);
                      await refreshDetail();
                      toast.success(
                        concepts.length === 1 ? 'Concepto excluido' : `${concepts.length} conceptos excluidos`
                      );
                    }
                  : undefined
              }
              onExcludeByCategory={
                canEdit && !isClosed && token && id
                  ? async (categoryId) => {
                      await apiExcludeByCategory(token, id, categoryId);
                      await refreshDetail();
                      toast.success('Conceptos de la categoría excluidos');
                    }
                  : undefined
              }
              onSuccess={refreshDetail}
            />
          )}
          {section === 'issues' && (
            <IssuesPanel
              runId={id!}
              token={token ?? undefined}
              issues={detail?.issues ?? []}
              isOwner={isCreator}
              onRefresh={refreshDetail}
            />
          )}
          {section === 'permisos' && isCreator && (
            <PermissionsPanel detail={detail} token={token ?? undefined} onRefresh={refreshDetail} />
          )}
        </div>
      </div>

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
