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

---

## Kong API Gateway Integration

### ¿Qué es Kong y para qué se usa aquí?
Kong es un API Gateway open source que centraliza, protege y orquesta el acceso a los endpoints de la API del monorepo. Permite aplicar plugins de seguridad (CORS, rate limiting, JWT, etc.), exponer rutas limpias y desacoplar el backend de los clientes.

### Arquitectura y Servicios Relacionados
- **kong-db:** PostgreSQL dedicado para Kong (no compartir con la app principal).
- **kong-migrations:** Inicializa y migra la base de datos de Kong.
- **kong:** Servicio principal de Kong, expone los puertos 8000 (proxy) y 8001 (admin API).
- **bp-api:** Backend NestJS (puerto 3002), expuesto a través de Kong.

#### Ejemplo de sección relevante en `docker-compose.yml`:
```yaml
  kong-db:
    image: postgres:15
    environment:
      POSTGRES_USER: kong
      POSTGRES_DB: kong
      POSTGRES_PASSWORD: kong
    volumes:
      - kong-db-data:/var/lib/postgresql/data
  kong-migrations:
    image: kong:3.6
    command: kong migrations bootstrap
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-db
      KONG_PG_PASSWORD: kong
      KONG_PG_USER: kong
    depends_on:
      - kong-db
  kong:
    image: kong:3.6
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-db
      KONG_PG_PASSWORD: kong
      KONG_PG_USER: kong
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    ports:
      - "8000:8000" # Proxy
      - "8001:8001" # Admin API
    depends_on:
      - kong-migrations
      - kong-db
      - api
```

### Rutas y Servicios Registrados en Kong
- **Servicio principal:**
  - Nombre: `api-saas`
  - URL: `http://bp-api:3002`
- **Ruta:**
  - Path: `/api`
  - Strip path: `true` (por defecto)
  - Resultado: `/api/auth/login` en Kong → `/auth/login` en el backend

#### Ejemplo de registro vía Admin API (PowerShell):
```powershell
# Crear el servicio
Invoke-RestMethod -Method Post -Uri "http://localhost:8001/services" -Body @{ name = 'api-saas'; url = 'http://bp-api:3002' }

# Crear la ruta
Invoke-RestMethod -Method Post -Uri "http://localhost:8001/routes" -Body @{ service = 'api-saas'; paths = @('/api') }
```

### Plugins configurados
- **CORS** (Cross-Origin Resource Sharing):
  - Permite peticiones desde el frontend.
  - Ejemplo de configuración mínima (PowerShell):
    ```powershell
    Invoke-RestMethod -Method Post -Uri "http://localhost:8001/services/api-saas/plugins" -Body @{ name = 'cors'; config_origins = '*'; config_methods = 'GET' }
    ```
  - Para múltiples métodos, usar herramientas compatibles con arrays o configurar manualmente desde la UI de Kong.

### Variables de entorno relevantes
- En los frontends (`apps/web`, `apps/staff`):
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8000/api
  ```
- En el backend, no requiere cambios para Kong, pero asegúrate de que el host `bp-api` sea accesible desde el contenedor Kong.

### Configuración de rewrites en Next.js
En `apps/web/next.config.ts`:
```ts
const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
return [
  { source: "/auth/:path*", destination: `${api}/auth/:path*` },
  { source: "/organizations/:path*", destination: `${api}/organizations/:path*` },
];
```

### Pruebas y troubleshooting
- **Probar login vía Kong (PowerShell):**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email": "usuario@dominio.com", "password": "tuclave"}'
  ```
- **Probar desde frontend:**
  - Accede a `http://localhost:3000/login` y verifica que el POST va a `/api/auth/login`.
- **Ver logs de Kong:**
  ```sh
  docker compose logs -f kong
  ```
- **Verificar servicios y rutas registrados:**
  ```sh
  curl http://localhost:8001/services
  curl http://localhost:8001/routes
  ```
- **Reiniciar Kong:**
  ```sh
  docker compose restart kong
  ```

### Buenas prácticas y recomendaciones
- Mantén el proxy de Kong como único punto de entrada para la API en producción.
- Usa plugins de seguridad (CORS, rate limiting, JWT, logging) según las necesidades del proyecto.
- Documenta cualquier cambio manual en la configuración de Kong o scripts de automatización.
- Para automatización avanzada, considera usar [decK](https://github.com/kong/deck) para versionar la configuración de Kong como código.

### Automatización avanzada y versionado de configuración (decK)
Para mantener la configuración de Kong como código y facilitar la colaboración/evolución del gateway, se recomienda usar [decK](https://github.com/kong/deck):

- **Exportar configuración actual:**
  ```sh
  deck dump --kong-addr http://localhost:8001 --output-file kong.yaml
  ```
- **Importar configuración versionada:**
  ```sh
  deck sync --kong-addr http://localhost:8001 --state kong.yaml
  ```
- **Validar diferencias antes de aplicar:**
  ```sh
  deck diff --kong-addr http://localhost:8001 --state kong.yaml
  ```

Puedes versionar el archivo `kong.yaml` en el repositorio (ej: en `infra/kong/`) y así tener control de cambios, rollback y CI/CD.

### Backup y restore manual de la base de datos de Kong
Para máxima robustez en producción:
- **Backup:**
  ```sh
  docker compose exec kong-db pg_dump -U kong kong > kong-backup.sql
  ```
- **Restore:**
  ```sh
  docker compose exec -T kong-db psql -U kong kong < kong-backup.sql
  ```

### Troubleshooting avanzado
- **Ver plugins activos en una ruta/servicio:**
  ```sh
  curl http://localhost:8001/services/api-saas/plugins
  curl http://localhost:8001/routes/<route_id>/plugins
  ```
- **Verificar salud de Kong y dependencias:**
  ```sh
  curl http://localhost:8001/status
  docker compose ps
  docker compose logs -f kong-db
  ```
- **Reiniciar todos los servicios relacionados:**
  ```sh
  docker compose restart kong kong-db kong-migrations
  ```

### Buenas prácticas DevOps y continuidad operativa
- Versiona la configuración de Kong y documenta cambios relevantes en el changelog del proyecto.
- Automatiza la provisión de servicios y rutas con scripts o pipelines CI/CD usando decK.
- Realiza backups periódicos de la base de datos de Kong, especialmente antes de upgrades.
- Incluye scripts de healthcheck en el monitoreo de infraestructura.
- Documenta el proceso de rollback ante fallos de configuración.

### Onboarding para nuevos desarrolladores
- Lee esta sección y ejecuta los comandos de troubleshooting para familiarizarte con el gateway.
- Si necesitas agregar una nueva ruta o plugin, sigue el flujo de decK o usa los comandos PowerShell/REST documentados.
- Si tienes dudas sobre el flujo, revisa los ejemplos y logs de Kong para entender cómo enruta y protege los endpoints.
- Consulta las referencias oficiales y la configuración versionada antes de hacer cambios manuales.

### Referencias útiles
- [Kong Docs](https://docs.konghq.com/gateway/latest/)
- [Kong Plugin Hub](https://docs.konghq.com/hub/)
- [decK](https://github.com/kong/deck)

---

Let me know if you'd like me to add more details about any specific part of the project!
