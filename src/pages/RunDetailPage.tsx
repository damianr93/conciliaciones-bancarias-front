import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Share2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchRunDetailThunk,
  exportRunThunk,
  shareRunThunk,
  addMessageThunk,
} from '@/store/thunks/reconciliationsThunks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

export function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const { detail, summary, isLoading } = useAppSelector((state) => state.reconciliations.currentRun);

  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [messageBody, setMessageBody] = useState('');

  useEffect(() => {
    if (token && id) {
      dispatch(fetchRunDetailThunk(token, id));
    }
  }, [dispatch, token, id]);

  const handleExport = async () => {
    if (!token || !id) return;
    try {
      await dispatch(exportRunThunk(token, id));
      toast.success('Archivo descargado correctamente');
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

  if (isLoading || !detail) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const extractById = new Map(detail.extractLines.map((line) => [line.id, line]));
  const systemById = new Map(detail.systemLines.map((line) => [line.id, line]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{detail.title || 'Conciliación'}</h1>
          <p className="text-muted-foreground">
            {new Date(detail.createdAt).toLocaleDateString()} - {detail.bankName || 'Sin banco'}
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Descargar Excel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Correctos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{detail.matches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Solo Extracto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{detail.unmatchedExtract.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {detail.unmatchedSystem.filter((u) => u.status === 'OVERDUE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Diferidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {detail.unmatchedSystem.filter((u) => u.status === 'DEFERRED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Correctos</CardTitle>
          <CardDescription>Registros conciliados exitosamente</CardDescription>
        </CardHeader>
        <CardContent>
          {detail.matches.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay registros</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Extracto</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Importe Extracto</TableHead>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solo Extracto</CardTitle>
          <CardDescription>Registros que no coinciden con el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {detail.unmatchedExtract.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay registros</p>
          ) : (
            <div className="rounded-md border">
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
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sistema Vencidos</CardTitle>
            <CardDescription>Registros del sistema vencidos</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.unmatchedSystem.filter((row) => row.status === 'OVERDUE').length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No hay registros</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Emisión</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.unmatchedSystem
                      .filter((row) => row.status === 'OVERDUE')
                      .map((row) => {
                        const sys = systemById.get(row.systemLineId);
                        if (!sys) return null;
                        return (
                          <TableRow key={row.systemLineId}>
                            <TableCell>{sys.issueDate ? new Date(sys.issueDate).toLocaleDateString() : ''}</TableCell>
                            <TableCell>{sys.dueDate ? new Date(sys.dueDate).toLocaleDateString() : ''}</TableCell>
                            <TableCell>${sys.amount.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sistema Diferidos</CardTitle>
            <CardDescription>Registros del sistema diferidos</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.unmatchedSystem.filter((row) => row.status === 'DEFERRED').length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No hay registros</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Emisión</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.unmatchedSystem
                      .filter((row) => row.status === 'DEFERRED')
                      .map((row) => {
                        const sys = systemById.get(row.systemLineId);
                        if (!sys) return null;
                        return (
                          <TableRow key={row.systemLineId}>
                            <TableCell>{sys.issueDate ? new Date(sys.issueDate).toLocaleDateString() : ''}</TableCell>
                            <TableCell>{sys.dueDate ? new Date(sys.dueDate).toLocaleDateString() : ''}</TableCell>
                            <TableCell>${sys.amount.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Colaboración</CardTitle>
          <CardDescription>Comparte esta conciliación con otros usuarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mensajes</CardTitle>
          <CardDescription>Conversación sobre esta conciliación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
