# Authentication System Setup Guide

## Prerequisites
- Bun runtime installed
- Neon PostgreSQL database account
- Node.js 18+ (if not using Bun)

## Setup Steps

### 1. Install Dependencies
```bash
bun install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NODE_ENV="development"
```

**Get your DATABASE_URL from Neon:**
1. Go to your Neon dashboard
2. Select your project
3. Copy the connection string
4. Replace the placeholder values

### 3. Set Up Prisma
```bash
# Generate Prisma Client
bun run db:generate

# Push schema to database
bun run db:push
```

### 4. Run the Server
```bash
bun run dev
```

The server will run on `http://localhost:3000`

## API Endpoints

### User Authentication

#### Register User
```http
POST /api/user/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Login User
```http
POST /api/user/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Admin Authentication

#### Register Admin
```http
POST /api/admin/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "adminpassword123"
}
```

#### Login Admin
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "adminpassword123"
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "clx...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Response
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

## Security Features

- ✅ Passwords are hashed using bcrypt
- ✅ JWT tokens for authentication
- ✅ HTTP-only cookies for token storage
- ✅ Secure cookies in production
- ✅ Input validation

## Database Schema

### User Model
- `id`: String (CUID)
- `name`: String
- `email`: String (unique)
- `password`: String (hashed)
- `role`: String (default: "user")
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Admin Model
- `id`: String (CUID)
- `name`: String
- `email`: String (unique)
- `password`: String (hashed)
- `role`: String (default: "admin")
- `createdAt`: DateTime
- `updatedAt`: DateTime

## Next Steps

1. Add authentication middleware for protected routes
2. Add password reset functionality
3. Add email verification
4. Add rate limiting
5. Add request validation middleware

