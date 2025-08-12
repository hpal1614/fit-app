/**
 * 🔍 Template Checker Utility
 * 
 * Utility to check and list saved workout templates
 */

import { hybridStorageService } from '../services/hybridStorageService';

export class TemplateChecker {
  // Use the exported instance

  /**
   * List all saved workout templates
   */
  async listAllTemplates() {
    try {
      console.log('🔍 Checking saved templates...');
      
      // Check IndexedDB storage
      const workoutsFromDB = await hybridStorageService.getAll('workout');
      console.log('📊 Templates in IndexedDB:', workoutsFromDB.length);
      
      // Check localStorage
      const templatesFromLS = JSON.parse(localStorage.getItem('workoutTemplates') || '[]');
      console.log('📊 Templates in localStorage:', templatesFromLS.length);
      
      // Check other localStorage keys
      const favoriteTemplates = JSON.parse(localStorage.getItem('favoriteTemplates') || '[]');
      const recentTemplates = JSON.parse(localStorage.getItem('recentTemplates') || '[]');
      
      console.log('📊 Favorite templates:', favoriteTemplates.length);
      console.log('📊 Recent templates:', recentTemplates.length);
      
      const allTemplates = {
        indexedDB: workoutsFromDB,
        localStorage: templatesFromLS,
        favorites: favoriteTemplates,
        recent: recentTemplates
      };
      
      console.log('📋 All templates summary:', allTemplates);
      
      return allTemplates;
    } catch (error) {
      console.error('❌ Error checking templates:', error);
      return null;
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(id: string) {
    try {
      // Try IndexedDB first
      const fromDB = await hybridStorageService.retrieve('workout', id);
      if (fromDB) {
        console.log('✅ Found template in IndexedDB:', fromDB);
        return fromDB;
      }
      
      // Try localStorage
      const templatesFromLS = JSON.parse(localStorage.getItem('workoutTemplates') || '[]');
      const fromLS = templatesFromLS.find((t: any) => t.id === id);
      if (fromLS) {
        console.log('✅ Found template in localStorage:', fromLS);
        return fromLS;
      }
      
      console.log('❌ Template not found:', id);
      return null;
    } catch (error) {
      console.error('❌ Error getting template:', error);
      return null;
    }
  }

  /**
   * Clear all templates (for testing)
   */
  async clearAllTemplates() {
    try {
      console.log('🗑️ Clearing all templates...');
      
      // Clear localStorage
      localStorage.removeItem('workoutTemplates');
      localStorage.removeItem('favoriteTemplates');
      localStorage.removeItem('recentTemplates');
      
      // Clear IndexedDB would require more complex logic
      console.log('✅ LocalStorage templates cleared');
      
      return true;
    } catch (error) {
      console.error('❌ Error clearing templates:', error);
      return false;
    }
  }
}

// Export instance for easy use
export const templateChecker = new TemplateChecker();

// Make it available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).templateChecker = templateChecker;
  
  // Add helper functions to window for easy debugging
  (window as any).checkTemplates = () => templateChecker.listAllTemplates();
  (window as any).getTemplate = (id: string) => templateChecker.getTemplate(id);
  (window as any).clearTemplates = () => templateChecker.clearAllTemplates();
  
  console.log('🔧 Template checker available in console:');
  console.log('  - checkTemplates() - List all saved templates');
  console.log('  - getTemplate(id) - Get specific template');
  console.log('  - clearTemplates() - Clear all templates (testing)');
}
