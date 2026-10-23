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
   - SQLite remains available at `database/database.sqlite`.
   - To use Supabase, configure the `SUPABASE_DB_*` variables in `.env`, then set `DB_CONNECTION=supabase`.
   - Keep `.env` private; do not put database passwords in `.env.example` or commit them.

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
   The built-in PHP development server is single-threaded. The dashboard overview now loads in one API request, but use Apache/Nginx with PHP-FPM (or another multi-worker PHP server) for production and concurrent users.

## API Endpoints

All API endpoints are prefixed with `/api`

### Public Endpoints
- `POST /api/auth/login` - Login with username/password

### Dashboard
- `GET /api/dashboard/summary` - Return permitted dashboard totals and due dates in one request

### Protected Endpoints (require  Bearer token)
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

### Event video uploads

Users with edit access to **Event & Updates** can attach MP4, WebM, or MOV videos up to 30 MB. Uploaded videos are stored under `storage/app/events`, outside the public web root, and can be downloaded by authenticated users with event access.

Make sure PHP is configured with `upload_max_filesize` of at least `30M` and `post_max_size` of at least `32M`. The PHP upload directory and Laravel `storage` directory must also be writable by the web server.

Event posts can also include an optional HTTP or HTTPS link. It is shown to viewers as an **Open event link** action and opens in a new tab.

### Worker PDF documents

Users with edit access to **Workers** can upload up to 5 PDF documents at a time for a saved worker. Each PDF may be up to 20 MB, with a 30 MB combined limit per upload. New PDF contents and document records are saved in both Supabase and SQLite, and are served through authenticated, permission-checked routes. Base64 storage increases the PDF data size by about one third in each database. Configure PHP with `upload_max_filesize` of at least `20M` and `post_max_size` of at least `32M`.

Existing PDFs uploaded before database storage was enabled can be previewed and backfilled from private file storage with:

```bash
php artisan worker-documents:backfill-databases
php artisan worker-documents:backfill-databases --force
```

The first command is read-only; the second stores the existing PDF contents in both databases.

The PDF bytes are Base64-encoded in each database, increasing their storage size by about one third. Listing documents returns metadata only; PDF contents are sent only through the authenticated download endpoint.

## Configuration

### CORS
- File: `config/cors.php`
- Currently allows all origins (`['*']`)
- For production, update to specific domain

### Database
- File: `config/database.php`
- SQLite uses the local file configured by `DB_BASEPATH` (or `DB_DATABASE`). Relative paths are resolved from the backend project directory so the database remains available regardless of the server's working directory.
- Supabase is a separate PostgreSQL connection named `supabase`, configured with `SUPABASE_DB_*`.
- The application uses the connection named by `DB_CONNECTION`. Laravel commands can address a connection explicitly with `--database=sqlite` or `--database=supabase`.
- Worker create, update, and delete requests write to Supabase first, then mirror the same worker to SQLite by `worker_id`. If the SQLite mirror fails, the API reports that Supabase already changed; check `storage/logs/laravel.log` and reconcile before retrying. Department IDs are matched by the stable department code, not assumed to match between databases.
- To preview or insert existing Supabase workers missing from SQLite, run `php artisan workers:mirror-to-sqlite` and then `php artisan workers:mirror-to-sqlite --force`. The command inserts missing worker IDs only and never overwrites existing SQLite worker records.

### Move the existing SQLite data to Supabase

The SQLite file is not deleted or modified by these steps. Make a separate backup before beginning:

```powershell
Copy-Item .\database\database.sqlite "$env:USERPROFILE\Documents\database.sqlite.backup"
```

1. Set `SUPABASE_DB_HOST`, `SUPABASE_DB_PORT`, `SUPABASE_DB_DATABASE`, `SUPABASE_DB_USERNAME`, and `SUPABASE_DB_PASSWORD` in `.env`. Use the PostgreSQL connection details from the Supabase dashboard; keep `SUPABASE_DB_SSLMODE=require`.
2. Set `DB_CONNECTION=supabase` and clear cached configuration:

   ```bash
   php artisan config:clear
   ```

3. Verify the connection:

   ```bash
   php artisan db:show --database=supabase
   ```

   Do not continue if this command cannot connect.

4. Confirm the Supabase `public` schema does not contain application data that must be retained. Do not run migrations against a database with unknown existing data.
5. Create the application schema on Supabase:

   ```bash
   php artisan migrate --database=supabase
   ```

6. Preview the one-time copy. The command checks for matching tables, matching columns, and empty destination tables; it aborts rather than overwriting existing Supabase records:

   ```bash
   php artisan db:copy-sqlite-to-supabase --dry-run
   ```

7. If the preview is correct, confirm and run the copy:

   ```bash
   php artisan db:copy-sqlite-to-supabase --force
   ```

The copy preserves row IDs, inserts in foreign-key dependency order, and updates PostgreSQL ID sequences. The `migrations` bookkeeping table is not copied. This is a one-time SQLite-to-Supabase copy, not ongoing two-way synchronization. Keep the SQLite backup until you have verified the application and the copied data in Supabase.

To use SQLite again, change `DB_CONNECTION=sqlite` and clear cached configuration. The original SQLite file remains available.

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
