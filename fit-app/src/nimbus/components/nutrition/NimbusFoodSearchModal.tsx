import React, { useState, useEffect } from 'react';
import { Search, X, Package, Store, Clock, Plus } from 'lucide-react';
import { NimbusProductInfo } from '../../../types/nimbus/NimbusNutrition';
import { NimbusProductScanner } from '../../services/NimbusProductScanner';
import { NimbusButton } from '../NimbusButton';
import { NimbusCard } from '../NimbusCard';

interface NimbusFoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (product: NimbusProductInfo) => void;
}

export const NimbusFoodSearchModal: React.FC<NimbusFoodSearchModalProps> = ({
  isOpen,
  onClose,
  onProductFound
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NimbusProductInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<NimbusProductInfo | null>(null);
  
  const scanner = new NimbusProductScanner();

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedProduct(null);
    }
  }, [isOpen]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await scanner.searchProducts(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProductSelect = (product: NimbusProductInfo) => {
    setSelectedProduct(product);
  };

  const handleAddProduct = () => {
    if (selectedProduct) {
      onProductFound(selectedProduct);
      onClose();
    }
  };

  const getRetailerIcon = (retailer?: string) => {
    switch (retailer) {
      case 'coles':
        return <Store className="w-4 h-4 text-blue-600" />;
      case 'woolworths':
        return <Store className="w-4 h-4 text-green-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRetailerName = (retailer?: string) => {
    switch (retailer) {
      case 'coles':
        return 'Coles';
      case 'woolworths':
        return 'Woolworths';
      default:
        return 'Generic';
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <NimbusCard variant="default" padding="lg" className="w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Search Australian Products</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Search for food products..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {isSearching && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Searching Australian databases...</p>
            </div>
          )}

                     {!isSearching && searchQuery && searchResults.length === 0 && (
             <div className="text-center py-8">
               <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
               <p className="text-gray-600 dark:text-gray-400">No products found</p>
               <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Try a different search term</p>
               <NimbusButton
                 variant="primary"
                 size="md"
                 icon={<Plus className="w-4 h-4" />}
                 onClick={() => {
                   onClose();
                   // This will trigger the custom food modal in the parent component
                   // We need to pass this callback up
                 }}
                 className="mt-4"
               >
                 Add Custom Food
               </NimbusButton>
             </div>
           )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((product, index) => (
                <div
                  key={product.barcode || index}
                  onClick={() => handleProductSelect(product)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedProduct?.barcode === product.barcode
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        {getRetailerIcon(product.retailer)}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {product.brand} • {getRetailerName(product.retailer)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="text-green-600 dark:text-green-400">
                          {product.nutritionPerServing?.calories || product.nutritionPer100g.calories} cal
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">
                          P: {product.nutritionPerServing?.protein || product.nutritionPer100g.protein}g
                        </span>
                        <span className="text-orange-600 dark:text-orange-400">
                          C: {product.nutritionPerServing?.carbs || product.nutritionPer100g.carbs}g
                        </span>
                        <span className="text-red-600 dark:text-red-400">
                          F: {product.nutritionPerServing?.fat || product.nutritionPer100g.fat}g
                        </span>
                      </div>
                    </div>
                    {product.price && (
                      <div className="text-right ml-4">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          ${product.price.amount.toFixed(2)}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">AUD</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Demo Products */}
          {!isSearching && !searchQuery && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Popular Australian products:</p>
              {[
                'yogurt',
                'chicken',
                'rice',
                'oats',
                'salmon'
              ].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                    handleSearch(term);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <span className="text-gray-700 dark:text-gray-300 capitalize">{term}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <NimbusButton
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </NimbusButton>
          
          <NimbusButton
            variant="primary"
            onClick={handleAddProduct}
            disabled={!selectedProduct}
            className="flex-1"
          >
            Add Product
          </NimbusButton>
        </div>

        {/* Demo Info */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Demo Mode:</strong> Search for "yogurt", "chicken", "rice", "oats", or "salmon" to see Australian products.
          </p>
        </div>
      </NimbusCard>
    </div>
  );
}; 