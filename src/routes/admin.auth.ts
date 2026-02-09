import { Elysia } from 'elysia';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../lib/auth';
import { jwt } from '@elysiajs/jwt';
import { cookie } from '@elysiajs/cookie';

export const adminAuth = new Elysia()
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

        // Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({
          where: { email },
        });

        if (existingAdmin) {
          return {
            success: false,
            message: 'Admin with this email already exists',
          };
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create admin
        const admin = await prisma.admin.create({
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
          id: admin.id,
          email: admin.email,
          role: admin.role,
        }) as string;

        // Set cookie (using Lax for cross-origin support)
        set.headers['Set-Cookie'] = `admin-auth-token=${token}; HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

        return {
          success: true,
          message: 'Admin registered successfully',
          admin,
          token,
        };
      } catch (error: any) {
        console.error('Admin registration error:', error);
        return {
          success: false,
          message: error?.message || 'An error occurred during admin registration',
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

        // Find admin
        const admin = await prisma.admin.findUnique({
          where: { email },
        });

        if (!admin) {
          return {
            success: false,
            message: 'Invalid email or password',
          };
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, admin.password);

        if (!isPasswordValid) {
          return {
            success: false,
            message: 'Invalid email or password',
          };
        }

        // Generate JWT token
        const token = await jwt.sign({
          id: admin.id,
          email: admin.email,
          role: admin.role,
        }) as string;

        // Set cookie (using Lax for cross-origin support)
        set.headers['Set-Cookie'] = `admin-auth-token=${token}; HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

        return {
          success: true,
          message: 'Admin login successful',
          admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            createdAt: admin.createdAt,
          },
          token,
        };
      } catch (error: any) {
        console.error('Admin login error:', error);
        return {
          success: false,
          message: error?.message || 'An error occurred during admin login',
          error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        };
      }
    },
  );

