import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { Select } from './ui/Select';
import { Input } from './ui/Input';

interface AddPendingDialogProps {
  open: boolean;
  onClose: () => void;
  systemLineId: string;
  onSuccess: () => void;
  onSubmit: (area: string, note: string) => Promise<void>;
}

const AREAS = ['Dirección', 'Pagos', 'Administración', 'Logística'];

export function AddPendingDialog({ open, onClose, onSubmit }: AddPendingDialogProps) {
  const [area, setArea] = useState(AREAS[0]);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit(area, note);
      toast.success('Pendiente creado');
      onClose();
      setNote('');
    } catch (err) {
      toast.error('Error al crear pendiente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Marcar como Pendiente"
      description="Asigna este movimiento a un área para seguimiento"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Área responsable</Label>
          <Select value={area} onChange={(e) => setArea(e.target.value)}>
            {AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Nota (opcional)</Label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Agregar observación..."
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
