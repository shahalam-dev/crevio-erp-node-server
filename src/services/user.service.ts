import type { User } from '@prisma/client';
import bcrypt from 'bcrypt';

import { CustomError } from '../exceptions/CustomError';
import type { SafeUser, UserRepository } from '../repositories/user.repository';
import { normalizePhone } from '../utils/phone.util';

const SALT_ROUNDS = 12;

const toSafeUser = (user: User): SafeUser => {
  const { password: _password, telegramChatId: _telegramChatId, ...safeUser } = user;
  return safeUser;
};

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
  role?: User['role'];
}

export interface UpdateUserInput extends Partial<Omit<User, 'phone'>> {
  phone?: string;
  countryCode?: string;
}

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async findById(id: string): Promise<SafeUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    return toSafeUser(user);
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    const user = await this.userRepository.findByEmail(email);
    return user ? toSafeUser(user) : null;
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.userRepository.findAll();
    return users.map(toSafeUser);
  }

  async create(data: CreateUserInput): Promise<SafeUser> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new CustomError('User already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const normalizedPhone = normalizePhone(data.phone, data.countryCode);

    const user = await this.userRepository.create({
      ...data,
      phone: normalizedPhone,
      password: hashedPassword,
    });

    return toSafeUser(user);
  }

  async update(id: string, data: UpdateUserInput): Promise<SafeUser> {
    const { countryCode, phone, ...rest } = data;

    const updateData: Partial<User> = { ...rest };

    if (phone) {
      if (!countryCode) {
        throw new CustomError('Country code is required when updating phone', 400);
      }
      updateData.phone = normalizePhone(phone, countryCode);
    }

    const user = await this.userRepository.update(id, updateData);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    return toSafeUser(user);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new CustomError('User not found', 404);
    }
  }
}
