## 2025-07-08 - 16:35

* **infra(auth/email):** Dockerización y robustez total del flujo de autenticación y email
  - Solucionado el build y arranque de todo el monorepo en Docker (web, api, staff, db, redis).
  - Fix crítico: Prisma CLI y Client ahora siempre disponibles en producción (migrados a dependencies en `packages/db/package.json`).
  - Actualizado el lockfile y build reproducible con `pnpm install && docker compose build`.
  - Separación definitiva de colas BullMQ: `email` y `password-reset` para evitar jobs no soportados y warnings de workers.
  - Fix de permisos (EACCES) en `/app/packages/db` dentro del contenedor Docker: documentado uso de `chmod -R 755 /app/packages/db` si es necesario.
  - Comando universal para migraciones Prisma en Docker:
    ```sh
    docker compose exec api npx --prefix /app/packages/db prisma migrate deploy
    ```
  - EmailProcessor y PasswordResetProcessor correctamente inicializados y escuchando solo sus colas.
  - Email de verificación y recuperación de contraseña funcionan end-to-end en entorno Docker.
  - Documentado el flujo recomendado de comandos para build, up, migraciones y troubleshooting en README y changelog.

**Archivos modificados:**
- `packages/email/src/email.module.ts`
- `packages/email/src/password-reset.processor.ts`
- `packages/db/package.json`
- `Dockerfile.api`
- `README.md`

**Notas:**
- El atributo `version` de `docker-compose.yml` es obsoleto y puede eliminarse.
- Todos los servicios arrancan sin errores críticos ni warnings de colas BullMQ.
- Comandos pnpm --filter db ... siguen funcionando en local para desarrollo.
- Flujo de registro y verificación de email probado y funcional en Docker.

---
## 2025-07-07 - 17:00

* **feat(auth/email):** Flujo robusto de recuperación y restablecimiento de contraseña
  - Implementado PasswordResetProcessor dedicado para manejar jobs de recuperación de contraseña en BullMQ/NestJS.
  - Ajustado EmailProcessor para coexistencia limpia de múltiples tipos de job.
  - Email de recuperación de contraseña ahora se envía correctamente y con token seguro.
* **fix(auth):** Validación estricta en restablecimiento de contraseña
  - El endpoint `/auth/reset-password` solo acepta `{ token, password }` y valida con Zod mínimo 8 caracteres.
  - Manejo seguro de errores y mensajes claros en backend y frontend.
* **feat(web):** Pantalla moderna de restablecimiento de contraseña
  - Refactor completo de `/reset-password/[token]` usando React Hook Form y Zod.
  - Validación local de confirmación de contraseña, UX amigable y mensajes de error claros.
  - Corrección de imports y tipado estricto en `/verify-email/[token]`.
* **infra:** El sistema de colas y email processors arranca sin errores ni advertencias críticas.

**Archivos modificados:**
- `packages/email/src/password-reset.processor.ts`
- `packages/email/src/email.processor.ts`
- `packages/email/src/email.module.ts`
- `apps/web/src/app/reset-password/[token]/page.tsx`
- `apps/web/src/app/verify-email/[token]/page.tsx`

**Notas:**
- Redis sigue mostrando advertencia de versión mínima recomendada (6.2.0), pero no afecta funcionalidad.
- Flujo de recuperación y restablecimiento de contraseña probado end-to-end.

---

## 2025-07-07 - 16:18

* **fix(auth):** Registro correcto de LocalStrategy en AuthModule
  - Se soluciona el error "Unknown authentication strategy 'local'" añadiendo LocalStrategy a los providers de `auth.module.ts`.
  - Ahora el login con email y password funciona correctamente y bloquea usuarios no verificados.
* **fix(ui):** Corrección de exportaciones y estructura de componentes UI
  - Unificación de exports en `packages/ui/src/index.ts` para permitir imports limpios desde `ui`.
  - Eliminados duplicados y errores de identificador en `card.tsx`.
  - Se agregan archivos base de componentes UI: `alert.tsx`, `button.tsx`, `checkbox.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`.
* **fix(email):** Actualización de dependencias
  - Corrección de la versión de `@nestjs/bullmq` en `packages/email/package.json` para evitar errores de instalación.

