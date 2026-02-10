# Admin Account Setup Guide

## Overview

This guide explains how to create an admin account for the Toolur application using the API endpoint. The admin account is required to access the admin dashboard and manage users, view statistics, and perform administrative tasks.

## Prerequisites

- Backend server running (default: `http://localhost:3000`)
- API client tool (Postman, Insomnia, Thunder Client, or curl)
- Valid email address
- Secure password

## API Endpoint

**Endpoint**: `POST /api/admin/register`

**Base URL Options**:
- Local: `http://localhost:3000`
- Production: `https://your-domain.com`

**Full URL**: `{BASE_URL}/api/admin/register`

## Request Format

### Headers
```
Content-Type: application/json
```

### Request Body (JSON)
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

### Required Fields
- `name` (string): Admin's full name
- `email` (string): Valid email address (must be unique)
- `password` (string): Password (minimum 6 characters recommended)

## Setup Instructions

### Method 1: Using Postman

1. **Open Postman** and create a new request
2. **Set Method**: Select `POST`
3. **Enter URL**: `http://localhost:3000/api/admin/register` (or your production URL)
4. **Set Headers**:
   - Key: `Content-Type`
   - Value: `application/json`
5. **Set Body**:
   - Select `raw`
   - Select `JSON` from dropdown
   - Enter the JSON body:
   ```json
   {
     "name": "Admin User",
     "email": "admin@toolur.com",
     "password": "AdminPassword123!"
   }
   ```
6. **Send Request**: Click "Send"
7. **Check Response**: You should receive a success response with admin data and token

### Method 2: Using Insomnia

1. **Open Insomnia** and create a new request
2. **Set Method**: `POST`
3. **Enter URL**: `http://localhost:3000/api/admin/register`
4. **Set Body Type**: `JSON`
5. **Enter JSON Body**:
   ```json
   {
     "name": "Admin User",
     "email": "admin@toolur.com",
     "password": "AdminPassword123!"
   }
   ```
6. **Send Request**: Click "Send"
7. **Save Response**: Note the token for future use

### Method 3: Using Thunder Client (VS Code Extension)

1. **Open VS Code** with Thunder Client extension
2. **Create New Request**
3. **Set Method**: `POST`
4. **Enter URL**: `http://localhost:3000/api/admin/register`
5. **Go to Body Tab**: Select `JSON`
6. **Enter JSON**:
   ```json
   {
     "name": "Admin User",
     "email": "admin@toolur.com",
     "password": "AdminPassword123!"
   }
   ```
7. **Send Request**

### Method 4: Using cURL (Command Line)

```bash
curl -X POST http://localhost:3000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@toolur.com",
    "password": "AdminPassword123!"
  }'
```

### Method 5: Using JavaScript (Node.js/Fetch)

```javascript
fetch('http://localhost:3000/api/admin/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Admin User',
    email: 'admin@toolur.com',
    password: 'AdminPassword123!'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## Success Response

```json
{
  "success": true,
  "message": "Admin registered successfully",
  "admin": {
    "id": "admin-id-here",
    "name": "Admin User",
    "email": "admin@toolur.com",
    "role": "admin",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "jwt-token-here"
}
```

## Error Responses

### Email Already Exists
```json
{
  "success": false,
  "message": "Admin with this email already exists"
}
```

### Missing Fields
```json
{
  "success": false,
  "message": "Name, email, and password are required"
}
```

### Server Error
```json
{
  "success": false,
  "message": "An error occurred during admin registration"
}
```

## After Registration

1. **Save the Token**: The JWT token in the response can be used for authenticated requests
2. **Login**: You can now use the admin login endpoint:
   - `POST /api/admin/login`
   - Use the same email and password
3. **Access Admin Dashboard**: Navigate to `/admin` in the frontend application
4. **Use Admin Features**:
   - View all users
   - View usage statistics
   - Manage subscriptions
   - View analytics

## Admin Login Endpoint

After registration, you can login using:

**Endpoint**: `POST /api/admin/login`

**Request Body**:
```json
{
  "email": "admin@toolur.com",
  "password": "AdminPassword123!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Admin login successful",
  "admin": { ... },
  "token": "jwt-token-here"
}
```

## Security Best Practices

1. **Use Strong Passwords**: Minimum 12 characters with mix of letters, numbers, and symbols
2. **Store Credentials Securely**: Never commit passwords to version control
3. **Use HTTPS in Production**: Always use secure connections for production
4. **Rotate Tokens**: Implement token refresh mechanism
5. **Limit Admin Accounts**: Only create admin accounts for trusted personnel
6. **Monitor Access**: Regularly check admin activity logs

## Troubleshooting

### Connection Refused
- Ensure backend server is running
- Check if port 3000 is available
- Verify the URL is correct

### CORS Errors
- Ensure CORS is properly configured in backend
- Check if frontend URL matches CORS settings

### Authentication Errors
- Verify JWT_SECRET is set in backend .env
- Check token expiration
- Ensure token is sent in Authorization header

### Database Errors
- Verify DATABASE_URL is correct
- Check database connection
- Ensure Prisma schema is synced

## Production Setup

For production deployment:

1. **Update Base URL**: Replace `localhost:3000` with your production domain
2. **Use HTTPS**: Always use `https://` in production
3. **Set Environment Variables**: Configure proper JWT_SECRET and DATABASE_URL
4. **Enable Security Headers**: Configure CORS and security headers properly
5. **Monitor Logs**: Set up logging and monitoring

## Support

For issues or questions:
- Check backend logs for detailed error messages
- Verify database connection
- Ensure all environment variables are set
- Check API endpoint documentation

## Example Complete Request (Postman Collection)

```json
{
  "info": {
    "name": "Admin Registration",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register Admin",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Admin User\",\n  \"email\": \"admin@toolur.com\",\n  \"password\": \"AdminPassword123!\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/admin/register",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "admin", "register"]
        }
      }
    }
  ]
}
```

Save this as a Postman collection for easy reuse.

