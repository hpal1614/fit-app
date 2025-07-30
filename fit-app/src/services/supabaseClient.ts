import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe environment variable access
function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Validate URL format
  const isValidUrl = url && (url.startsWith('https://') || url.startsWith('http://'));
  const isValidKey = key && key.length > 10;
  
  if (!isValidUrl || !isValidKey) {
    console.warn('Supabase credentials invalid or missing:', {
      hasUrl: !!url,
      hasKey: !!key,
      urlValid: isValidUrl
    });
    return null;
  }
  
  return { url, key };
}

// Create safe Supabase client
let supabase: SupabaseClient | null = null;

try {
  const config = getSupabaseConfig();
  if (config) {
    supabase = createClient(config.url, config.key);
    console.log('Supabase client created successfully');
  } else {
    console.log('Running in offline mode - Supabase disabled');
  }
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  supabase = null;
}

// Safe wrapper functions
export const safeSupabase = {
  client: supabase,
  
  async query(table: string, options: any = {}) {
    if (!supabase) {
      console.warn('Supabase not available, returning mock data');
      return { data: [], error: null };
    }
    
    try {
      return await supabase.from(table).select(options.select || '*');
    } catch (error) {
      console.error('Supabase query failed:', error);
      return { data: [], error };
    }
  },
  
  async insert(table: string, data: any) {
    if (!supabase) {
      console.warn('Supabase not available, data not saved');
      return { data: null, error: 'Offline mode' };
    }
    
    try {
      return await supabase.from(table).insert(data);
    } catch (error) {
      console.error('Supabase insert failed:', error);
      return { data: null, error };
    }
  }
};

export { supabase };
export default supabase;