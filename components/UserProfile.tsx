
import React, { useState } from 'react';
import { User, Order, MediaItem } from '../types';
import { orderService } from '../services/orderService';
import { mediaService } from '../services/mediaService';
import { authService } from '../services/authService';
import { 
  Package, User as UserIcon, LogOut, MapPin, Clock, Image as ImageIcon, 
  Settings, Edit3, Camera, UploadCloud, Trash2, Download, Check, X,
  Sliders, RotateCcw, Type, Save, Moon, Bell, Globe, Key
} from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
  onClose: () => void;
}

export const UserProfile: React.FC<Props> = ({ user, onLogout, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'gallery' | 'studio' | 'settings'>('profile');
  const [orders] = useState<Order[]>(orderService.getOrdersByUser(user.id));
  const [userMedia, setUserMedia] = useState<MediaItem[]>(mediaService.getUserMedia(user.id));
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user.name, email: user.email, currentPassword: '', newPassword: '' });

  // Studio State
  const [studioImage, setStudioImage] = useState<MediaItem | null>(null);
  const [studioConfig, setStudioConfig] = useState({ filter: 'none', rotation: 0, text: '' });

  const handleProfileUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await authService.updateProfile(user.id, { name: profileForm.name, email: profileForm.email });
          if (profileForm.newPassword) {
              // Simulated password change
              alert('Password updated successfully');
          }
          setIsEditingProfile(false);
          alert('Profile Updated!');
      } catch (err) {
          alert('Update failed');
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          try {
              const newItem = await mediaService.uploadFile(e.target.files[0], user.id);
              setUserMedia(prev => [newItem, ...prev]);
          } catch (err) {
              alert('Upload failed');
          }
      }
  };

  const handleStudioSave = async () => {
      if (!studioImage) return;
      alert(`Saved edited version of ${studioImage.name} to gallery!`);
      // In a real app, we would canvas.toDataURL() and upload
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
       <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
         
         {/* Sidebar */}
         <div className="w-full md:w-64 bg-earth-900 text-earth-100 flex flex-col p-6 shrink-0">
            <div className="flex flex-col items-center mb-8">
               <div className="relative group cursor-pointer">
                  <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full border-2 border-herb-500 mb-3 object-cover" />
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                  </div>
               </div>
               <h3 className="font-bold text-lg text-center">{user.name}</h3>
               <span className="text-xs bg-herb-600 px-2 py-0.5 rounded text-white capitalize">{user.role.replace('_', ' ')}</span>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto">
              {[
                  { id: 'profile', icon: UserIcon, label: 'My Profile' },
                  { id: 'orders', icon: Package, label: 'My Orders' },
                  { id: 'gallery', icon: ImageIcon, label: 'My Gallery' },
                  { id: 'studio', icon: Edit3, label: 'Creator Studio' },
                  { id: 'settings', icon: Settings, label: 'Settings' }
              ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-herb-600 text-white' : 'hover:bg-earth-800'}`}
                  >
                    <item.icon className="h-5 w-5" /> {item.label}
                  </button>
              ))}
            </nav>

            <button 
              onClick={onLogout}
              className="mt-4 flex items-center gap-2 text-red-400 hover:text-red-300 p-2 border-t border-earth-800 pt-4"
            >
              <LogOut className="h-5 w-5" /> Logout
            </button>
         </div>

         {/* Content Area */}
         <div className="flex-1 bg-earth-50 p-6 md:p-8 overflow-y-auto">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl mx-auto">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-serif font-bold text-earth-900">Personal Details</h2>
                    <button 
                        onClick={() => setIsEditingProfile(!isEditingProfile)} 
                        className="text-herb-700 hover:bg-herb-50 p-2 rounded-full"
                    >
                        {isEditingProfile ? <X /> : <Edit3 />}
                    </button>
                 </div>

                 {isEditingProfile ? (
                     <form onSubmit={handleProfileUpdate} className="bg-white p-6 rounded-xl shadow-sm border border-earth-100 space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <label className="text-xs font-bold text-earth-500 uppercase">Full Name</label>
                                 <input className="w-full border p-2 rounded-lg" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-earth-500 uppercase">Email</label>
                                 <input className="w-full border p-2 rounded-lg" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                             </div>
                         </div>
                         <div className="pt-4 border-t border-earth-100">
                             <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><Key className="h-4 w-4" /> Change Password</h4>
                             <div className="space-y-3">
                                <input className="w-full border p-2 rounded-lg" type="password" placeholder="Current Password" />
                                <input className="w-full border p-2 rounded-lg" type="password" placeholder="New Password" />
                             </div>
                         </div>
                         <button className="w-full bg-herb-600 text-white py-3 rounded-lg font-bold mt-4">Save Changes</button>
                     </form>
                 ) : (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-earth-100 space-y-6 animate-in fade-in">
                        <div>
                        <label className="text-sm font-bold text-earth-500 uppercase tracking-wide">Full Name</label>
                        <p className="text-lg font-medium text-earth-900">{user.name}</p>
                        </div>
                        <div>
                        <label className="text-sm font-bold text-earth-500 uppercase tracking-wide">Email Address</label>
                        <p className="text-lg font-medium text-earth-900">{user.email}</p>
                        </div>
                        <div>
                        <label className="text-sm font-bold text-earth-500 uppercase tracking-wide">Member Since</label>
                        <p className="text-lg font-medium text-earth-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                 )}
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-serif font-bold text-earth-900 mb-6">Order History</h2>
                {orders.length === 0 ? (
                  <div className="text-center py-10 text-earth-500">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>No orders found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-earth-100">
                         <div className="flex justify-between items-start mb-4 border-b border-earth-50 pb-4">
                            <div>
                               <p className="font-bold text-earth-900">Order #{order.id}</p>
                               <p className="text-xs text-earth-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                 order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                                 {order.status}
                            </span>
                         </div>
                         <div className="text-right font-bold text-lg text-herb-700">₹{order.totalAmount}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* GALLERY TAB */}
            {activeTab === 'gallery' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-serif font-bold text-earth-900">My Gallery</h2>
                        <label className="bg-herb-600 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 hover:bg-herb-700">
                            <UploadCloud className="h-5 w-5" /> Upload
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {userMedia.map(item => (
                            <div key={item.id} className="group relative aspect-square bg-white rounded-xl shadow-sm overflow-hidden border border-earth-200">
                                <img src={item.url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <button 
                                        onClick={() => { setActiveTab('studio'); setStudioImage(item); }}
                                        className="bg-white p-2 rounded-full text-earth-900 hover:scale-110 transition-transform"
                                        title="Edit in Studio"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button className="bg-white p-2 rounded-full text-red-600 hover:scale-110 transition-transform">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                                    item.status === 'approved' ? 'bg-green-500 text-white' : item.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-earth-900'
                                }`}>
                                    {item.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* STUDIO TAB */}
            {activeTab === 'studio' && (
                <div className="h-full flex flex-col">
                    <h2 className="text-2xl font-serif font-bold text-earth-900 mb-6">Creative Studio</h2>
                    <div className="flex-1 flex gap-6 overflow-hidden">
                        {/* Canvas Area */}
                        <div className="flex-1 bg-earth-200 rounded-xl flex items-center justify-center relative overflow-hidden border border-earth-300">
                            {studioImage ? (
                                <div className="relative transition-all duration-300" style={{ 
                                    transform: `rotate(${studioConfig.rotation}deg)`,
                                    filter: studioConfig.filter === 'grayscale' ? 'grayscale(100%)' : studioConfig.filter === 'sepia' ? 'sepia(100%)' : studioConfig.filter === 'blur' ? 'blur(2px)' : 'none'
                                }}>
                                    <img src={studioImage.url} className="max-h-[50vh] max-w-full shadow-2xl" />
                                    {studioConfig.text && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-white drop-shadow-lg text-center whitespace-pre">
                                            {studioConfig.text}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-earth-500">
                                    <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                    <p>Select an image from Gallery to edit</p>
                                    <button onClick={() => setActiveTab('gallery')} className="mt-4 text-herb-700 font-bold underline">Go to Gallery</button>
                                </div>
                            )}
                        </div>
                        
                        {/* Controls */}
                        <div className="w-64 bg-white p-4 rounded-xl shadow-sm border border-earth-100 flex flex-col gap-6 overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-earth-500 uppercase flex items-center gap-2"><Sliders className="h-4 w-4" /> Filters</label>
                                <select 
                                    className="w-full border p-2 rounded-lg"
                                    value={studioConfig.filter}
                                    onChange={(e) => setStudioConfig({...studioConfig, filter: e.target.value})}
                                >
                                    <option value="none">Normal</option>
                                    <option value="grayscale">B&W (Grayscale)</option>
                                    <option value="sepia">Vintage (Sepia)</option>
                                    <option value="blur">Soft Blur</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-earth-500 uppercase flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Rotation</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setStudioConfig(p => ({...p, rotation: p.rotation - 90}))} className="flex-1 bg-earth-100 py-2 rounded hover:bg-earth-200">-90°</button>
                                    <button onClick={() => setStudioConfig(p => ({...p, rotation: p.rotation + 90}))} className="flex-1 bg-earth-100 py-2 rounded hover:bg-earth-200">+90°</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-earth-500 uppercase flex items-center gap-2"><Type className="h-4 w-4" /> Text Overlay</label>
                                <input 
                                    className="w-full border p-2 rounded-lg"
                                    placeholder="Add text..."
                                    value={studioConfig.text}
                                    onChange={(e) => setStudioConfig({...studioConfig, text: e.target.value})}
                                />
                            </div>

                            <div className="mt-auto space-y-2 pt-4 border-t border-earth-100">
                                <button onClick={handleStudioSave} className="w-full bg-herb-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                                    <Save className="h-4 w-4" /> Save as Copy
                                </button>
                                <button className="w-full bg-earth-100 text-earth-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                                    <Download className="h-4 w-4" /> Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
                <div className="max-w-xl mx-auto">
                    <h2 className="text-2xl font-serif font-bold text-earth-900 mb-6">Preferences</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-earth-100 divide-y divide-earth-50 overflow-hidden">
                        <div className="p-6 flex items-center justify-between hover:bg-earth-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-100 p-2 rounded-full text-purple-600"><Moon className="h-5 w-5" /></div>
                                <div>
                                    <p className="font-bold text-earth-900">Dark Mode</p>
                                    <p className="text-xs text-earth-500">Reduce eye strain</p>
                                </div>
                            </div>
                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                            </div>
                        </div>
                        
                        <div className="p-6 flex items-center justify-between hover:bg-earth-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Bell className="h-5 w-5" /></div>
                                <div>
                                    <p className="font-bold text-earth-900">Notifications</p>
                                    <p className="text-xs text-earth-500">Updates & Offers</p>
                                </div>
                            </div>
                            <button className="text-herb-600 font-bold text-sm">Configure</button>
                        </div>

                        <div className="p-6 flex items-center justify-between hover:bg-earth-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Globe className="h-5 w-5" /></div>
                                <div>
                                    <p className="font-bold text-earth-900">Language</p>
                                    <p className="text-xs text-earth-500">English / Hindi</p>
                                </div>
                            </div>
                            <select className="bg-transparent font-bold text-earth-700 outline-none">
                                <option>English</option>
                                <option>Hindi</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
         </div>

         <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full md:hidden">
            <X className="h-5 w-5 text-earth-900" />
         </button>
       </div>
    </div>
  );
};
