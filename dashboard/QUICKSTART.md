# Quick Start Guide - Frontend

## Prerequisites
- Node.js 16+ installed
- npm or yarn

## Setup

1. **Navigate to dashboard folder:**
   ```bash
   cd dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment is already configured:**
   - The `.env` file is set up with:
   - `VITE_API_BASE_URL=http://localhost:8000/api`
   - `VITE_API_TIMEOUT=30000`

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   - Navigate to `http://localhost:5173`
   - Sign in with your credentials

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run typecheck` - Check TypeScript types

## Connecting to Backend

**Important:** Make sure the backend is running on `http://localhost:8000` before signing in.

The frontend will automatically:
1. Send login request to `POST /api/auth/login`
2. Store the JWT token in localStorage
3. Attach token to all subsequent API requests
4. Handle errors and token expiration

## File Structure

```
dashboard/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   │   ├── api.ts      # Base API client
│   │   ├── auth.ts     # Authentication
│   │   ├── users.ts    # User management
│   │   ├── projects.ts # Project management
│   │   └── ...         # Other services
│   ├── contexts/       # React contexts (notifications, etc.)
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── .env               # Environment variables
├── vite.config.ts     # Vite configuration
└── package.json       # Dependencies
```

## Troubleshooting

### "Cannot connect to API"
- Check that backend is running on http://localhost:8000
- Verify `VITE_API_BASE_URL` in `.env`

### "Login fails"
- Check browser console for error message
- Verify backend is properly set up and running
- Ensure user account exists in backend database

### "Module not found errors"
- Run `npm install` again
- Clear node_modules: `rm -rf node_modules && npm install`

## Next Steps

- See `INTEGRATION_GUIDE.md` for detailed API documentation
- Check `API_ARCHITECTURE.md` for service architecture
- Review `API_ENDPOINTS.md` for endpoint specifications
