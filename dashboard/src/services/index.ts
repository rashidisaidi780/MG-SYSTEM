/**
 * Central export point for all API services.
 * Import services from here instead of individual files.
 */

export * from './api';
export { authService } from './auth';
export type { User as AuthUser, AuthCredentials, AuthResponse } from './auth';

export { adminService } from './admin';
export type { CreateUserRequest, UserResponse } from './admin';

export { invoicesService } from './invoices';
export * from './invoices';

export { clientsService } from './clients';
export * from './clients';

export { projectsService } from './projects';
export * from './projects';

export { usersService } from './users';
export * from './users';

export { departmentsService } from './departments';
export * from './departments';

export { workersService } from './workers';
export * from './workers';

export { bookingsService } from './bookings';
export * from './bookings';

export { officeOrdersService } from './officeOrders';
export * from './officeOrders';

export { eventsService } from './events';
export * from './events';

export { notificationsService } from './notifications';
export * from './notifications';
