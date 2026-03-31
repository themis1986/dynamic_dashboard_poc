import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get user from Authorization header
    // Format: "Bearer <userId>" or just "<userId>"
    const authHeader = request.headers["authorization"];

    if (!authHeader) {
      throw new UnauthorizedException("Missing Authorization header");
    }

    // Extract userId
    const userId = authHeader.replace("Bearer ", "").trim();

    if (!userId) {
      throw new UnauthorizedException("Invalid Authorization header");
    }

    // Attach userId to request for later use
    request.userId = userId;

    return true;
  }
}
