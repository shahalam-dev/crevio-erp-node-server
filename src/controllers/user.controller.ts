import { BaseController } from './base.controller';

// import { UserService } from '../services/user.service';

export class UserController extends BaseController {
  // constructor(private userService: UserService) {
  //   super();
  // }
  // getAll = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const users = await this.userService.findAll();
  //     this.sendSuccess(res, users);
  //   } catch (error) {
  //     next(error);
  //   }
  // };
  // getById = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const { id } = req.params;
  //     if (!id) {
  //       throw new CustomError('User ID is required', 400);
  //     } else {
  //       const user = await this.userService.findById(id);
  //     }
  //     this.sendSuccess(res, user);
  //   } catch (error) {
  //     next(error);
  //   }
  // };
  // create = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const user = await this.userService.create(req.body);
  //     this.sendSuccess(res, user, 201);
  //   } catch (error) {
  //     next(error);
  //   }
  // };
  // update = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const { id } = req.params;
  //     const user = await this.userService.update(id, req.body);
  //     this.sendSuccess(res, user);
  //   } catch (error) {
  //     next(error);
  //   }
  // };
  // delete = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     await this.userService.delete(req.params.id);
  //     this.sendSuccess(res, { message: 'User deleted successfully' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
  // getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  //   try {
  //     if (!req.user) {
  //       throw new CustomError('Unauthorized', 401);
  //     }
  //     const user = await this.userService.findById(req.user.id);
  //     this.sendSuccess(res, user);
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}
