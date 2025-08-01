import { NimbusProductInfo } from '../../types/nimbus/NimbusNutrition';

// Australian Food Database - Simulated for now
class AustralianFoodDatabase {
  private products: Map<string, NimbusProductInfo> = new Map();

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Sample Australian products
    const sampleProducts: NimbusProductInfo[] = [
      {
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
      },
      {
        barcode: '9300633000001',
        name: 'Coles Free Range Chicken Breast',
        brand: 'Coles',
        category: 'Meat',
        nutritionPer100g: {
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          fiber: 0
        },
        servingSize: {
          amount: 150,
          unit: 'g',
          nutritionPerServing: {
            calories: 248,
            protein: 46.5,
            carbs: 0,
            fat: 5.4,
            fiber: 0
          }
        },
        retailer: 'coles',
        price: {
          amount: 12.00,
          currency: 'AUD',
          date: new Date()
        }
      },
      {
        barcode: '9300633000002',
        name: 'SunRice Brown Rice',
        brand: 'SunRice',
        category: 'Grains',
        nutritionPer100g: {
          calories: 110,
          protein: 2.5,
          carbs: 23,
          fat: 0.9,
          fiber: 1.8
        },
        servingSize: {
          amount: 100,
          unit: 'g',
          nutritionPerServing: {
            calories: 110,
            protein: 2.5,
            carbs: 23,
            fat: 0.9,
            fiber: 1.8
          }
        },
        retailer: 'coles',
        price: {
          amount: 3.50,
          currency: 'AUD',
          date: new Date()
        }
      },
      {
        barcode: '9300633000003',
        name: 'Quaker Oats Traditional',
        brand: 'Quaker',
        category: 'Grains',
        nutritionPer100g: {
          calories: 150,
          protein: 5,
          carbs: 27,
          fat: 3,
          fiber: 4,
          sugar: 1
        },
        servingSize: {
          amount: 100,
          unit: 'g',
          nutritionPerServing: {
            calories: 150,
            protein: 5,
            carbs: 27,
            fat: 3,
            fiber: 4,
            sugar: 1
          }
        },
        retailer: 'woolworths',
        price: {
          amount: 2.80,
          currency: 'AUD',
          date: new Date()
        }
      },
      {
        barcode: '9300633000004',
        name: 'Tassal Atlantic Salmon Fillet',
        brand: 'Tassal',
        category: 'Seafood',
        nutritionPer100g: {
          calories: 233,
          protein: 29,
          carbs: 0,
          fat: 13,
          fiber: 0
        },
        servingSize: {
          amount: 120,
          unit: 'g',
          nutritionPerServing: {
            calories: 280,
            protein: 35,
            carbs: 0,
            fat: 15,
            fiber: 0
          }
        },
        retailer: 'coles',
        price: {
          amount: 18.00,
          currency: 'AUD',
          date: new Date()
        }
      }
    ];

    sampleProducts.forEach(product => {
      if (product.barcode) {
        this.products.set(product.barcode, product);
      }
    });
  }

  async findByBarcode(barcode: string): Promise<NimbusProductInfo | null> {
    return this.products.get(barcode) || null;
  }

  async search(query: string): Promise<NimbusProductInfo[]> {
    const results: NimbusProductInfo[] = [];
    const searchTerm = query.toLowerCase();

    for (const product of this.products.values()) {
      if (
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      ) {
        results.push(product);
      }
    }

    return results.slice(0, 10); // Limit to 10 results
  }
}

// Coles API - Simulated
class ColesAPI {
  async findProduct(barcode: string): Promise<NimbusProductInfo | null> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo purposes, return null (would integrate with real Coles API)
    return null;
  }

  async search(query: string): Promise<NimbusProductInfo[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [];
  }
}

// Woolworths API - Simulated
class WoolworthsAPI {
  async findProduct(barcode: string): Promise<NimbusProductInfo | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return null;
  }

  async search(query: string): Promise<NimbusProductInfo[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [];
  }
}

