# API Architecture Documentation

## Overview

This document describes the frontend API service layer that separates frontend UI logic from backend API communication. The architecture follows these principles:

- **Separation of Concerns**: Frontend handles UI/UX, Backend handles data persistence and business logic
- **Stateless API**: All state changes go through API calls
- **Consistent Error Handling**: Centralized error management
- **Token-based Authentication**: JWT tokens stored in localStorage
- **Scalable Services**: Each domain has its own service module

## Directory Structure

```
src/services/
├── index.ts              # Central export point for all services
├── api.ts                # Base API client with HTTP methods
├── auth.ts               # Authentication service (login, logout, refresh)
├── invoices.ts           # Invoice CRUD operations
├── clients.ts            # Client management
├── projects.ts           # Project management
├── users.ts              # User account management
├── departments.ts        # Department management
├── workers.ts            # Worker/staff management
├── bookings.ts           # Service bookings and appointments
├── officeOrders.ts       # Internal office purchase orders
├── events.ts             # System events and audit trail
└── notifications.ts      # User notifications and alerts
```

## Base API Client (api.ts)

The `ApiClient` class handles:
- HTTP methods: GET, POST, PUT, PATCH, DELETE
- Authentication headers with Bearer token
- Request timeout handling (default: 30s)
- Response error handling
- Token refresh logic (401 responses)

### Configuration

```typescript
// Via environment variable in .env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
```

### Usage

```typescript
import { apiClient } from '@/services/api';

// Direct API calls (rarely needed, use service classes instead)
const data = await apiClient.get<DataType>('/endpoint');
await apiClient.post<DataType>('/endpoint', { data });
```

## Services Overview

### 1. Authentication Service (auth.ts)

Handles user login, logout, and session management.

**Key Methods:**
- `login(credentials)` - Sign in with username/password
- `logout()` - Clear session
- `getCurrentUser()` - Fetch current user profile
- `refreshToken()` - Refresh expired token
- `isAuthenticated()` - Check if user is logged in
- `getStoredUser()` - Get cached user data

**Usage:**
```typescript
import { authService } from '@/services';

const response = await authService.login({ username, password });
// Token automatically stored and set
```

### 2. Invoices Service (invoices.ts)

Complete invoice lifecycle management.

**Operations:**
- List invoices (with search, status filter, pagination)
- View invoice details
- Create new invoice
- Update invoice
- Delete invoice
- Update payment status
- Update payment amount
- Generate invoice number
- Export to PDF

**Data Relationships:**
- Invoice → Client (by name)
- Invoice → Line Items (nested)
- Invoice → Payment History

**Usage:**
```typescript
import { invoicesService } from '@/services';

const invoices = await invoicesService.getAll({ 
  search: 'client name',
  status: 'Pending',
  page: 1,
  limit: 20
});

const invoice = await invoicesService.create({
  client: 'Acme Corp',
  items: [...],
  date: '2026-09-08',
  due: '2026-09-22'
});
```

### 3. Clients Service (clients.ts)

Client directory and relationship management.

**Operations:**
- List clients (search, pagination)
- Get client details
- Create client
- Update client
- Delete client

**Data:**
- Basic info: name, email, phone, company
- Billing info: TIN, address, country

**Usage:**
```typescript
import { clientsService } from '@/services';

const clients = await clientsService.getAll({ search: 'name' });
await clientsService.create({
  name: 'Client Name',
  email: 'client@example.com',
  // ...
});
```

### 4. Projects Service (projects.ts)

Project portfolio and team management.

**Operations:**
- List projects (status filter)
- View project details
- Create project
- Update project
- Delete project
- Update project status
- Track budget vs spending

**Status Values:** Active, Completed, On Hold, Canceled

**Usage:**
```typescript
import { projectsService } from '@/services';

const projects = await projectsService.getAll({ status: 'Active' });
await projectsService.updateStatus(projectId, 'Completed');
```

### 5. Users Service (users.ts)

System user account management.

**Operations:**
- List users (role, status filters)
- View user profile
- Create user
- Update user
- Delete user
- Change password
- Reset password
- Manage roles: Admin, Manager, Employee, Guest

**Usage:**
```typescript
import { usersService } from '@/services';

const users = await usersService.getAll({ role: 'Admin' });
await usersService.create({
  username: 'john.doe',
  email: 'john@example.com',
  role: 'Employee',
  department: 'Sales'
});
```

### 6. Departments Service (departments.ts)

Department and team structure management.

**Operations:**
- List departments
- View department
- Create department
- Update department
- Delete department
- Get department members
- Track head count and budget

**Usage:**
```typescript
import { departmentsService } from '@/services';

const departments = await departmentsService.getAll();
const members = await departmentsService.getMembers(departmentId);
```

### 7. Workers Service (workers.ts)

Staff and personnel management.

**Operations:**
- List workers (department, status filters)
- View worker profile
- Create worker record
- Update worker info
- Delete worker
- Update employment status

**Status Values:** Active, On Leave, Inactive

**Usage:**
```typescript
import { workersService } from '@/services';

const workers = await workersService.getAll({ 
  department: 'Engineering',
  status: 'Active'
});
```

### 8. Bookings Service (bookings.ts)

Service bookings and appointment scheduling.

**Operations:**
- List bookings (status, date filters)
- View booking details
- Create booking
- Update booking
- Cancel booking
- Update booking status

**Status Values:** Confirmed, Pending, Canceled, Completed

