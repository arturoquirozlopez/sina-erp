# Sina ERP

Prototipo navegable del sistema operativo de Sina Pinturas SpA. Aplicación SPA en un solo archivo HTML que carga React 18, Tailwind y Chart.js desde CDN. Todo el estado se persiste en `localStorage` del navegador.

## Acceso

- **URL:** se publica en Vercel al hacer push a `main`
- **Email:** `aquirozl@gmail.com`
- **Contraseña:** `sina2026`

## Módulos incluidos

Dashboard ejecutivo, Inventario (con stock por ubicación y transferencias), Clientes (CRM con churn), Ventas (cotizaciones con PDF + órdenes de venta), Facturación electrónica, Cobranza, Compras (proveedores, OC con documentos y recepciones, cuentas por pagar, inteligencia de compra), Puntos de Retiro, Finanzas (P&L, Balance, SG&A), Deuda y Préstamos, Mensajería WhatsApp con agente AI, Automatizaciones, Reportes BI, Usuarios y Permisos (RBAC + invitaciones).

## Ejecutar localmente

```bash
npx serve .
# abre http://localhost:3000
```

O simplemente abre `sina-app.html` con doble click — funciona offline.

## Desplegar en Vercel

1. Sube este repo a GitHub.
2. En vercel.com → Add New → Project → importa el repo.
3. Framework Preset: **Other**. Build command: vacío. Output Directory: `.`
4. Deploy.

`vercel.json` ya configura el routing para servir `sina-app.html` en la raíz.

## Notas

Este es un **prototipo navegable**, no un sistema productivo. Los datos viven en el navegador de cada usuario, los emails y WhatsApp son simulados, y la facturación electrónica usa un mock interno. Para producción real ver el scaffold Next.js + Supabase aparte.
