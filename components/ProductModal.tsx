

import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Star, Check, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { AudioPlayer } from './AudioPlayer';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setIsAdded(false);
      setCurrentImageIndex(0);
      setSelectedVariants({});
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const images = product.gallery && product.gallery.length > 0 ? [product.image, ...product.gallery] : [product.image];
  const isOutOfStock = !product.inStock || product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 px-4">
      <div 
        className="absolute inset-0 bg-earth-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/80 rounded-full hover:bg-white text-earth-500 hover:text-earth-900 transition-colors backdrop-blur-sm shadow-sm"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-earth-100 relative h-64 md:h-auto group">
            <img 
              src={images[currentImageIndex]} 
              alt={product.name} 
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${isOutOfStock ? 'grayscale opacity-75' : ''}`}
            />
            
            {/* Gallery Navigation */}
            {images.length > 1 && (
                <>
                    <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/80 p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronLeft className="h-5 w-5 text-earth-900" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/80 p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-5 w-5 text-earth-900" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-2 w-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`} 
                            />
                        ))}
                    </div>
                </>
            )}

            {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-black/70 text-white px-6 py-2 rounded-full font-bold tracking-widest border border-white/20 backdrop-blur-md">
                        OUT OF STOCK
                    </span>
                </div>
            )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto bg-earth-50/30">
          <div className="mb-3 flex justify-between items-start">
             <div className="flex gap-2">
                <span className="text-xs font-bold tracking-widest text-herb-700 uppercase bg-herb-100 px-3 py-1 rounded-full border border-herb-200">
                {product.category}
                </span>
                {product.tags && product.tags.length > 0 && (
                     <span className="text-[10px] font-bold tracking-widest text-earth-600 uppercase bg-earth-200 px-2 py-1 rounded-full">
                         {product.tags[0]}
                     </span>
                )}
             </div>
             {product.stock > 0 && product.stock < 10 && (
                 <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                     <AlertCircle className="h-3 w-3" />
                     Only {product.stock} left
                 </span>
             )}
          </div>

          <div className="flex justify-between items-start">
            <h2 className="text-3xl font-serif font-bold text-earth-900 mb-1 leading-tight">{product.name}</h2>
            <AudioPlayer text={`${product.name}. ${product.description}`} />
          </div>
          <p className="text-lg text-earth-600 font-sans mb-4">{product.nameHindi}</p>
          
          <div className="flex items-center gap-2 mb-6 bg-white/50 w-fit px-3 py-1 rounded-full border border-earth-100">
            <div className="flex text-yellow-500">
               {[...Array(5)].map((_, i) => (
                 <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}`} />
               ))}
            </div>
            <span className="text-sm text-earth-600 font-bold ml-1">{product.rating}</span>
          </div>

          <div className="prose prose-earth mb-6">
            <p className="text-earth-700 leading-relaxed text-lg">
              {product.description}
            </p>
          </div>

          {/* Variants Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6 space-y-4">
                {product.variants.map((variant) => (
                    <div key={variant.name}>
                        <h4 className="text-sm font-bold text-earth-900 uppercase tracking-wide mb-2">{variant.name}</h4>
                        <div className="flex flex-wrap gap-2">
                            {variant.options.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setSelectedVariants({...selectedVariants, [variant.name]: option})}
                                    className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                                        selectedVariants[variant.name] === option
                                            ? 'bg-earth-800 text-white border-earth-800'
                                            : 'bg-white text-earth-600 border-earth-200 hover:border-earth-400'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          )}

          <div className="mb-8 bg-white p-5 rounded-xl border border-earth-100 shadow-sm">
            <h3 className="font-serif font-bold text-earth-900 mb-3 text-sm uppercase tracking-wide">Key Benefits</h3>
            <ul className="space-y-2">
              {product.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-3 text-earth-700">
                  <div className="h-5 w-5 rounded-full bg-herb-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-herb-600" />
                  </div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto pt-6 border-t border-earth-200 flex items-center justify-between gap-6">
             <div className="flex flex-col">
               <span className="text-sm text-earth-500 font-medium uppercase tracking-wide">Price</span>
               <div className="flex items-baseline gap-2">
                   {product.discountPrice ? (
                       <>
                         <span className="text-3xl font-serif font-bold text-earth-900">₹{product.discountPrice}</span>
                         <span className="text-lg text-earth-400 line-through">₹{product.price}</span>
                       </>
                   ) : (
                       <span className="text-3xl font-serif font-bold text-earth-900">₹{product.price}</span>
                   )}
               </div>
             </div>
             <button
               onClick={handleAddToCart}
               disabled={isAdded || isOutOfStock}
               className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
                 isOutOfStock
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : isAdded 
                   ? 'bg-herb-600 text-white shadow-herb-200 cursor-default' 
                   : 'bg-earth-900 text-white hover:bg-herb-700 hover:shadow-herb-200 hover:-translate-y-0.5'
               }`}
             >
               {isOutOfStock ? (
                   <span>Out of Stock</span>
               ) : isAdded ? (
                 <>
                   <Check className="h-5 w-5" />
                   <span>Added to Cart</span>
                 </>
               ) : (
                 <>
                   <ShoppingBag className="h-5 w-5" />
                   <span>Add to Cart</span>
                 </>
               )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};