**Archivos modificados:**
- `apps/api/src/auth/auth.module.ts`
- `packages/ui/src/card.tsx`
- `packages/ui/src/index.ts`
- `packages/email/package.json`

**Nuevos archivos UI:**
- `packages/ui/src/alert.tsx`
- `packages/ui/src/button.tsx`
- `packages/ui/src/checkbox.tsx`
- `packages/ui/src/input.tsx`
- `packages/ui/src/label.tsx`
- `packages/ui/src/textarea.tsx`

## 2025-07-07 - 15:30

* **fix:** Solucionado problema de BullMQ en Windows con ESM
  - Corregido error "File does not exist" en el procesador de email en entornos Windows
  - Implementada solución compatible con ESM que utiliza decoradores nativos de NestJS
  - Documentada la solución en `/docs/email-processor-windows-fix.md`
* **feat:** Implementado flujo completo de verificación de email
  - Integración de cola de emails usando BullMQ y NestJS 11
  - Envío de correos de verificación al registrarse
  - Endpoint para verificar tokens de email (/auth/verify-email/:token)
* **docs:** Añadida documentación detallada sobre la implementación del procesador de emails en Windows

## 2025-07-07 - 10:36

* **test:** Pruebas unitarias completas (en español) para autenticación de dos factores (2FA)
  - Se implementan pruebas para todos los endpoints del controlador TwoFactorController (generar, habilitar, deshabilitar, recuperar, enviar y verificar código por email).
  - Se implementan pruebas para todos los métodos utilitarios de TwoFactorUtils (generación y verificación de códigos, generación de URL QR).
  - Se asegura cobertura de casos principales y mensajes descriptivos en español.

## [Unreleased]

### Fixed
- Corregido error de tipos en el servicio `MagicLinkService` que impedía la compilación
- Solucionado problema con la generación de tipos de Prisma para el modelo `MagicLinkToken`
- Mejorado el manejo de errores en el flujo de autenticación con magic links
- Corregida la configuración del servicio de correo electrónico para el envío de emails de verificación

### Added
- Implementado soporte completo para autenticación con magic links
- Añadido modelo `MagicLinkToken` al esquema de Prisma
- Configurado el servicio de correo electrónico para enviar emails de verificación
- Agregadas rutas de API para el manejo de magic links

### Changed
- Actualizada la documentación del servicio de autenticación
- Mejorado el manejo de errores en los controladores de autenticación
- Optimizado el proceso de generación y validación de tokens

### Security
- Asegurada la correcta invalidación de tokens después de su uso
- Implementada verificación de expiración de tokens
- Añadida protección contra ataques de fuerza bruta en los endpoints de autenticación

## 2025-07-07 - 00:15

* **feat:** Implemented complete Two-Factor Authentication system
  - Added TwoFactorUtils with custom code generation
  - Updated TwoFactorService with proper error handling
  - Fixed email queue job naming consistency
* **fix:** Resolved Prisma schema validation issues for 2FA fields
* **refactor:** Improved email processor initialization logs
* **chore:** Regenerated Prisma client to recognize all model fields

## 2025-07-06 - 21:02

* **fix:** Corregida arquitectura del paquete email para separar correctamente archivos fuente (.ts) y compilados (.js/.d.ts)
* **fix:** Actualizada configuración de TypeScript para habilitar decoradores y metadatos en el paquete email
* **fix:** Corregidas rutas en el package.json del paquete email para apuntar a la ubicación correcta de los archivos compilados
* **fix:** Mejorada integración del EmailProcessor con BullMQ y NestJS 11 asegurando registro correcto del worker
* **fix:** Añadido endpoint para limpiar la cola de email (/email/clear-queue)
* **fix:** Mejorado manejo de errores y logging en el procesador de emails

## 2025-07-05 - 00:02

* **feat:** Implemented BullMQ email processor integration for password reset and email verification workflows
* **test:** Added comprehensive unit tests for email sending functionality
* **fix:** Resolved TypeScript build errors and module import issues

## 2025-07-04 - 17:12

* **docs:** Se crea el archivo README.md con la documentación inicial del proyecto.