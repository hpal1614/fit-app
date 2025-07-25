interface CameraConfig {
  width: number;
  height: number;
  fps: number;
  facing: 'user' | 'environment';
}

interface DrawOptions {
  showSkeleton: boolean;
  showAngles: boolean;
  showCorrections: boolean;
  showStats: boolean;
  confidenceThreshold: number;
}

interface CameraMetrics {
  fps: number;
  processingTime: number;
  frameCount: number;
  detectionRate: number;
}

export class CameraService {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private isProcessing = false;
  private frameCount = 0;
  private lastFrameTime = 0;
  private fps = 0;
  private processingTimes: number[] = [];
  private drawOptions: DrawOptions = {
    showSkeleton: true,
    showAngles: true,
    showCorrections: true,
    showStats: true,
    confidenceThreshold: 0.5
  };

  // Skeleton connections for drawing
  private readonly POSE_CONNECTIONS = [
    // Face
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
    [9, 10],
    // Upper body
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    // Torso
    [11, 17], [12, 18], [17, 18],
    // Lower body
    [17, 19], [19, 21], [21, 23], [23, 25],
    [18, 20], [20, 22], [22, 24], [24, 26]
  ];

  // Colors for different elements
  private readonly COLORS = {
    skeleton: {
      good: '#00ff00',
      warning: '#ffff00',
      error: '#ff0000'
    },
    keypoint: {
      high: '#00ff00',
      medium: '#ffff00',
      low: '#ff0000'
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      error: '#ff0000',
      success: '#00ff00'
    },
    overlay: 'rgba(0, 0, 0, 0.3)'
  };

