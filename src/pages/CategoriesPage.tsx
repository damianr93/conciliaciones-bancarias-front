import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchCategoriesThunk,
  createCategoryThunk,
  deleteCategoryThunk,
  createRuleThunk,
  deleteRuleThunk,
} from '@/store/thunks/expensesThunks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

export function CategoriesPage() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const { categories, isLoading } = useAppSelector((state) => state.expenses);

  const [newCategory, setNewCategory] = useState('');
  const [ruleCategoryId, setRuleCategoryId] = useState('');
  const [rulePattern, setRulePattern] = useState('');
  const [ruleRegex, setRuleRegex] = useState(false);
  const [ruleCase, setRuleCase] = useState(false);

  useEffect(() => {
    if (token) {
      dispatch(fetchCategoriesThunk(token));
    }
  }, [dispatch, token]);

  const handleAddCategory = async () => {
    if (!token || !newCategory.trim()) return;
    try {
      await dispatch(createCategoryThunk(token, newCategory.trim()));
      setNewCategory('');
      toast.success('Categoría creada');
    } catch (err) {
      toast.error('Error al crear categoría');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!token) return;
    try {
      await dispatch(deleteCategoryThunk(token, id));
      toast.success('Categoría eliminada');
    } catch (err) {
      toast.error('Error al eliminar categoría');
    }
  };

  const handleAddRule = async () => {
    if (!token || !ruleCategoryId || !rulePattern.trim()) return;
    try {
      await dispatch(createRuleThunk(token, {
        categoryId: ruleCategoryId,
        pattern: rulePattern.trim(),
        isRegex: ruleRegex,
        caseSensitive: ruleCase,
      }));
      setRulePattern('');
      setRuleRegex(false);
      setRuleCase(false);
      toast.success('Regla creada');
    } catch (err) {
      toast.error('Error al crear regla');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!token) return;
    try {
      await dispatch(deleteRuleThunk(token, id));
      toast.success('Regla eliminada');
    } catch (err) {
      toast.error('Error al eliminar regla');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Categorías de Gastos</h1>
        <p className="text-muted-foreground">
          Agrupá conceptos del extracto (ej. IVA PATO, IVA GATO → IVA) para clasificar y excluir más fácil en cada conciliación.
        </p>
      </div>

      <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-lg text-blue-700 dark:text-blue-400">💡 ¿Para qué sirven las Categorías?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>Agrupar conceptos:</strong> Definí categorías (ej. &quot;IVA&quot;) y reglas que matchean texto del concepto. 
            Así &quot;IVA PATO&quot;, &quot;IVA GATO&quot;, &quot;IVA PERRO&quot; se clasifican todos como <strong>IVA</strong>.
          </p>
          <div className="space-y-1">
            <p><strong>En la conciliación:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
              <li>En <strong>Exclusiones</strong> podés excluir por categoría de una: &quot;Excluir todos esta categoría&quot; (IVA, Comisiones, etc.).</li>
              <li>En el modal de exclusión también aparecen las categorías por regla para excluir en un click.</li>
              <li>En el reporte y Excel exportado cada línea lleva su categoría asignada.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="text-purple-700 dark:text-purple-400">Nueva Categoría</CardTitle>
            <CardDescription>Crea una nueva categoría de gastos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la categoría</Label>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ej: Comisiones bancarias"
              />
            </div>
            <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Categoría
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader>
            <CardTitle className="text-indigo-700 dark:text-indigo-400">Nueva Regla</CardTitle>
            <CardDescription>Agrega una regla de clasificación automática</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={ruleCategoryId} onChange={(e) => setRuleCategoryId(e.target.value)}>
                <option value="">Seleccionar</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Patrón de búsqueda</Label>
              <Input
                value={rulePattern}
                onChange={(e) => setRulePattern(e.target.value)}
                placeholder="Ej: comision, transferencia"
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ruleRegex}
                  onChange={(e) => setRuleRegex(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Regex</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ruleCase}
                  onChange={(e) => setRuleCase(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Case sensitive</span>
              </label>
            </div>
            <Button onClick={handleAddRule} disabled={!ruleCategoryId || !rulePattern.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Regla
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <CardDescription>
                {(category.rules ?? []).length} {(category.rules ?? []).length === 1 ? 'regla' : 'reglas'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(category.rules ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin reglas</p>
              ) : (
                <div className="space-y-2">
                  {(category.rules ?? []).map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{rule.pattern}</span>
                        <div className="flex gap-1">
                          {rule.isRegex && <Badge variant="secondary">regex</Badge>}
                          {rule.caseSensitive && <Badge variant="secondary">case</Badge>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                No hay categorías aún. Crea una para comenzar a clasificar tus gastos automáticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
