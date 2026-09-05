import type { Prisma, User } from '@prisma/client';

import { prisma } from '../config/database';

import { SoftDeleteRepository } from './soft-delete.repository';

export type { User } from '@prisma/client';

export type SafeUser = Omit<User, 'password'>;

export class UserRepository extends SoftDeleteRepository<User> {
  constructor() {
    super(prisma.user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
  }

  async create(data: Partial<User>): Promise<User> {
    const createData: Prisma.UserCreateInput = {
      email: data.email!,
      password: data.password!,
      firstName: data.firstName!,
      lastName: data.lastName!,
      phone: data.phone!,
    };

    if (data.role !== undefined) {
      createData.role = data.role;
    }

    if (data.avatarUrl !== undefined) {
      createData.avatarUrl = data.avatarUrl;
    }

    return prisma.user.create({ data: createData });
  }
}
