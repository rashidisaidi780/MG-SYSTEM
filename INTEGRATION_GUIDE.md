# Frontend-Backend Integration Guide

## Overview
This document describes the complete integration between the React frontend (Dashboard) and Laravel backend (MG Backend).

## Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Laravel 11 with Sanctum (JWT authentication)
- **Communication**: RESTful API with JSON
- **Authentication**: Bearer Token (JWT)

## Getting Started

### 1. Backend Setup

Navigate to the `mg_backend` directory:

```bash
cd mg_backend
```

Install dependencies:
```bash
composer install
```

Configure environment:
```bash
# The .env file is already configured with SQLite database
# If you need to use a different database, update DB_* variables in .env
```

Run migrations:
```bash
php artisan migrate
```

(Optional) Seed sample data:
```bash
php artisan db:seed
```

Start the server:
```bash
php artisan serve --port=8000
```

The backend will be available at `http://localhost:8000`

### 2. Frontend Setup

Navigate to the `dashboard` directory:

```bash
cd dashboard
```

Install dependencies:
```bash
npm install
```

The `.env` file is already configured with:
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000
VITE_DEBUG_API=false
```

Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the next available port)

## API Authentication

### Flow

1. **User Login**
   - User enters credentials on SignInPage
   - Frontend calls `POST /auth/login` with username and password
   - Backend validates credentials and returns JWT token
   - Frontend stores token in localStorage with user data
   - Token is automatically attached to all subsequent requests

2. **Authenticated Requests**
   - All protected endpoints require `Authorization: Bearer <token>` header
   - The API client (`src/services/api.ts`) automatically attaches token to headers
   - If request returns 401, token is cleared and user is redirected to login

3. **Token Refresh**
   - Call `POST /auth/refresh` to get a new token
   - Old token is revoked and replaced with new one

### API Endpoints

#### Authentication (Public)

**POST** `/auth/login`
```json
{
  "username": "john.doe",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "username": "john.doe",
    "email": "john@example.com",
    "role": "Admin"
  },
  "token": "eyJhbGc..."
}
```

#### Authentication (Protected)

**GET** `/auth/me` - Get current user info

**POST** `/auth/logout` - Logout and revoke token

**POST** `/auth/refresh` - Refresh token

#### Resources (Protected)

All resource endpoints follow RESTful conventions:

- `GET /users` - List all users
- `GET /users/{id}` - Get single user
- `POST /users` - Create user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

Same pattern for:
- `/projects`
- `/clients`
- `/departments`
- `/workers`
- `/invoices`
- `/officeorders`
- `/admins`

## Frontend Services

### AuthService (`src/services/auth.ts`)

Handles authentication operations:

```typescript
import { authService } from '@/services';

// Login
const response = await authService.login({ username, password });

// Logout
await authService.logout();

// Get current user
const user = await authService.getCurrentUser();

// Check if authenticated
const isAuth = authService.isAuthenticated();

// Get stored user from localStorage
const storedUser = authService.getStoredUser();

// Refresh token
const newToken = await authService.refreshToken();
```

### UsersService (`src/services/users.ts`)

```typescript
import { usersService } from '@/services';

// Get all users
const users = await usersService.getAll({ page: 1, limit: 20 });

// Get single user
const user = await usersService.getById('user-123');

// Create user
const newUser = await usersService.create({
  username: 'john.doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'Employee',
  department: 'Engineering'
});

// Update user
await usersService.update('user-123', { role: 'Manager' });

// Delete user
await usersService.delete('user-123');
```

### ProjectsService (`src/services/projects.ts`)

```typescript
import { projectsService } from '@/services';

// Get all projects
const projects = await projectsService.getAll({
  search: 'Website',
  status: 'Active',
  page: 1
});

// Get single project
const project = await projectsService.getById('proj-123');

// Create project
const newProject = await projectsService.create({
  name: 'Website Redesign',
  description: 'Redesign company website',
  client: 'client-123',
  startDate: '2024-01-01',
  endDate: '2024-03-01',
  budget: 50000
});

// Update project
await projectsService.update('proj-123', { status: 'Completed' });

// Delete project
await projectsService.delete('proj-123');
```

### ClientsService (`src/services/clients.ts`)

Similar pattern to other services:

```typescript
import { clientsService } from '@/services';

const clients = await clientsService.getAll();
const client = await clientsService.getById('client-123');
await clientsService.create({ name: '...', /* ... */ });
await clientsService.update('client-123', { /* ... */ });
await clientsService.delete('client-123');
```

### InvoicesService (`src/services/invoices.ts`)

Additional methods for invoice-specific operations:

```typescript
import { invoicesService } from '@/services';

