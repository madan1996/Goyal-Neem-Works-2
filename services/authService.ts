
import { User, UserRole } from '../types';
import { logger } from './loggerService';

// Mock Users Database
let USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Super Admin',
    email: 'admin@veda.com',
    role: 'super_admin',
    isBlocked: false,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=0D9488&color=fff'
  },
  {
    id: 'user-1',
    name: 'Rahul Kumar',
    email: 'rahul@example.com',
    role: 'user',
    isBlocked: false,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    avatar: 'https://ui-avatars.com/api/?name=Rahul+Kumar&background=random'
  }
];

const CURRENT_USER_KEY = 'veda_current_user';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = USERS.find(u => u.email === email && !u.isDeleted);
    
    // Mock Password Check (In real app, hash check)
    if (user && password !== 'wrong') {
      if (user.isBlocked) {
        logger.log('WARNING', 'Blocked user attempted login', { userId: user.id });
        throw new Error('Your account has been blocked. Contact support.');
      }

      const updatedUser = { ...user, lastLogin: new Date().toISOString(), deviceInfo: navigator.userAgent };
      // Update the user in the "DB"
      const idx = USERS.findIndex(u => u.id === user.id);
      if (idx !== -1) USERS[idx] = updatedUser;

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      
      logger.log('INFO', 'User Logged In', { userId: user.id });
      return updatedUser;
    }
    
    logger.log('WARNING', 'Failed Login Attempt', { requestData: { email } });
    throw new Error('Invalid credentials');
  },

  signup: async (name: string, email: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (USERS.find(u => u.email === email && !u.isDeleted)) {
      throw new Error('Email already exists');
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role: 'user',
      isBlocked: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      deviceInfo: navigator.userAgent,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };

    USERS.push(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    
    logger.log('INFO', 'New User Registered', { userId: newUser.id });
    return newUser;
  },

  logout: () => {
    const user = authService.getCurrentUser();
    if (user) {
      logger.log('INFO', 'User Logged Out', { userId: user.id });
    }
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  updateProfile: async (id: string, updates: Partial<User>): Promise<User> => {
    const userIdx = USERS.findIndex(u => u.id === id);
    if (userIdx === -1) throw new Error('User not found');

    USERS[userIdx] = { ...USERS[userIdx], ...updates };
    
    // Update session if it's the current user
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      const updated = { ...currentUser, ...updates };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
      return updated;
    }
    
    return USERS[userIdx];
  },

  getAllUsers: (): User[] => {
    return USERS.filter(u => !u.isDeleted);
  },

  // --- Admin Management Methods ---

  createUser: async (userData: Partial<User>): Promise<User> => {
      if (USERS.find(u => u.email === userData.email && !u.isDeleted)) {
          throw new Error('User with this email already exists');
      }
      const newUser: User = {
          id: `user-${Date.now()}`,
          name: userData.name || 'New User',
          email: userData.email || '',
          role: userData.role || 'user',
          isBlocked: !!userData.isBlocked,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random`,
          ...userData
      } as User;
      USERS.push(newUser);
      logger.log('INFO', 'Admin Created User', { requestData: { email: newUser.email, role: newUser.role } });
      return newUser;
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
      const idx = USERS.findIndex(u => u.id === id);
      if (idx === -1) throw new Error('User not found');
      
      USERS[idx] = { ...USERS[idx], ...updates };
      logger.log('INFO', 'Admin Updated User', { userId: id, requestData: updates });
      return USERS[idx];
  },

  deleteUser: async (id: string, hard: boolean = false): Promise<void> => {
      const idx = USERS.findIndex(u => u.id === id);
      if (idx === -1) throw new Error('User not found');

      if (hard) {
          USERS.splice(idx, 1);
          logger.log('WARNING', 'Admin Hard Deleted User', { userId: id });
      } else {
          USERS[idx].isDeleted = true;
          USERS[idx].isBlocked = true; // Also block access
          logger.log('INFO', 'Admin Soft Deleted User', { userId: id });
      }
  },

  resetPassword: async (id: string): Promise<string> => {
      const user = USERS.find(u => u.id === id);
      if (!user) throw new Error('User not found');
      
      const tempPassword = Math.random().toString(36).slice(-8);
      logger.log('INFO', 'Admin Reset User Password', { userId: id });
      return tempPassword;
  },

  forceLogout: async (id: string): Promise<void> => {
      const user = USERS.find(u => u.id === id);
      if (!user) throw new Error('User not found');
      
      // In a real app, this would invalidate the token. 
      // Here we just log it, as we can't clear other browser's localStorage.
      // We could add a 'tokenVersion' to user and check it on every request.
      logger.log('WARNING', 'Admin Forced Logout', { userId: id });
  }
};
