
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, Package, Settings, FileText, Shield, 
  Trash2, Edit, Plus, Ban, RefreshCw, LogOut, Activity, 
  Image as ImageIcon, Search, CheckCircle, AlertTriangle, 
  UploadCloud, AlertOctagon, Info, Download, X, Eye, 
  ToggleLeft, ToggleRight, Save, LayoutGrid, List, ArrowUpDown,
  History, TrendingUp, DollarSign, Key, ShoppingCart, Power, MoreVertical, Unlock, UserCheck, Layers, File as FileIcon, Video, Tag, CheckSquare, Square,
  Database, Globe, Server, AlertCircle, Loader2, Copy, ExternalLink, ClipboardList, ChevronDown, Bell, Mail, Filter, Sliders, Minus, Truck, Calendar,
  Edit2, ScanBarcode
} from 'lucide-react';
import { Product, LogEntry, Severity, User, Order, UserRole, MediaItem, Permission, RoleDefinition, OrderStatus } from '../types';
import { logger } from '../services/loggerService';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';
import { mediaService } from '../services/mediaService';
import { CATEGORIES } from '../constants';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  maintenanceMode: boolean;
  toggleMaintenanceMode: () => void;
  notify: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

// --- PERMISSION MATRIX ---
const DEFAULT_PERMISSIONS: RoleDefinition[] = [
    { role: 'super_admin', permissions: ['manage_users', 'manage_products', 'manage_orders', 'delete_records', 'view_financials', 'manage_settings', 'publish_content', 'manage_media'] },
    { role: 'admin', permissions: ['manage_users', 'manage_products', 'manage_orders', 'manage_media', 'publish_content', 'view_financials'] },
    { role: 'editor', permissions: ['manage_products', 'manage_media'] }, 
    { role: 'viewer', permissions: [] }, 
    { role: 'user', permissions: [] }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen, onClose, products, onUpdateProduct, onAddProduct, onDeleteProduct,
  maintenanceMode, toggleMaintenanceMode, notify
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'inventory' | 'orders' | 'media' | 'roles' | 'settings' | 'logs'>('overview');
  const currentUser = authService.getCurrentUser();
  const userPermissions = DEFAULT_PERMISSIONS.find(r => r.role === currentUser?.role)?.permissions || [];

  // Helper to check permission
  const can = (perm: Permission) => userPermissions.includes(perm);

  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  // Product State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  
  // --- Multi-Select Filter State ---
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [skuSearch, setSkuSearch] = useState('');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [productFilterStatus, setProductFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Inventory State
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'out'>('all');
  // Removed tempStock to enforce modal usage for reason logging
  const [tempReorder, setTempReorder] = useState<{[key: string]: number}>({});
  const [isAlertConfigOpen, setIsAlertConfigOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState(() => {
    const saved = localStorage.getItem('veda_inventory_alerts');
    return saved ? JSON.parse(saved) : { dashboard: false, email: false };
  });

  // Stock Adjustment State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState({ type: 'add' as 'add'|'remove'|'set', quantity: 0, reason: '' });

  // Order Management State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderForm, setOrderForm] = useState<{ status: OrderStatus; trackingNumber: string }>({ status: 'pending', trackingNumber: '' });
  const [orderSearch, setOrderSearch] = useState('');

  // Log Viewer State
  const [logFilter, setLogFilter] = useState<{severity: string, search: string}>({ severity: 'ALL', search: '' });

  // Media Manager State
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [mediaUploadLoading, setMediaUploadLoading] = useState(false);

  // Tag Management State (Settings)
  const [editingTag, setEditingTag] = useState<{ name: string, count: number } | null>(null);
  const [newTagNameInput, setNewTagNameInput] = useState('');

  // Initial Data Load
  useEffect(() => {
    if (isOpen) {
      if (!can('view_financials') && !can('manage_products')) {
           setActiveTab('overview');
      }
      setUsers(authService.getAllUsers());
      setOrders(orderService.getAllOrders());
      setMediaItems(mediaService.getAllMedia());
      
      const sevFilter = logFilter.severity === 'ALL' ? undefined : logFilter.severity as Severity;
      const logs = logger.getLogs({
        severity: sevFilter,
        search: logFilter.search
      });
      setSystemLogs(logs);
    }
  }, [isOpen, activeTab, logFilter]); 

  // --- Alert Logic ---
  useEffect(() => {
    localStorage.setItem('veda_inventory_alerts', JSON.stringify(alertConfig));

    if (activeTab === 'inventory' && alertConfig.dashboard) {
        const lowStockItems = products.filter(p => p.stock <= (p.reorderPoint || 10));
        if (lowStockItems.length > 0) {
            const hasNotified = sessionStorage.getItem('veda_alert_shown_session');
            if (!hasNotified) {
               notify('warning', `Alert: ${lowStockItems.length} products are below reorder level.`);
               sessionStorage.setItem('veda_alert_shown_session', 'true');
               
               if (alertConfig.email) {
                   logger.log('INFO', `Automated Stock Alert Email Sent`, { 
                       requestData: { 
                           recipient: 'admin@veda.com', 
                           itemCount: lowStockItems.length,
                           items: lowStockItems.map(i => i.sku)
                        } 
                    });
                    setTimeout(() => notify('info', 'Stock report sent to admin email'), 1000);
               }
            }
        }
    }
  }, [activeTab, products, alertConfig, notify]);


  // --- Product Form State ---
  const initialProductFormState: Partial<Product> = {
      name: '', nameHindi: '', description: '', price: 0, discountPrice: 0,
      offerPercentage: 0, category: 'supplements', image: '', gallery: [], benefits: [],
      sku: '', stock: 0, reorderPoint: 10, inStock: true, isActive: true, variants: [], sales: 0, rating: 0, tags: []
  };
  const [productForm, setProductForm] = useState<Partial<Product>>(initialProductFormState);
  const [benefitsInput, setBenefitsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  
  // --- Helper: Derived Data ---
  const allTags = Array.from(new Set(products.flatMap(p => p.tags || []))).sort();

  // --- Tag Analytics Derived State ---
  const tagAnalytics = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
        p.tags?.forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1;
        });
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1]) // Sort by frequency
        .map(([name, count]) => ({ name, count }));
  }, [products]);

  // --- Product Functions ---
  const handleEditProduct = (product: Product) => {
    if (!can('manage_products')) return;
    setEditingProduct(product);
    setProductForm({ ...product, reorderPoint: product.reorderPoint || 10 });
    setBenefitsInput(product.benefits.join(', '));
    setTagsInput(product.tags ? product.tags.join(', ') : '');
    setActiveTab('products');
  };

  const handleSaveProduct = () => {
    if (!can('manage_products')) {
        alert('Permission Denied');
        return;
    }

    try {
        if (!productForm.name || !productForm.price || !productForm.sku) {
            throw new Error('Required fields missing: Name, Price, SKU');
        }

        const finalBenefits = benefitsInput.split(',').map(b => b.trim()).filter(Boolean);
        const finalTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
        
        const oldProduct = editingProduct; 
        
        const productData = {
            ...productForm,
            benefits: finalBenefits,
            tags: finalTags,
            price: Number(productForm.price),
            discountPrice: Number(productForm.discountPrice || 0),
            stock: Number(productForm.stock || 0),
            reorderPoint: Number(productForm.reorderPoint || 10),
            createdAt: productForm.createdAt || new Date().toISOString()
        } as Product;

        if (oldProduct) {
            onUpdateProduct(productData);
            logger.log('INFO', 'Product Updated', { userId: currentUser?.id, requestData: { productId: productData.id, sku: productData.sku } });
            
            if(oldProduct.stock !== productData.stock) {
                 logger.log('INFO', 'Stock Adjusted (Edit)', { 
                    userId: currentUser?.id, 
                    requestData: { 
                        productId: productData.id, 
                        oldStock: oldProduct.stock, 
                        newStock: productData.stock 
                    } 
                });
            }
        } else {
            const newProduct = { ...productData, id: Date.now().toString() };
            onAddProduct(newProduct);
            logger.log('INFO', 'Product Created', { userId: currentUser?.id, requestData: { sku: newProduct.sku } });
        }
        
        setEditingProduct(null);
        setProductForm(initialProductFormState);
        setBenefitsInput('');
        setTagsInput('');
        alert('Product saved successfully!');

    } catch (err: any) {
        logger.log('ERROR', 'Product Save Failed', { 
            userId: currentUser?.id, 
            error: err, 
            requestData: productForm,
            errorCode: 'PRODUCT_SAVE_FAIL'
        });
        const errorMessage = err instanceof Error ? err.message : String(err);
        alert(`Error: ${errorMessage}`);
    }
  };

  const handleDeleteProduct = (id: string) => {
      if (!can('delete_records')) {
          alert('Permission Denied: Cannot delete records');
          return;
      }
      if (confirm('Are you sure you want to delete this product?')) {
          onDeleteProduct(id);
          logger.log('WARNING', 'Product Deleted', { userId: currentUser?.id, requestData: { id } });
      }
  };

  // --- Inventory Functions ---
  const handleQuickUpdateStock = (productId: string, field: 'reorderPoint', value: number) => {
    if (!can('manage_products')) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Only allow reorder point updates inline. Stock updates must use modal.
    if (field === 'reorderPoint') {
        const updatedProduct = { ...product, [field]: value };
        onUpdateProduct(updatedProduct);
        const newTemp = { ...tempReorder };
        delete newTemp[productId];
        setTempReorder(newTemp);
    }
  };

  const openStockModal = (product: Product) => {
    setStockModalProduct(product);
    setStockAdjustment({ type: 'add', quantity: 0, reason: '' });
    setIsStockModalOpen(true);
  };

  const handleSaveStockAdjustment = () => {
    if(!stockModalProduct) return;
    
    // --- Validation: Reason is mandatory ---
    if (!stockAdjustment.reason || !stockAdjustment.reason.trim()) {
        notify('error', 'Please provide a reason for this stock adjustment.');
        return;
    }

    let newStock = stockModalProduct.stock;
    const qty = Number(stockAdjustment.quantity);

    if (stockAdjustment.type === 'add') newStock += qty;
    else if (stockAdjustment.type === 'remove') newStock = Math.max(0, newStock - qty);
    else if (stockAdjustment.type === 'set') newStock = Math.max(0, qty);

    const updatedProduct = { 
        ...stockModalProduct, 
        stock: newStock, 
        inStock: newStock > 0 
    };

    onUpdateProduct(updatedProduct);
    
    logger.log('INFO', 'Stock Adjustment', { 
        userId: currentUser?.id, 
        requestData: { 
            sku: stockModalProduct.sku, 
            type: stockAdjustment.type, 
            qty, 
            reason: stockAdjustment.reason,
            oldStock: stockModalProduct.stock,
            newStock 
        } 
    });

    notify('success', `Stock updated for ${stockModalProduct.name}`);
    setIsStockModalOpen(false);
    setStockModalProduct(null);
  };

  const getInventoryProducts = () => {
    return products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || 
                              p.sku?.toLowerCase().includes(inventorySearch.toLowerCase());
        
        const reorderLevel = p.reorderPoint || 10;
        let matchesFilter = true;
        
        if (inventoryFilter === 'out') {
            matchesFilter = p.stock <= 0;
        } else if (inventoryFilter === 'low') {
            matchesFilter = p.stock <= reorderLevel;
        }

        return matchesSearch && matchesFilter;
    }).sort((a, b) => a.stock - b.stock);
  };

  // --- Order Functions ---
  const handleOpenOrderModal = (order: Order) => {
      setEditingOrder(order);
      setOrderForm({
          status: order.status,
          trackingNumber: order.trackingNumber || ''
      });
  };

  const handleSaveOrder = async () => {
    if (!editingOrder || !can('manage_orders')) return;
    
    await orderService.updateOrderStatus(editingOrder.id, orderForm.status, orderForm.trackingNumber);
    
    // Refresh local order list
    setOrders(orders.map(o => o.id === editingOrder.id ? { 
        ...o, 
        status: orderForm.status, 
        trackingNumber: orderForm.trackingNumber 
    } : o));
    
    notify('success', `Order ${editingOrder.id} updated`);
    setEditingOrder(null);
  };
  
  // --- Media Functions ---
  const handlePrimaryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!can('manage_media')) return;
      if (e.target.files && e.target.files[0]) {
          setMediaUploadLoading(true);
          try {
             const newItem = await mediaService.uploadFile(e.target.files[0], currentUser?.id || 'admin', true); 
             setMediaItems(prev => [newItem, ...prev]);
             setProductForm({...productForm, image: newItem.url});
          } catch (err: any) {
              alert('Upload failed');
              logger.log('ERROR', 'File Upload Failed', { error: err });
          } finally {
              setMediaUploadLoading(false);
          }
      }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!can('manage_media')) return;
      if (e.target.files && e.target.files.length > 0) {
          setMediaUploadLoading(true);
          try {
              const newUrls: string[] = [];
              for(let i=0; i<e.target.files.length; i++) {
                  const file = e.target.files[i];
                  const newItem = await mediaService.uploadFile(file, currentUser?.id || 'admin', true);
                  setMediaItems(prev => [newItem, ...prev]);
                  newUrls.push(newItem.url);
              }
              setProductForm(prev => ({
                  ...prev,
                  gallery: [...(prev.gallery || []), ...newUrls]
              }));
          } catch (err: any) {
              alert('Gallery upload failed');
          } finally {
              setMediaUploadLoading(false);
          }
      }
  };

  // --- Tag Management Functions ---
  const handleRenameTag = () => {
      if(!editingTag || !newTagNameInput.trim()) return;
      const oldName = editingTag.name;
      const newName = newTagNameInput.trim();

      if (oldName === newName) {
          setEditingTag(null);
          return;
      }

      let updatedCount = 0;
      products.forEach(p => {
          if (p.tags?.includes(oldName)) {
              // Filter out old tag, add new tag
              const otherTags = p.tags.filter(t => t !== oldName);
              // Use Set to ensure uniqueness (Merging logic)
              const updatedTags = Array.from(new Set([...otherTags, newName]));
              onUpdateProduct({ ...p, tags: updatedTags });
              updatedCount++;
          }
      });

      logger.log('INFO', 'Tag Renamed/Merged', { 
          userId: currentUser?.id, 
          requestData: { oldName, newName, productsAffected: updatedCount } 
      });
      notify('success', `Tag updated on ${updatedCount} products`);
      setEditingTag(null);
      setNewTagNameInput('');
  };

  const handleDeleteTag = (tagName: string) => {
      if(!confirm(`Are you sure you want to delete the tag "${tagName}"? It will be removed from all products.`)) return;

      let updatedCount = 0;
      products.forEach(p => {
          if (p.tags?.includes(tagName)) {
              const updatedTags = p.tags.filter(t => t !== tagName);
              onUpdateProduct({ ...p, tags: updatedTags });
              updatedCount++;
          }
      });

      logger.log('WARNING', 'Tag Deleted', { 
          userId: currentUser?.id, 
          requestData: { tagName, productsAffected: updatedCount } 
      });
      notify('success', `Tag removed from ${updatedCount} products`);
  };

  // --- User Functions ---
  const handleUserRoleChange = async (userId: string, newRole: UserRole) => {
    if(!can('manage_users')) return;
    await authService.updateUser(userId, { role: newRole });
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    logger.log('INFO', 'User Role Updated', { userId: currentUser?.id, requestData: { targetUser: userId, newRole }});
  };

  const handleBlockUser = async (userId: string, blocked: boolean) => {
    if(!can('manage_users')) return;
    await authService.updateUser(userId, { isBlocked: blocked });
    setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: blocked } : u));
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if(!can('manage_media')) return;
    if(confirm('Delete this file permanently?')) {
        await mediaService.deleteMedia(mediaId);
        setMediaItems(mediaItems.filter(m => m.id !== mediaId));
    }
  };

  // --- Helper: Product Filters (Enhanced) ---
  const getFilteredProducts = () => {
      let filtered = products.filter(p => {
          // 1. Search Logic (Case-insensitive, Multi-field)
          const searchLower = productSearch.toLowerCase().trim();
          const matchesSearch = 
                !searchLower ||
                p.name.toLowerCase().includes(searchLower) || 
                p.sku?.toLowerCase().includes(searchLower) ||
                p.tags?.some(t => t.toLowerCase().includes(searchLower)) ||
                p.benefits?.some(b => b.toLowerCase().includes(searchLower));

          // 2. SKU Filter
          const skuLower = skuSearch.toLowerCase().trim();
          const matchesSku = !skuLower || p.sku?.toLowerCase().includes(skuLower);

          // 3. Category Filter (Multi-select)
          const matchesCat = selectedCategories.length === 0 || selectedCategories.includes(p.category);
          
          // 4. Tag Filter (Multi-select)
          const matchesTags = selectedTags.length === 0 || p.tags?.some(t => selectedTags.includes(t));

          // 5. Status Filter
          const matchesStatus = productFilterStatus === 'all' || 
                                (productFilterStatus === 'active' ? p.isActive : !p.isActive);

          return matchesSearch && matchesSku && matchesCat && matchesTags && matchesStatus;
      });
      return filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  };

  // Filter Toggle Helpers
  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => 
        prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-earth-50 font-sans text-earth-900">
      {/* Sidebar */}
      <div className="w-64 bg-earth-900 text-earth-100 flex flex-col shadow-2xl flex-shrink-0">
        <div className="p-6 border-b border-earth-800 flex items-center gap-3">
          <Shield className="h-8 w-8 text-herb-500" />
          <div>
            <h1 className="font-serif font-bold text-xl">Admin Panel</h1>
            <p className="text-xs text-earth-400">Goyal Neem Works</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'overview', icon: Activity, label: 'Overview', perm: 'view_financials' },
            { id: 'users', icon: Users, label: 'User Management', perm: 'manage_users' },
            { id: 'products', icon: Package, label: 'Product Catalog', perm: 'manage_products' },
            { id: 'inventory', icon: ClipboardList, label: 'Inventory Management', perm: 'manage_products' },
            { id: 'orders', icon: ShoppingCart, label: 'Orders', perm: 'manage_orders' },
            { id: 'media', icon: ImageIcon, label: 'Media Library', perm: 'manage_media' },
            { id: 'roles', icon: Key, label: 'Roles & Permissions', perm: 'manage_users' },
            { id: 'logs', icon: FileText, label: 'System Logs', perm: 'manage_settings' },
            { id: 'settings', icon: Settings, label: 'Global Settings', perm: 'manage_settings' },
          ].map((item) => {
              if (item.perm && !can(item.perm as Permission)) return null;
              return (
                <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === item.id 
                    ? 'bg-herb-600 text-white shadow-lg' 
                    : 'hover:bg-earth-800 text-earth-300'
                }`}
                >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                </button>
              );
          })}
        </nav>

        <div className="p-4 border-t border-earth-800 bg-earth-950/50">
             <div className="flex items-center justify-between mb-4 px-2">
                 <span className="text-xs font-bold text-earth-400">STATUS</span>
                 <span className={`h-2 w-2 rounded-full ${maintenanceMode ? 'bg-orange-500' : 'bg-green-500'}`}></span>
             </div>
            <button onClick={onClose} className="w-full flex items-center gap-2 px-4 py-2 text-earth-400 hover:text-white transition-colors bg-earth-800/50 rounded-lg">
                <LogOut className="h-4 w-4" />
                <span>Exit</span>
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-earth-50/50">
         <main className="p-8">
            
            {/* --- OVERVIEW TAB --- */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-serif font-bold text-earth-900">Dashboard Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-earth-100 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-herb-100 text-herb-600 rounded-xl"><Package className="h-6 w-6"/></div>
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+2.5%</span>
                            </div>
                            <p className="text-earth-500 text-sm font-bold uppercase">Total Products</p>
                            <p className="text-3xl font-bold text-earth-900 mt-2">{products.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-earth-100 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users className="h-6 w-6"/></div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Active</span>
                            </div>
                            <p className="text-earth-500 text-sm font-bold uppercase">Total Users</p>
                            <p className="text-3xl font-bold text-earth-900 mt-2">{users.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-earth-100 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><ShoppingCart className="h-6 w-6"/></div>
                            </div>
                            <p className="text-earth-500 text-sm font-bold uppercase">Pending Orders</p>
                            <p className="text-3xl font-bold text-earth-900 mt-2">{orders.filter(o => o.status === 'pending').length}</p>
                        </div>
                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-earth-100 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><DollarSign className="h-6 w-6"/></div>
                            </div>
                            <p className="text-earth-500 text-sm font-bold uppercase">Total Revenue</p>
                            <p className="text-3xl font-bold text-earth-900 mt-2">₹{orders.reduce((acc, o) => acc + o.totalAmount, 0)}</p>
                        </div>
                    </div>
                    
                    {/* NEW INVENTORY INSIGHTS SECTION */}
                    <div>
                         <h3 className="text-xl font-serif font-bold text-earth-900 mb-4 mt-2">Inventory Insights</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div 
                                onClick={() => { setActiveTab('inventory'); setInventoryFilter('all'); }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-earth-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
                            >
                                <div className="p-3 bg-teal-100 text-teal-600 rounded-xl"><Database className="h-6 w-6"/></div>
                                <div>
                                    <p className="text-earth-500 text-xs font-bold uppercase">Total Stock Value</p>
                                    <p className="text-2xl font-bold text-earth-900">₹{products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()}</p>
                                </div>
                            </div>
                            <div 
                                onClick={() => { setActiveTab('inventory'); setInventoryFilter('low'); }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-earth-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
                            >
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><AlertTriangle className="h-6 w-6"/></div>
                                <div>
                                    <p className="text-earth-500 text-xs font-bold uppercase">Low Stock Items</p>
                                    <p className="text-2xl font-bold text-earth-900">{products.filter(p => p.stock <= (p.reorderPoint || 10)).length}</p>
                                </div>
                            </div>
                            <div 
                                onClick={() => { setActiveTab('inventory'); setInventoryFilter('out'); }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-earth-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
                            >
                                <div className="p-3 bg-rose-100 text-rose-600 rounded-xl"><AlertCircle className="h-6 w-6"/></div>
                                <div>
                                    <p className="text-earth-500 text-xs font-bold uppercase">Out of Stock</p>
                                    <p className="text-2xl font-bold text-earth-900">{products.filter(p => p.stock <= 0).length}</p>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            )}

            {/* --- SETTINGS TAB --- */}
            {activeTab === 'settings' && (
                <div className="space-y-8">
                    <h2 className="text-2xl font-serif font-bold text-earth-900">System Settings</h2>
                    
                    {/* General Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-earth-100 p-6">
                        <h3 className="font-bold text-lg text-earth-900 mb-4 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-earth-500" /> General Configuration
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-earth-50 rounded-lg border border-earth-200">
                            <div>
                                <p className="font-bold text-earth-800">Maintenance Mode</p>
                                <p className="text-xs text-earth-500">Temporarily disable the store for customers</p>
                            </div>
                            <button 
                                onClick={toggleMaintenanceMode}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-herb-500 focus:ring-offset-2 ${maintenanceMode ? 'bg-orange-500' : 'bg-earth-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Tag Management */}
                    <div className="bg-white rounded-xl shadow-sm border border-earth-100 p-6">
                        <h3 className="font-bold text-lg text-earth-900 mb-4 flex items-center gap-2">
                            <Tag className="h-5 w-5 text-earth-500" /> Tag Management
                        </h3>
                        <p className="text-sm text-earth-600 mb-6">
                            Manage product tags. Renaming a tag will update all associated products. 
                            If you rename a tag to an existing one, they will be merged.
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-earth-50 text-xs font-bold text-earth-500 uppercase">
                                    <tr>
                                        <th className="p-3 border-b border-earth-200">Tag Name</th>
                                        <th className="p-3 border-b border-earth-200">Products Count</th>
                                        <th className="p-3 border-b border-earth-200 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-earth-100 text-sm">
                                    {tagAnalytics.length === 0 && (
                                        <tr><td colSpan={3} className="p-4 text-center text-earth-400 italic">No tags found in products.</td></tr>
                                    )}
                                    {tagAnalytics.map(({ name, count }) => (
                                        <tr key={name} className="hover:bg-earth-50/50 group">
                                            <td className="p-3 font-medium text-earth-900">
                                                <span className="bg-earth-100 text-earth-700 px-2 py-1 rounded-md text-xs font-bold border border-earth-200">
                                                    #{name}
                                                </span>
                                            </td>
                                            <td className="p-3 text-earth-600">{count} products</td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => { setEditingTag({ name, count }); setNewTagNameInput(name); }}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                        title="Rename / Merge"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteTag(name)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Delete Tag"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tag Edit Modal */}
                    {editingTag && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingTag(null)} />
                            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                                <div className="p-6">
                                    <h4 className="font-bold text-lg text-earth-900 mb-2">Edit Tag</h4>
                                    <p className="text-xs text-earth-500 mb-4">
                                        Renaming <strong>#{editingTag.name}</strong> (used in {editingTag.count} products).
                                    </p>
                                    
                                    <label className="text-xs font-bold text-earth-500 uppercase block mb-1">New Tag Name</label>
                                    <input 
                                        className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-herb-500 outline-none mb-4"
                                        value={newTagNameInput}
                                        onChange={(e) => setNewTagNameInput(e.target.value)}
                                        placeholder="e.g. Organic"
                                    />
                                    
                                    <div className="bg-blue-50 p-3 rounded-lg flex gap-3 items-start mb-4">
                                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-800">
                                            Tip: If you enter a tag name that already exists, this tag will be <strong>merged</strong> into it.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setEditingTag(null)}
                                            className="flex-1 py-2 text-earth-600 font-bold hover:bg-earth-50 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleRenameTag}
                                            disabled={!newTagNameInput.trim() || newTagNameInput.trim() === editingTag.name}
                                            className="flex-1 py-2 bg-herb-600 text-white font-bold rounded-lg hover:bg-herb-700 disabled:opacity-50"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- PRODUCTS TAB (STRICT RULES) --- */}
            {activeTab === 'products' && (
                <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                         <h2 className="text-2xl font-serif font-bold text-earth-900">Product Management</h2>
                         <div className="flex gap-3">
                             {can('manage_products') && (
                                <button onClick={() => { setEditingProduct(null); setProductForm(initialProductFormState); }} className="bg-herb-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md hover:bg-herb-700 transition-all">
                                    <Plus className="h-5 w-5" /> Add Product
                                </button>
                             )}
                         </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                        {/* List View */}
                        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-earth-200 flex flex-col overflow-hidden h-[80vh]">
                            <div className="p-4 border-b border-earth-100 space-y-3 z-20 relative">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-earth-400" />
                                    <input 
                                        className="w-full pl-9 pr-9 py-2 bg-earth-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-herb-500 transition-all" 
                                        placeholder="Search name, SKU, tags, benefits..."
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                    />
                                    {productSearch && (
                                        <button 
                                            onClick={() => setProductSearch('')}
                                            className="absolute right-3 top-2.5 text-earth-400 hover:text-earth-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                {/* ... [Rest of filter logic same as original] ... */}
                                <div className="flex gap-2 flex-wrap">
                                    {/* SKU Filter */}
                                    <div className="relative">
                                        <input
                                            className={`w-full text-xs p-2 rounded-lg border outline-none transition-all ${skuSearch ? 'bg-purple-50 border-purple-200 text-purple-800 font-bold' : 'bg-earth-50 border-transparent text-earth-600 hover:border-earth-200'}`}
                                            placeholder="Filter SKU..."
                                            value={skuSearch}
                                            onChange={e => setSkuSearch(e.target.value)}
                                            style={{ width: '80px' }}
                                        />
                                    </div>

                                    {/* Category Filter */}
                                    <div className="relative flex-1">
                                        <button 
                                            onClick={() => { setIsCatDropdownOpen(!isCatDropdownOpen); setIsTagDropdownOpen(false); }}
                                            className={`w-full text-xs p-2 rounded-lg flex items-center justify-between border transition-all ${
                                                selectedCategories.length > 0 ? 'bg-herb-50 border-herb-200 text-herb-800 font-bold' : 'bg-earth-50 border-transparent text-earth-600 hover:border-earth-200'
                                            }`}
                                        >
                                            <span className="truncate">
                                                {selectedCategories.length === 0 ? 'Categories' : `Cat. (${selectedCategories.length})`}
                                            </span>
                                            <ChevronDown className={`h-3 w-3 transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isCatDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setIsCatDropdownOpen(false)} />
                                                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-earth-100 shadow-xl rounded-lg overflow-hidden z-20 animate-in fade-in zoom-in-95">
                                                    <div className="p-2 border-b border-earth-50 flex justify-between bg-earth-50/50">
                                                        <span className="text-[10px] font-bold text-earth-500 uppercase tracking-wider">Filter by Category</span>
                                                        <button onClick={() => setSelectedCategories([])} className="text-[10px] text-red-500 hover:underline">Clear</button>
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto p-1">
                                                        {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                                            <div 
                                                                key={c.id} 
                                                                className="flex items-center gap-3 p-2 hover:bg-earth-50 cursor-pointer rounded-md transition-colors"
                                                                onClick={(e) => { e.stopPropagation(); toggleCategory(c.id); }}
                                                            >
                                                                <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${selectedCategories.includes(c.id) ? 'bg-herb-600 border-herb-600' : 'border-earth-300 bg-white'}`}>
                                                                    {selectedCategories.includes(c.id) && <CheckSquare className="h-3 w-3 text-white" />}
                                                                </div>
                                                                <span className="text-sm text-earth-700">{c.label.split('(')[0]}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Tags Filter */}
                                    <div className="relative flex-1">
                                        <button 
                                            onClick={() => { setIsTagDropdownOpen(!isTagDropdownOpen); setIsCatDropdownOpen(false); }}
                                            className={`w-full text-xs p-2 rounded-lg flex items-center justify-between border transition-all ${
                                                selectedTags.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold' : 'bg-earth-50 border-transparent text-earth-600 hover:border-earth-200'
                                            }`}
                                        >
                                            <span className="truncate">
                                                {selectedTags.length === 0 ? 'Tags' : `Tags (${selectedTags.length})`}
                                            </span>
                                            <ChevronDown className={`h-3 w-3 transition-transform ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isTagDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setIsTagDropdownOpen(false)} />
                                                <div className="absolute top-full right-0 md:left-0 mt-1 w-56 bg-white border border-earth-100 shadow-xl rounded-lg overflow-hidden z-20 animate-in fade-in zoom-in-95">
                                                    <div className="p-2 border-b border-earth-50 flex justify-between bg-earth-50/50">
                                                        <span className="text-[10px] font-bold text-earth-500 uppercase tracking-wider">Filter by Tag</span>
                                                        <button onClick={() => setSelectedTags([])} className="text-[10px] text-red-500 hover:underline">Clear</button>
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto p-1">
                                                        {allTags.length === 0 && <div className="p-4 text-center text-xs text-earth-400 italic">No tags available</div>}
                                                        {allTags.map((tag: string) => (
                                                            <div 
                                                                key={tag} 
                                                                className="flex items-center gap-3 p-2 hover:bg-earth-50 cursor-pointer rounded-md transition-colors"
                                                                onClick={(e) => { e.stopPropagation(); toggleTag(tag); }}
                                                            >
                                                                <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${selectedTags.includes(tag) ? 'bg-blue-600 border-blue-600' : 'border-earth-300 bg-white'}`}>
                                                                    {selectedTags.includes(tag) && <CheckSquare className="h-3 w-3 text-white" />}
                                                                </div>
                                                                <span className="text-sm text-earth-700 truncate">#{tag}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    
                                    {/* Status Filter */}
                                    <select 
                                        className={`text-xs p-2 rounded-lg border w-24 outline-none transition-all ${
                                            productFilterStatus !== 'all' ? 'bg-orange-50 border-orange-200 text-orange-800 font-bold' : 'bg-earth-50 border-transparent text-earth-600 hover:border-earth-200'
                                        }`}
                                        value={productFilterStatus} 
                                        onChange={e => setProductFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                                    >
                                        <option value="all">Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                
                                {/* Active Filters Chips */}
                                {(selectedCategories.length > 0 || selectedTags.length > 0 || skuSearch || productFilterStatus !== 'all') && (
                                    <div className="flex flex-wrap gap-1 mt-1 pt-2 border-t border-earth-50">
                                        {skuSearch && (
                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium border border-purple-200">
                                                SKU: {skuSearch} <X className="h-3 w-3 cursor-pointer hover:text-purple-900" onClick={() => setSkuSearch('')} />
                                            </span>
                                        )}
                                        {selectedCategories.map((c: string) => {
                                            const label = CATEGORIES.find(cat => cat.id === c)?.label?.split('(')[0] || c;
                                            return (
                                                <span key={c} className="text-[10px] bg-herb-100 text-herb-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium border border-herb-200">
                                                    {label} <X className="h-3 w-3 cursor-pointer hover:text-herb-900" onClick={() => toggleCategory(c)} />
                                                </span>
                                            );
                                        })}
                                        {selectedTags.map((t: string) => (
                                            <span key={t} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium border border-blue-200">
                                                #{t} <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => toggleTag(t)} />
                                            </span>
                                        ))}
                                        {productFilterStatus !== 'all' && (
                                            <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium border border-orange-200">
                                                Status: {productFilterStatus} <X className="h-3 w-3 cursor-pointer hover:text-orange-900" onClick={() => setProductFilterStatus('all')} />
                                            </span>
                                        )}
                                        <button 
                                            onClick={() => { setSelectedCategories([]); setSelectedTags([]); setProductFilterStatus('all'); setProductSearch(''); setSkuSearch(''); }} 
                                            className="text-[10px] text-red-500 hover:text-red-700 hover:underline px-1 ml-auto font-medium"
                                        >
                                            Reset All
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {getFilteredProducts().map(product => (
                                    <div 
                                        key={product.id} 
                                        onClick={() => handleEditProduct(product)}
                                        className={`p-4 border-b border-earth-50 hover:bg-earth-50 cursor-pointer transition-colors ${editingProduct?.id === product.id ? 'bg-earth-50 border-l-4 border-l-herb-500' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <img src={product.image} className="w-12 h-12 rounded-lg object-cover bg-earth-200 border border-earth-100" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-sm text-earth-900 truncate">{product.name}</h4>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {product.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-earth-500 truncate font-mono mt-0.5">SKU: {product.sku || 'N/A'}</p>
                                                <div className="flex justify-between items-end mt-2">
                                                    <span className="text-xs font-medium bg-earth-100 px-2 py-0.5 rounded text-earth-700">₹{product.price}</span>
                                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${product.stock < 10 ? 'text-red-500' : 'text-earth-400'}`}>
                                                        {product.stock < 10 && <AlertTriangle className="h-3 w-3" />}
                                                        Stock: {product.stock}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {getFilteredProducts().length === 0 && (
                                    <div className="p-12 text-center text-earth-400 flex flex-col items-center">
                                        <Filter className="h-8 w-8 mb-2 opacity-20" />
                                        <p className="text-sm font-medium">No products match your filters.</p>
                                        <button 
                                            onClick={() => { setSelectedCategories([]); setSelectedTags([]); setProductFilterStatus('all'); setProductSearch(''); setSkuSearch(''); }}
                                            className="mt-2 text-xs text-herb-600 hover:underline"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Edit Form */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-earth-200 p-6 overflow-y-auto h-[80vh]">
                            {/* ... [Rest of Edit form logic same as original] ... */}
                            <h3 className="font-serif font-bold text-lg mb-6 flex items-center gap-2 text-earth-900">
                                {editingProduct ? <div className="p-2 bg-herb-50 rounded-full"><Edit className="h-5 w-5 text-herb-600" /></div> : <div className="p-2 bg-herb-50 rounded-full"><Plus className="h-5 w-5 text-herb-600" /></div>}
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h3>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-earth-500 uppercase block mb-1">Product Title *</label>
                                        <input className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-herb-500 outline-none transition-all" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} placeholder="e.g. Organic Neem Powder" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-earth-500 uppercase block mb-1">Hindi Name</label>
                                        <input className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-herb-500 outline-none transition-all" value={productForm.nameHindi} onChange={e => setProductForm({...productForm, nameHindi: e.target.value})} placeholder="e.g. नीम पाउडर" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-earth-500 uppercase block mb-1">SKU Code *</label>
                                        <input className="w-full border p-2 rounded-lg font-mono focus:ring-2 focus:ring-herb-500 outline-none transition-all" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} placeholder="GNW-001" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-earth-500 uppercase block mb-1">Description *</label>
                                    <textarea className="w-full border p-2 rounded-lg h-24 focus:ring-2 focus:ring-herb-500 outline-none transition-all resize-none" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} placeholder="Detailed description..." />
                                </div>

                                <div className="grid grid-cols-3 gap-4 bg-earth-50 p-4 rounded-xl border border-earth-100">
                                    <div>
                                        <label className="text-xs font-bold text-earth-500 uppercase block mb-1">Price (₹) *</label>
                                        <input type="number" className="w-full border p-2 rounded-lg bg-white focus:ring-2 focus:ring-herb-500 outline-none transition-all" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-earth-500 uppercase block mb-1">Stock Qty *</label>
                                        <input type="number" className="w-full border p-2 rounded-lg bg-white focus:ring-2 focus:ring-herb-500 outline-none transition-all" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})} />
                                    </div>
                                     <div>
                                        <label className="text-xs font-bold text-earth-500 uppercase block mb-1">Reorder Point</label>
                                        <input type="number" className="w-full border p-2 rounded-lg bg-white focus:ring-2 focus:ring-herb-500 outline-none transition-all" value={productForm.reorderPoint} onChange={e => setProductForm({...productForm, reorderPoint: Number(e.target.value)})} />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-earth-500 uppercase block mb-1">Category</label>
                                    <select className="w-full border p-2 rounded-lg bg-white focus:ring-2 focus:ring-herb-500 outline-none transition-all" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value as Product['category']})}>
                                        {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="text-xs font-bold text-earth-500 uppercase block mb-1">Tags (comma separated)</label>
                                        <input className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-herb-500 outline-none transition-all" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Organic, Skin, Detox" />
                                     </div>
                                     <div>
                                        <label className="text-xs font-bold text-earth-500 uppercase block mb-1">Benefits (comma separated)</label>
                                        <input className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-herb-500 outline-none transition-all" value={benefitsInput} onChange={e => setBenefitsInput(e.target.value)} placeholder="Clear Skin, Immunity" />
                                     </div>
                                </div>

                                <div className="p-4 rounded-xl border border-earth-200 bg-earth-50/50">
                                    <label className="text-xs font-bold text-earth-500 uppercase block mb-2">Primary Image URL</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="h-20 w-20 bg-earth-100 rounded-lg overflow-hidden border">
                                            {productForm.image ? <img src={productForm.image} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-earth-400 text-xs">No Img</div>}
                                        </div>
                                        <div className="flex-1">
                                             <input className="w-full border p-2 rounded-lg mb-2 text-sm focus:ring-2 focus:ring-herb-500 outline-none transition-all" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} placeholder="https://..." />
                                             <label className="text-xs bg-white border border-earth-200 px-3 py-1.5 rounded cursor-pointer hover:bg-earth-50 inline-flex items-center gap-2 shadow-sm transition-all">
                                                 <UploadCloud className="h-3 w-3" /> Upload Primary
                                                 <input type="file" className="hidden" onChange={handlePrimaryImageUpload} />
                                             </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-earth-200 mt-4 bg-earth-50/50">
                                    <label className="text-xs font-bold text-earth-500 uppercase block mb-2">Product Gallery (Multiple)</label>
                                    <div className="grid grid-cols-4 gap-3 mb-3">
                                        {productForm.gallery?.map((img, idx) => (
                                            <div key={idx} className="relative h-20 w-20 rounded-lg overflow-hidden group border border-earth-100 shadow-sm">
                                                <img src={img} className="w-full h-full object-cover" />
                                                <button 
                                                    onClick={() => {
                                                        const newGallery = productForm.gallery?.filter((_, i) => i !== idx);
                                                        setProductForm({...productForm, gallery: newGallery});
                                                    }}
                                                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="h-20 w-20 bg-white border-2 border-dashed border-earth-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-earth-50 hover:border-herb-400 transition-all group">
                                            {mediaUploadLoading ? <Loader2 className="h-5 w-5 animate-spin text-herb-600"/> : <UploadCloud className="h-5 w-5 text-earth-400 group-hover:text-herb-500" />}
                                            <span className="text-[10px] text-earth-500 font-bold mt-1 group-hover:text-herb-600">Add</span>
                                            <input type="file" multiple className="hidden" onChange={handleGalleryUpload} />
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-earth-400">* Supported: JPG, PNG, WEBP. Auto-compressed.</p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-earth-100">
                                     <div className="flex items-center gap-4">
                                         <label className="flex items-center gap-2 cursor-pointer select-none">
                                             <div className={`w-10 h-6 rounded-full p-1 transition-colors ${productForm.isActive ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => setProductForm({...productForm, isActive: !productForm.isActive})}>
                                                 <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${productForm.isActive ? 'translate-x-4' : ''}`} />
                                             </div>
                                             <span className="text-sm font-bold text-earth-700">Active / Published</span>
                                         </label>
                                     </div>
                                     <div className="flex gap-3">
                                         {editingProduct && can('delete_records') && (
                                             <button onClick={() => handleDeleteProduct(editingProduct.id)} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors">Delete</button>
                                         )}
                                         <button onClick={handleSaveProduct} className="px-6 py-2 bg-herb-600 text-white rounded-lg font-bold hover:bg-herb-700 shadow-lg transition-all transform hover:-translate-y-0.5">
                                             Save Product
                                         </button>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- INVENTORY MANAGEMENT TAB --- */}
            {activeTab === 'inventory' && (
                <div className="h-full flex flex-col relative">
                     <div className="flex justify-between items-center mb-6">
                         <h2 className="text-2xl font-serif font-bold text-earth-900">Inventory Management</h2>
                         <div className="flex gap-2">
                             {/* Alert Config Trigger */}
                             <div className="relative">
                                 <button 
                                    onClick={() => setIsAlertConfigOpen(!isAlertConfigOpen)}
                                    className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${isAlertConfigOpen ? 'bg-earth-200 text-earth-800' : 'bg-white border border-earth-200 text-earth-700 hover:bg-earth-50'}`}
                                 >
                                    <Bell className={`h-4 w-4 ${alertConfig.dashboard ? 'text-herb-600 fill-herb-600' : ''}`} />
                                    Alerts
                                 </button>
                                 
                                 {/* Config Popup */}
                                 {isAlertConfigOpen && (
                                     <>
                                         <div className="fixed inset-0 z-10" onClick={() => setIsAlertConfigOpen(false)} />
                                         <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-earth-100 p-4 z-20 animate-in fade-in zoom-in-95">
                                             <h4 className="font-bold text-earth-900 mb-3 flex items-center gap-2">
                                                 <AlertTriangle className="h-4 w-4 text-orange-500" /> Stock Alerts
                                             </h4>
                                             <div className="space-y-3">
                                                 <div className="flex items-center justify-between">
                                                     <div className="text-sm">
                                                         <p className="font-medium text-earth-800">Dashboard Notifications</p>
                                                         <p className="text-xs text-earth-500">Show in-app alerts</p>
                                                     </div>
                                                     <div 
                                                        className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${alertConfig.dashboard ? 'bg-green-500' : 'bg-gray-300'}`}
                                                        onClick={() => setAlertConfig({...alertConfig, dashboard: !alertConfig.dashboard})}
                                                     >
                                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${alertConfig.dashboard ? 'translate-x-4' : ''}`} />
                                                     </div>
                                                 </div>
                                                 <div className="flex items-center justify-between">
                                                     <div className="text-sm">
                                                         <p className="font-medium text-earth-800">Email Reports</p>
                                                         <p className="text-xs text-earth-500">Send to admin@veda.com</p>
                                                     </div>
                                                     <div 
                                                        className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${alertConfig.email ? 'bg-green-500' : 'bg-gray-300'}`}
                                                        onClick={() => setAlertConfig({...alertConfig, email: !alertConfig.email})}
                                                     >
                                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${alertConfig.email ? 'translate-x-4' : ''}`} />
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                     </>
                                 )}
                             </div>

                             <button className="bg-earth-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                                 <Download className="h-4 w-4" /> Export Report
                             </button>
                         </div>
                    </div>

                    {/* Inventory Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-earth-100 flex items-center gap-4">
                            <div className="p-3 bg-teal-100 text-teal-600 rounded-xl"><Database className="h-6 w-6"/></div>
                            <div>
                                <p className="text-xs text-earth-500 font-bold uppercase">Total Stock Value</p>
                                <p className="text-2xl font-bold text-earth-900">₹{products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()}</p>
                            </div>
                        </div>
                         <div className="bg-white p-4 rounded-xl shadow-sm border border-earth-100 flex items-center gap-4">
                            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><AlertTriangle className="h-6 w-6"/></div>
                            <div>
                                <p className="text-xs text-earth-500 font-bold uppercase">Low Stock Items</p>
                                <p className="text-2xl font-bold text-earth-900">{products.filter(p => p.stock <= (p.reorderPoint || 10)).length}</p>
                            </div>
                        </div>
                         <div className="bg-white p-4 rounded-xl shadow-sm border border-earth-100 flex items-center gap-4">
                            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl"><AlertCircle className="h-6 w-6"/></div>
                            <div>
                                <p className="text-xs text-earth-500 font-bold uppercase">Out of Stock</p>
                                <p className="text-xl font-bold text-earth-900">{products.filter(p => p.stock <= 0).length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-earth-200 overflow-hidden h-full flex flex-col">
                        <div className="p-4 border-b border-earth-100 bg-earth-50 flex gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-earth-400" />
                                <input 
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-earth-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-herb-500" 
                                    placeholder="Search products..."
                                    value={inventorySearch}
                                    onChange={e => setInventorySearch(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setInventoryFilter('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${inventoryFilter === 'all' ? 'bg-earth-800 text-white' : 'bg-white border border-earth-200 text-earth-600'}`}
                                >
                                    All
                                </button>
                                <button 
                                    onClick={() => setInventoryFilter('low')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${inventoryFilter === 'low' ? 'bg-orange-500 text-white' : 'bg-white border border-earth-200 text-earth-600'}`}
                                >
                                    Low Stock
                                </button>
                                <button 
                                    onClick={() => setInventoryFilter('out')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${inventoryFilter === 'out' ? 'bg-red-600 text-white' : 'bg-white border border-earth-200 text-earth-600'}`}
                                >
                                    Out of Stock
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-earth-50 text-xs font-bold text-earth-500 uppercase sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 border-b border-earth-200">Product</th>
                                        <th className="p-4 border-b border-earth-200">SKU</th>
                                        <th className="p-4 border-b border-earth-200">Current Stock</th>
                                        <th className="p-4 border-b border-earth-200">Reorder Point</th>
                                        <th className="p-4 border-b border-earth-200">Status</th>
                                        <th className="p-4 border-b border-earth-200">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-earth-100">
                                    {getInventoryProducts().map(product => {
                                        const reorderLevel = product.reorderPoint || 10;
                                        const isLow = product.stock <= reorderLevel && product.stock > 0;
                                        const isOut = product.stock <= 0;
                                        const reorderVal = tempReorder[product.id] !== undefined ? tempReorder[product.id] : reorderLevel;
                                        
                                        return (
                                            <tr key={product.id} className="hover:bg-earth-50/50">
                                                <td className="p-4 flex items-center gap-3">
                                                    <img src={product.image} className="w-10 h-10 rounded object-cover border border-earth-200" />
                                                    <span className="font-medium text-sm text-earth-900">{product.name}</span>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-earth-600">{product.sku}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-mono font-bold text-sm ${isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-earth-900'}`}>
                                                            {product.stock}
                                                        </span>
                                                        <button 
                                                            onClick={() => openStockModal(product)} 
                                                            className="px-2 py-1 bg-herb-100 hover:bg-herb-200 text-herb-800 rounded text-xs font-bold transition-colors flex items-center gap-1"
                                                            title="Adjust Stock (Requires Reason)"
                                                        >
                                                            <Edit2 className="h-3 w-3" /> Adjust
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                     <div className="flex items-center gap-2">
                                                        <input 
                                                            type="number"
                                                            className="w-20 border border-earth-200 rounded px-2 py-1 text-sm"
                                                            value={reorderVal}
                                                            onChange={(e) => setTempReorder({...tempReorder, [product.id]: parseInt(e.target.value) || 0})}
                                                            onBlur={() => handleQuickUpdateStock(product.id, 'reorderPoint', reorderVal)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleQuickUpdateStock(product.id, 'reorderPoint', reorderVal)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {isOut ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                            <AlertCircle className="h-3 w-3" /> Out of Stock
                                                        </span>
                                                    ) : isLow ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                                                            <AlertTriangle className="h-3 w-3" /> Low Stock
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                            <CheckCircle className="h-3 w-3" /> In Stock
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-xs text-earth-500">
                                                    {new Date(product.createdAt || Date.now()).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {getInventoryProducts().length === 0 && (
                                <div className="p-12 text-center text-earth-500">
                                    <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p>No products found matching your search.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Stock Adjustment Modal */}
                    {isStockModalOpen && stockModalProduct && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsStockModalOpen(false)} />
                            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                                <div className="bg-earth-50 p-6 border-b border-earth-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-serif font-bold text-lg text-earth-900">Adjust Stock</h3>
                                        <p className="text-xs text-earth-500 font-mono">{stockModalProduct.name} (Current: {stockModalProduct.stock})</p>
                                    </div>
                                    <button onClick={() => setIsStockModalOpen(false)} className="text-earth-400 hover:text-earth-800"><X className="h-5 w-5"/></button>
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* Type Selection */}
                                    <div className="flex bg-earth-100 p-1 rounded-lg">
                                        {(['add', 'remove', 'set'] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setStockAdjustment({...stockAdjustment, type})}
                                                className={`flex-1 py-2 text-sm font-bold rounded-md capitalize transition-all ${
                                                    stockAdjustment.type === type 
                                                    ? 'bg-white text-herb-700 shadow-sm' 
                                                    : 'text-earth-500 hover:text-earth-700'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Quantity Input */}
                                    <div>
                                        <label className="text-xs font-bold text-earth-500 uppercase block mb-1">
                                            {stockAdjustment.type === 'set' ? 'New Total Quantity' : 'Quantity to Adjust'}
                                        </label>
                                        <div className="flex items-center">
                                            <input 
                                                type="number" 
                                                min="0"
                                                className="w-full border border-earth-200 rounded-lg p-3 text-lg font-mono font-bold outline-none focus:ring-2 focus:ring-herb-500"
                                                value={stockAdjustment.quantity}
                                                onChange={e => setStockAdjustment({...stockAdjustment, quantity: parseInt(e.target.value) || 0})}
                                            />
                                        </div>
                                    </div>

                                    {/* Reason Input */}
                                    <div>
                                        <label className="text-xs font-bold text-earth-500 uppercase block mb-1">Reason *</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-earth-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-herb-500"
                                            placeholder="e.g. Shipment received, Damaged goods"
                                            value={stockAdjustment.reason}
                                            onChange={e => setStockAdjustment({...stockAdjustment, reason: e.target.value})}
                                        />
                                    </div>

                                    {/* Summary Preview */}
                                    <div className="bg-earth-50 p-4 rounded-xl flex justify-between items-center text-sm">
                                        <span className="text-earth-600">New Stock Level:</span>
                                        <span className="font-bold text-lg text-earth-900">
                                            {stockAdjustment.type === 'add' ? stockModalProduct.stock + stockAdjustment.quantity :
                                             stockAdjustment.type === 'remove' ? Math.max(0, stockModalProduct.stock - stockAdjustment.quantity) :
                                             stockAdjustment.quantity}
                                        </span>
                                    </div>

                                    <button 
                                        onClick={handleSaveStockAdjustment}
                                        className="w-full bg-herb-600 text-white py-3 rounded-xl font-bold hover:bg-herb-700 transition-colors"
                                    >
                                        Confirm Adjustment
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* --- ORDERS MANAGEMENT TAB --- */}
            {activeTab === 'orders' && (
                <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-serif font-bold text-earth-900">Order Management</h2>
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-earth-400" />
                            <input 
                                className="w-full pl-9 pr-4 py-2 bg-white border border-earth-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-herb-500" 
                                placeholder="Search Order ID, Status, or Tracking..."
                                value={orderSearch}
                                onChange={e => setOrderSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-earth-200 flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-earth-50 text-xs font-bold text-earth-500 uppercase sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 border-b border-earth-200">Order Details</th>
                                        <th className="p-4 border-b border-earth-200">Items</th>
                                        <th className="p-4 border-b border-earth-200">Customer</th>
                                        <th className="p-4 border-b border-earth-200">Status</th>
                                        <th className="p-4 border-b border-earth-200">Tracking #</th>
                                        <th className="p-4 border-b border-earth-200">Total</th>
                                        <th className="p-4 border-b border-earth-200">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-earth-100 text-sm">
                                    {orders.filter(o => 
                                        o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
                                        o.status.toLowerCase().includes(orderSearch.toLowerCase()) ||
                                        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(orderSearch.toLowerCase()))
                                    ).map(order => (
                                        <tr key={order.id} className="hover:bg-earth-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-earth-900">{order.id}</div>
                                                <div className="text-xs text-earth-500 flex items-center gap-1 mt-1">
                                                    <Calendar className="h-3 w-3" /> {new Date(order.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-earth-600">
                                                {order.items.length} items
                                                <div className="text-[10px] text-earth-400 mt-0.5 truncate max-w-[150px]">
                                                    {order.items.map(i => i.name).join(', ')}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-earth-900 font-medium">User: {order.userId}</div>
                                                <div className="text-xs text-earth-500 truncate max-w-[150px]">{order.shippingAddress.city}, {order.shippingAddress.zipCode}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-earth-700">
                                                {order.trackingNumber || <span className="text-earth-300 italic">None</span>}
                                            </td>
                                            <td className="p-4 font-bold text-earth-900">₹{order.totalAmount}</td>
                                            <td className="p-4">
                                                <button 
                                                    onClick={() => handleOpenOrderModal(order)}
                                                    className="px-3 py-1.5 border border-earth-200 hover:bg-herb-50 hover:border-herb-200 hover:text-herb-700 rounded-lg text-xs font-bold transition-all"
                                                >
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Edit Order Modal */}
                    {editingOrder && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingOrder(null)} />
                            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                                <div className="bg-earth-50 p-6 border-b border-earth-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-serif font-bold text-lg text-earth-900">Update Order</h3>
                                        <p className="text-xs text-earth-500 font-mono">Order ID: {editingOrder.id}</p>
                                    </div>
                                    <button onClick={() => setEditingOrder(null)} className="text-earth-400 hover:text-earth-800"><X className="h-5 w-5"/></button>
                                </div>
                                
                                <div className="p-6 space-y-6">
                                    {/* Order Summary */}
                                    <div className="bg-earth-50/50 p-4 rounded-xl border border-earth-100 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-earth-500">Customer ID:</span>
                                            <span className="font-medium text-earth-900">{editingOrder.userId}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-earth-500">Total Amount:</span>
                                            <span className="font-bold text-earth-900">₹{editingOrder.totalAmount}</span>
                                        </div>
                                        <div className="text-xs text-earth-400 mt-2 pt-2 border-t border-earth-100">
                                            {editingOrder.shippingAddress.street}, {editingOrder.shippingAddress.city}, {editingOrder.shippingAddress.state} - {editingOrder.shippingAddress.zipCode}
                                        </div>
                                    </div>

                                    {/* Status Update */}
                                    <div>
                                        <label className="text-xs font-bold text-earth-500 uppercase block mb-1">Order Status</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full border border-earth-200 rounded-lg p-3 bg-white appearance-none outline-none focus:ring-2 focus:ring-herb-500"
                                                value={orderForm.status}
                                                onChange={(e) => setOrderForm({...orderForm, status: e.target.value as OrderStatus})}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="packed">Packed</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-earth-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Tracking Number Input */}
                                    <div>
                                        <label className="text-xs font-bold text-earth-500 uppercase block mb-1">Tracking Number</label>
                                        <div className="relative">
                                            <Truck className="absolute left-3 top-3 h-5 w-5 text-earth-400" />
                                            <input 
                                                type="text" 
                                                className="w-full border border-earth-200 rounded-lg p-2.5 pl-10 outline-none focus:ring-2 focus:ring-herb-500"
                                                placeholder="e.g. FEDEX-123456789"
                                                value={orderForm.trackingNumber}
                                                onChange={(e) => setOrderForm({...orderForm, trackingNumber: e.target.value})}
                                            />
                                        </div>
                                        <p className="text-[10px] text-earth-400 mt-1 ml-1">Visible to customer once saved.</p>
                                    </div>

                                    <button 
                                        onClick={handleSaveOrder}
                                        className="w-full bg-herb-600 text-white py-3 rounded-xl font-bold hover:bg-herb-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Save className="h-4 w-4" /> Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* --- SYSTEM LOGS TAB --- */}
            {activeTab === 'logs' && (
                <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-serif font-bold text-earth-900">System Logs</h2>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => { logger.clearLogs(); setSystemLogs([]); notify('info', 'Logs cleared'); }}
                                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" /> Clear Logs
                            </button>
                            <button 
                                onClick={() => logger.exportLogs()}
                                className="bg-earth-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-earth-900 transition-colors"
                            >
                                <Download className="h-4 w-4" /> Export CSV
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-earth-200 flex flex-col h-full overflow-hidden">
                        <div className="p-4 border-b border-earth-100 bg-earth-50 flex gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-earth-400" />
                                <input 
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-earth-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-herb-500" 
                                    placeholder="Search logs..."
                                    value={logFilter.search}
                                    onChange={e => setLogFilter({...logFilter, search: e.target.value})}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-earth-400" />
                                <select 
                                    className="px-4 py-2 bg-white border border-earth-200 rounded-lg text-sm font-bold text-earth-700 outline-none focus:ring-1 focus:ring-herb-500 cursor-pointer"
                                    value={logFilter.severity}
                                    onChange={e => setLogFilter({...logFilter, severity: e.target.value})}
                                >
                                    <option value="ALL">All Severities</option>
                                    <option value="INFO">Info</option>
                                    <option value="WARNING">Warning</option>
                                    <option value="ERROR">Error</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-earth-50 text-xs font-bold text-earth-500 uppercase sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 border-b border-earth-200 w-48">Timestamp</th>
                                        <th className="p-4 border-b border-earth-200 w-24">Level</th>
                                        <th className="p-4 border-b border-earth-200">Message</th>
                                        <th className="p-4 border-b border-earth-200 w-40">User</th>
                                        <th className="p-4 border-b border-earth-200 w-40">Context</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-earth-100 text-sm">
                                    {systemLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-earth-50/50 transition-colors">
                                            <td className="p-4 text-earth-500 text-xs font-mono">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                    log.severity === 'CRITICAL' ? 'bg-red-600 text-white border-red-600' :
                                                    log.severity === 'ERROR' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    log.severity === 'WARNING' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                    {log.severity}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-earth-900">{log.message}</div>
                                                {log.errorCode && log.errorCode !== 'UNKNOWN' && (
                                                    <span className="text-xs text-earth-400 font-mono mt-0.5 block">Code: {log.errorCode}</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-xs text-earth-600">
                                                <div className="flex items-center gap-1.5">
                                                    <UserCheck className="h-3 w-3 text-earth-400"/> 
                                                    <span className="truncate max-w-[120px]">{log.userId || 'Guest'}</span>
                                                </div>
                                            </td>
                                             <td className="p-4 text-xs text-earth-500 font-mono">
                                                {log.functionName || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {systemLogs.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-earth-400">
                                    <FileText className="h-12 w-12 mb-3 opacity-20" />
                                    <p className="font-medium">No logs found matching your filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
         </main>
      </div>
    </div>
  );
};