export class NimbusProductScanner {
  private australianDB: AustralianFoodDatabase;
  private colesAPI: ColesAPI;
  private woolworthsAPI: WoolworthsAPI;

  constructor() {
    this.australianDB = new AustralianFoodDatabase();
    this.colesAPI = new ColesAPI();
    this.woolworthsAPI = new WoolworthsAPI();
  }

  // Scan barcode using device camera
  async scanBarcode(): Promise<NimbusProductInfo | null> {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Use BarcodeDetector API if available, otherwise fallback to manual detection
      if ('BarcodeDetector' in window) {
        return await this.detectBarcodeNative(stream);
      } else {
        return await this.detectBarcodeManual(stream);
      }
    } catch (error) {
      console.error('Barcode scanning failed:', error);
      throw new Error('Unable to access camera for barcode scanning');
    }
  }

  private async detectBarcodeNative(stream: MediaStream): Promise<NimbusProductInfo | null> {
    const barcodeDetector = new (window as any).BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
    });

    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const scanFrame = async () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx?.drawImage(video, 0, 0);
          
          const barcodes = await barcodeDetector.detect(canvas);
          if (barcodes.length > 0) {
            stream.getTracks().forEach(track => track.stop());
            const productInfo = await this.lookupProduct(barcodes[0].rawValue);
            resolve(productInfo);
            return;
          }
        }
        requestAnimationFrame(scanFrame);
      };
      
      scanFrame();
    });
  }

  private async detectBarcodeManual(stream: MediaStream): Promise<NimbusProductInfo | null> {
    // For demo purposes, simulate barcode detection
    // In a real implementation, this would use a barcode detection library
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    stream.getTracks().forEach(track => track.stop());
    
    // Return a demo product for testing
    return await this.lookupProduct('9300633000000');
  }

  // Lookup product in Australian databases
  async lookupProduct(barcode: string): Promise<NimbusProductInfo | null> {
    try {
      // Try Australian food database first
      let product = await this.australianDB.findByBarcode(barcode);
      
      if (!product) {
        // Try Coles API
        product = await this.colesAPI.findProduct(barcode);
      }
      
      if (!product) {
        // Try Woolworths API
        product = await this.woolworthsAPI.findProduct(barcode);
      }

      if (!product) {
        // Fallback to international databases
        product = await this.fallbackProductLookup(barcode);
      }

      return product;
    } catch (error) {
      console.error('Product lookup failed:', error);
      return null;
    }
  }

  // Search products by name
  async searchProducts(query: string): Promise<NimbusProductInfo[]> {
    const results: NimbusProductInfo[] = [];
    
    try {
      // Search Australian database
      const localResults = await this.australianDB.search(query);
      results.push(...localResults);
      
      // Search retailer databases
      const colesResults = await this.colesAPI.search(query);
      const woolworthsResults = await this.woolworthsAPI.search(query);
      
      results.push(...colesResults, ...woolworthsResults);
      
      // Remove duplicates and sort by relevance
      return this.deduplicateAndSort(results, query);
    } catch (error) {
      console.error('Product search failed:', error);
      return [];
    }
  }

  private async fallbackProductLookup(barcode: string): Promise<NimbusProductInfo | null> {
    // Simulate international database lookup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return null for demo (would integrate with real international databases)
    return null;
  }

  private deduplicateAndSort(products: NimbusProductInfo[], query: string): NimbusProductInfo[] {
    const seen = new Set<string>();
    const unique = products.filter(product => {
      const key = product.barcode || product.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by relevance (exact matches first, then partial matches)
    return unique.sort((a, b) => {
      const aExact = a.name.toLowerCase() === query.toLowerCase();
      const bExact = b.name.toLowerCase() === query.toLowerCase();
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.name.localeCompare(b.name);
    });
  }

  // Check if barcode scanning is supported
  isBarcodeScanningSupported(): boolean {
    return 'BarcodeDetector' in window || 'mediaDevices' in navigator;
  }

  // Get camera permissions status
  async getCameraPermissionStatus(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state;
    } catch (error) {
      console.warn('Camera permission check failed:', error);
      return 'prompt';
    }
  }
} 