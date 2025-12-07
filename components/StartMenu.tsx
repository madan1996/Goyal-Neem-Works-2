
import React from 'react';
import { 
  ShoppingBag, Shield, Video, User, 
  MessageCircle, Settings, Box, BarChart 
} from 'lucide-react';
import { User as UserType } from '../types';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onNavigate: (destination: string) => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ isOpen, onClose, user, onNavigate }) => {
  if (!isOpen) return null;

  const menuItems = [
    { id: 'store', label: 'Store Front', icon: ShoppingBag, color: 'text-herb-600', bg: 'bg-herb-50', desc: 'Browse Products' },
    { id: 'profile', label: 'My Profile', icon: User, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Account Settings' },
    { id: 'studio', label: 'Avatar Studio', icon: Video, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Create Content' },
    { id: 'chatbot', label: 'Ask Veda', icon: MessageCircle, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'AI Assistant' },
  ];

  if (user?.role === 'admin' || user?.role === 'super_admin') {
    menuItems.push(
      { id: 'admin', label: 'Admin Panel', icon: Shield, color: 'text-red-600', bg: 'bg-red-50', desc: 'Manage System' },
      { id: 'inventory', label: 'Inventory', icon: Box, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Stock Control' },
      { id: 'analytics', label: 'Analytics', icon: BarChart, color: 'text-teal-600', bg: 'bg-teal-50', desc: 'Sales Reports' },
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-16 left-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-earth-200 p-4 animate-in slide-in-from-top-2 fade-in duration-200">
        <h3 className="text-xs font-bold text-earth-400 uppercase tracking-wider mb-4 ml-2">Quick Access</h3>
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose(); }}
              className="flex flex-col items-center p-4 rounded-xl hover:bg-earth-50 transition-all border border-transparent hover:border-earth-100 group"
            >
              <div className={`p-3 rounded-full mb-3 ${item.bg} group-hover:scale-110 transition-transform`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <span className="font-bold text-sm text-earth-800">{item.label}</span>
              <span className="text-[10px] text-earth-400 mt-1">{item.desc}</span>
            </button>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-earth-100 px-2 flex justify-between items-center text-xs text-earth-400">
            <span>Goyal OS v2.1</span>
            <span>Ayurveda First</span>
        </div>
      </div>
    </>
  );
};
