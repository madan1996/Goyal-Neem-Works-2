
import React, { useState } from 'react';
import { ShoppingBag, Menu, Leaf, Search, Lock, User as UserIcon, Video, Grid, Activity } from 'lucide-react';
import { User, SystemTask } from '../types';
import { StartMenu } from './StartMenu';
import { TaskCenter } from './TaskCenter';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  currentLang: 'hi' | 'en';
  user: User | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenAvatarStudio?: () => void;
  // New Props
  tasks: SystemTask[];
  onClearTask: (id: string) => void;
  onNavigate: (dest: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  cartCount, onOpenCart, currentLang, user, onOpenAuth, onOpenProfile, onOpenAdmin, onOpenAvatarStudio,
  tasks, onClearTask, onNavigate
}) => {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isTaskCenterOpen, setIsTaskCenterOpen] = useState(false);

  const activeTaskCount = tasks.filter(t => t.status === 'processing' || t.status === 'queued').length;

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-earth-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          <div className="flex items-center gap-4">
             {/* Start Menu Trigger */}
             <div className="relative">
                 <button 
                    onClick={() => { setIsStartMenuOpen(!isStartMenuOpen); setIsTaskCenterOpen(false); }}
                    className={`p-2 rounded-lg transition-colors ${isStartMenuOpen ? 'bg-earth-100 text-earth-900' : 'text-earth-500 hover:bg-earth-50'}`}
                 >
                     <Grid className="h-6 w-6" />
                 </button>
                 <StartMenu 
                    isOpen={isStartMenuOpen} 
                    onClose={() => setIsStartMenuOpen(false)} 
                    user={user}
                    onNavigate={(dest) => {
                        if(dest === 'admin') onOpenAdmin();
                        else if(dest === 'profile') onOpenProfile();
                        else if(dest === 'studio' && onOpenAvatarStudio) onOpenAvatarStudio();
                        else onNavigate(dest);
                    }}
                 />
             </div>

             {/* Logo */}
             <div className="flex items-center cursor-pointer group" onClick={() => onNavigate('store')}>
                <div className="bg-herb-50 p-2 rounded-full mr-3 group-hover:bg-herb-100 transition-colors">
                    <Leaf className="h-6 w-6 text-herb-600" />
                </div>
                <div className="flex flex-col">
                    <span className="font-serif text-2xl font-bold text-earth-900 tracking-tight leading-none hidden sm:block">
                    Goyal Neem Works
                    </span>
                    <span className="font-serif text-xl font-bold text-earth-900 tracking-tight leading-none sm:hidden">
                    GNW
                    </span>
                    <span className="text-[10px] font-bold tracking-widest text-earth-500 uppercase mt-1">
                    Since 1995 • Pure Ayurveda
                    </span>
                </div>
             </div>
          </div>

          {/* Desktop Search */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
            <input
              type="text"
              placeholder={currentLang === 'hi' ? "नीम उत्पाद खोजें..." : "Search pure neem products..."}
              className="w-full bg-earth-50 border border-earth-200 rounded-lg py-2.5 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-herb-500 focus:border-transparent text-sm transition-all"
            />
            <Search className="absolute right-3 top-3 h-4 w-4 text-earth-400" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Task Center Trigger */}
            <div className="relative">
                <button 
                   onClick={() => { setIsTaskCenterOpen(!isTaskCenterOpen); setIsStartMenuOpen(false); }}
                   className={`p-2 rounded-full transition-colors relative ${isTaskCenterOpen ? 'bg-earth-100 text-earth-900' : 'text-earth-500 hover:text-earth-900'}`}
                   title="System Tasks"
                >
                   <Activity className={`h-6 w-6 ${activeTaskCount > 0 ? 'animate-pulse text-herb-600' : ''}`} />
                   {activeTaskCount > 0 && (
                       <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-white" />
                   )}
                </button>
                <TaskCenter 
                    isOpen={isTaskCenterOpen} 
                    onClose={() => setIsTaskCenterOpen(false)}
                    tasks={tasks}
                    onClearTask={onClearTask}
                />
            </div>

            {/* User Auth / Profile */}
            {user ? (
               <div className="flex items-center gap-2">
                   {/* Admin Access Button (Only for admins) */}
                   {(user.role === 'admin' || user.role === 'super_admin') && (
                     <button 
                       onClick={onOpenAdmin}
                       className="hidden md:block p-2 text-earth-500 hover:text-earth-900 transition-colors"
                       title="Admin Dashboard"
                     >
                       <Lock className="h-5 w-5" />
                     </button>
                   )}
                   
                   <button 
                     onClick={onOpenProfile}
                     className="flex items-center gap-2 pl-2 pr-4 py-1.5 bg-white border border-earth-200 rounded-full hover:shadow-md transition-all group"
                   >
                       <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-earth-100" />
                       <div className="flex flex-col items-start">
                           <span className="text-xs font-bold text-earth-900 leading-none hidden sm:block max-w-[80px] truncate">{user.name}</span>
                           <span className="text-[10px] text-earth-500 hidden sm:block">My Account</span>
                       </div>
                   </button>
               </div>
            ) : (
                <button 
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-earth-900 text-white text-sm font-bold hover:bg-earth-800 transition-colors shadow-sm"
                >
                    <UserIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Login</span>
                </button>
            )}

            <button
              onClick={onOpenCart}
              className="relative p-3 text-earth-700 hover:text-herb-600 transition-colors"
            >
              <ShoppingBag className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center h-5 w-5 text-[10px] font-bold leading-none text-white transform translate-x-0 -translate-y-0 bg-herb-600 rounded-full border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
