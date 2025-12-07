
import React, { useState } from 'react';
import { Plus, Heart, Eye, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ 
  product, 
  onAddToCart, 
  isFavorite, 
  onToggleFavorite,
  onQuickView
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const isOutOfStock = !product.inStock || product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (!product.isActive) return null; // Don't show inactive products

  return (
    <div className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-earth-100 flex flex-col h-full relative ${isOutOfStock ? 'opacity-80' : ''}`}>
      <div className="relative aspect-square overflow-hidden bg-earth-100">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'grayscale' : ''}`}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.offerPercentage && product.offerPercentage > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                    {product.offerPercentage}% OFF
                </span>
            )}
            {isOutOfStock && (
                <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    OUT OF STOCK
                </span>
            )}
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button
            onClick={() => onToggleFavorite(product.id)}
            className="p-2 rounded-full bg-white/90 shadow-sm hover:bg-white hover:scale-110 transition-all duration-200"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`h-5 w-5 transition-colors duration-200 ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-earth-400 hover:text-red-400'
              }`}
            />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="p-2 rounded-full bg-white/90 shadow-sm hover:bg-white hover:scale-110 transition-all duration-200 md:translate-x-12 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100"
            style={{ transitionDelay: '50ms' }}
            aria-label="Quick View"
          >
            <Eye className="h-5 w-5 text-earth-600 hover:text-earth-900" />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <span className="text-xs font-medium text-herb-600 uppercase tracking-wider bg-herb-50 px-2 py-1 rounded-md">
            {product.category}
          </span>
        </div>
        
        <h3 className="font-serif text-lg font-bold text-earth-900 leading-tight mb-1">
          {product.name}
        </h3>
        <p className="text-sm text-earth-600 font-medium mb-2 font-sans">
          {product.nameHindi}
        </p>
        
        <p className="text-earth-500 text-sm line-clamp-2 mb-4 flex-grow">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-earth-100">
          <div className="flex flex-col">
            {product.discountPrice ? (
                <>
                    <span className="text-xs text-earth-400 line-through">₹{product.price}</span>
                    <span className="text-lg font-bold text-earth-900">₹{product.discountPrice}</span>
                </>
            ) : (
                <span className="text-lg font-bold text-earth-900">₹{product.price}</span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={isAdded || isOutOfStock}
            className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : isAdded 
                    ? 'bg-herb-600 text-white cursor-default' 
                    : 'bg-earth-800 hover:bg-herb-700 text-white'
            }`}
          >
            {isOutOfStock ? (
                <span>Sold Out</span>
            ) : isAdded ? (
              <>
                <Check className="h-4 w-4" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
