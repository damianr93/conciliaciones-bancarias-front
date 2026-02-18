import { useState } from 'react';
import { Shield, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { apiShareRun, apiRemoveMember } from '@/api';
import type { RunDetail } from '@/types';

interface PermissionsPanelProps {
  detail: RunDetail;
  token: string | undefined;
  onRefresh: () => void | Promise<unknown>;
}

const ROLE_LABELS: Record<string, string> = {
  EDITOR: 'Admin (puede editar)',
  VIEWER: 'Solo lectura (+ issues)',
};

export function PermissionsPanel({ detail, token, onRefresh }: PermissionsPanelProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const members = detail.members ?? [];

  const handleAdd = async () => {
    if (!token || !detail.id || !email.trim()) return;
    setLoading(true);
    try {
      await apiShareRun(token, detail.id, email.trim(), role);
      toast.success(`Permiso asignado a ${email.trim()}`);
      setEmail('');
      await Promise.resolve(onRefresh());
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al asignar');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!token || !detail.id) return;
    setRemovingId(userId);
    try {
      await apiRemoveMember(token, detail.id, userId);
      toast.success('Usuario quitado');
      await Promise.resolve(onRefresh());
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al quitar');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permisos de la conciliación
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Todos los usuarios pueden ver esta conciliación y agregar issues. Acá podés dar permiso de <strong>Admin</strong> a quien pueda editar (matches, pendientes, cerrar, etc.).
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
        <p className="text-sm font-medium">Agregar usuario con permiso</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground block mb-1">Email</label>
            <Input
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="w-48">
            <label className="text-xs text-muted-foreground block mb-1">Rol</label>
            <Select value={role} onChange={(e) => setRole(e.target.value as 'EDITOR' | 'VIEWER')} disabled={loading}>
              <option value="EDITOR">Admin (puede editar)</option>
              <option value="VIEWER">Solo lectura (+ issues)</option>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!email.trim() || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}
            {loading ? 'Agregando...' : 'Agregar'}
          </Button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Usuarios con permiso asignado</p>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nadie además del propietario tiene permiso asignado.</p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 bg-card"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{m.user.email}</span>
                  <Badge variant={m.role === 'EDITOR' ? 'default' : 'secondary'}>
                    {ROLE_LABELS[m.role] ?? m.role}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(m.userId)}
                  disabled={removingId === m.userId}
                >
                  {removingId === m.userId ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Quitar'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
