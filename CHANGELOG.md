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