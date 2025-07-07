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