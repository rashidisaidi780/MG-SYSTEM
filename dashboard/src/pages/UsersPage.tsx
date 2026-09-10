import { useState, useMemo, useEffect } from 'react';
import { Plus, Mail, Key, Edit3, Trash2, ShieldCheck, Building2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { notifySystem } from '@/utils/systemNotifications';
import { adminService } from '@/services/admin';
import { useDepartments } from '@/utils/departments';

type AccessLevel = 'None' | 'View' | 'Edit' | 'Both';

type AccessArea =
  | 'Dashboard'
  | 'Projects'
  | 'Clients'
  | 'Users'
  | 'Departments'
  | 'Workers'
  | 'Invoices'
  | 'Event & Updates'
  | 'Notifications'
  | 'Booking Orders'
  | 'Office Orders';

const systemAreas: AccessArea[] = [
  'Dashboard',
  'Projects',
  'Clients',
  'Users',
  'Departments',
  'Workers',
  'Invoices',
  'Event & Updates',
  'Notifications',
  'Booking Orders',
  'Office Orders',
];

interface UserAccount {
  id: string;
  username: string;
  email: string;
  password: string;
  department: string;
  role: 'Admin' | 'Manager' | 'Sub User' | 'Accountant';
  status: 'Active' | 'Inactive';
  date: string;
  access: Record<AccessArea, AccessLevel>;
}

const initialUsers: UserAccount[] = [];
/*
  {
    id: 'user-1',
    username: 'admin',
    email: 'admin@makezy.com',
    password: 'admin123',
    department: 'Information Technology',
    role: 'Admin',
    status: 'Active',
    date: '2026-07-01',
    access: {
      Dashboard: 'Both',
      Projects: 'Both',
      Clients: 'Both',
      Users: 'Both',
      Workers: 'Both',
      Invoices: 'Both',
      Notifications: 'Both',
      'Booking Orders': 'Both',
      'Office Orders': 'Both',
    },
  },
  {
    id: 'user-2',
    username: 'jane.doe',
    email: 'jane.doe@makezy.com',
    password: 'password1',
    department: 'Operations',
    role: 'Manager',
    status: 'Active',
    date: '2026-08-02',
    access: {
      Dashboard: 'Both',
      Projects: 'Both',
      Clients: 'Both',
      Users: 'None',
      Workers: 'Both',
      Invoices: 'Both',
      Notifications: 'Both',
      'Booking Orders': 'Both',
      'Office Orders': 'None',
    },
  },
  {
    id: 'user-3',
    username: 'sam.smith',
    email: 'sam.smith@makezy.com',
    password: 'passw0rd',
    department: 'Finance',
    role: 'Sub User',
    status: 'Inactive',
    date: '2026-06-22',
    access: {
      Dashboard: 'Both',
      Projects: 'None',
      Clients: 'None',
      Users: 'None',
      Workers: 'None',
      Invoices: 'None',
      Notifications: 'View',
      'Booking Orders': 'View',
      'Office Orders': 'None',
    },
  },
]; */

const emptyUser: UserAccount = {
  id: '',
  username: '',
  email: '',
  password: '',
  department: '',
  role: 'Sub User',
  status: 'Active',
  date: '',
  access: {
    Dashboard: 'Both',
    Projects: 'None',
    Clients: 'None',
    Users: 'None',
    Departments: 'None',
    Workers: 'None',
    Invoices: 'None',
    'Event & Updates': 'None',
    Notifications: 'None',
    'Booking Orders': 'None',
    'Office Orders': 'None',
  },
};

export default function UsersPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [departments] = useDepartments();
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formUser, setFormUser] = useState<UserAccount>(emptyUser);
  const [showPassword, setShowPassword] = useState(false);
  const [isAccessControlOpen, setIsAccessControlOpen] = useState(false);
  const [accessUser, setAccessUser] = useState<UserAccount | null>(null);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAllUsers();
      setUsers((response.data || []).map((user: any) => ({
        id: user.user_id,
        username: user.user_name,
        email: user.user_email,
        password: '',
        department: user.department_id ? String(user.department_id) : '',
        role: user.user_role,
        status: user.user_status,
        date: user.created_at,
        access: { ...emptyUser.access, ...(user.permissions || {}) },
      })));
    } catch (error) {
      showToast('Unable to load users from the server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query),
    );
  }, [users, searchQuery]);
  const openForm = (mode: 'add' | 'edit', user?: UserAccount) => {
    setFormMode(mode);
    setFormUser(user ? user : emptyUser);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormUser(emptyUser);
    setShowPassword(false);
  };

  const handleChange = (field: keyof UserAccount, value: string) => {
    setFormUser((current) => ({ ...current, [field]: value }));
  };

  const openAccessControl = (user: UserAccount) => {
    setAccessUser(user);
    setIsAccessControlOpen(true);
  };

  const closeAccessControl = () => {
    setIsAccessControlOpen(false);
    setAccessUser(null);
  };

  const setAccessLevel = (area: AccessArea, level: AccessLevel) => {
    if (!accessUser) return;
    setAccessUser((current) =>
      current ? { ...current, access: { ...current.access, [area]: level } } : null,
    );
  };

  const saveAccessControl = () => {
    if (!accessUser) return;
    void adminService.updateUser(accessUser.id, { permissions: accessUser.access })
      .then(() => {
        setUsers((current) => current.map((user) => (user.id === accessUser.id ? accessUser : user)));
        showToast('Permissions updated successfully', 'success');
        closeAccessControl();
      })
      .catch(() => showToast('Unable to save permissions', 'error'));
  };

  const handleSave = () => {
    if (!formUser.username.trim() || !formUser.email.trim() || (formMode === 'add' && !formUser.password.trim())) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    if (formMode === 'add') {
      void adminService.createUser({
        user_id: `user-${Date.now()}`,
        user_name: formUser.username,
        user_email: formUser.email,
        user_password: formUser.password,
        user_role: formUser.role === 'Sub User' || formUser.role === 'Accountant' ? formUser.role : formUser.role,
        user_status: formUser.status,
        permissions: formUser.access,
      }).then(() => {
        notifySystem('User added', `${formUser.username} was added to the system.`);
        showToast(`User "${formUser.username}" added successfully`, 'success');
        closeForm();
        void loadUsers();
      }).catch(() => showToast('Unable to create user on the server', 'error'));
    } else {
      void adminService.updateUser(formUser.id, {
        user_name: formUser.username,
        user_email: formUser.email,
        user_password: formUser.password || undefined,
        user_role: formUser.role,
        user_status: formUser.status,
        permissions: formUser.access,
      }).then(() => {
        notifySystem('User updated', `${formUser.username}'s account details were updated.`);
        showToast(`User "${formUser.username}" updated successfully`, 'success');
        closeForm();
        void loadUsers();
      }).catch(() => showToast('Unable to update user on the server', 'error'));
    }
  };

  const handleDelete = (userId: string) => {
    const userToDelete = users.find((user) => user.id === userId);
    void adminService.deleteUser(userId).then(() => {
      if (userToDelete) {
        notifySystem('User deleted', `${userToDelete.username} was removed from the system.`);
        showToast(`User "${userToDelete.username}" deleted`, 'info');
      }
      setPendingDeleteUserId(null);
      void loadUsers();
    }).catch(() => showToast('Unable to delete user from the server', 'error'));
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <p className="text-sm text-neutral-400 font-medium">{filteredUsers.length} users total</p>
          <h2 className="text-2xl font-semibold">User management</h2>
        </div>
        <button
          data-mutation-control
          onClick={() => openForm('add')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-black text-white text-sm font-semibold shadow-lg shadow-black/10 hover:bg-neutral-900 transition-all duration-200"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {isLoading ? <p className="text-sm text-neutral-500">Loading users...</p> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white border border-neutral-200 rounded-[28px] p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-sm font-semibold text-neutral-700">
                {user.username
                  .split(/[^A-Za-z0-9]/)
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  data-mutation-control
                  onClick={() => openForm('edit', user)}
                  className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
                  title="Edit user"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  data-mutation-control
                  onClick={() => openAccessControl(user)}
                  className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
                  title="Access control"
                >
                  <ShieldCheck size={16} />
                </button>
                <button
                  data-mutation-control
                  onClick={() => setPendingDeleteUserId(user.id)}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete user"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-lg leading-tight mb-1">{user.username}</h3>
            <p className="text-sm text-neutral-500 mb-4">{user.role}</p>

            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-neutral-400" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Key size={14} className="text-neutral-400" />
                <span>••••••••</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-neutral-400" />
                <span>{user.department}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-neutral-100 text-xs text-neutral-500">
              <div className="rounded-3xl bg-neutral-50 px-3 py-2 text-center font-semibold text-neutral-700">
                {user.status}
              </div>
              <div className="rounded-3xl bg-neutral-50 px-3 py-2 text-center">
                {new Date(user.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteUserId !== null}
        title="Delete user?"
        message="This user account will be permanently removed. Do you want to continue?"
        confirmText="Yes"
        cancelText="No"
        destructive
        onConfirm={() => {
          if (pendingDeleteUserId) handleDelete(pendingDeleteUserId);
        }}
        onCancel={() => setPendingDeleteUserId(null)}
      />

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-2xl animate-book-modal">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">
                  {formMode === 'add' ? 'New user' : 'Edit user'}
                </p>
                <h3 className="text-2xl font-semibold mt-2">
                  {formMode === 'add' ? 'Add user account' : 'Update user account'}
                </h3>
              </div>
              <button
                onClick={closeForm}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Username
                <input
                  value={formUser.username}
                  onChange={(event) => handleChange('username', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter username"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Email address
                <input
                  type="email"
                  value={formUser.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter email address"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                <div className="flex items-center justify-between">
                  <span>Password</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formUser.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter password"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Role
                <select
                  value={formUser.role}
                  onChange={(event) => handleChange('role', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Sub User">Sub User</option>
                  <option value="Accountant">Accountant</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Department
                <select
                  value={formUser.department}
                  onChange={(event) => handleChange('department', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  <option value="" disabled>Select department</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Status
                <select
                  value={formUser.status}
                  onChange={(event) => handleChange('status', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeForm}
                className="rounded-3xl border border-neutral-200 px-5 py-3 text-sm font-semibold hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                data-mutation-control
                onClick={handleSave}
                className="rounded-3xl bg-black text-white px-5 py-3 text-sm font-semibold hover:bg-neutral-900 transition"
              >
                Save user
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAccessControlOpen && accessUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] bg-white shadow-2xl animate-book-modal">
            <div className="p-8 pb-4">
              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Access control</p>
                  <h3 className="text-2xl font-semibold mt-2">Manage system access for {accessUser.username}</h3>
                  <p className="text-sm text-neutral-500 mt-2">
                    Grant or revoke access to each area of the system. Checked items are available to the user, while unchecked areas will be restricted.
                  </p>
                </div>
                <button
                  onClick={closeAccessControl}
                  className="self-start rounded-2xl px-4 py-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 transition"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[55vh] overflow-y-auto pr-1">
                <div className="grid gap-3">
                  {systemAreas.map((area) => (
                    <div
                      key={area}
                      className="rounded-3xl border border-neutral-200 p-3 hover:border-black transition-colors"
                    >
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                          <span className="font-semibold text-sm">{area}</span>
                          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                            {accessUser.access[area] === 'None'
                              ? `Blocked: ${accessUser.username} cannot access ${area.toLowerCase()}.`
                              : accessUser.access[area] === 'View'
                              ? `View only: ${accessUser.username} can see ${area.toLowerCase()}.`
                              : accessUser.access[area] === 'Edit'
                              ? `Edit only: ${accessUser.username} can modify ${area.toLowerCase()}.`
                              : `Full access: ${accessUser.username} can view and edit ${area.toLowerCase()}.`}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(['View', 'Edit', 'Both'] as AccessLevel[]).map((level) => (
                            <label
                              key={level}
                              className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700 transition-colors hover:border-black"
                            >
                              <input
                                type="radio"
                                name={`${area}-${accessUser.id}`}
                                value={level}
                                checked={accessUser.access[area] === level}
                                onChange={() => setAccessLevel(area, level)}
                                className="h-3 w-3 accent-black"
                              />
                              {level}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 px-8 py-5">
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeAccessControl}
                  className="rounded-3xl border border-neutral-200 px-5 py-3 text-sm font-semibold hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  data-mutation-control
                  onClick={saveAccessControl}
                  className="rounded-3xl bg-black text-white px-5 py-3 text-sm font-semibold hover:bg-neutral-900 transition"
                >
                  Save access
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
