
import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  notify: (type: 'success' | 'error', msg: string) => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess, notify }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user: User;
      if (mode === 'login') {
        user = await authService.login(formData.email, formData.password);
        notify('success', `Welcome back, ${user.name}!`);
      } else {
        user = await authService.signup(formData.name, formData.email, formData.password);
        notify('success', 'Account created successfully!');
      }
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      notify('error', err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-earth-900 p-6 text-white text-center relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-earth-300 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-serif font-bold mb-1">
            {mode === 'login' ? 'Welcome Back' : 'Join VedaRoot'}
          </h2>
          <p className="text-earth-200 text-sm">
            {mode === 'login' ? 'Sign in to access your account' : 'Start your ayurvedic journey today'}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-earth-400" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-earth-200 rounded-lg focus:ring-2 focus:ring-herb-500 focus:outline-none"
                />
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-earth-400" />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-earth-200 rounded-lg focus:ring-2 focus:ring-herb-500 focus:outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-earth-400" />
              <input
                type="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-earth-200 rounded-lg focus:ring-2 focus:ring-herb-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-herb-600 text-white py-3 rounded-lg font-bold hover:bg-herb-700 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-earth-600">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="font-bold text-herb-700 hover:underline"
              >
                {mode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
