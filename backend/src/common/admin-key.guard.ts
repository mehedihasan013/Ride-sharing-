import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/** True when `provided` matches ADMIN_API_KEY; with no key set, only outside production. */
export function isAdminKeyValid(provided: unknown): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    return process.env.NODE_ENV !== 'production';
  }
  if (typeof provided !== 'string') {
    return false;
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, so check length first
  return a.length === b.length && timingSafeEqual(a, b);
}

@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!isAdminKeyValid(req.headers['x-admin-key'])) {
      throw new ForbiddenException('Invalid or missing admin key');
    }
    return true;
  }
}
