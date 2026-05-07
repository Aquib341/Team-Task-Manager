import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('admin'); // 'admin' or 'member'
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (type) => {
    setLoginType(type);
    // Optional: Pre-fill some demo credentials if you create these accounts
    // if (type === 'admin') { setEmail('admin@example.com'); setPassword('admin123'); }
    // else { setEmail('member@example.com'); setPassword('member123'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Sign in to access your workspace
          </p>
        </div>

        {/* Role Toggle Switch */}
        <div className="flex p-1 space-x-1 bg-gray-100/80 rounded-xl">
          <button
            onClick={() => setDemoCredentials('admin')}
            className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-all ${
              loginType === 'admin'
                ? 'bg-white text-purple-700 shadow-sm ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            Admin Login
          </button>
          <button
            onClick={() => setDemoCredentials('member')}
            className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-all ${
              loginType === 'member'
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            Member Login
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                placeholder={loginType === 'admin' ? "admin@company.com" : "member@company.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-md ${
                loginType === 'admin' 
                  ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 shadow-purple-500/30' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-500/30'
              } disabled:opacity-50`}
            >
              {loading ? 'Signing in...' : `Sign in as ${loginType === 'admin' ? 'Admin' : 'Member'}`}
            </button>
          </div>
          <div className="text-sm text-center pt-2">
            <Link to="/signup" className={`font-medium transition-colors ${loginType === 'admin' ? 'text-purple-600 hover:text-purple-500' : 'text-blue-600 hover:text-blue-500'}`}>
              Don't have an account? Create one now
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
