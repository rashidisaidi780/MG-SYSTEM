# Admin & User Setup Guide

## Overview

The system now has a two-tier login system:
1. **Admin Login** - Only the seeded admin can login
2. **User Login** - Users created by the admin can login

## Admin Setup

### Initial Admin (Seeded)

The admin is created through the seeder with these credentials:

```
Username: rashidadmin
Email: admin@makezy.co.tz
Password: rashidmakezy2026@
```

### Database Setup

1. **Navigate to backend:**
   ```bash
   cd mg_backend
   ```

2. **Install dependencies:**
   ```bash
   composer install
   ```

3. **Run migrations:**
   ```bash
   php artisan migrate
   ```

4. **Run seeders to create admin:**
   ```bash
   php artisan db:seed
   # Or specific seeder:
   php artisan db:seed --class=AdminSeeder
   ```

5. **Start backend server:**
   ```bash
   php artisan serve --port=8000
   ```

## Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Navigate to http://localhost:5173

## Login Flow

### Admin Login

1. On the login page, click **"Admin Sign In"** button
2. Enter admin credentials:
   - Username: `rashidadmin`
   - Password: `rashidmakezy2026@`
3. Click **Continue**
4. You'll see the **Admin Dashboard** with User Management

### User Login

1. On the login page, use the regular user login
2. Enter credentials created by admin
3. Click **Continue**
4. You'll see the **Regular Dashboard**

## Admin Operations

### Creating Users

1. Login as admin
2. You'll see the **User Management** page
3. Click **"Create New User"** button
4. Fill in the form:
   - **User ID** - Unique identifier (e.g., user-001)
   - **Username** - Login username (e.g., john.doe)
   - **Email** - User email (e.g., john@example.com)
   - **Password** - At least 6 characters
   - **Role** - Select from: Guest, Employee, Manager, Admin
   - **Status** - Active (new users default to Active)
5. Click **Create User**
6. User will appear in the users list

### Managing Users

- **View Users** - All created users appear in the table
- **Delete User** - Click the trash icon to delete a user
- **User Details** - Table shows: User ID, Username, Email, Role, Status, Created Date

## Created Users Can Login

Once a user is created by admin:

1. Go to login page
2. Use the **User Login** (default)
3. Enter the credentials created by admin:
   - Username or Email created
   - Password created by admin
4. Click Continue
5. User will have access to the dashboard and other features

## API Endpoints

### Admin Endpoints

All require Bearer token from admin login.

**Create User:**
```bash
POST http://localhost:8000/api/admin/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "user_id": "user-001",
  "user_name": "john.doe",
  "user_email": "john@example.com",
  "user_password": "password123",
  "user_role": "Employee",
  "user_status": "Active"
}
```

**List Users:**
```bash
GET http://localhost:8000/api/admin/users?page=1&per_page=20
Authorization: Bearer <admin-token>
```

**Delete User:**
```bash
DELETE http://localhost:8000/api/admin/users/<user-id>
Authorization: Bearer <admin-token>
```

**Get Admin Info:**
```bash
GET http://localhost:8000/api/admin/me
Authorization: Bearer <admin-token>
```

**Admin Logout:**
```bash
POST http://localhost:8000/api/admin/logout
Authorization: Bearer <admin-token>
```

### User Endpoints

Users created by admin use:

**User Login:**
```bash
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "username": "john.doe",
  "password": "password123"
}
```

**User cannot create other users** - Only admin can create users.

## Testing the System

### Test Scenario 1: Admin Creates and Manages Users

1. Login as admin with provided credentials
2. Click "Create New User"
3. Fill in:
   - User ID: `user-test-001`
   - Username: `test.user`
   - Email: `test@example.com`
   - Password: `testpass123`
   - Role: `Employee`
4. Click "Create User"
5. User appears in table

### Test Scenario 2: Created User Logins

1. Logout from admin
2. On login page, use **User Sign In** (default)
3. Enter:
   - Username: `test.user`
   - Password: `testpass123`
4. Click Continue
5. User dashboard loads (not admin dashboard)

### Test Scenario 3: Delete User

1. Login as admin
2. Find user in table
3. Click trash icon
4. Confirm deletion
5. User removed from table

## File Structure

### Backend
- `app/Models/Admin.php` - Admin model with API tokens
- `app/Models/User.php` - User model with API tokens
- `app/Http/Controllers/AdminAuthController.php` - Admin login and user management
- `app/Http/Controllers/AuthController.php` - User login
- `routes/api.php` - API routes for admin and user
- `database/seeders/AdminSeeder.php` - Seeds initial admin

### Frontend
- `src/pages/AdminSignInPage.tsx` - Admin login page
- `src/pages/SignInPage.tsx` - User login page
- `src/pages/AdminDashboardPage.tsx` - Admin user management
- `src/services/admin.ts` - Admin API service
- `src/App.tsx` - Routes between admin and user flows

## Database Schema

### Admins Table
```sql
- id (Primary Key)
- full_name
- username (Unique)
- email (Unique)
- password
- timestamps
```

### Users Table
```sql
- id (Primary Key)
- user_id (Unique)
- user_name
- user_email (Unique)
- user_password
- department_id (Foreign Key)
- user_role (Admin, Manager, Employee, Guest)
- user_status (Active, Inactive, Suspended)
- remember_token
- timestamps
```

## Security Notes

1. **Admin Credentials** - Keep safe, only one admin initially
2. **Password Hashing** - All passwords hashed with bcrypt
3. **Token-Based Auth** - JWT tokens via Laravel Sanctum
4. **User Status** - Only Active users can login
5. **Admin Only** - User creation restricted to authenticated admins

## Troubleshooting

### "Cannot create user" error
- Check if you're logged in as admin
- Verify all form fields are filled
- Check password is at least 6 characters
- Ensure user_id and user_email are unique

### "Login fails for created user"
- Verify username/email is correct
- Check user status is "Active"
- Ensure password is correct
- Check database has the user (check admins table if admin)

### "Admin login fails"
- Verify you're on Admin Sign In page
- Check credentials: `rashidadmin` / `rashidmakezy2026@`
- Ensure migrations ran with `php artisan migrate`
- Ensure seeders ran with `php artisan db:seed`

### "CORS or connection error"
- Verify backend running on port 8000
- Check frontend API URL in `.env`
- Ensure both backend and frontend are running

## Next Steps

1. ✅ Backend is ready - admin and user login working
2. ✅ Frontend is ready - admin can create users
3. Next: Connect other pages to API services
4. Next: Implement additional user management features
5. Next: Deploy to production

## Support

- See `INTEGRATION_GUIDE.md` for full API documentation
- See backend `QUICKSTART.md` for backend commands
- See frontend `QUICKSTART.md` for frontend commands
