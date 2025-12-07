
import React, { useState, useMemo, useEffect, Suspense, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationToast } from './components/NotificationToast';
import { PRODUCTS, CATEGORIES } from './constants';
import { CartItem, Product, User, Notification, SystemTask } from './types';
import { Filter, Heart, Lock, Loader2 } from 'lucide-react';
import { logger } from './services/loggerService';
import { authService } from './services/authService';

// Lazy Load Heavy Components for Quick Open
const CartDrawer = React.lazy(() => import('./components/CartDrawer').then(module => ({ default: module.CartDrawer })));
const HerbalChatbot = React.lazy(() => import('./components/HerbalChatbot').then(module => ({ default: module.HerbalChatbot })));
const ProductModal = React.lazy(() => import('./components/ProductModal').then(module => ({ default: module.ProductModal })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AuthModal = React.lazy(() => import('./components/AuthModal').then(module => ({ default: module.AuthModal })));
const CheckoutModal = React.lazy(() => import('./components/CheckoutModal').then(module => ({ default: module.CheckoutModal })));
const UserProfile = React.lazy(() => import('./components/UserProfile').then(module => ({ default: module.UserProfile })));
const AvatarVideo = React.lazy(() => import('./components/AvatarVideo').then(module => ({ default: module.AvatarVideo })));

const AppContent: React.FC = () => {
  // Global App State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemTasks, setSystemTasks] = useState<SystemTask[]>([]);
  
  // Background Task Simulator Ref
  const tasksRef = useRef<SystemTask[]>([]);
  tasksRef.current = systemTasks;

  // Product & Cart State
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAvatarStudioOpen, setIsAvatarStudioOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false); // Controlled from Navbar

  // Initialize
  useEffect(() => {
    logger.log('INFO', 'Goyal Neem Works Application Initialized');
    const user = authService.getCurrentUser();
    if (user) setCurrentUser(user);

    // Simulate an initial background task
    addSystemTask('Checking Inventory Integrity', 'Validating stock levels...');
  }, []);

  // --- Task System Logic ---
  const addSystemTask = (name: string, details: string) => {
      const newTask: SystemTask = {
          id: Date.now().toString(),
          name,
          details,
          status: 'queued',
          progress: 0,
          startTime: new Date().toISOString()
      };
      setSystemTasks(prev => [newTask, ...prev]);
  };

  const removeTask = (id: string) => {
      setSystemTasks(prev => prev.filter(t => t.id !== id));
  };

  // Simulate Progress Effect
  useEffect(() => {
    const interval = setInterval(() => {
        setSystemTasks(currentTasks => {
            let hasUpdates = false;
            const updatedTasks = currentTasks.map(task => {
                if (task.status === 'completed' || task.status === 'failed') return task;
                
                hasUpdates = true;
                let newProgress = task.progress + Math.random() * 10;
                let newStatus: SystemTask['status'] = task.status;

                if (task.status === 'queued') newStatus = 'processing';
                
                if (newProgress >= 100) {
                    newProgress = 100;
                    newStatus = 'completed';
                    // Auto-notify on completion could be handled here via a side effect mechanism,
                    // but for simulation, we just update the status.
                }

                return { ...task, progress: newProgress, status: newStatus };
            });
            return hasUpdates ? updatedTasks : currentTasks;
        });
    }, 1000);

    return () => clearInterval(interval);
  }, []);


  // --- Notification System ---
  const notify = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- Cart Handlers ---
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
    notify('success', `Added ${product.name} to cart`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) return { ...item, quantity: Math.max(0, item.quantity + delta) };
      return item;
    }).filter(item => item.quantity > 0));
  };

  // --- Product Handlers ---
  const filteredProducts = useMemo(() => {
    // Strict Display Rule: Inactive products hidden from user view
    let activeProducts = products.filter(p => p.isActive);
    
    if (selectedCategory === 'favorites') {
      return activeProducts.filter(p => favorites.includes(p.id));
    }
    return selectedCategory === 'all' 
      ? activeProducts 
      : activeProducts.filter(p => p.category === selectedCategory);
  }, [selectedCategory, favorites, products]);

  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + (item.discountPrice || item.price) * item.quantity, 0), [cartItems]);

  // --- Order Logic ---
  const handleOrderComplete = () => {
      // 1. Deduct Stock from global inventory
      const updatedProducts = products.map(p => {
          const inCart = cartItems.find(item => item.id === p.id);
          if (inCart) {
              const newStock = Math.max(0, p.stock - inCart.quantity);
              return { 
                  ...p, 
                  stock: newStock, 
                  inStock: newStock > 0 
              };
          }
          return p;
      });
      setProducts(updatedProducts);
      
      // Simulate Order Processing Task
      addSystemTask('Processing Order', `Allocating items for order...`);

      // 2. Log the inventory update
      logger.log('INFO', 'Inventory Automatically Deducted', { 
          requestData: { 
              itemsCount: cartItems.length,
              orderValue: cartTotal 
          } 
      });

      // 3. Clear Cart & Close UI
      setCartItems([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
  };

  // --- Navigation Handler ---
  const handleNavigate = (dest: string) => {
      if (dest === 'store') {
        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      } else if (dest === 'chatbot') {
        // Chatbot self-manages visibility or could be lifted state.
        // For now, chatbot is always visible as FAB, but we can trigger logic here if needed.
        notify('info', 'Chat with Veda using the button below!');
      } else if (dest === 'inventory' || dest === 'analytics') {
          setIsAdminOpen(true);
          // Ideally AdminDashboard would accept an initialTab prop
      }
  };

  // --- Maintenance Mode Guard ---
  if (maintenanceMode && (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin'))) {
      return (
          <div className="min-h-screen bg-earth-900 flex flex-col items-center justify-center text-white p-4 text-center">
              <Lock className="h-16 w-16 text-orange-500 mb-6" />
              <h1 className="text-4xl font-serif font-bold mb-4">Goyal Neem Works</h1>
              <h2 className="text-2xl mb-4">Under Maintenance</h2>
              <p className="text-earth-200 max-w-md mb-8">
                  We are upgrading our systems to serve you better. We will be back shortly with pure ayurvedic products.
              </p>
              <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="text-sm text-earth-400 hover:text-white underline"
              >
                  Admin Login
              </button>
              {isAuthOpen && (
                <Suspense fallback={<div className="text-white">Loading...</div>}>
                  <AuthModal 
                    isOpen={isAuthOpen} 
                    onClose={() => setIsAuthOpen(false)} 
                    onLoginSuccess={(user) => {
                        setCurrentUser(user);
                        setIsAuthOpen(false);
                    }} 
                    notify={notify}
                  />
                </Suspense>
              )}
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-earth-50 font-sans text-earth-900">
      <Navbar 
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)}
        currentLang="en"
        user={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAvatarStudio={() => setIsAvatarStudioOpen(true)}
        tasks={systemTasks}
        onClearTask={removeTask}
        onNavigate={handleNavigate}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Rebranded */}
         <section className="mb-12 relative overflow-hidden rounded-3xl bg-earth-900 text-white min-h-[350px] flex items-center shadow-2xl">
           <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1628100582298-6369527e0255?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
           <div className="relative z-10 px-8 md:px-16 py-12 max-w-2xl">
             <div className="flex items-center gap-2 mb-4">
                 <span className="h-px w-10 bg-herb-400"></span>
                 <span className="text-herb-300 text-xs font-bold tracking-widest uppercase">
                   100% Pure • Stone-Ground
                 </span>
             </div>
             <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight">
               Nature's Best<br/>
               <span className="text-herb-400">Neem & Herbs</span>
             </h1>
             <p className="text-lg text-earth-100 mb-8 max-w-lg leading-relaxed">
               Goyal Neem Works brings you the purest ayurvedic remedies from Jodhpur. Lab-tested quality you can trust.
             </p>
             <button onClick={() => {
                 document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
             }} className="bg-herb-600 text-white px-8 py-3 rounded-full font-bold hover:bg-herb-700 transition-colors shadow-lg">
                 Shop Now
             </button>
           </div>
        </section>

        {/* Filters */}
        <div id="products" className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-3xl font-serif font-bold text-earth-800">Our Products</h2>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <Filter className="h-5 w-5 text-earth-400 flex-shrink-0" />
            {[...CATEGORIES, { id: 'favorites', label: 'Favorites', icon: Heart }].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-herb-600 text-white border-herb-600 shadow-md'
                    : 'bg-white text-earth-600 border-earth-200 hover:border-earth-400 hover:bg-earth-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
              isFavorite={favorites.includes(product.id)}
              onToggleFavorite={(id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>
      </main>

      {/* --- Modals & Overlays --- */}
      <Suspense fallback={null}>
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={updateQuantity}
        />
        
        {/* Checkout Floating Action if Cart has items */}
        {isCartOpen && cartItems.length > 0 && (
            <div className="fixed bottom-4 left-4 z-[60] md:hidden">
                <button onClick={() => setIsCheckoutOpen(true)} className="bg-herb-600 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2">
                    Checkout
                </button>
            </div>
        )}

        <CheckoutModal 
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cartItems={cartItems}
          total={cartTotal}
          user={currentUser}
          onOrderComplete={handleOrderComplete}
          onOpenLogin={() => setIsAuthOpen(true)}
          notify={notify}
        />

        <ProductModal 
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={addToCart}
        />

        <AdminDashboard 
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          products={products}
          onAddProduct={(p) => setProducts(prev => [...prev, p])}
          onUpdateProduct={(p) => setProducts(prev => prev.map(prod => prod.id === p.id ? p : prod))}
          onDeleteProduct={(id) => setProducts(prev => prev.filter(p => p.id !== id))}
          maintenanceMode={maintenanceMode}
          toggleMaintenanceMode={() => setMaintenanceMode(!maintenanceMode)}
          notify={notify}
        />

        <AuthModal 
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={(user) => {
              setCurrentUser(user);
              setIsAuthOpen(false);
          }}
          notify={notify}
        />

        {isProfileOpen && currentUser && (
            <UserProfile 
              user={currentUser}
              onClose={() => setIsProfileOpen(false)}
              onLogout={() => {
                  authService.logout();
                  setCurrentUser(null);
                  setIsProfileOpen(false);
                  notify('info', 'Logged out successfully');
              }}
            />
        )}

        <AvatarVideo 
          isOpen={isAvatarStudioOpen}
          onClose={() => setIsAvatarStudioOpen(false)}
        />

        <HerbalChatbot />
      </Suspense>
      
      <NotificationToast notifications={notifications} removeNotification={removeNotification} />

    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
