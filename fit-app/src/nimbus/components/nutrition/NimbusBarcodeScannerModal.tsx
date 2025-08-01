import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, AlertCircle, CheckCircle } from 'lucide-react';
import { NimbusProductInfo } from '../../../types/nimbus/NimbusNutrition';
import { NimbusProductScanner } from '../../services/NimbusProductScanner';
import { NimbusButton } from '../NimbusButton';
import { NimbusCard } from '../NimbusCard';

interface NimbusBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (product: NimbusProductInfo) => void;
}

export const NimbusBarcodeScannerModal: React.FC<NimbusBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onProductFound
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [foundProduct, setFoundProduct] = useState<NimbusProductInfo | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const scanner = new NimbusProductScanner();

  useEffect(() => {
    if (isOpen) {
      setScanError(null);
      setScanSuccess(false);
      setFoundProduct(null);
    }
  }, [isOpen]);

  const startScanning = async () => {
    setIsScanning(true);
    setScanError(null);
    setScanSuccess(false);
    
    try {
      const product = await scanner.scanBarcode();
      if (product) {
        setFoundProduct(product);
        setScanSuccess(true);
        // Auto-close after showing success
        setTimeout(() => {
          onProductFound(product);
          onClose();
        }, 2000);
      } else {
        setScanError('Product not found. Try manual entry instead.');
      }
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Scanning failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualEntry = () => {
    // For demo purposes, use a sample product
    const demoProduct: NimbusProductInfo = {
      barcode: '9300633000000',
      name: 'Woolworths Greek Style Natural Yoghurt',
      brand: 'Woolworths',
      category: 'Dairy',
      nutritionPer100g: {
        calories: 59,
        protein: 10.3,
        carbs: 3.6,
        fat: 0.4,
        fiber: 0,
        sugar: 3.6
      },
      servingSize: {
        amount: 170,
        unit: 'g',
        nutritionPerServing: {
          calories: 100,
          protein: 17.5,
          carbs: 6.1,
          fat: 0.7,
          fiber: 0,
          sugar: 6.1
        }
      },
      retailer: 'woolworths',
      price: {
        amount: 4.50,
        currency: 'AUD',
        date: new Date()
      }
    };
    
    onProductFound(demoProduct);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <NimbusCard variant="default" padding="lg" className="w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Scan Product Barcode</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Camera View */}
        <div className="relative mb-4">
          <div className="w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
            {isScanning ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-white text-sm">Scanning for barcode...</p>
              </div>
            ) : scanSuccess ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-white text-lg font-medium">Product Found!</p>
                {foundProduct && (
                  <p className="text-gray-300 text-sm mt-2">{foundProduct.name}</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 text-sm">Camera view will appear here</p>
              </div>
            )}
          </div>
          
          {/* Scanning overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-32 border-2 border-primary-500 border-dashed rounded-lg flex items-center justify-center">
                <span className="text-primary-500 text-sm font-medium">
                  Position barcode here
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {scanError && (
          <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{scanError}</p>
          </div>
        )}

        {scanSuccess && foundProduct && (
          <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Product Found!</span>
            </div>
            <p className="text-sm">{foundProduct.name}</p>
            <p className="text-xs mt-1">
              {foundProduct.nutritionPerServing?.calories || foundProduct.nutritionPer100g.calories} cal per serving
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <NimbusButton
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </NimbusButton>
          
          {!isScanning && !scanSuccess && (
            <NimbusButton
              variant="primary"
              onClick={startScanning}
              className="flex-1"
            >
              Start Scan
            </NimbusButton>
          )}
          
          {scanError && (
            <NimbusButton
              variant="primary"
              onClick={handleManualEntry}
              className="flex-1"
            >
              Use Demo Product
            </NimbusButton>
          )}
        </div>

        {/* Demo Info */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Demo Mode:</strong> This will simulate scanning and return a sample Australian product for testing.
          </p>
        </div>
      </NimbusCard>
    </div>
  );
}; 