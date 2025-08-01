/**
 * Real Barcode Scanner Service
 * Uses actual camera and barcode detection APIs
 */

export interface BarcodeScanResult {
  barcode: string;
  format: string;
  confidence: number;
  timestamp: Date;
}

export interface CameraConfig {
  facingMode: 'environment' | 'user';
  width: number;
  height: number;
  aspectRatio: number;
}

export class RealBarcodeScanner {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private isScanning = false;
  private scanInterval: number | null = null;

  /**
   * Initialize camera and start scanning
   */
  async startScanning(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    config: CameraConfig = {
      facingMode: 'environment',
      width: 640,
      height: 480,
      aspectRatio: 4/3
    }
  ): Promise<void> {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    
    try {
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: config.facingMode,
          width: { ideal: config.width },
          height: { ideal: config.height },
          aspectRatio: config.aspectRatio
        }
      });

      // Set up video element
      this.videoElement.srcObject = this.stream;
      this.videoElement.play();

      // Start scanning loop
      this.isScanning = true;
      this.startScanLoop();

      console.log('Barcode scanner started successfully');
    } catch (error) {
      console.error('Failed to start barcode scanner:', error);
      throw new Error(`Camera access denied: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop scanning and release camera
   */
  stopScanning(): void {
    this.isScanning = false;
    
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    console.log('Barcode scanner stopped');
  }

  /**
   * Start the scanning loop
   */
  private startScanLoop(): void {
    if (!this.videoElement || !this.canvasElement) return;

    this.scanInterval = window.setInterval(async () => {
      if (!this.isScanning || !this.videoElement || !this.canvasElement) return;

      try {
        const barcode = await this.detectBarcode();
        if (barcode) {
          this.onBarcodeDetected(barcode);
        }
      } catch (error) {
        console.error('Barcode detection error:', error);
      }
    }, 500); // Scan every 500ms
  }

  /**
   * Detect barcode in current video frame
   */
  private async detectBarcode(): Promise<BarcodeScanResult | null> {
    if (!this.videoElement || !this.canvasElement) return null;

    const canvas = this.canvasElement;
    const video = this.videoElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for barcode detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Try different barcode detection methods
    const results = await Promise.allSettled([
      this.detectWithBarcodeDetector(imageData),
      this.detectWithZXing(imageData),
      this.detectWithQuaggaJS(imageData)
    ]);

    // Return the first successful result
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
    }

    return null;
  }

  /**
   * Use native BarcodeDetector API (modern browsers)
   */
  private async detectWithBarcodeDetector(imageData: ImageData): Promise<BarcodeScanResult | null> {
    try {
      // Check if BarcodeDetector is available
      if (!('BarcodeDetector' in window)) {
        return null;
      }

      const detector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93']
      });

      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(imageData, 0, 0);

      const barcodes = await detector.detect(canvas);
      
      if (barcodes.length > 0) {
        const barcode = barcodes[0];
        return {
          barcode: barcode.rawValue,
          format: barcode.format,
          confidence: 0.9, // BarcodeDetector doesn't provide confidence
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('BarcodeDetector error:', error);
    }

    return null;
  }

  /**
   * Use ZXing library (fallback)
   */
  private async detectWithZXing(imageData: ImageData): Promise<BarcodeScanResult | null> {
    try {
      // This would require the ZXing library to be loaded
      // For now, we'll simulate detection
      return null;
    } catch (error) {
      console.error('ZXing detection error:', error);
      return null;
    }
  }

  /**
   * Use QuaggaJS library (fallback)
   */
  private async detectWithQuaggaJS(imageData: ImageData): Promise<BarcodeScanResult | null> {
    try {
      // This would require the QuaggaJS library to be loaded
      // For now, we'll simulate detection
      return null;
    } catch (error) {
      console.error('QuaggaJS detection error:', error);
      return null;
    }
  }

  /**
   * Handle barcode detection
   */
  private onBarcodeDetected(result: BarcodeScanResult): void {
    console.log('Barcode detected:', result);
    
    // Emit custom event for components to listen to
    const event = new CustomEvent('barcodeDetected', {
      detail: result
    });
    window.dispatchEvent(event);
  }

  /**
   * Check if barcode scanning is supported
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Get available camera devices
   */
  static async getCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Failed to get cameras:', error);
      return [];
    }
  }

  /**
   * Test camera access without starting scanner
   */
  static async testCameraAccess(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera access test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const realBarcodeScanner = new RealBarcodeScanner(); 