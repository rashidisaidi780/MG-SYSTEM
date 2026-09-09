# Quick Start Guide - Backend

## Prerequisites
- PHP 8.2+ 
- Composer
- SQLite (or MySQL/PostgreSQL if configured)

## Setup

1. **Navigate to mg_backend folder:**
   ```bash
   cd mg_backend
   ```

2. **Install dependencies:**
   ```bash
   composer install
   ```

3. **Environment configuration:**
   - The `.env` file is already set up
   - Database is configured for SQLite (see DB_CONNECTION in .env)
   - To use a different database, update DB_* variables

4. **Generate application key (if needed):**
   ```bash
   php artisan key:generate
   ```

5. **Run database migrations:**
   ```bash
   php artisan migrate
   ```

6. **Start development server:**
   ```bash
   php artisan serve --port=8000
   ```

   Backend will be available at `http://localhost:8000`

## API Endpoints

All API endpoints are prefixed with `/api`

### Public Endpoints
- `POST /api/auth/login` - Login with username/password

### Protected Endpoints (require Bearer token)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Resource Endpoints (CRUD operations)
- `/api/users`
- `/api/projects`
- `/api/clients`
- `/api/departments`
- `/api/workers`
- `/api/invoices`
- `/api/officeorders`
- `/api/admins`

## Database Setup

### Migrations
```bash
# Run all pending migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Rollback all migrations
php artisan migrate:reset

# Reset and re-run
php artisan migrate:refresh
```

### Seeding (Sample Data)
```bash
# Run seeders
php artisan db:seed

# Seed specific seeder
php artisan db:seed --class=UserSeeder
```

## Creating Test Users

Use Laravel Tinker to create test users:

```bash
php artisan tinker
```

Then run:
```php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

User::create([
    'user_id' => 'user-001',
    'user_name' => 'john.doe',
    'user_email' => 'john@example.com',
    'user_password' => Hash::make('password123'),
    'user_role' => 'Admin',
    'user_status' => 'Active',
]);

User::create([
    'user_id' => 'user-002',
    'user_name' => 'jane.smith',
    'user_email' => 'jane@example.com',
    'user_password' => Hash::make('password123'),
    'user_role' => 'Employee',
    'user_status' => 'Active',
]);

exit;
```

Test login with:
- Username: `john.doe`
- Password: `password123`

## File Structure

```
mg_backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/    # API Controllers
│   │   │   ├── AuthController.php
│   │   │   ├── UserController.php
│   │   │   ├── ProjectController.php
│   │   │   └── ...
│   │   └── Middleware/     # Authentication/Authorization
│   └── Models/             # Database Models
│       ├── User.php
│       ├── Project.php
│       ├── Client.php
│       └── ...
├── routes/
│   └── api.php            # API Routes
├── database/
│   ├── migrations/        # Database migrations
│   └── seeders/          # Database seeders
├── config/
│   ├── cors.php          # CORS configuration
│   ├── auth.php          # Authentication config
│   └── ...
├── .env                  # Environment variables
├── artisan              # Artisan CLI
└── composer.json        # Dependencies
```

## Common Commands

```bash
# List all routes
php artisan route:list

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Run tests
php artisan test

# Check code quality
php artisan pint  # Laravel Pint code formatter

# View logs
tail -f storage/logs/laravel.log
```

## Configuration

### CORS
- File: `config/cors.php`
- Currently allows all origins (`['*']`)
- For production, update to specific domain

### Database
- File: `.env` (DB_* variables)
- Default: SQLite (file-based)
- To use MySQL/PostgreSQL, update DB_* settings

### Authentication
- Using Laravel Sanctum for API tokens
- Tokens are stored in `personal_access_tokens` table
- Token prefix: `auth-token`

## Troubleshooting

### "SQLSTATE[HY000]: General error: 1 no such table"
- Run `php artisan migrate`
- Check `database/database.sqlite` exists

### "Cannot connect from frontend"
- Ensure backend runs on port 8000: `php artisan serve --port=8000`
- Check CORS configuration in `config/cors.php`
- Verify frontend API URL matches: `http://localhost:8000/api`

### "Unauthenticated" on protected routes
- Check token is being sent in Authorization header
- Verify token hasn't expired
- Use `POST /api/auth/refresh` to get new token

### "Laravel Application has encountered an error"
- Check `storage/logs/laravel.log` for details
- Ensure `.env` file is properly configured
- Run `php artisan config:cache`

## Next Steps

- See `INTEGRATION_GUIDE.md` for detailed API documentation
- Check API_ENDPOINTS.md in dashboard folder for endpoint specs
- Review API_ARCHITECTURE.md in dashboard folder for frontend service layer

## Production Deployment

```bash
# Install production dependencies
composer install --no-dev

# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Run migrations
php artisan migrate --force

# Set permissions (Linux/Mac)
chmod -R 775 storage bootstrap/cache
```

Set environment variables for production:
- `APP_ENV=production`
- `APP_DEBUG=false`
- Update `APP_URL` and CORS origins
