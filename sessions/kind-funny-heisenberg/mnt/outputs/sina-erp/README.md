# Sina ERP · Producción

Aplicación Next.js 14 + Supabase para Sina Pinturas SpA.

## Stack
- **Next.js 14** (App Router, RSC, Server Actions)
- **TypeScript** estricto
- **Tailwind CSS** con tokens de marca Sina (`navy #0F2747`, `sky #1E88E5`)
- **Supabase** (Postgres + Auth + Storage + RLS)
- **Resend** para envío de emails (con `EmailProvider` desacoplado para SendGrid/SES)
- **Zod** para validación de inputs en server actions
- **Lucide React** para iconografía

## Setup local
```bash
cp .env.example .env.local
# completa los valores reales
npm install
supabase login
supabase link --project-ref <project-ref>
supabase db push          # aplica migrations + seed
npm run dev
```

## Variables de entorno (producción)
Ver `.env.example` para la lista completa. Las críticas:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only — nunca exponer al browser)
- `RESEND_API_KEY` (o credenciales del provider que elijas)
- `NEXT_PUBLIC_APP_URL=https://app.gruposina.cl`

## Deploy en Vercel
1. Conecta el repo de GitHub a Vercel.
2. Framework Preset: **Next.js**. Build command y output detectados automáticamente.
3. En **Settings → Environment Variables** carga las variables del `.env.example`.
4. Connect Custom Domain → `app.gruposina.cl`.
5. Cada push a `main` despliega producción; las preview PRs salen en URLs efímeras.

## Estado de la migración

### ✅ Implementado y funcional
- **Schema completo** (`supabase/migrations/0001_init.sql`): 35+ tablas, FK, índices, triggers, función SQL `emitir_factura`
- **RLS por rol** (`supabase/migrations/0002_rls.sql`): políticas granulares por permiso
- **Auth real**: login, logout, recuperar contraseña, invitaciones por email, activación de cuenta
- **RBAC**: 8 roles seed con matrices de permisos, override por usuario
- **Auditoría**: logs de logins, cambios y eventos críticos en tabla `audit_log`
- **EmailProvider desacoplado**: Resend implementado + stubs SendGrid/SES + console para dev
- **Módulos productivos completos**:
  - `/usuarios` · CRUD, cambio de rol, activar/desactivar, auditoría, invitaciones con reenvío y cancelación
  - `/clientes` · CRUD completo, búsqueda, filtros, vista 360° con OV y facturas asociadas, notas, eliminación
  - `/productos` · CRUD completo, stock por ubicación, registro de movimientos (entrada/salida/ajuste), historial
- **Dashboard ejecutivo** con KPIs reales desde Supabase

### 🟡 Módulos en migración (stub funcional)
Cada uno ya tiene página con permission gate y lectura de Supabase cableada. Falta portar la UI completa siguiendo el patrón Clientes/Productos:
- `/ventas` (cotizaciones + órdenes de venta)
- `/facturacion` (DTE con `BillingProvider`)
- `/cobranza` (CxC + conciliación)
- `/compras` (proveedores + OC + recepciones + CxP)
- `/puntos` (puntos de retiro + transferencias)
- `/finanzas` (ER + Balance + SG&A)
- `/deuda` (préstamos)
- `/mensajeria` (WhatsApp + agente AI)
- `/automatizaciones`
- `/reportes` (BI exportable)

### Patrón para portar cada módulo restante
1. **page.tsx** (RSC) — `await requirePermission('mod.ver')`, lee de Supabase
2. **actions.ts** (server actions) — valida con Zod, `requirePermission`, persiste con admin client o user client según RLS, registra `audit`
3. **\<form\>.tsx** (client component) — formularios con Tailwind
4. **\[id\]/page.tsx** + **\[id\]/editar/page.tsx** — detalle y edición

Ejemplos completos: `/app/(dashboard)/clientes/` y `/app/(dashboard)/productos/`

## Storage (archivos)
Buckets sugeridos en Supabase Storage:
- `documents/oc/{id}/...` — Invoice, Proforma, Packing List, BL
- `documents/expenses/{id}/...` — Comprobantes
- `documents/debt-payments/{id}/...`
- `pdfs/quotes/{id}.pdf`

Crear desde Supabase Dashboard → Storage → New bucket. Aplicar RLS sobre `storage.objects` igual que en `audit_log` (lectura autenticada, escritura por permiso).

## Comandos útiles
```bash
npm run typecheck         # tsc --noEmit
npm run db:push           # aplicar migrations
npm run db:seed           # cargar seed.sql
npm run db:types          # generar lib/types/database.generated.ts
```

## Checklist pre-producción
- [ ] Variables de entorno cargadas en Vercel
- [ ] `supabase db push` aplicado en proyecto de producción
- [ ] Crear primer usuario admin manualmente:
      ```sql
      -- En SQL editor de Supabase:
      -- 1) Invitar manualmente vía Supabase Auth: Dashboard → Authentication → Users → Invite
      -- 2) Una vez creado el user, vincular profile:
      insert into public.profiles(id, email, nombre, apellido, role_id, activo, activated_at)
      values ('<user-uuid>', 'admin@gruposina.cl', 'Admin', 'Sina', 'R1', true, now());
      ```
- [ ] Configurar dominio `app.gruposina.cl` en Vercel + DNS
- [ ] Configurar SPF/DKIM/DMARC en `gruposina.cl` para Resend
- [ ] Verificar que `SUPABASE_SERVICE_ROLE_KEY` está marcado server-only en Vercel
- [ ] Verificar `auth.enable_signup = false` en `supabase/config.toml` (signup solo por invitación)
- [ ] Revisar políticas RLS en producción con `\dt+` y prueba manual con cuenta no admin

## Seguridad
- Service role key nunca expuesta al browser (solo `createAdminClient()` en server)
- Todas las mutations pasan por server actions con `requirePermission`
- RLS activado en todas las tablas
- Tokens de invitación y reset son single-use con expiración
- Audit log inmutable de acciones críticas

## Soporte
Issues técnicos: arturo@gruposina.cl