  async initialize(config: CameraConfig): Promise<void> {
    try {
      // Get video stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: config.width },
          height: { ideal: config.height },
          frameRate: { ideal: config.fps },
          facingMode: config.facing
        }
      });

      console.log('Camera initialized successfully');
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      throw error;
    }
  }

  attachToElements(video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    if (!this.stream) {
      throw new Error('Camera not initialized');
    }

    // Attach stream to video element
    this.video.srcObject = this.stream;
    
    // Set canvas size to match video
    this.video.onloadedmetadata = () => {
      if (this.canvas && this.video) {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
      }
    };
  }

  startProcessing(onFrame: (canvas: HTMLCanvasElement) => Promise<any>): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processFrame(onFrame);
  }

  stopProcessing(): void {
    this.isProcessing = false;
  }

  private async processFrame(onFrame: (canvas: HTMLCanvasElement) => Promise<any>): Promise<void> {
    if (!this.isProcessing || !this.video || !this.canvas || !this.ctx) return;

    const startTime = performance.now();

    // Draw video frame to canvas
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    // Process the frame (pose detection, etc.)
    try {
      const result = await onFrame(this.canvas);
      
      // Draw overlays based on result
      if (result) {
        this.drawOverlays(result);
      }
    } catch (error) {
      console.error('Frame processing error:', error);
    }

    // Update metrics
    const processingTime = performance.now() - startTime;
    this.updateMetrics(processingTime);

    // Schedule next frame
    requestAnimationFrame(() => this.processFrame(onFrame));
  }

  private drawOverlays(data: any): void {
    if (!this.ctx || !this.canvas) return;

    const { pose, formAnalysis } = data;

    if (pose && this.drawOptions.showSkeleton) {
      this.drawSkeleton(pose);
    }

    if (pose && this.drawOptions.showAngles) {
      this.drawAngles(pose, formAnalysis);
    }

    if (formAnalysis && this.drawOptions.showCorrections) {
      this.drawCorrections(formAnalysis);
    }

    if (this.drawOptions.showStats) {
      this.drawStats(formAnalysis);
    }
  }

  private drawSkeleton(pose: any): void {
    if (!this.ctx) return;

    const keypoints = pose.keypoints;

    // Draw connections
    this.POSE_CONNECTIONS.forEach(([start, end]) => {
      const kp1 = keypoints[start];
      const kp2 = keypoints[end];

      if (kp1.score > this.drawOptions.confidenceThreshold && 
          kp2.score > this.drawOptions.confidenceThreshold) {
        
        // Determine color based on form analysis
        const color = this.getSkeletonColor(pose.formScore || 100);
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(kp1.x, kp1.y);
        this.ctx.lineTo(kp2.x, kp2.y);
        this.ctx.stroke();
      }
    });

    // Draw keypoints
    keypoints.forEach((keypoint: any) => {
      if (keypoint.score > this.drawOptions.confidenceThreshold) {
        const color = this.getKeypointColor(keypoint.score);
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        this.ctx.fill();
      }
    });
  }

  private drawAngles(pose: any, formAnalysis: any): void {
    if (!this.ctx || !formAnalysis || !formAnalysis.errors) return;

    const keypoints = pose.keypoints;

    // Draw angle indicators for problem areas
    formAnalysis.errors.forEach((error: any) => {
      if (error.joint === 'Knee' || error.joint === 'Hip' || error.joint === 'Elbow') {
        this.drawAngleIndicator(keypoints, error);
      }
    });
  }

  private drawAngleIndicator(keypoints: unknown[], error: any): void {
    if (!this.ctx) return;

    // Map joint names to keypoint indices
    const jointMap: { [key: string]: [number, number, number] } = {
      'Knee': [17, 19, 21], // Hip, Knee, Ankle
      'Hip': [11, 17, 19],  // Shoulder, Hip, Knee
      'Elbow': [11, 13, 15] // Shoulder, Elbow, Wrist
    };

    const indices = jointMap[error.joint];
    if (!indices) return;

    const [a, b, c] = indices.map(i => keypoints[i]);
    
    if (a.score > this.drawOptions.confidenceThreshold &&
        b.score > this.drawOptions.confidenceThreshold &&
        c.score > this.drawOptions.confidenceThreshold) {
      
      // Calculate angle
      const angle = this.calculateAngle(a, b, c);
      
      // Draw arc
      const radius = 30;
      const startAngle = Math.atan2(a.y - b.y, a.x - b.x);
      const endAngle = Math.atan2(c.y - b.y, c.x - b.x);
      
      this.ctx.strokeStyle = this.getSeverityColor(error.severity);
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, radius, startAngle, endAngle);
      this.ctx.stroke();
      
      // Draw angle text
      this.ctx.fillStyle = this.COLORS.text.primary;
      this.ctx.font = '14px Arial';
      this.ctx.fillText(`${Math.round(angle)}°`, b.x + radius + 5, b.y);
    }
  }

  private drawCorrections(formAnalysis: any): void {
    if (!this.ctx || !this.canvas) return;

    // Draw correction overlay
    const corrections = formAnalysis.errors
      .filter((e: any) => e.severity === 'critical' || e.severity === 'major')
      .slice(0, 3);

    if (corrections.length > 0) {
      // Draw semi-transparent background
      this.ctx.fillStyle = this.COLORS.overlay;
      this.ctx.fillRect(10, 10, 400, 30 + corrections.length * 25);

      // Draw corrections
      this.ctx.fillStyle = this.COLORS.text.primary;
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText('Form Corrections:', 20, 30);

      this.ctx.font = '14px Arial';
      corrections.forEach((error: any, index: number) => {
        const color = this.getSeverityColor(error.severity);
        this.ctx!.fillStyle = color;
        this.ctx!.fillText(`• ${error.correction}`, 20, 55 + index * 25);
      });
    }
  }

  private drawStats(formAnalysis: any): void {
    if (!this.ctx || !this.canvas) return;

    const stats = [
      { label: 'Form Score', value: `${formAnalysis?.formScore || 0}%`, color: this.getScoreColor(formAnalysis?.formScore) },
      { label: 'Reps', value: formAnalysis?.repCount || 0, color: this.COLORS.text.primary },
      { label: 'Tempo', value: `${formAnalysis?.tempo || 0}s`, color: this.COLORS.text.primary },
      { label: 'FPS', value: Math.round(this.fps), color: this.COLORS.text.secondary }
    ];

    // Draw stats in top right corner
    const x = this.canvas.width - 150;
    const y = 10;

    // Background
    this.ctx.fillStyle = this.COLORS.overlay;
    this.ctx.fillRect(x - 10, y, 150, 110);

    // Stats
    stats.forEach((stat, index) => {
      this.ctx!.fillStyle = this.COLORS.text.secondary;
      this.ctx!.font = '12px Arial';
      this.ctx!.fillText(stat.label, x, y + 20 + index * 25);

      this.ctx!.fillStyle = stat.color;
      this.ctx!.font = 'bold 14px Arial';
      this.ctx!.fillText(stat.value.toString(), x + 70, y + 20 + index * 25);
    });
  }

  private calculateAngle(a: any, b: any, c: any): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180 / Math.PI);
    if (angle > 180) {
      angle = 360 - angle;
    }
    return angle;
  }

  private getSkeletonColor(formScore: number): string {
    if (formScore >= 80) return this.COLORS.skeleton.good;
    if (formScore >= 60) return this.COLORS.skeleton.warning;
    return this.COLORS.skeleton.error;
  }

  private getKeypointColor(confidence: number): string {
    if (confidence >= 0.8) return this.COLORS.keypoint.high;
    if (confidence >= 0.5) return this.COLORS.keypoint.medium;
    return this.COLORS.keypoint.low;
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return this.COLORS.text.error;
      case 'major': return this.COLORS.skeleton.warning;
      case 'minor': return this.COLORS.text.secondary;
      default: return this.COLORS.text.primary;
    }
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return this.COLORS.text.success;
    if (score >= 60) return this.COLORS.skeleton.warning;
    return this.COLORS.text.error;
  }

  private updateMetrics(processingTime: number): void {
    this.frameCount++;
    
    // Update processing times
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 30) {
      this.processingTimes.shift();
    }

    // Calculate FPS
    const currentTime = performance.now();
    if (currentTime - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = currentTime;
    }
  }

  setDrawOptions(options: Partial<DrawOptions>): void {
    this.drawOptions = { ...this.drawOptions, ...options };
  }

  getMetrics(): CameraMetrics {
    const avgProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
      : 0;

    return {
      fps: this.fps,
      processingTime: Math.round(avgProcessingTime),
      frameCount: this.frameCount,
      detectionRate: this.processingTimes.filter(t => t < 50).length / this.processingTimes.length
    };
  }

  async switchCamera(): Promise<void> {
    if (!this.stream) return;

    // Stop current stream
    this.stream.getTracks().forEach(track => track.stop());

    // Get current facing mode
    const currentFacing = this.stream.getVideoTracks()[0]?.getSettings().facingMode || 'user';
    const newFacing = currentFacing === 'user' ? 'environment' : 'user';

    // Initialize with new camera
    await this.initialize({
      width: 640,
      height: 480,
      fps: 30,
      facing: newFacing as 'user' | 'environment'
    });

    // Reattach to elements
    if (this.video && this.canvas) {
      this.attachToElements(this.video, this.canvas);
    }
  }

  takeSnapshot(): string | null {
    if (!this.canvas) return null;
    
    return this.canvas.toDataURL('image/png');
  }

  dispose(): void {
    this.stopProcessing();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }

    this.video = null;
    this.canvas = null;
    this.ctx = null;
  }
}

// Export singleton instance
export const cameraService = new CameraService();