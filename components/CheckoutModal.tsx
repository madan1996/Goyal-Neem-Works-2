
import React, { useState } from 'react';
import { X, CreditCard, Truck, Check, Loader2 } from 'lucide-react';
import { CartItem, Address, User } from '../types';
import { orderService } from '../services/orderService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  total: number;
  user: User | null;
  onOrderComplete: () => void;
  onOpenLogin: () => void;
  notify: (type: 'success' | 'error', msg: string) => void;
}

export const CheckoutModal: React.FC<Props> = ({ 
  isOpen, onClose, cartItems, total, user, onOrderComplete, onOpenLogin, notify 
}) => {
  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<Address>({
    street: '', city: '', state: '', zipCode: '', country: 'India'
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('online');

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
         <div className="bg-white p-8 rounded-2xl text-center max-w-sm">
            <h3 className="text-xl font-serif font-bold mb-4">Login Required</h3>
            <p className="text-earth-600 mb-6">Please log in to proceed with checkout.</p>
            <div className="flex gap-4 justify-center">
                <button onClick={onClose} className="px-4 py-2 text-earth-500 hover:bg-earth-50 rounded-lg">Cancel</button>
                <button onClick={() => { onClose(); onOpenLogin(); }} className="px-6 py-2 bg-herb-600 text-white rounded-lg hover:bg-herb-700">Login Now</button>
            </div>
         </div>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      await orderService.createOrder(user.id, cartItems, total, address, paymentMethod);
      setStep('success');
      onOrderComplete();
      notify('success', 'Order placed successfully!');
    } catch (error) {
      notify('error', 'Failed to place order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step === 'success' ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-earth-50 px-6 py-4 border-b border-earth-100 flex justify-between items-center">
          <h2 className="font-serif font-bold text-lg text-earth-900">
            {step === 'address' ? 'Shipping Address' : step === 'payment' ? 'Payment Method' : 'Order Confirmed'}
          </h2>
          {step !== 'success' && (
            <button onClick={onClose} className="text-earth-400 hover:text-earth-900">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'address' && (
            <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-earth-600 mb-1">Street Address</label>
                       <input 
                         type="text" 
                         className="w-full border border-earth-200 rounded-lg p-2.5 focus:ring-2 focus:ring-herb-500 outline-none"
                         value={address.street}
                         onChange={e => setAddress({...address, street: e.target.value})}
                         placeholder="House No, Street Area"
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-earth-600 mb-1">City</label>
                       <input 
                         type="text" 
                         className="w-full border border-earth-200 rounded-lg p-2.5 focus:ring-2 focus:ring-herb-500 outline-none"
                         value={address.city}
                         onChange={e => setAddress({...address, city: e.target.value})}
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-earth-600 mb-1">State</label>
                       <input 
                         type="text" 
                         className="w-full border border-earth-200 rounded-lg p-2.5 focus:ring-2 focus:ring-herb-500 outline-none"
                         value={address.state}
                         onChange={e => setAddress({...address, state: e.target.value})}
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-earth-600 mb-1">Zip Code</label>
                       <input 
                         type="text" 
                         className="w-full border border-earth-200 rounded-lg p-2.5 focus:ring-2 focus:ring-herb-500 outline-none"
                         value={address.zipCode}
                         onChange={e => setAddress({...address, zipCode: e.target.value})}
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-earth-600 mb-1">Country</label>
                       <input 
                         type="text" 
                         className="w-full border border-earth-200 rounded-lg p-2.5 bg-earth-50 text-earth-500 cursor-not-allowed"
                         value="India"
                         readOnly
                       />
                   </div>
               </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-4">
               <div 
                 onClick={() => setPaymentMethod('online')}
                 className={`p-4 border rounded-xl cursor-pointer flex items-center gap-4 transition-all ${paymentMethod === 'online' ? 'border-herb-500 bg-herb-50 ring-1 ring-herb-500' : 'border-earth-200 hover:border-earth-300'}`}
               >
                 <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><CreditCard className="h-6 w-6"/></div>
                 <div>
                    <h4 className="font-bold text-earth-900">Online Payment</h4>
                    <p className="text-xs text-earth-500">UPI, Cards, Netbanking (Secure)</p>
                 </div>
               </div>
               
               <div 
                 onClick={() => setPaymentMethod('cod')}
                 className={`p-4 border rounded-xl cursor-pointer flex items-center gap-4 transition-all ${paymentMethod === 'cod' ? 'border-herb-500 bg-herb-50 ring-1 ring-herb-500' : 'border-earth-200 hover:border-earth-300'}`}
               >
                 <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Truck className="h-6 w-6"/></div>
                 <div>
                    <h4 className="font-bold text-earth-900">Cash on Delivery</h4>
                    <p className="text-xs text-earth-500">Pay when you receive the order</p>
                 </div>
               </div>

               <div className="mt-8 bg-earth-50 p-4 rounded-xl">
                 <div className="flex justify-between text-sm mb-2">
                    <span className="text-earth-600">Items Total</span>
                    <span className="font-medium">₹{total}</span>
                 </div>
                 <div className="flex justify-between text-sm mb-4">
                    <span className="text-earth-600">Delivery</span>
                    <span className="font-medium text-green-600">Free</span>
                 </div>
                 <div className="flex justify-between text-lg font-bold border-t border-earth-200 pt-3">
                    <span>Total Amount</span>
                    <span>₹{total}</span>
                 </div>
               </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
               <div className="mx-auto bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                  <Check className="h-10 w-10 text-green-600" />
               </div>
               <h3 className="text-2xl font-serif font-bold text-earth-900 mb-2">Order Confirmed!</h3>
               <p className="text-earth-600 mb-8 max-w-sm mx-auto">
                 Thank you for your purchase. Your natural remedies are being packed with care.
               </p>
               <button 
                 onClick={onClose}
                 className="bg-earth-900 text-white px-8 py-3 rounded-full font-bold hover:bg-earth-800"
               >
                 Continue Shopping
               </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step !== 'success' && (
          <div className="p-6 border-t border-earth-100 flex justify-between items-center bg-white">
             {step === 'payment' ? (
               <button onClick={() => setStep('address')} className="text-earth-600 font-medium hover:underline">
                 Back
               </button>
             ) : (
               <button onClick={onClose} className="text-earth-600 font-medium hover:underline">Cancel</button>
             )}

             <button 
               onClick={() => {
                 if (step === 'address') {
                    if(!address.street || !address.zipCode) {
                        notify('error', 'Please fill in address details');
                        return;
                    }
                    setStep('payment');
                 } else {
                    handlePlaceOrder();
                 }
               }}
               disabled={loading}
               className="bg-herb-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-herb-700 disabled:opacity-50 flex items-center gap-2"
             >
               {loading ? <Loader2 className="h-5 w-5 animate-spin"/> : (
                 step === 'address' ? 'Proceed to Payment' : `Pay ₹${total}`
               )}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
