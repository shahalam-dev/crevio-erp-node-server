import type { Prisma, User } from '@prisma/client';

import { prisma } from '../config/database';

import { BaseRepository } from './base.repository';

export type { User } from '@prisma/client';

export type SafeUser = Omit<User, 'password'>;

export class UserRepository extends BaseRepository<User> {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<User[]> {
    return prisma.user.findMany();
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
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

  async update(id: string, data: Partial<User>): Promise<User | null> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
