// import { BaseService } from './base.service.js';

// export class UserService extends BaseService<User> {
//   constructor(private userRepository: UserRepository) {
//     super();
//   }

//   // async findById(id: string): Promise<User | null> {
//   //   const user = await this.userRepository.findById(id);
//   //   if (!user) {
//   //     throw new CustomError('User not found', 404);
//   //   }
//   //   return user;
//   // }

//   // async findAll(): Promise<User[]> {
//   //   return this.userRepository.findAll();
//   // }

//   // async findByEmail(email: string): Promise<User | null> {
//   //   return this.userRepository.findByEmail(email);
//   // }

//   // async create(data: { email: string; password: string; name: string; role?: string }): Promise<User> {
//   //   // Check if user exists
//   //   const existingUser = await this.userRepository.findByEmail(data.email);
//   //   if (existingUser) {
//   //     throw new CustomError('User already exists', 409);
//   //   }

//   //   // Hash password
//   //   const hashedPassword = await bcrypt.hash(data.password, 10);

//   //   const user = await this.userRepository.create({
//   //     ...data,
//   //     password: hashedPassword,
//   //   });

//   //   // Remove password from returned object
//   //   const { password, ...userWithoutPassword } = user;
//   //   return userWithoutPassword as User;
//   // }

//   // async update(id: string, data: Partial<User>): Promise<User | null> {
//   //   const user = await this.userRepository.update(id, data);
//   //   if (!user) {
//   //     throw new CustomError('User not found', 404);
//   //   }

//   //   const { password, ...userWithoutPassword } = user;
//   //   return userWithoutPassword as User;
//   // }

//   // async delete(id: string): Promise<boolean> {
//   //   const deleted = await this.userRepository.delete(id);
//   //   if (!deleted) {
//   //     throw new CustomError('User not found', 404);
//   //   }
//   //   return true;
//   // }

//   // async login(email: string, password: string): Promise<{ user: Omit<User, 'password'>; token: string }> {
//   //   const user = await this.userRepository.findByEmail(email);
//   //   if (!user) {
//   //     throw new CustomError('Invalid credentials', 401);
//   //   }

//   //   const isPasswordValid = await bcrypt.compare(password, user.password);
//   //   if (!isPasswordValid) {
//   //     throw new CustomError('Invalid credentials', 401);
//   //   }

//   //   const token = jwt.sign(
//   //     { id: user.id, email: user.email, role: user.role },
//   //     env.JWT_SECRET,
//   //     { expiresIn: env.JWT_EXPIRES_IN }
//   //   );

//   //   const { password: _, ...userWithoutPassword } = user;
//   //   return { user: userWithoutPassword, token };
//   // }
// }
