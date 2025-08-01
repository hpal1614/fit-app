import { Exercise } from '../workoutService';

export interface NimbusWorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: Exercise[];
  author?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  isShared?: boolean;
  originalShareCode?: string;
}

export interface NimbusSharedTemplate {
  id: string;
  shareCode: string;
  name: string;
  description: string;
  author: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  downloads: number;
  tags: string[];
  exercises: Exercise[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

export interface NimbusTemplateShare {
  templateId: string;
  shareCode: string;
  expiresAt?: Date;
  password?: string;
  downloadLimit?: number;
  currentDownloads: number;
}

export class NimbusTemplateSharing {
  private storageKey = 'nimbus_shared_templates';
  private shareStorageKey = 'nimbus_template_shares';

  // Generate shareable link for template
  async shareTemplate(
    template: NimbusWorkoutTemplate,
    options: {
      isPublic?: boolean;
      expiresInDays?: number;
      password?: string;
      downloadLimit?: number;
    } = {}
  ): Promise<string> {
    const shareCode = this.generateShareCode();
    const expiresAt = options.expiresInDays 
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const sharedTemplate: NimbusSharedTemplate = {
      id: template.id,
      shareCode,
      name: template.name,
      description: template.description || '',
      author: template.author || 'Anonymous',
      difficulty: template.difficulty || 'intermediate',
      rating: 0,
      downloads: 0,
      tags: template.tags || [],
      exercises: template.exercises,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: options.isPublic || false
    };

    const templateShare: NimbusTemplateShare = {
      templateId: template.id,
      shareCode,
      expiresAt,
      password: options.password,
      downloadLimit: options.downloadLimit,
      currentDownloads: 0
    };

    // Store in localStorage (in production, this would be a backend API)
    await this.storeSharedTemplate(sharedTemplate);
    await this.storeTemplateShare(templateShare);

    return shareCode;
  }

  // Import template using share code
  async importSharedTemplate(shareCode: string, password?: string): Promise<NimbusWorkoutTemplate> {
    const templateShare = await this.getTemplateShare(shareCode);
    if (!templateShare) {
      throw new Error('Invalid share code');
    }

    // Check if expired
    if (templateShare.expiresAt && new Date() > templateShare.expiresAt) {
      throw new Error('This shared template has expired');
    }

    // Check password
    if (templateShare.password && templateShare.password !== password) {
      throw new Error('Incorrect password');
    }

    // Check download limit
    if (templateShare.downloadLimit && 
        templateShare.currentDownloads >= templateShare.downloadLimit) {
      throw new Error('Download limit reached for this template');
    }

    const sharedTemplate = await this.getSharedTemplate(shareCode);
    if (!sharedTemplate) {
      throw new Error('Template not found');
    }

    // Increment download counter
    templateShare.currentDownloads++;
    await this.updateTemplateShare(templateShare);

    // Convert to local template format
    const importedTemplate: NimbusWorkoutTemplate = {
      id: this.generateId(),
      name: `${sharedTemplate.name} (Imported)`,
      description: sharedTemplate.description,
      exercises: sharedTemplate.exercises,
      author: sharedTemplate.author,
      difficulty: sharedTemplate.difficulty,
      tags: [...sharedTemplate.tags, 'imported'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isShared: true,
      originalShareCode: shareCode
    };

    return importedTemplate;
  }

  // Browse public templates
  async browsePublicTemplates(filters: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    search?: string;
  } = {}): Promise<NimbusSharedTemplate[]> {
    const allShared = await this.getAllSharedTemplates();
    
    return allShared
      .filter(template => template.isPublic)
      .filter(template => {
        if (filters.difficulty && template.difficulty !== filters.difficulty) {
          return false;
        }
        if (filters.tags && filters.tags.length > 0) {
          return filters.tags.some(tag => template.tags.includes(tag));
        }
        if (filters.search) {
          const search = filters.search.toLowerCase();
          return template.name.toLowerCase().includes(search) ||
                 template.description.toLowerCase().includes(search) ||
                 template.author.toLowerCase().includes(search);
        }
        return true;
      })
      .sort((a, b) => b.downloads - a.downloads); // Sort by popularity
  }

  // Rate a shared template
  async rateTemplate(shareCode: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const template = await this.getSharedTemplate(shareCode);
    if (!template) {
      throw new Error('Template not found');
    }

    // Simple rating system (in production, would track individual user ratings)
    const newRating = (template.rating + rating) / 2;
    template.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal
    template.updatedAt = new Date();

    await this.storeSharedTemplate(template);
  }

  // Get template share info
  async getTemplateShareInfo(shareCode: string): Promise<NimbusSharedTemplate | null> {
    return await this.getSharedTemplate(shareCode);
  }

  // Private helper methods
  private generateShareCode(): string {
    return 'NMB-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  private generateId(): string {
    return 'tmpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private async storeSharedTemplate(template: NimbusSharedTemplate): Promise<void> {
    const existing = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const index = existing.findIndex((t: NimbusSharedTemplate) => t.shareCode === template.shareCode);
    
    if (index >= 0) {
      existing[index] = template;
    } else {
      existing.push(template);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(existing));
  }

  private async getSharedTemplate(shareCode: string): Promise<NimbusSharedTemplate | null> {
    const templates = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    return templates.find((t: NimbusSharedTemplate) => t.shareCode === shareCode) || null;
  }

  private async getAllSharedTemplates(): Promise<NimbusSharedTemplate[]> {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  private async storeTemplateShare(share: NimbusTemplateShare): Promise<void> {
    const existing = JSON.parse(localStorage.getItem(this.shareStorageKey) || '[]');
    const index = existing.findIndex((s: NimbusTemplateShare) => s.shareCode === share.shareCode);
    
    if (index >= 0) {
      existing[index] = share;
    } else {
      existing.push(share);
    }
    
    localStorage.setItem(this.shareStorageKey, JSON.stringify(existing));
  }

  private async getTemplateShare(shareCode: string): Promise<NimbusTemplateShare | null> {
    const shares = JSON.parse(localStorage.getItem(this.shareStorageKey) || '[]');
    return shares.find((s: NimbusTemplateShare) => s.shareCode === shareCode) || null;
  }

  private async updateTemplateShare(share: NimbusTemplateShare): Promise<void> {
    await this.storeTemplateShare(share);
  }
} 