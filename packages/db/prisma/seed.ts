import {
  PrismaClient,
  AccountType,
  PlatformRole,
  CustomerRole,
  SubscriptionPlan,
  SubscriptionStatus,
} from "../src/generated/prisma";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;
  const password = await bcrypt.hash("pass123", saltRounds);

  // Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@example.com",
      password: password,
      name: "Super Admin",
      emailVerified: true,
      accountType: AccountType.PLATFORM_STAFF,
      platformRole: PlatformRole.SUPER_ADMIN,
    },
  });

  // Create Platform Admin
  const platformAdmin = await prisma.user.create({
    data: {
      email: "platformadmin@example.com",
      password: password,
      name: "Platform Admin",
      emailVerified: true,
      accountType: AccountType.PLATFORM_STAFF,
      platformRole: PlatformRole.SUPPORT_AGENT,
    },
  });

  // Create Regular User
  const regularUser = await prisma.user.create({
    data: {
      email: "user@example.com",
      password: password,
      name: "Regular User",
      emailVerified: true,
      accountType: AccountType.CUSTOMER_USER,
    },
  });

  // Create Organization
  const organization = await prisma.organization.create({
    data: {
      name: "Acme Inc.",
      createdBy: {
        connect: {
          id: regularUser.id,
        },
      },
    },
  });

  // Create Organization Memberships
  await prisma.organizationMembership.create({
    data: {
      organizationId: organization.id,
      userId: regularUser.id,
      role: CustomerRole.OWNER,
    },
  });

  await prisma.organizationMembership.create({
    data: {
      organizationId: organization.id,
      userId: platformAdmin.id,
      role: CustomerRole.ADMIN,
    },
  });

  // Create Invitation
  await prisma.invitation.create({
    data: {
      email: "newuser@example.com",
      organizationId: organization.id,
      role: CustomerRole.MEMBER,
      token: "invitation-token",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  });

  // Create Profile
  await prisma.profile.create({
    data: {
      userId: regularUser.id,
      bio: "This is a bio.",
      avatarUrl: "https://example.com/avatar.png",
    },
  });

  // Create Customer and Subscription
  const customer = await prisma.customer.create({
    data: {
      id: "cus_123456789",
      organizationId: organization.id,
    },
  });

  await prisma.subscription.create({
    data: {
      id: "sub_123456789",
      customerId: customer.id,
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  // Seed Permissions & RolePermissions
  const permissions = [
    { scope: 'user:read', description: 'Leer usuarios' },
    { scope: 'user:update', description: 'Actualizar usuarios' },
    { scope: 'org:manage', description: 'Administrar organización' },
  ];

  await prisma.permission.createMany({ data: permissions, skipDuplicates: true });

  // Map roles a permisos (simplificado)
  const rolePermMap: Record<string, string[]> = {
    ADMIN: ['user:read', 'user:update', 'org:manage'],
    USER: ['user:read'],
  };

  // Crear RolePermissions evitando problemas con nombres de índices compuestos
  const rolePermissionsData: { role: any; permissionId: string }[] = [];
  for (const [role, scopes] of Object.entries(rolePermMap)) {
    for (const scope of scopes) {
      const perm = await prisma.permission.findUnique({ where: { scope } });
      if (perm) {
        rolePermissionsData.push({ role: role as any, permissionId: perm.id });


      }
    }
  }

  // Insertar datos y omitir duplicados
  if (rolePermissionsData.length) {
    await prisma.rolePermission.createMany({ data: rolePermissionsData, skipDuplicates: true });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