// Standard CRUD
const invoices = await invoicesService.getAll();

// Invoice-specific operations
await invoicesService.updatePaymentStatus('inv-123', 'Paid');
await invoicesService.updatePaymentAmount('inv-123', 1000);
const invoiceNumber = await invoicesService.generateInvoiceNumber();
await invoicesService.exportToPdf('inv-123');
```

## Error Handling

### API Error Structure

```typescript
interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}
```

### Service Error Handling

Services throw `ApiError` on failure:

```typescript
try {
  const user = await usersService.getById('invalid-id');
} catch (error) {
  if (error instanceof ApiError) {
    console.log(`Error ${error.status}: ${error.message}`);
  }
}
```

### Authentication Errors

When a request returns 401 (Unauthorized):
- Token is automatically cleared from localStorage
- User should be redirected to login page
- Implement a 401 interceptor in your app component

## CORS Configuration

The backend is configured to allow requests from all origins:

```php
// config/cors.php
'allowed_origins' => ['*'],
'allowed_methods' => ['*'],
```

For production, update this to only allow your frontend domain:

```php
'allowed_origins' => ['https://yourdomain.com'],
```

## Testing the Integration

### 1. Start Backend
```bash
cd mg_backend
php artisan serve --port=8000
```

### 2. Start Frontend
```bash
cd dashboard
npm run dev
```

### 3. Test Login
- Open http://localhost:5173
- Try signing in with test credentials
- Check Network tab in browser DevTools to verify API calls

### 4. Create Test User (if needed)

Using Laravel Tinker:
```bash
cd mg_backend
php artisan tinker

# Create test user
User::create([
    'user_id' => 'user-test-001',
    'user_name' => 'test.user',
    'user_email' => 'test@example.com',
    'user_password' => Hash::make('password123'),
    'user_role' => 'Admin',
])
```

Then login with: `test.user` / `password123`

## Troubleshooting

### "Cannot POST /api/auth/login"
- Ensure Laravel backend is running on port 8000
- Check VITE_API_BASE_URL in frontend .env file

### "CORS error" or "No 'Access-Control-Allow-Origin' header"
- Make sure Laravel backend is accessible from frontend
- Check backend CORS configuration in `config/cors.php`

### "Invalid token" or "Unauthenticated"
- Ensure token is stored correctly in localStorage
- Check that Authorization header is being sent
- Open browser DevTools > Network tab to inspect request headers

### "Cannot find module '@/services'"
- Verify path alias in `vite.config.ts` is configured correctly
- Run `npm install` to ensure all dependencies are installed

## Development Guidelines

### Adding New API Endpoints

1. **Create Backend Controller Method**
   ```php
   public function customMethod(Request $request) {
       // Handle request
       return response()->json(['data' => $result]);
   }
   ```

2. **Add Route**
   ```php
   Route::post('/resource/custom', [ResourceController::class, 'customMethod']);
   ```

3. **Create Frontend Service Method**
   ```typescript
   async customMethod(data: any) {
       return apiClient.post('/resource/custom', data);
   }
   ```

4. **Use in Component**
   ```typescript
   const result = await resourceService.customMethod(data);
   ```

### Response Format Convention

All API responses should follow this format:

```json
{
  "success": true,
  "message": "Optional message",
  "data": { /* actual data */ }
}
```

On error:
```json
{
  "success": false,
  "message": "Error description",
  "errors": { /* validation errors if any */ }
}
```

## Production Deployment

### Frontend Build
```bash
cd dashboard
npm run build
# Output in dist/ folder
```

### Backend Deployment
```bash
cd mg_backend
composer install --no-dev
php artisan config:cache
php artisan route:cache
php artisan migrate --force
```

Set environment variables:
- `APP_ENV=production`
- `APP_DEBUG=false`
- `VITE_API_BASE_URL=https://api.yourdomain.com`

## Security Notes

1. **HTTPS Only in Production** - Always use HTTPS for production
2. **Token Storage** - Currently stored in localStorage; consider using httpOnly cookies for better security
3. **CORS** - Restrict allowed origins to your domain
4. **Sensitive Data** - Never log tokens or user passwords
5. **Token Expiry** - Implement token expiry and refresh logic

## Support & Documentation

- Laravel Documentation: https://laravel.com/docs
- React Documentation: https://react.dev
- Vite Documentation: https://vitejs.dev
- Laravel Sanctum: https://laravel.com/docs/sanctum
