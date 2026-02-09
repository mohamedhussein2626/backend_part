import { jwt } from '@elysiajs/jwt';
import { cookie } from '@elysiajs/cookie';
import { Elysia } from 'elysia';

export const authMiddleware = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    })
  )
  .use(cookie())
  .derive(async ({ cookie, jwt }) => {
    try {
      const token = cookie['auth-token'] as string | undefined;
      
      if (!token) {
        return { userId: null };
      }

      const payload = await jwt.verify(token);
      
      if (payload && typeof payload === 'object' && 'id' in payload) {
        return { userId: payload.id as string };
      }
      
      return { userId: null };
    } catch (error) {
      return { userId: null };
    }
  });

