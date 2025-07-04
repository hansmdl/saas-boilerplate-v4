import {
  PrismaClient,
  UserType,
  OrganizationRole,
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
      userType: UserType.SUPER_ADMIN,
    },
  });

  // Create Platform Admin
  const platformAdmin = await prisma.user.create({
    data: {
      email: "platformadmin@example.com",
      password: password,
      name: "Platform Admin",
      emailVerified: true,
      userType: UserType.PLATFORM_ADMIN,
    },
  });

  // Create Regular User
  const regularUser = await prisma.user.create({
    data: {
      email: "user@example.com",
      password: password,
      name: "Regular User",
      emailVerified: true,
      userType: UserType.REGULAR,
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
      role: OrganizationRole.OWNER,
    },
  });

  await prisma.organizationMembership.create({
    data: {
      organizationId: organization.id,
      userId: platformAdmin.id,
      role: OrganizationRole.ADMIN,
    },
  });

  // Create Invitation
  await prisma.invitation.create({
    data: {
      email: "newuser@example.com",
      organizationId: organization.id,
      role: OrganizationRole.MEMBER,
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
