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

## Configuration Notes
- TypeScript base config in `tsconfig.base.json`
- Turborepo pipeline defined in `turbo.json`
- pnpm workspace config in `pnpm-workspace.yaml`

Let me know if you'd like me to add more details about any specific part of the project!
