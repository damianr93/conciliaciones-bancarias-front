import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRunsThunk } from '@/store/thunks/reconciliationsThunks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const token = useAppSelector((state) => state.auth.token);
  const runs = useAppSelector((state) => state.reconciliations.runs);

  useEffect(() => {
    if (token) {
      dispatch(fetchRunsThunk(token));
    }
  }, [dispatch, token]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Gestiona tus conciliaciones bancarias</p>
        </div>
        <Button onClick={() => navigate('/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Conciliación
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Conciliaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {runs.filter((r) => {
                const date = new Date(r.createdAt);
                const now = new Date();
                return (
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear()
                );
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Última Actualización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {runs[0] ? new Date(runs[0].createdAt).toLocaleDateString() : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conciliaciones Recientes</CardTitle>
          <CardDescription>Historial de conciliaciones realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No hay conciliaciones aún. Crea una nueva para comenzar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow 
                    key={run.id}
                    className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20"
                    onClick={() => navigate(`/run/${run.id}`)}
                  >
                    <TableCell className="font-medium">
                      {run.title || 'Sin título'}
                    </TableCell>
                    <TableCell>
                      {new Date(run.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{run.bankName || '-'}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Completada</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/run/${run.id}`);
                        }}
                      >
                        Ver Detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
