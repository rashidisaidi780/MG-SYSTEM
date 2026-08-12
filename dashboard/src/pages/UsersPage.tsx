import { useState } from 'react';
import { Plus, Mail, Key, Edit3, Trash2 } from 'lucide-react';

interface UserAccount {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'Admin' | 'Manager' | 'Sub User' | 'Accountant';
  status: 'Active' | 'Inactive';
  date: string;
}

const initialUsers: UserAccount[] = [
  {
    id: 'user-1',
    username: 'admin',
    email: 'admin@makezy.com',
    password: 'admin123',
    role: 'Admin',
    status: 'Active',
    date: '2026-07-01',
  },
  {
    id: 'user-2',
    username: 'jane.doe',
    email: 'jane.doe@makezy.com',
    password: 'password1',
    role: 'Manager',
    status: 'Active',
    date: '2026-08-02',
  },
  {
    id: 'user-3',
    username: 'sam.smith',
    email: 'sam.smith@makezy.com',
    password: 'passw0rd',
    role: 'Sub User',
    status: 'Inactive',
    date: '2026-06-22',
  },
];

const emptyUser: UserAccount = {
  id: '',
  username: '',
  email: '',
  password: '',
  role: 'Sub User',
  status: 'Active',
  date: '',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formUser, setFormUser] = useState<UserAccount>(emptyUser);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleSave = () => {
    if (!formUser.username.trim() || !formUser.email.trim() || !formUser.password.trim()) {
      return;
    }

    if (formMode === 'add') {
      setUsers((current) => [
        { ...formUser, id: `user-${Date.now()}`, date: new Date().toISOString().slice(0, 10) },
        ...current,
      ]);
    } else {
      setUsers((current) => current.map((user) => (user.id === formUser.id ? { ...formUser } : user)));
    }

    closeForm();
  };

  const handleDelete = (userId: string) => {
    setUsers((current) => current.filter((user) => user.id !== userId));
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <p className="text-sm text-neutral-400 font-medium">{users.length} users total</p>
          <h2 className="text-2xl font-semibold">User management</h2>
        </div>
        <button
          onClick={() => openForm('add')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-black text-white text-sm font-semibold shadow-lg shadow-black/10 hover:bg-neutral-900 transition-all duration-200"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map((user) => (
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
                  onClick={() => openForm('edit', user)}
                  className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
                  title="Edit user"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
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
                onClick={handleSave}
                className="rounded-3xl bg-black text-white px-5 py-3 text-sm font-semibold hover:bg-neutral-900 transition"
              >
                Save user
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
