import { Elysia } from 'elysia';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../lib/auth';
import { jwt } from '@elysiajs/jwt';
import { cookie } from '@elysiajs/cookie';

export const userAuth = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    })
  )
  .use(cookie())
  .post(
    '/register',
    async ({ body, jwt, set }) => {
      try {
        const { name, email, password } = body as {
          name: string;
          email: string;
          password: string;
        };

        // Validate input
        if (!name || !email || !password) {
          return {
            success: false,
            message: 'Name, email, and password are required',
          };
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          return {
            success: false,
            message: 'User with this email already exists',
          };
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });

        // Generate JWT token
        const token = await jwt.sign({
          id: user.id,
          email: user.email,
          role: user.role,
        }) as string;

        // Set cookie
        set.headers['Set-Cookie'] = `auth-token=${token}; HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

        return {
          success: true,
          message: 'User registered successfully',
          user,
          token,
        };
      } catch (error: any) {
        console.error('Registration error:', error);
        return {
          success: false,
          message: error?.message || 'An error occurred during registration',
          error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        };
      }
    },
  )
  .post(
    '/login',
    async ({ body, jwt, set }) => {
      try {
        const { email, password } = body as {
          email: string;
          password: string;
        };

        // Validate input
        if (!email || !password) {
          return {
            success: false,
            message: 'Email and password are required',
          };
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return {
            success: false,
            message: 'Invalid email or password',
          };
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
          return {
            success: false,
            message: 'Invalid email or password',
          };
        }

        // Generate JWT token
        const token = await jwt.sign({
          id: user.id,
          email: user.email,
          role: user.role,
        }) as string;

        // Set cookie
        set.headers['Set-Cookie'] = `auth-token=${token}; HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

        return {
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
          token,
        };
      } catch (error: any) {
        console.error('Login error:', error);
        return {
          success: false,
          message: error?.message || 'An error occurred during login',
          error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        };
      }
    },
  );

