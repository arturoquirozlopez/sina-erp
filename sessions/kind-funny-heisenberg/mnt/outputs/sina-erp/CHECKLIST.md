# Checklist de migración módulo por módulo

Para cada módulo en estado "stub funcional", replicar el patrón de `/clientes` o `/productos`.

## Patrón estándar (5 archivos por módulo)
- `app/(dashboard)/<modulo>/page.tsx` — listado con filtros, KPIs, tabla
- `app/(dashboard)/<modulo>/actions.ts` — server actions con Zod + audit
- `app/(dashboard)/<modulo>/<modulo>-form.tsx` — client form reutilizable
- `app/(dashboard)/<modulo>/nuevo/page.tsx` — crear
- `app/(dashboard)/<modulo>/[id]/page.tsx` — detalle/360°
- `app/(dashboard)/<modulo>/[id]/editar/page.tsx` — editar

## Módulos pendientes en orden de prioridad
1. **Proveedores** (`compras` ya tiene stub) — bancarios, lead time, fácil
2. **Cotizaciones** — items con descuento %/$, estado, PDF preview
3. **Órdenes de Venta** — items, tipo entrega, historial estado, factura
4. **Órdenes de Compra** — items, ETA, recepciones parciales, documentos en Storage
5. **Facturación electrónica** — capa `BillingProvider` + integración real con proveedor DTE
6. **Cobranza** — aging, registro de pagos, conciliación CSV
7. **Cuentas por Pagar** (sub-tab dentro de Compras) — facturas de proveedor + pagos
8. **Puntos de Retiro** — CRUD + transferencias entre ubicaciones
9. **Finanzas** — ER, Balance, SG&A, configuración financiera
10. **Deuda** — préstamos + pagos con capital/interés + adjuntos
11. **Mensajería WhatsApp** — `MessagingProvider` + agente AI (server actions o API route)
12. **Automatizaciones** — reglas SI/ENTONCES + ejecutor (cron Vercel)
13. **Reportes BI** — agregados SQL + exports CSV/Excel

## Cosas que NO requieren código adicional (ya están listas)
- Auth completa
- RBAC + auditoría
- Schema completo de DB
- RLS por rol
- Email provider abstracto + Resend
- Componentes UI base (Card, Btn, Kpi, Badge, Input, Select, Textarea, EmptyState)
- Sidebar dinámica según permisos
- Logout y session management

## Estimación realista (semanas-dev)
- Semana 1-2: Proveedores + Cotizaciones + OV (CRUD básico)
- Semana 3: OC + Recepciones + Cuentas por Pagar + Storage adjuntos
- Semana 4: Facturación electrónica (integración real DTE)
- Semana 5: Cobranza + Conciliación bancaria
- Semana 6: Puntos de Retiro + Transferencias
- Semana 7: Finanzas (ER + Balance + Gastos)
- Semana 8: Deuda + Reportes BI
- Semana 9-10: WhatsApp Cloud API + agente AI + Automatizaciones
- Semana 11: QA, hardening, optimización
- Semana 12: Producción

Total: ~3 meses con 1 dev senior FullStack.
