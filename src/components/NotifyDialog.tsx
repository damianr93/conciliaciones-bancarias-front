import { useState } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { Badge } from './ui/Badge';

interface NotifyDialogProps {
  open: boolean;
  onClose: () => void;
  pendingByArea: Record<string, number>;
  onSubmit: (areas: string[], customMessage: string) => Promise<void>;
}

export function NotifyDialog({ open, onClose, pendingByArea, onSubmit }: NotifyDialogProps) {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const VALID_AREAS = ['Dirección', 'Tesorería'];
  const areas = Object.keys(pendingByArea).filter(
    (area) => pendingByArea[area] > 0 && VALID_AREAS.includes(area),
  );

  const handleSubmit = async () => {
    if (selectedAreas.length === 0) {
      toast.error('Selecciona al menos un área');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(selectedAreas, customMessage);
      toast.success(`Email enviado a ${selectedAreas.length} área(s)`);
      onClose();
      setSelectedAreas([]);
      setCustomMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar emails');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Notificar Pendientes"
      description="Envía emails a las áreas con movimientos pendientes"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Selecciona las áreas a notificar</Label>
          <div className="space-y-2">
            {areas.map((area) => (
              <label
                key={area}
                className="flex items-center justify-between p-3 rounded-md border hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(area)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAreas([...selectedAreas, area]);
                      } else {
                        setSelectedAreas(selectedAreas.filter(a => a !== area));
                      }
                    }}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="font-medium">{area}</span>
                </div>
                <Badge variant="secondary">
                  {pendingByArea[area]} pendiente{pendingByArea[area] !== 1 ? 's' : ''}
                </Badge>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Mensaje personalizado (opcional)</Label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Agrega un mensaje adicional..."
          />
        </div>
        <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm">
          <p className="font-medium mb-1">Vista previa del email:</p>
          <p className="text-muted-foreground">
            Se enviará una tabla con los movimientos pendientes de cada área seleccionada.
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || selectedAreas.length === 0}>
            <Send className="mr-2 h-4 w-4" />
            {isLoading ? 'Enviando...' : `Enviar a ${selectedAreas.length} área(s)`}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
