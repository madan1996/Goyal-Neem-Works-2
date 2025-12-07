

export interface Product {
  id: string;
  name: string;
  nameHindi: string;
  description: string;
  price: number;
  discountPrice?: number;
  offerPercentage?: number;
  category: 'supplements' | 'tea' | 'oils' | 'skincare';
  image: string;
  gallery?: string[];
  rating: number;
  benefits: string[];
  
  // Inventory & Management
  sku?: string;
  stock: number;
  inStock: boolean;
  isActive: boolean;
  createdAt?: string; // ISO Date string
  sales?: number; // For analytics
  tags?: string[]; // New field for tags
  reorderPoint?: number; // Threshold for low stock alerts
  
  // Variants
  variants?: {
    name: string; // e.g. "Size", "Color"
    options: string[]; // e.g. ["100g", "200g"]
  }[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  id: string;
  timestamp: string;
  severity: Severity;
  message: string;
  errorCode?: string;
  functionName?: string;
  userId?: string;
  deviceType?: string;
  requestData?: any;
  stackTrace?: string;
}

export type UserRole = 'user' | 'admin' | 'super_admin' | 'editor' | 'viewer';

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'hi';
  notifications: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isBlocked: boolean;
  isDeleted?: boolean; // For soft delete
  createdAt: string;
  lastLogin?: string;
  deviceInfo?: string;
  preferences?: UserPreferences;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type OrderStatus = 'pending' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: Address;
  paymentMethod: 'cod' | 'online';
  createdAt: string;
  trackingNumber?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface SystemTask {
  id: string;
  name: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 to 100
  startTime: string;
  details?: string;
}

// --- NEW TYPES FOR MEDIA & PERMISSIONS ---

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: number; // in KB
  uploadedBy: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  metadata: {
    title?: string;
    alt?: string;
    description?: string;
    tags?: string[];
  };
  versions?: { url: string; createdAt: string; size: number }[]; // Version history
}

export type Permission = 
  | 'manage_users' 
  | 'manage_products' 
  | 'manage_orders' 
  | 'delete_records' 
  | 'view_financials' 
  | 'manage_settings' 
  | 'publish_content'
  | 'manage_media';

export interface RoleDefinition {
  role: UserRole;
  permissions: Permission[];
}