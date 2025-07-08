# SaaS Boilerplate v4

A modern monorepo-based SaaS starter kit using Turborepo, pnpm, NestJS, and Prisma.

## Project Structure

```
saas-boilerplate-v4/
├── apps/
│   ├── api/ - NestJS backend application
│   │   ├── src/ - Source code
│   │   ├── test/ - Tests
│   │   └── package.json - API dependencies
│   ├── web/ - User-facing web app
│   └── staff/ - Internal admin dashboard
├── packages/
│   ├── db/ - Shared database module
│   │   ├── prisma/ - Prisma schema and migrations
│   │   └── package.json - DB dependencies
│   └── email/ - Email service module
├── dist/ - Build output directory
├── .turbo/ - Turborepo cache
├── .vscode/ - VSCode settings
├── node_modules/ - Shared dependencies
├── package.json - Root dependencies
├── pnpm-lock.yaml - Dependency lockfile
├── pnpm-workspace.yaml - Workspace configuration
├── tsconfig.base.json - Shared TypeScript config
└── turbo.json - Turborepo pipeline config
```

## Key Technologies
- **Monorepo Manager**: Turborepo + pnpm
- **Backend**: NestJS (Node.js framework)
- **Database**: Prisma ORM
- **Authentication**: JWT + Passport
- **Testing**: Jest
- **Styling**: Tailwind CSS

## Root Dependencies (package.json)
```json
{
  "private": true,
  "name": "saas-boilerplate-v4",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "dev:web": "pnpm --filter web dev",
    "dev:staff": "pnpm --filter staff dev",
    "dev:api": "pnpm --filter api start"
  },
  "dependencies": {
    "@tailwindcss/postcss": "^4.1.11",
    "autoprefixer": "^10.4.21",
    "db": "link:packages/db",
    "email": "link:packages/email",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.11"
  },
  "devDependencies": {
    "jest-mock-extended": "^4.0.0",
    "prettier": "^3.6.2",
    "ts-node": "^10.9.2",
    "turbo": "^2.5.4"
  }
}
```

## API App Configuration (apps/api/package.json)
- **Main Dependencies**: 
  - NestJS ecosystem (`@nestjs/*`)
  - Authentication (`passport`, `passport-jwt`)
  - Database (`db` workspace package)
  - Validation (`zod`)
- **Scripts**:
  - `build`: Compile NestJS app
  - `start`: Run in production mode
  - `start:dev`: Run in development mode
  - `test`: Run Jest tests

## Database Package (packages/db/package.json)
- Uses Prisma ORM
- Exports TypeScript types from `dist/src/index.d.ts`
- Contains Prisma seed script
- Dev dependencies include Prisma client and TypeScript

## Development Workflow
1. Install dependencies: `pnpm install`
2. Start all services: `pnpm dev`
3. Start specific service: `pnpm dev:api` or `pnpm dev:web`
4. Run tests: `pnpm test` (in each package)

---

## Docker & Production Workflow

### Build and Run All Services
```sh
pnpm install            # Asegúrate de tener lockfile actualizado
# Build todas las imágenes (api, web, staff)
docker compose build
# Levanta todos los servicios en segundo plano
docker compose up -d
```

### Migraciones Prisma dentro de Docker
> Ejecuta SIEMPRE las migraciones Prisma después de levantar los servicios y antes de exponer la API en producción.

```sh
# Comando universal y robusto para aplicar migraciones Prisma en el contenedor
# Usa el flag --schema para asegurar que Prisma encuentre el archivo correcto en Docker

docker compose exec api npx --prefix /app/packages/db prisma migrate deploy --schema=/app/packages/db/prisma/schema.prisma
```

**¿Por qué es necesario el flag `--schema`?**
En entornos Docker, la resolución de rutas puede variar y Prisma podría no encontrar el archivo `schema.prisma` si no se indica la ruta absoluta. Usar `--schema=/app/packages/db/prisma/schema.prisma` garantiza que siempre se use el schema correcto, evitando errores de "file not found".

Si ves errores de permisos (EACCES) en `/app/packages/db`, ejecuta dentro del contenedor:
```sh
docker compose exec api sh
chmod -R 755 /app/packages/db
exit
```
Luego repite el comando de migración.

**Si Prisma no encuentra el schema incluso usando el flag:**
- Verifica que el archivo exista en el contenedor (`/app/packages/db/prisma/schema.prisma`).
- Asegúrate de que el Dockerfile copia la carpeta `prisma` correctamente.
- Haz rebuild de la imagen con `docker compose build --no-cache api` si hiciste cambios en el Dockerfile.

### Comandos útiles para troubleshooting
```sh
# Ver logs en tiempo real de la API
  docker compose logs -f api
# Ingresar a un contenedor para debug
  docker compose exec api sh
# Verificar estado de servicios
  docker compose ps
```

### Flujo recomendado para desarrollo local
```sh
pnpm install
pnpm dev         # Arranca todo (web, api, staff) en modo desarrollo
# Migraciones y generación de Prisma Client en local
pnpm --filter db run prisma:migrate
pnpm --filter db run prisma:generate
```

### Buenas prácticas
- Elimina el atributo `version` de `docker-compose.yml` si ves advertencias.
- Usa siempre los comandos pnpm --filter ... para operar sobre paquetes individuales en local.
- En Docker, usa `npx --prefix` para ejecutar binarios de subpaquetes.
- Todas las variables de entorno críticas están en el `.env` de la raíz y se montan en los servicios por Docker Compose.
- Los workers BullMQ (Email, PasswordReset) están correctamente aislados y escuchan solo su cola.
- **IMPORTANTE:** Si agregas nuevas colas BullMQ (ej: `password-reset`), debes registrarlas explícitamente en el módulo correspondiente usando `BullModule.registerQueue({ name: 'password-reset' })` para evitar errores de inyección en NestJS.
- El flujo de recuperación de contraseña está desacoplado del envío de emails generales y usa su propia cola y processor para máxima robustez.
- El flujo de registro, verificación de email y recuperación de contraseña está probado end-to-end en Docker y local.

---

## Configuration Notes
- TypeScript base config in `tsconfig.base.json`
- Turborepo pipeline defined in `turbo.json`
- pnpm workspace config in `pnpm-workspace.yaml`

Let me know if you'd like me to add more details about any specific part of the project!
