# Plan de Implementación – RBAC Granular & Multi-Tenant Workspaces

Este documento describe el roadmap técnico para incorporar:
1. Roles y Permisos (RBAC) con scopes granulares.
2. Multi-tenant basado en organizaciones/equipos y selector de workspace.

Todas las tareas respetan la arquitectura Turborepo, el esquema Prisma existente y las guías del proyecto.

---
## Fase 0 – Preparativos
- [x] Revisar `packages/db/schema.prisma` (models `User`, `Role`, `Organization`, `Membership`).
- [x] Crear migración inicial para nuevas tablas si faltan.
- [x] Añadir feature-flags en `packages/config/features.ts` (`enableRBAC`, `enableMultiTenant`).

---
## Fase 1 – RBAC Granular
### 1. Base de Datos & Prisma
- [x] Tablas/pivots `Permission` y `RolePermission`.
- [x] Seeder con roles (`admin`, `staff`, `owner`, `member`) y scopes (`user:read`, `user:update`, `org:manage`, …).

### 2. Backend (apps/api)
- [x] Decorador `@Scopes()` y `ScopesGuard` (NestJS).
- [x] Servicio `RolesService` con métodos `getUserScopes`, `assignRole` (cache Redis pendiente).
- [x] Endpoints Staff `PATCH /staff/users/:id/roles` (protegido por scope `user:update`).

### 3. Frontend (apps/web & apps/staff)
- [x] Hook `useHasScope(scope)` (WebSocket)
- [x] UI en panel Staff para asignación de roles (tabla usuarios + combobox vía WebSocket).

### 4. Tests
- [ ] Unit tests para `ScopesGuard`.
- [ ] e2e SuperTest para endpoint protegido.

---
## Fase 2 – Multi-Tenant Teams & Workspaces
### 1. Base de Datos & Prisma
- [ ] Confirmar/añadir modelos `Organization`, `Membership`, `Invitation`.
- [ ] FK `organizationId` en recursos y migraciones.

### 2. Backend
- [ ] Middleware `TenantMiddleware` (inyecta `request.orgId`).
- [ ] Endpoints `POST /org`, `POST /org/:id/invite`, `POST /org/accept`.
- [ ] Guard `OrganizationMembershipGuard`.

### 3. Frontend (apps/web)
- [ ] Zustand `useWorkspace` + Context.
- [ ] Selector de workspace en Header (popover).
- [ ] Ajustar fetch/React-Query para enviar header `X-Org-Id`.

### 4. Panel Staff
- [ ] Página `Organizations` con tabla y botón impersonate.

### 5. Seeds & CLI
- [ ] Seed org de ejemplo + invitaciones.
- [ ] Script CLI `pnpm api org:create`.

---
## Fase 3 – Integración UX
- [ ] Dashboard usa `currentOrgId` para KPIs.
- [ ] Onboarding wizard si usuario sin organización.

---
## Checklist Global de Avance
- [x] Fase 0 completa
- [x] Fase 1 – DB
- [x] Fase 1 – Backend
- [ ] Fase 1 – Frontend
- [ ] Fase 1 – Tests
- [ ] Fase 2 – DB
- [ ] Fase 2 – Backend
- [ ] Fase 2 – Frontend
- [ ] Fase 2 – Panel Staff
- [ ] Fase 2 – Seeds/CLI
- [ ] Fase 3 – UX final

> Recordatorio: antes de cada migración ejecutar `pnpm prisma:migrate dev` y revisar que **NO** se dupliquen modelos ya presentes.