**Usage:**
```typescript
import { bookingsService } from '@/services';

const bookings = await bookingsService.getAll({ 
  status: 'Confirmed',
  date: '2026-09-08'
});
```

### 9. Office Orders Service (officeOrders.ts)

Internal purchase order management.

**Operations:**
- List orders (status, department filters)
- View order details
- Create order
- Update order
- Delete order
- Approve order
- Reject order
- Track order status

**Status Values:** Pending, Approved, Ordered, Received, Rejected

**Usage:**
```typescript
import { officeOrdersService } from '@/services';

const orders = await officeOrdersService.getAll({ 
  status: 'Pending'
});
await officeOrdersService.approve(orderId);
```

### 10. Events Service (events.ts)

System event logging and audit trail.

**Operations:**
- List events (type, entity filters)
- View event details
- Get recent events
- Mark events as read

**Event Types:** create, update, delete, status_change, login, logout, other

**Usage:**
```typescript
import { eventsService } from '@/services';

const recentEvents = await eventsService.getRecentEvents(20);
```

### 11. Notifications Service (notifications.ts)

User notifications and alerts.

**Operations:**
- List notifications (read status filter)
- View notification
- Create notification
- Mark as read
- Mark all as read
- Delete notification
- Get unread count
- Subscribe to real-time updates

**Notification Types:** info, warning, error, success

**Usage:**
```typescript
import { notificationsService } from '@/services';

const unreadCount = await notificationsService.getUnreadCount();
await notificationsService.markAsRead(notificationId);
```

## Frontend Features (No API Required)

These features are handled entirely in the frontend and do NOT require backend API calls:

1. **UI State Management**
   - Modal open/close state
   - Form field values
   - Dropdown selections
   - Tab navigation
   - Search input (but search execution is on backend)

2. **Presentation Logic**
   - Date formatting
   - Currency formatting
   - Status color/styling
   - Table sorting (client-side only)
   - Pagination UI state

3. **Validation**
   - Form field validation (before submitting)
   - Required field checks
   - Format validation (email, phone, etc.)
   - Custom business rules

4. **Animations & Transitions**
   - Page fade-in animations
   - Modal animations
   - Toast notifications (local state)
   - Loading spinners

5. **Local Storage**
   - Form field persistence (temporary, before save)
   - User preferences
   - UI state (sidebar collapsed, theme)

## Backend Operations (Requires API)

These operations MUST go through the API service layer:

1. **Data Persistence**
   - Create/Read/Update/Delete any entity
   - All database operations
   - File uploads/downloads

2. **Business Logic**
   - Invoice calculations (subtotals, taxes, totals)
   - Payment processing
   - Status transitions with validation
   - Workflow approvals

3. **Authentication**
   - Login/logout
   - Permission checking
   - Token refresh

4. **Data Relationships**
   - Linking entities (Invoice → Client)
   - Cascading deletes
   - Cross-entity queries

5. **Search & Filtering**
   - Full-text search (server-side indexed)
   - Advanced filtering
   - Sorting on large datasets

6. **Audit Trail**
   - Who changed what and when
   - Change history
   - Event logging

7. **Real-time Features**
   - Notifications
   - System events
   - Collaborative updates

## Error Handling

All services throw `ApiError` objects with:
- `status`: HTTP status code
- `message`: Error message
- `details`: Additional error information

```typescript
try {
  const data = await invoicesService.getById(id);
} catch (error) {
  const apiError = error as ApiError;
  console.error(`${apiError.status}: ${apiError.message}`);
  
  if (apiError.status === 401) {
    // Redirect to login
  } else if (apiError.status === 404) {
    // Show "not found" message
  }
}
```

## Environment Configuration

Create `.env` file in project root:

```env
# Required
VITE_API_BASE_URL=http://localhost:3000/api

# Optional
VITE_API_TIMEOUT=30000
VITE_ENVIRONMENT=development
VITE_DEBUG_API=false
```

## Integration Example

### Before (Frontend-only):
```typescript
// Old: Data stored in localStorage
const [invoices, setInvoices] = usePersistentState('invoices', []);

const saveInvoice = () => {
  setInvoices([...invoices, newInvoice]); // Direct localStorage update
};
```

### After (With Backend API):
```typescript
// New: Data from backend
const [invoices, setInvoices] = useState<Invoice[]>([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  loadInvoices();
}, []);

const loadInvoices = async () => {
  try {
    setLoading(true);
    const data = await invoicesService.getAll();
    setInvoices(data);
  } catch (error) {
    showToast('Failed to load invoices', 'error');
  } finally {
    setLoading(false);
  }
};

const saveInvoice = async () => {
  try {
    const saved = await invoicesService.create(newInvoice);
    setInvoices([saved, ...invoices]);
    showToast('Invoice created', 'success');
  } catch (error) {
    showToast('Failed to create invoice', 'error');
  }
};
```

## Next Steps

1. **Backend Development**: Implement REST API endpoints matching these services
2. **Database Schema**: Create database tables for all entities
3. **Authentication**: Implement JWT token generation and validation
4. **Page Refactoring**: Update each page component to use services instead of `usePersistentState`
5. **Error Handling**: Add proper error boundaries and user feedback
6. **Testing**: Write tests for service methods and API responses

## API Endpoint Specification

See `API_ENDPOINTS.md` for complete list of all endpoint paths, methods, request/response formats, and authentication requirements.
