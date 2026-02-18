# Conciliaciones Front

## Detalle de conciliación (UX)
- **Todos los usuarios** pueden ver todas las conciliaciones y abrir cualquier una. Pueden leer y agregar issues/comentarios.
- **Solo propietario o usuarios con permiso Admin** pueden editar (cerrar/reabrir, actualizar Excel, notificar, guardar hoja de trabajo, resolver pendientes, etc.).
- **Sidebar**: Resumen, Hoja de trabajo, Issues y (solo propietario) **Permisos**, donde se agregan usuarios con rol Admin (pueden editar) o Solo lectura (+ issues).

Se eliminaron las secciones Colaboración y Mensajes.

## Dev
```bash
npm install
npm run dev
```

Configurar `VITE_API_URL` si el backend no corre en `http://localhost:3000/api`.
