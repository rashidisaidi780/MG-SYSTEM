# API Endpoints Specification

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints (except login) require `Authorization: Bearer <token>` header.

---

## Authentication Endpoints

### POST /auth/login
Login user and receive JWT token.

**Request:**
```json
{
  "username": "john.doe",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user-123",
    "username": "john.doe",
    "email": "john@example.com",
    "role": "Admin",
    "token": "eyJhbGc..."
  },
  "token": "eyJhbGc..."
}
```

**Errors:**
- 401: Invalid credentials
- 400: Missing fields

---

### POST /auth/logout
Logout and invalidate token.

**Response (200):**
```json
{ "success": true }
```

---

### GET /auth/me
Get current authenticated user.

**Response (200):**
```json
{
  "id": "user-123",
  "username": "john.doe",
  "email": "john@example.com",
  "role": "Admin"
}
```

**Errors:**
- 401: Not authenticated

---

### POST /auth/refresh
Refresh expired token.

**Response (200):**
```json
{
  "token": "eyJhbGc..."
}
```

---

## Invoice Endpoints

### GET /invoices
List all invoices with optional filters.

**Query Parameters:**
- `search`: Search in client name or invoice ID
- `status`: Filter by status (Paid, Pending, Overdue, Canceled)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response (200):**
```json
[
  {
    "id": "INV-2026-09-001",
    "client": "Acme Corp",
    "company": "Acme Company",
    "tin": "TIN-123456",
    "email": "contact@acme.com",
    "phone": "+1 555-0100",
    "address": "123 Main St",
    "country": "USA",
    "amount": "Tsh 10,000",
    "paidAmount": 5000,
    "date": "Sep 08, 2026",
    "due": "Sep 22, 2026",
    "issuedRaw": "2026-09-08",
    "dueRaw": "2026-09-22",
    "status": "Pending",
    "items": [
      {
        "desc": "Design services",
        "quantity": 1,
        "amount": 10000
      }
    ],
    "notes": "Initial design phase",
    "createdAt": "2026-09-08T10:30:00Z",
    "updatedAt": "2026-09-08T10:30:00Z"
  }
]
```

---

### GET /invoices/:id
Get invoice details.

**Response (200):**
```json
{ /* Invoice object as above */ }
```

**Errors:**
- 404: Invoice not found

---

### POST /invoices
Create new invoice.

**Request:**
```json
{
  "client": "Acme Corp",
  "company": "Acme Company",
  "tin": "TIN-123456",
  "email": "contact@acme.com",
  "phone": "+1 555-0100",
  "address": "123 Main St",
  "country": "USA",
  "items": [
    {
      "desc": "Design services",
      "quantity": 1,
      "amount": 10000
    }
  ],
  "date": "2026-09-08",
  "due": "2026-09-22",
  "notes": "Initial design phase"
}
```

**Response (201):**
```json
{ /* Created invoice object */ }
```

---

### PUT /invoices/:id
Update invoice.

**Request:**
```json
{
  "client": "Acme Corp",
  "status": "Pending",
  "items": [...],
  "notes": "Updated notes"
}
```

**Response (200):**
```json
{ /* Updated invoice object */ }
```

---

### PATCH /invoices/:id
Partial update (for status, payment only).

**Request:**
```json
{
  "status": "Paid",
  "paidAmount": 10000
}
```

**Response (200):**
```json
{ /* Updated invoice object */ }
```

---

### DELETE /invoices/:id
Delete invoice.

**Response (204):** No content

---

### GET /invoices/generate/number
Generate next invoice number.

**Query Parameters:**
- `year`: Optional year (default: current year)
- `month`: Optional month (default: current month)

**Response (200):**
```json
{
  "invoiceNumber": "INV-2026-09-042"
}
```

---

### GET /invoices/:id/export/pdf
Export invoice as PDF.

**Response (200):** PDF file

---

## Client Endpoints

### GET /clients
List all clients.

**Query Parameters:**
- `search`: Search by name, email, company
- `page`: Page number
- `limit`: Items per page

**Response (200):**
```json
[
  {
    "id": "client-123",
    "name": "Acme Corp",
    "email": "contact@acme.com",
    "phone": "+1 555-0100",
    "company": "Acme Company",
    "tin": "TIN-123456",
    "address": "123 Main St",
    "country": "USA",
    "createdAt": "2026-09-01T10:00:00Z",
    "updatedAt": "2026-09-08T10:00:00Z"
  }
]
```

---

### GET /clients/:id
### POST /clients
### PUT /clients/:id
### DELETE /clients/:id

Similar structure to invoices endpoints.

---

## Project Endpoints

### GET /projects
List all projects.

**Query Parameters:**
- `search`: Search by name
- `status`: Filter by status (Active, Completed, On Hold, Canceled)
- `page`: Page number
- `limit`: Items per page

**Response (200):**
```json
[
  {
    "id": "proj-123",
    "name": "Website Redesign",
    "description": "Complete website redesign project",
    "client": "client-123",
    "status": "Active",
    "startDate": "2026-09-01",
    "endDate": "2026-12-31",
    "budget": 50000,
    "spent": 15000,
    "team": ["user-1", "user-2", "user-3"],
    "createdAt": "2026-09-01T10:00:00Z",
    "updatedAt": "2026-09-08T10:00:00Z"
  }
]
```

### GET /projects/:id
### POST /projects
### PUT /projects/:id
### DELETE /projects/:id

Similar structure to invoices endpoints.

---

## User Endpoints

### GET /users
List all users.

**Query Parameters:**
- `search`: Search by username, email
- `role`: Filter by role (Admin, Manager, Employee, Guest)
- `status`: Filter by status (Active, Inactive, Suspended)
- `page`: Page number
- `limit`: Items per page

