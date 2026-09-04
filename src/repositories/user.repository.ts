import { BaseRepository } from './base.repository.js';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage (replace with database)
const users: Map<string, User> = new Map();

export class UserRepository extends BaseRepository<User> {
  async findById(id: string): Promise<User | null> {
    return users.get(id) || null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(users.values());
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = Array.from(users.values()).find(u => u.email === email);
    return user || null;
  }

  async create(data: Partial<User>): Promise<User> {
    const user = {
      id: crypto.randomUUID(),
      email: data.email!,
      password: data.password!,
      name: data.name!,
      role: data.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    users.set(user.id, user);
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const existing = users.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return users.delete(id);
  }
}
