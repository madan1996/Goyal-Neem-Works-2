import React from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, items, onUpdateQuantity }) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md transform transition-transform duration-300 ease-in-out bg-white shadow-2xl flex flex-col h-full">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-earth-100 flex items-center justify-between bg-earth-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-earth-700" />
              <h2 className="text-lg font-serif font-bold text-earth-900">Your Cart</h2>
            </div>
            <button onClick={onClose} className="p-2 text-earth-500 hover:text-red-500 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-earth-400 space-y-4">
                <ShoppingBag className="h-16 w-16 opacity-20" />
                <p>Your cart is empty</p>
                <button onClick={onClose} className="text-herb-600 font-medium hover:underline">
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-earth-200">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-earth-900">
                        <h3>{item.name}</h3>
                        <p className="ml-4">₹{item.price * item.quantity}</p>
                      </div>
                      <p className="mt-1 text-sm text-earth-500">{item.nameHindi}</p>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <div className="flex items-center border border-earth-200 rounded-lg">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="p-1 hover:bg-earth-100 rounded-l-lg text-earth-600"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-2 font-medium text-earth-900 min-w-[1.5rem] text-center">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="p-1 hover:bg-earth-100 rounded-r-lg text-earth-600"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-earth-100 px-6 py-6 bg-earth-50">
              <div className="flex justify-between text-base font-medium text-earth-900 mb-4">
                <p>Subtotal</p>
                <p>₹{total}</p>
              </div>
              <p className="mt-0.5 text-sm text-earth-500 mb-6">
                Shipping and taxes calculated at checkout.
              </p>
              <button
                className="w-full flex items-center justify-center rounded-full border border-transparent bg-earth-800 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-herb-700 transition-colors"
              >
                Checkout (Buy Now)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