**Response (200):**
```json
[
  {
    "id": "user-123",
    "username": "john.doe",
    "email": "john@example.com",
    "role": "Admin",
    "department": "IT",
    "status": "Active",
    "lastLogin": "2026-09-08T15:30:00Z",
    "createdAt": "2026-01-01T10:00:00Z",
    "updatedAt": "2026-09-08T10:00:00Z"
  }
]
```

### GET /users/:id
### POST /users
### PUT /users/:id
### DELETE /users/:id

Similar structure to invoices endpoints.

---

### POST /users/:id/change-password
Change user password.

**Request:**
```json
{
  "oldPassword": "current_password",
  "newPassword": "new_password"
}
```

**Response (200):**
```json
{ "success": true }
```

---

### POST /users/:id/reset-password
Admin reset password.

**Response (200):**
```json
{
  "tempPassword": "TempPass123!"
}
```

---

## Department Endpoints

### GET /departments
### GET /departments/:id
### POST /departments
### PUT /departments/:id
### DELETE /departments/:id

Similar structure to invoices endpoints.

---

### GET /departments/:id/members
Get department members.

**Response (200):**
```json
[
  {
    "id": "user-123",
    "name": "John Doe"
  },
  {
    "id": "user-456",
    "name": "Jane Smith"
  }
]
```

---

## Worker Endpoints

### GET /workers
List all workers.

**Query Parameters:**
- `search`: Search by name, email
- `department`: Filter by department
- `status`: Filter by status (Active, On Leave, Inactive)
- `page`: Page number
- `limit`: Items per page

### GET /workers/:id
### POST /workers
### PUT /workers/:id
### DELETE /workers/:id

---

## Booking Endpoints

### GET /bookings
List all bookings.

**Query Parameters:**
- `search`: Search by client, service
- `status`: Filter by status
- `date`: Filter by date
- `page`: Page number
- `limit`: Items per page

### GET /bookings/:id
### POST /bookings
### PUT /bookings/:id
### DELETE /bookings/:id

---

## Office Order Endpoints

### GET /office-orders
List all office orders.

**Query Parameters:**
- `search`: Search by item
- `status`: Filter by status
- `department`: Filter by department
- `page`: Page number
- `limit`: Items per page

### GET /office-orders/:id
### POST /office-orders
### PUT /office-orders/:id
### DELETE /office-orders/:id

---

### PATCH /office-orders/:id/approve
Approve office order.

**Response (200):**
```json
{ /* Order with status: "Approved" */ }
```

---

### PATCH /office-orders/:id/reject
Reject office order.

**Response (200):**
```json
{ /* Order with status: "Rejected" */ }
```

---

## Event Endpoints

### GET /events
List system events.

**Query Parameters:**
- `search`: Search by action
- `type`: Filter by type (create, update, delete, status_change, login, logout)
- `entity`: Filter by entity type
- `page`: Page number
- `limit`: Items per page

**Response (200):**
```json
[
  {
    "id": "event-123",
    "type": "create",
    "entity": "Invoice",
    "entityId": "INV-2026-09-001",
    "user": "user-123",
    "action": "Created invoice",
    "details": {
      "client": "Acme Corp",
      "amount": 10000
    },
    "timestamp": "2026-09-08T10:30:00Z",
    "isNew": true
  }
]
```

### GET /events/:id

---

### GET /events/recent
Get recent system events.

**Query Parameters:**
- `limit`: Number of events (default: 10)

**Response (200):**
```json
[ /* Array of recent events */ ]
```

---

### POST /events/mark-read
Mark events as read.

**Request:**
```json
{
  "ids": ["event-123", "event-456"]
}
```

**Response (200):**
```json
{ "success": true }
```

---

## Notification Endpoints

### GET /notifications
List notifications.

**Query Parameters:**
- `read`: Filter by read status (true/false)
- `type`: Filter by type (info, warning, error, success)
- `page`: Page number
- `limit`: Items per page

**Response (200):**
```json
[
  {
    "id": "notif-123",
    "title": "Invoice Created",
    "message": "Invoice INV-2026-09-001 was created",
    "type": "info",
    "read": false,
    "user": "user-123",
    "actionUrl": "/invoices/INV-2026-09-001",
    "relatedEntity": "Invoice",
    "timestamp": "2026-09-08T10:30:00Z"
  }
]
```

### GET /notifications/:id
### POST /notifications
### PATCH /notifications/:id (mark as read)
### DELETE /notifications/:id

---

### POST /notifications/mark-all-read
Mark all notifications as read.

**Response (200):**
```json
{ "success": true }
```

---

### GET /notifications/unread/count
Get count of unread notifications.

**Response (200):**
```json
{
  "count": 5
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "status": 400,
    "message": "Bad Request",
    "details": {
      "field": ["validation error message"]
    }
  }
}
```

### Common Status Codes
- 200: OK
- 201: Created
- 204: No Content
- 400: Bad Request (validation failed)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (authenticated but no permission)
- 404: Not Found
- 409: Conflict (e.g., duplicate entry)
- 500: Internal Server Error

---

## Pagination

Paginated endpoints accept:
- `page`: Page number (1-indexed, default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Sorting

Add `sort` query parameter:
```
GET /invoices?sort=-date,client
```

- Prefix with `-` for descending
- No prefix for ascending
- Multiple sorts with comma

---

## Rate Limiting

- Rate limit: 1000 requests per hour
- Rate limit headers:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

---

## Version

Current API Version: **v1**

All endpoints are under `/api` prefix. Future versions may use `/api/v2`, etc.
