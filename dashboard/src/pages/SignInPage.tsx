import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import logoImg from '@/assets/logo.jpeg';
import { notifySystem } from '@/utils/systemNotifications';
import { authService, type AuthUser } from '@/services';

const getLoginErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: number }).status;
    if (status === 401 || status === 422) {
      return 'Incorrect username or password. Please try again.';
    }
  }

  return 'Unable to sign in right now. Please try again.';
};

export default function SignInPage({ onSignIn }: { onSignIn: (user: AuthUser) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.login({ username, password });
      
      // Store the authenticated account, including role and permissions.
      localStorage.setItem('mg_user', JSON.stringify({ 
        ...response.user,
        token: response.token,
        type: response.user.role === 'Admin' ? 'admin' : 'user',
      }));
      
      notifySystem('User signed in', `${response.user.username || 'A user'} signed in successfully.`);
      setLoading(false);
      onSignIn({ ...response.user, token: response.token });
    } catch (err) {
      setLoading(false);
      const errorMessage = getLoginErrorMessage(err);
      setError(errorMessage);
      notifySystem('Login failed', errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-8xl min-h-[95vh] grid grid-cols-1 md:grid-cols-[1.35fr_1fr] overflow-hidden rounded-[32px] bg-white shadow-2xl">
        <section className="relative hidden md:block h-full">
          <div className="absolute inset-0 bg-slate-950/55" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.35),transparent_20%)]" />
          <div className="relative h-full p-12 flex flex-col justify-between text-white">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.25em] text-white/90">
                Makezy Group
              </div>
              <h1 className="max-l-sm text-4xl font-semibold leading-tight">Welcome back to the Makezy Group Management System</h1>
              <p className="max-l-sm text-sm text-white/80">Sign in to manage your operations from a single dashboard.</p>
            </div>
            <div className="space-y-3 text-sm text-white/80">
              <p className="font-semibold">Trusted management company</p>
              <p>Fast access, secure credentials, and a modern operations workspace.</p>
            </div>
          </div>
        </section>

        <main className="flex items-center justify-center bg-white p-10 md:p-12">
          <div className="w-full max-w-lg">
            <div className="mb-10 text-center">
              <img src={logoImg} alt="Logo" className="mx-auto mb-8 h-24 w-24 rounded-full border-2 border-slate-200 object-cover shadow-lg" />
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Makezy group of companies</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">Sign in to your account</h2>
              <p className="mt-3 text-sm text-slate-500">Enter your username and password to continue.</p>
            </div>

            <form onSubmit={submit} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email / Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Email or Username"
                  className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Signing in...' : 'Continue'}
                  <span className="ml-2">→</span>
                </button>
              </div>

            </form>

            <p className="mt-12 text-center text-xs text-slate-400">© 2026 Makezy Group Of Companies. All rights reserved.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
