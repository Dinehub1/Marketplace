import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('   Required: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.error('   Please check your .env file');
}

// Create Supabase client. Sign-in is real Supabase Auth (phone OTP), so the session is kept in
// AsyncStorage and refreshed while the app is in the foreground; every request then carries the
// customer's own token rather than only the public anon key.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh tokens only while the app is active, as Supabase recommends for React Native.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

// Real Supabase helper functions for user management
export const createUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating user:', error);
    return { data: null, error };
  }
};

export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return { data: null, error };
  }
};

export const getUserByFirebaseUid = async (firebaseUid) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - user doesn't exist
        return { data: null, error: null };
      } else {
        // Other error
        throw error;
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting user by Firebase UID:', error);
    return { data: null, error };
  }
};

export const getUserByPhoneNumber = async (phoneNumber) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - user doesn't exist
        return { data: null, error: null };
      } else {
        // Other error
        throw error;
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting user by phone number:', error);
    return { data: null, error };
  }
};

export const updateUser = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating user:', error);
    return { data: null, error };
  }
};

// ============== FCM TOKEN MANAGEMENT FUNCTIONS ==============

/**
 * Update user's FCM token for push notifications
 * @param {string} userId - User ID
 * @param {string} fcmToken - Firebase Cloud Messaging token
 * @returns {Promise<{data, error}>}
 */
export const updateUserFCMToken = async (userId, fcmToken) => {
  try {
    console.log('📱 Updating FCM token for user:', userId);
    const { data, error } = await supabase
      .from('users')
      .update({
        firebase_fcm: fcmToken,
        push_notification_token: fcmToken, // Also update push_notification_token for compatibility
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    console.log('✅ FCM token updated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error updating FCM token:', error);
    return { data: null, error };
  }
};

/**
 * Get user's FCM token
 * @param {string} userId - User ID
 * @returns {Promise<{data: string | null, error}>}
 */
export const getUserFCMToken = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('firebase_fcm')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data: data.firebase_fcm, error: null };
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return { data: null, error };
  }
};

/**
 * Clear user's FCM token (on logout or token invalidation)
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>}
 */
export const clearUserFCMToken = async (userId) => {
  try {
    console.log('🗑️ Clearing FCM token for user:', userId);
    const { data, error } = await supabase
      .from('users')
      .update({
        firebase_fcm: null,
        push_notification_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    console.log('✅ FCM token cleared successfully');
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error clearing FCM token:', error);
    return { data: null, error };
  }
};

// ============== USER LOCATION MANAGEMENT FUNCTIONS ==============

/**
 * Update user's current location in the database
 * @param {string} userId - User ID
 * @param {object} locationData - { latitude, longitude, city, area, state, fullAddress }
 * @returns {Promise<{data, error}>}
 */
export const updateUserLocation = async (userId, locationData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        current_latitude: locationData.latitude,
        current_longitude: locationData.longitude,
        current_city: locationData.city || null,
        current_area: locationData.area || null,
        current_state: locationData.state || null,
        current_full_address: locationData.fullAddress || null,
        last_location_update: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    console.log('✅ User location updated in database');
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error updating user location:', error);
    return { data: null, error };
  }
};

/**
 * Get user's location from database
 * @param {string} userId - User ID
 * @returns {Promise<{data: {latitude, longitude, city, area, state, fullAddress, last_update}, error}>}
 */
export const getUserLocation = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('current_latitude, current_longitude, current_city, current_area, current_state, current_full_address, last_location_update')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Return formatted location data
    return {
      data: {
        latitude: data.current_latitude,
        longitude: data.current_longitude,
        city: data.current_city,
        area: data.current_area,
        state: data.current_state,
        fullAddress: data.current_full_address,
        last_update: data.last_location_update
      },
      error: null
    };
  } catch (error) {
    console.error('❌ Error getting user location:', error);
    return { data: null, error };
  }
};

/**
 * Update user's location preference (GPS or Manual)
 * @param {string} userId - User ID
 * @param {string} locationType - 'gps' or 'manual'
 * @returns {Promise<{data, error}>}
 */
export const updateLocationPreference = async (userId, locationType) => {
  try {
    // First check if user_preferences record exists
    const { data: existingPrefs, error: checkError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    let result;
    if (existingPrefs) {
      // Update existing record
      result = await supabase
        .from('user_preferences')
        .update({
          location_type: locationType,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Create new record
      result = await supabase
        .from('user_preferences')
        .insert([{
          user_id: userId,
          location_type: locationType,
          notification_preferences: {
            email: true,
            push: true,
            sms: false
          }
        }])
        .select()
        .single();
    }

    if (result.error) throw result.error;
    console.log('✅ Location preference updated:', locationType);
    return { data: result.data, error: null };
  } catch (error) {
    console.error('❌ Error updating location preference:', error);
    return { data: null, error };
  }
};

/**
 * Get user's location preference
 * @param {string} userId - User ID
 * @returns {Promise<{data: {location_type}, error}>}
 */
export const getLocationPreference = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('location_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    // Return default 'gps' if no preference exists
    return {
      data: { location_type: data?.location_type || 'gps' },
      error: null
    };
  } catch (error) {
    console.error('❌ Error getting location preference:', error);
    return { data: { location_type: 'gps' }, error };
  }
};


// Real Supabase restaurant management functions
export const getRestaurants = async (filters = {}) => {
  try {
    let query = supabase
      .from('restaurants')
      .select(`
        *,
        dinein_offers (
          id,
          title,
          discount_type,
          discount_value,
          is_active
        )
      `)
      .eq('is_active', true);

    // Apply filters
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.cuisine_type) {
      query = query.eq('cuisine_type', filters.cuisine_type);
    }
    if (filters.price_range) {
      query = query.eq('price_range', filters.price_range);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting restaurants:', error);
    return { data: [], error };
  }
};

export const getTrendingRestaurants = async (limit = 10, city) => {
  try {
    let query = supabase
      .from('restaurants')
      .select(`
        *,
        dinein_offers (
          id,
          title,
          discount_type,
          discount_value,
          is_active
        )
      `)
      .eq('is_active', true);

    // Filter by city if provided
    if (city) {
      query = query.eq('city', city);
    }

    query = query
      .order('rating', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting trending restaurants:', error);
    return { data: [], error };
  }
};

export const getPopularRestaurants = async (limit = 10, city) => {
  try {
    let query = supabase
      .from('restaurants')
      .select(`
        *,
        dinein_offers (
          id,
          title,
          discount_type,
          discount_value,
          is_active
        )
      `)
      .eq('is_active', true);

    // Filter by city if provided
    if (city) {
      query = query.eq('city', city);
    }

    query = query
      .order('total_reviews', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting popular restaurants:', error);
    return { data: [], error };
  }
};

// Get all restaurants with pagination support
export const getAllRestaurants = async (page = 0, limit = 20, city) => {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('restaurants')
      .select(`
        *,
        dinein_offers (
          id,
          title,
          discount_type,
          discount_value,
          is_active
        )
      `, { count: 'exact' })
      .eq('is_active', true);

    // Filter by city if provided
    if (city) {
      query = query.eq('city', city);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;
    return {
      data: data || [],
      error: null,
      totalCount: count || 0,
      hasMore: count ? (from + limit) < count : false
    };
  } catch (error) {
    console.error('Error getting all restaurants:', error);
    return { data: [], error, totalCount: 0, hasMore: false };
  }
};

export const getRestaurantById = async (restaurantId) => {
  try {
    console.log('🔍 getRestaurantById called with ID:', restaurantId);
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    console.log('📊 Supabase response:', { data: data ? 'Found' : 'Not found', error });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error getting restaurant by ID:', error);
    return { data: null, error };
  }
};

// Get restaurant menu categories
export const getRestaurantMenuCategories = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_menu_categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting restaurant menu categories:', error);
    return { data: [], error };
  }
};

// Add cuisine to restaurant (max 3)
export const addRestaurantCuisine = async (restaurantId, cuisine) => {
  try {
    const { data, error } = await supabase.rpc('add_restaurant_cuisine', {
      restaurant_uuid: restaurantId,
      new_cuisine: cuisine
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding restaurant cuisine:', error);
    return { data: null, error };
  }
};

// Remove cuisine from restaurant
export const removeRestaurantCuisine = async (restaurantId, cuisine) => {
  try {
    const { data, error } = await supabase.rpc('remove_restaurant_cuisine', {
      restaurant_uuid: restaurantId,
      cuisine_to_remove: cuisine
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error removing restaurant cuisine:', error);
    return { data: null, error };
  }
};

// Real Supabase event management functions
// Get featured events
export const getFeaturedEvents = async (city) => {
  try {
    let query = supabase
      .from('events')
      .select(`
        *,
        event_categories (
          id,
          name,
          icon
        ),
        restaurants (
          id,
          name,
          address,
          city
        ),
        event_venue (
          venue_data,
          restaurant_id,
          restaurants (
            id,
            name,
            address,
            city
          )
        )
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .contains('event_scope', ['event'])
      .in('status', ['active', 'coming_soon']);

    // Filter by city if provided
    if (city) {
      query = query.eq('city', city);
    }

    query = query
      .order('event_date', { ascending: true })
      .limit(10);

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting featured events:', error);
    return { data: [], error };
  }
};

export const getEvents = async (filters = {}) => {
  try {
    let query = supabase
      .from('events')
      .select(`
        *,
        event_categories (
          id,
          name,
          icon
        ),
        event_venue (
          venue_data,
          restaurant_id,
          restaurants (
            id,
            name,
            address,
            city
          )
        ),
        event_ticket_types (
          id,
          price,
          entry_fee_amount,
          ticket_cover_amount,
          ticket_cover_enabled,
          is_active
        )
      `)
      .eq('is_active', true)
      .contains('event_scope', ['event'])
      .in('status', ['active', 'coming_soon']);

    // Apply filters
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.event_type) {
      query = query.eq('event_type', filters.event_type);
    }
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.categories && filters.categories.length > 0) {
      query = query.in('category_id', filters.categories);
    }
    if (filters.dateRange) {
      query = query.gte('event_date', filters.dateRange.startDate);
      query = query.lte('event_date', filters.dateRange.endDate);
    }

    // Add sorting
    if (filters.sortBy === 'date') {
      query = query.order('event_date', { ascending: true });
    } else if (filters.sortBy === 'popularity') {
      query = query.order('is_featured', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting events:', error);
    return { data: [], error };
  }
};

// Get event categories with event counts
export const getEventCategories = async (city) => {
  try {
    let query = supabase
      .from('event_categories')
      .select(`
        id,
        name,
        description,
        icon,
        events!inner (
          id,
          city,
          is_active,
          status
        )
      `)
      .eq('is_active', true)
      .eq('events.is_active', true)
      .in('events.status', ['active', 'coming_soon']);

    if (city) {
      query = query.eq('events.city', city);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data to include event counts
    const categoriesWithCounts = (data || []).map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      eventCount: category.events?.length || 0
    }));

    // Filter out categories with no events and sort by event count
    const filteredCategories = categoriesWithCounts
      .filter(cat => cat.eventCount > 0)
      .sort((a, b) => b.eventCount - a.eventCount);

    return { data: filteredCategories, error: null };
  } catch (error) {
    console.error('Error getting event categories:', error);
    return { data: [], error };
  }
};

export const getActivities = async (filters = {}) => {
  try {
    let query = supabase
      .from('events')
      .select(`
        *,
        event_categories (
          id,
          name,
          icon
        ),
        event_venue (
          venue_data,
          restaurant_id,
          restaurants (
            id,
            name,
            address,
            city
          )
        ),
        event_ticket_types (
          id,
          price,
          entry_fee_amount,
          ticket_cover_amount,
          ticket_cover_enabled,
          is_active
        )
      `)
      .eq('is_active', true)
      .contains('event_scope', ['activity'])
      .in('status', ['active', 'coming_soon']);

    // Apply filters
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.event_type) {
      query = query.eq('event_type', filters.event_type);
    }
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.categories && filters.categories.length > 0) {
      query = query.in('category_id', filters.categories);
    }
    if (filters.dateRange) {
      query = query.gte('event_date', filters.dateRange.startDate);
      query = query.lte('event_date', filters.dateRange.endDate);
    }

    // Add sorting
    if (filters.sortBy === 'date') {
      query = query.order('event_date', { ascending: true });
    } else if (filters.sortBy === 'popularity') {
      query = query.order('is_featured', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting activities:', error);
    return { data: [], error };
  }
};

export const getUpcomingEvents = async (limit = 5, city) => {
  try {
    let query = supabase
      .from('events')
      .select(`
        *,
        event_categories (
          id,
          name,
          icon
        ),
        restaurants (
          id,
          name,
          address
        )
      `)
      .eq('is_active', true)
      .gte('event_date', new Date().toISOString().split('T')[0]);

    // Filter by city if provided
    if (city) {
      query = query.eq('city', city);
    }

    query = query
      .order('event_date', { ascending: true })
      .limit(limit);

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    return { data: [], error };
  }
};

export const getEventById = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_categories (
          id,
          name,
          icon
        ),
        restaurants (
          id,
          name,
          address
        ),
        event_ticket_types (
          id,
          event_id,
          occurrence_id,
          name,
          description,
          price,
          strike_price,
          total_quantity,
          sold_quantity,
          features,
          is_active,
          is_available,
          is_sold_out,
          ticket_cover_enabled,
          ticket_cover_amount,
          ticket_cover_title,
          entry_fee_amount,
          valid_from,
          valid_until,
          min_purchase_amount,
          max_purchase_amount
        ),
        event_guide (
          guide_data
        ),
        event_venue (
          venue_data,
          restaurant_id,
          restaurants (
            id,
            name,
            address,
            city,
            state,
            latitude,
            longitude,
            google_maps_place_id,
            phone_number,
            email,
            website,
            opening_hours,
            cuisines,
            price_range,
            rating,
            total_reviews,
            cover_image_url,
            gallery_images,
            description
          )
        ),
        event_faq_terms (
          content_data
        ),
        event_prohibited_items (
          items_data
        ),
        event_experiences (
          id,
          name,
          image_url,
          description,
          display_order
        ),
        event_partners (
          id,
          name,
          logo_url,
          website_url,
          partner_type,
          display_order
        ),
        event_artists (
          id,
          artist_id,
          display_order,
          role,
          artists (
            id,
            name,
            bio,
            profile_image_url,
            social_links,
            genre,
            phone_number
          )
        )
      `)
      .eq('id', eventId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting event by ID:', error);
    return { data: null, error };
  }
};

// ============== EVENT OCCURRENCES MANAGEMENT FUNCTIONS ==============

/**
 * Get all occurrences for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<{data, error}>}
 */
export const getEventOccurrences = async (eventId) => {
  try {
    console.log('🔍 Fetching occurrences for event:', eventId);

    const { data, error } = await supabase
      .from('event_occurrences')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'scheduled')
      .order('occurrence_date', { ascending: true });

    if (error) {
      console.error('❌ Supabase error fetching occurrences:', error);
      throw error;
    }

    console.log('✅ Supabase returned occurrences:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('📅 First occurrence:', data[0].occurrence_date);
      console.log('📅 Last occurrence:', data[data.length - 1].occurrence_date);
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('❌ Exception getting event occurrences:', error);
    return { data: [], error };
  }
};

/**
 * Get a specific occurrence by ID
 * @param {string} occurrenceId - Occurrence ID
 * @returns {Promise<{data, error}>}
 */
export const getOccurrenceById = async (occurrenceId) => {
  try {
    const { data, error } = await supabase
      .from('event_occurrences')
      .select('*')
      .eq('id', occurrenceId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting occurrence by ID:', error);
    return { data: null, error };
  }
};

/**
 * Get tickets for a specific occurrence
 * @param {string} eventId - Event ID
 * @param {string} occurrenceId - Occurrence ID (optional)
 * @returns {Promise<{data, error}>}
 */
export const getTicketsForOccurrence = async (eventId, occurrenceId = null) => {
  try {
    let query = supabase
      .from('event_ticket_types')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true);

    if (occurrenceId) {
      // Get tickets linked to this specific occurrence OR tickets linked to event (occurrence_id is null)
      query = query.or(`occurrence_id.eq.${occurrenceId},occurrence_id.is.null`);
    } else {
      // Get all tickets for the event
      query = query.is('occurrence_id', null);
    }

    const { data, error } = await query.order('price', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting tickets for occurrence:', error);
    return { data: [], error };
  }
};

export const getEventsByRestaurantId = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        event_date,
        start_time,
        end_time,
        cover_image_url,
        event_type,
        ticket_type,
        is_active,
        is_featured,
        event_categories (
          id,
          name,
          icon
        ),
        event_ticket_types (
          id,
          price,
          is_active
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting events by restaurant ID:', error);
    return { data: [], error };
  }
};

export const getEventsByOrganizerId = async (organizerId) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        event_date,
        start_time,
        end_time,
        cover_image_url,
        event_type,
        ticket_type,
        is_active,
        event_categories (
          id,
          name,
          icon
        ),
        event_venue (
          venue_data
        ),
        restaurants (
          name,
          address,
          city
        )
      `)
      .eq('organizer_id', organizerId)
      .eq('is_active', true)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting events by organizer ID:', error);
    return { data: [], error };
  }
};

export const getOrganizerEventCount = async (organizerId) => {
  try {
    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', organizerId)
      .eq('is_active', true);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error getting organizer event count:', error);
    return { count: 0, error };
  }
};

// Real Supabase booking management functions
export const createBooking = async (bookingData) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_booking')
      .insert([bookingData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { data: null, error };
  }
};

export const createTransaction = async (transactionData) => {
  try {
    console.log('Creating transaction:', transactionData);
    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { data: null, error };
  }
};

// Get user's restaurant bookings (updated for new table structure)
export const getUserRestaurantBookings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_booking')
      .select(`
        *,
        restaurants:restaurant_id (
          id,
          name,
          cover_image_url,
          address,
          city
        ),
        dinein_offers:offer_id (
          id,
          title,
          description,
          discount_type,
          discount_value
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting user restaurant bookings:', error);
    return { data: [], error };
  }
};

// Keep old function for backward compatibility (now only for events)
export const getUserBookings = async (userId) => {
  console.warn('getUserBookings is deprecated, use getUserRestaurantBookings for restaurant bookings');
  try {
    const { data, error } = await supabase
      .from('event_bookings')
      .select(`
        *,
        restaurants (
          id,
          name,
          cover_image_url,
          address,
          city
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting user bookings:', error);
    return { data: [], error };
  }
};

// Get bookings for a specific restaurant, date, and meal period to check availability
export const getRestaurantBookings = async (restaurantId, date, mealPeriod) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_booking')
      .select('booking_time, party_size')
      .eq('restaurant_id', restaurantId)
      .eq('booking_date', date)
      .eq('meal_period', mealPeriod)
      .eq('status', 'confirmed');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting restaurant bookings:', error);
    return { data: [], error };
  }
};

// Check if a specific time slot is available for booking
export const checkTimeSlotAvailability = async (restaurantId, date, time, mealPeriod, partySize) => {
  try {
    const { data, error } = await getRestaurantBookings(restaurantId, date, mealPeriod);

    if (error) return { available: false, error };

    // Simple availability logic - you can enhance this based on restaurant capacity
    const existingBookings = data.filter(booking => booking.booking_time === time);
    const totalGuests = existingBookings.reduce((sum, booking) => sum + booking.party_size, 0);

    // Assume restaurant capacity of 100 guests per time slot - you can make this dynamic
    const maxCapacity = 100;
    const available = (totalGuests + parseInt(partySize)) <= maxCapacity;

    return { available, error: null };
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    return { available: false, error };
  }
};

// Event booking management functions
export const createEventBooking = async (bookingData) => {
  try {
    // Generate ticket number
    const { data: ticketNumberData, error: ticketNumberError } = await supabase
      .rpc('generate_ticket_number');

    if (ticketNumberError) throw ticketNumberError;

    const bookingWithTicketNumber = {
      ...bookingData,
      ticket_number: ticketNumberData,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('event_bookings')
      .insert([bookingWithTicketNumber])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating event booking:', error);
    return { data: null, error };
  }
};

export const getUserEventBookings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('event_bookings')
      .select(`
        *,
        events (
          id,
          title,
          description,
          event_date,
          start_time,
          cover_image_url
        ),
        event_ticket_types (
          id,
          name,
          price,
          features
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting user event bookings:', error);
    return { data: [], error };
  }
};

export const updateEventBookingStatus = async (bookingId, status) => {
  try {
    const { data, error } = await supabase
      .from('event_bookings')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating event booking status:', error);
    return { data: null, error };
  }
};

// Create transaction for event booking
export const createEventTransaction = async (transactionData) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        ...transactionData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating event transaction:', error);
    return { data: null, error };
  }
};

// Update ticket sold quantity
export const updateTicketSoldQuantity = async (ticketId, quantityToAdd) => {
  try {
    // First get current sold quantity
    const { data: ticketData, error: fetchError } = await supabase
      .from('event_ticket_types')
      .select('sold_quantity')
      .eq('id', ticketId)
      .single();

    if (fetchError) throw fetchError;

    // Update sold quantity
    const { data, error } = await supabase
      .from('event_ticket_types')
      .update({
        sold_quantity: (ticketData.sold_quantity || 0) + quantityToAdd
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating ticket sold quantity:', error);
    return { data: null, error };
  }
};

// ============== RESTAURANT SLOT MANAGEMENT FUNCTIONS ==============

// Check if a time slot is blocked for a restaurant
export const checkSlotBlocking = async (restaurantId, date, time, mealPeriod) => {
  try {
    console.log('Checking blocking for:', { restaurantId, date, time, mealPeriod });

    // Query with the simplified blocking logic using only 4 main columns:
    // block_date, block_end_date, start_time, end_time
    const { data: blocks, error } = await supabase
      .from('restaurant_slot_blocks')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true);

    if (error) {
      console.error('Error in blocking check:', error);
      return { isBlocked: false, blockingRules: [] };
    }

    if (!blocks || blocks.length === 0) {
      console.log('No blocks found for restaurant');
      return { isBlocked: false, blockingRules: [] };
    }

    // Filter blocks based on date and time ranges
    const applicableBlocks = blocks.filter(block => {
      console.log('Checking block:', block);

      // Check date range
      let dateInRange = false;

      if (block.block_date && block.block_end_date) {
        // Date range blocking: block_date <= date <= block_end_date
        dateInRange = date >= block.block_date && date <= block.block_end_date;
        console.log('Date range check:', { date, blockStart: block.block_date, blockEnd: block.block_end_date, inRange: dateInRange });
      } else if (block.block_date && !block.block_end_date) {
        // Single date blocking: exact date match
        dateInRange = date === block.block_date;
        console.log('Single date check:', { date, blockDate: block.block_date, matches: dateInRange });
      } else {
        // No date restriction - applies to all dates
        dateInRange = true;
        console.log('No date restriction - applies to all dates');
      }

      if (!dateInRange) {
        console.log('Date not in range for block:', block.id);
        return false;
      }

      // Check time range
      let timeInRange = false;

      if (block.start_time && block.end_time) {
        // Time range blocking: start_time <= time <= end_time
        timeInRange = time >= block.start_time && time <= block.end_time;
        console.log('Time range check:', { time, startTime: block.start_time, endTime: block.end_time, inRange: timeInRange });
      } else if (block.start_time && !block.end_time) {
        // Block from start_time onwards
        timeInRange = time >= block.start_time;
        console.log('Start time only check:', { time, startTime: block.start_time, afterStart: timeInRange });
      } else if (!block.start_time && block.end_time) {
        // Block until end_time
        timeInRange = time <= block.end_time;
        console.log('End time only check:', { time, endTime: block.end_time, beforeEnd: timeInRange });
      } else {
        // No time restriction - applies to all times
        timeInRange = true;
        console.log('No time restriction - applies to all times');
      }

      if (!timeInRange) {
        console.log('Time not in range for block:', block.id);
        return false;
      }

      console.log('Block applies:', { blockId: block.id, reason: block.reason });
      return true;
    });

    const isBlocked = applicableBlocks.length > 0;
    console.log('Blocking result:', { isBlocked, blocksCount: applicableBlocks.length });

    return {
      isBlocked,
      blockingRules: applicableBlocks
    };
  } catch (error) {
    console.error('Error checking slot blocking:', error);
    return { isBlocked: false, blockingRules: [] };
  }
};

// Get capacity limit for a time slot
export const getCapacityLimit = async (restaurantId, date, time) => {
  try {
    console.log('Checking capacity for:', { restaurantId, date, time });

    // NOTE: restaurant_time_capacity table was removed, now using restaurant.capacity as base limit
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('capacity')
      .eq('id', restaurantId)
      .single();

    if (error) throw error;

    // If restaurant has a capacity set, use it as a simple limit
    if (restaurant?.capacity && restaurant.capacity > 0) {
      const capacityLimit = {
        max_covers: restaurant.capacity,
        start_time: '00:00',
        end_time: '23:59',
        restaurant_id: restaurantId
      };
      console.log('Using restaurant capacity limit:', capacityLimit);
      return { capacityLimit };
    }

    // No capacity limits
    console.log('No capacity limits found for restaurant');
    return { capacityLimit: null };
  } catch (error) {
    console.error('Error getting capacity limit:', error);
    return { capacityLimit: null };
  }
};

// Count current bookings in a time range
export const getBookingsInTimeRange = async (restaurantId, date, startTime, endTime) => {
  try {
    console.log('Getting bookings in time range:', { restaurantId, date, startTime, endTime });

    const { data, error } = await supabase
      .from('restaurant_booking')
      .select('party_size')
      .eq('restaurant_id', restaurantId)
      .eq('booking_date', date)
      .gte('booking_time', startTime)
      .lt('booking_time', endTime)
      .eq('status', 'confirmed');

    if (error) throw error;

    const totalCovers = data.reduce((sum, booking) => sum + booking.party_size, 0);
    console.log('Found bookings:', { totalCovers, bookingCount: data.length });
    return { totalCovers, bookingCount: data.length };
  } catch (error) {
    console.error('Error getting bookings in time range:', error);
    return { totalCovers: 0, bookingCount: 0 };
  }
};

// Check slot availability (combines blocking and capacity checks)
export const checkSlotAvailability = async (restaurantId, date, time, mealPeriod, partySize = 1) => {
  try {
    console.log('🔍 checkSlotAvailability called with:', { restaurantId, date, time, mealPeriod, partySize });

    // Check if slot is blocked
    const { isBlocked, blockingRules } = await checkSlotBlocking(restaurantId, date, time, mealPeriod);
    console.log('🚫 Blocking result:', { isBlocked, blockingRulesCount: blockingRules?.length });

    if (isBlocked) {
      return {
        status: 'blocked',
        available: false,
        reason: blockingRules[0]?.reason || 'Time slot is not available',
        availableCovers: 0,
        maxCovers: 0,
        currentBookings: 0
      };
    }

    // Check capacity limits
    const { capacityLimit } = await getCapacityLimit(restaurantId, date, time);

    if (capacityLimit) {
      // Get current bookings in the time range
      const { totalCovers } = await getBookingsInTimeRange(
        restaurantId,
        date,
        capacityLimit.start_time,
        capacityLimit.end_time
      );

      const availableCovers = capacityLimit.max_covers - totalCovers;
      const canAccommodateParty = availableCovers >= partySize;

      return {
        status: canAccommodateParty ? 'available' : 'full',
        available: canAccommodateParty,
        reason: canAccommodateParty ? null : 'Time slot is fully booked',
        availableCovers,
        maxCovers: capacityLimit.max_covers,
        currentBookings: totalCovers
      };
    }

    // No restrictions - slot is available
    return {
      status: 'available',
      available: true,
      reason: null,
      availableCovers: null, // unlimited
      maxCovers: null,
      currentBookings: 0
    };

  } catch (error) {
    console.error('Error checking slot availability:', error);
    return {
      status: 'error',
      available: false,
      reason: 'Unable to check availability',
      availableCovers: 0,
      maxCovers: 0,
      currentBookings: 0
    };
  }
};

// ============== OFFER MANAGEMENT FUNCTIONS ==============

// Get active offers for a restaurant
export const getRestaurantOffers = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('dinein_offers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting restaurant offers:', error);
    return { data: [], error };
  }
};

// Get offer by ID
export const getOfferById = async (offerId) => {
  try {
    const { data, error } = await supabase
      .from('dinein_offers')
      .select('*')
      .eq('id', offerId)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting offer by ID:', error);
    return { data: null, error };
  }
};

// Check if offer is valid for specific date/time/party size
export const validateOffer = async (offerId, bookingDate, bookingTime, partySize) => {
  try {
    const { data: offer, error } = await getOfferById(offerId);
    if (error || !offer) {
      return { valid: false, reason: 'Offer not found' };
    }

    const slotData = offer.slot_data;
    const conditions = offer.conditions;

    // Check date validity
    const today = new Date().toISOString().split('T')[0];
    if (slotData.valid_from && bookingDate < slotData.valid_from) {
      return { valid: false, reason: 'Offer not yet valid' };
    }
    if (slotData.valid_until && bookingDate > slotData.valid_until) {
      return { valid: false, reason: 'Offer has expired' };
    }

    // Check day of week
    const bookingDateObj = new Date(bookingDate);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayOfWeek = dayNames[bookingDateObj.getDay()];

    if (slotData.days && !slotData.days.includes(dayOfWeek)) {
      return { valid: false, reason: 'Offer not valid on this day' };
    }

    // Check time slots
    if (slotData.time_slots && slotData.time_slots.length > 0) {
      const validTimeSlot = slotData.time_slots.find(slot => {
        return bookingTime >= slot.start && bookingTime <= slot.end;
      });

      if (!validTimeSlot) {
        return { valid: false, reason: 'Offer not valid at this time' };
      }

      // Check slot usage limits (date-based) - Enhanced for party size
      if (validTimeSlot.max_uses) {
        const today = new Date().toISOString().split('T')[0];
        const todaysUsage = validTimeSlot.current_uses_by_date?.[today] || 0;
        const remainingSlots = validTimeSlot.max_uses - todaysUsage;

        // Check if enough slots remain for the party size
        if (remainingSlots < partySize) {
          return {
            valid: false,
            reason: `Only ${remainingSlots} slots remaining, cannot accommodate ${partySize} guests`
          };
        }
      }
    }

    // Check party size conditions (guest_required in offer conditions)
    if (conditions && conditions[offer.discount_type]) {
      const offerTypeConditions = conditions[offer.discount_type];

      // Check guest_required field
      if (offerTypeConditions.guest_required && partySize < offerTypeConditions.guest_required) {
        return {
          valid: false,
          reason: `Minimum ${offerTypeConditions.guest_required} guests required for this offer`
        };
      }
    }

    // Legacy check for backward compatibility
    if (conditions.rules_by_type && conditions.rules_by_type[offer.discount_type]) {
      const typeRules = conditions.rules_by_type[offer.discount_type];
      if (typeRules.min_people && partySize < typeRules.min_people) {
        return { valid: false, reason: `Minimum ${typeRules.min_people} people required for this offer` };
      }
    }

    return { valid: true, offer };
  } catch (error) {
    console.error('Error validating offer:', error);
    return { valid: false, reason: 'Error validating offer' };
  }
};

// Create offer redemption record (removed duplicate)

// Get user's offer redemption history for a specific offer
export const getUserOfferRedemptions = async (userId, offerId) => {
  try {
    const { data, error } = await supabase
      .from('dinein_offer_redemptions')
      .select('*')
      .eq('user_id', userId)
      .eq('offer_id', offerId);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting user offer redemptions:', error);
    return { data: [], error };
  }
};

// Get today's usage count for a specific offer slot
export const getTodaysOfferUsage = (offer, slotLabel = 'All Day') => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const timeSlot = offer.slot_data?.time_slots?.find(slot => slot.label === slotLabel);

    if (!timeSlot) return 0;

    return timeSlot.current_uses_by_date?.[today] || 0;
  } catch (error) {
    console.error('Error getting today\'s offer usage:', error);
    return 0;
  }
};

// Update current_uses in offer slot_data when offer is redeemed (date-based)
export const updateOfferCurrentUses = async (offerId, slotLabel = 'All Day', partySize = 1) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // '2025-09-18'

    // Get current offer data
    const { data: offer, error: fetchError } = await supabase
      .from('dinein_offers')
      .select('slot_data')
      .eq('id', offerId)
      .single();

    if (fetchError) throw fetchError;

    // Update the current_uses_by_date for the specified slot
    const updatedSlotData = { ...offer.slot_data };

    if (updatedSlotData.time_slots) {
      updatedSlotData.time_slots = updatedSlotData.time_slots.map(slot => {
        if (slot.label === slotLabel) {
          const currentUsesByDate = slot.current_uses_by_date || {};
          return {
            ...slot,
            // Keep legacy current_uses for backward compatibility
            current_uses: (slot.current_uses || 0) + partySize,
            // Add new date-based tracking with party size
            current_uses_by_date: {
              ...currentUsesByDate,
              [today]: (currentUsesByDate[today] || 0) + partySize
            }
          };
        }
        return slot;
      });
    }

    // Update the offer with new slot_data
    const { data, error } = await supabase
      .from('dinein_offers')
      .update({ slot_data: updatedSlotData })
      .eq('id', offerId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating offer current uses:', error);
    return { data: null, error };
  }
};

// Calculate discount amount based on offer and order value
export const calculateDiscountAmount = (offer, orderValue) => {
  try {
    let discountAmount = 0;

    switch (offer.discount_type) {
      case 'percentage':
        discountAmount = (orderValue * offer.discount_value) / 100;
        break;
      case 'flat':
        discountAmount = offer.discount_value;
        break;
      case 'bogo':
        // For BOGO, discount depends on implementation
        // For now, treating as flat discount
        discountAmount = offer.discount_value;
        break;
      default:
        discountAmount = 0;
    }

    // Apply max discount limit if specified
    if (offer.conditions && offer.conditions.max_discount) {
      discountAmount = Math.min(discountAmount, offer.conditions.max_discount);
    }

    // Ensure discount doesn't exceed order value
    discountAmount = Math.min(discountAmount, orderValue);

    return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating discount amount:', error);
    return 0;
  }
};

// ============== EVENT OFFER MANAGEMENT FUNCTIONS ==============

// Get active offers for an event
export const getEventOffers = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('event_offers')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting event offers:', error);
    return { data: [], error };
  }
};

// Get event offer by ID
export const getEventOfferById = async (offerId) => {
  try {
    const { data, error } = await supabase
      .from('event_offers')
      .select('*')
      .eq('id', offerId)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting event offer by ID:', error);
    return { data: null, error };
  }
};

// Check if event offer is valid for specific date/time/party size
export const validateEventOffer = async (offerId, bookingDate, bookingTime, partySize) => {
  try {
    const { data: offer, error } = await getEventOfferById(offerId);
    if (error || !offer) {
      return { valid: false, reason: 'Event offer not found' };
    }

    const slotData = offer.slot_data;
    const conditions = offer.conditions;

    // Check date validity
    if (slotData.valid_from && bookingDate < slotData.valid_from) {
      return { valid: false, reason: 'Event offer not yet valid' };
    }
    if (slotData.valid_until && bookingDate > slotData.valid_until) {
      return { valid: false, reason: 'Event offer has expired' };
    }

    // Check day of week
    const bookingDateObj = new Date(bookingDate);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayOfWeek = dayNames[bookingDateObj.getDay()];

    // Normalize allowed days to handle typos like "mmon" → "mon"
    const normalizedAllowedDays = slotData.days ? slotData.days.map(day => {
      // Fix common typos
      if (day === 'mmon') return 'mon';
      if (day === 'tues') return 'tue';
      if (day === 'weds') return 'wed';
      if (day === 'thur' || day === 'thurs') return 'thu';
      return day.toLowerCase().substring(0, 3); // Normalize to first 3 chars
    }) : [];

    console.log('🗓️ Event Offer Day Validation DEBUG:', {
      bookingDate,
      bookingDateObj: bookingDateObj.toString(),
      getDay: bookingDateObj.getDay(),
      dayNamesArray: dayNames,
      calculatedDayOfWeek: dayOfWeek,
      allowedDays: slotData.days,
      normalizedAllowedDays: normalizedAllowedDays,
      dayInAllowedList: normalizedAllowedDays.length > 0 ? normalizedAllowedDays.includes(dayOfWeek) : 'no restriction',
      actualDayName: bookingDateObj.toLocaleDateString('en-US', { weekday: 'long' })
    });

    if (normalizedAllowedDays.length > 0 && !normalizedAllowedDays.includes(dayOfWeek)) {
      return { valid: false, reason: `Event offer not valid on ${dayOfWeek}. Valid days: ${normalizedAllowedDays.join(', ')}` };
    }

    // Check time slots
    if (slotData.time_slots && slotData.time_slots.length > 0) {
      const validTimeSlot = slotData.time_slots.find(slot => {
        return bookingTime >= slot.start && bookingTime <= slot.end;
      });

      if (!validTimeSlot) {
        return { valid: false, reason: 'Event offer not valid at this time' };
      }

      // Check slot usage limits (date-based) - Enhanced for party size
      if (validTimeSlot.max_uses) {
        const today = new Date().toISOString().split('T')[0];
        const todaysUsage = validTimeSlot.current_uses_by_date?.[today] || 0;
        const remainingSlots = validTimeSlot.max_uses - todaysUsage;

        // Check if enough slots remain for the party size
        if (remainingSlots < partySize) {
          return {
            valid: false,
            reason: `Only ${remainingSlots} slots remaining, cannot accommodate ${partySize} guests`
          };
        }
      }
    }

    // Check party size conditions (guest_required in offer conditions)
    if (conditions && conditions[offer.discount_type]) {
      const offerTypeConditions = conditions[offer.discount_type];

      // Check guest_required field
      if (offerTypeConditions.guest_required && partySize < offerTypeConditions.guest_required) {
        return {
          valid: false,
          reason: `Minimum ${offerTypeConditions.guest_required} guests required for this event offer`
        };
      }
    }

    // Legacy check for backward compatibility
    if (conditions.rules_by_type && conditions.rules_by_type[offer.discount_type]) {
      const typeRules = conditions.rules_by_type[offer.discount_type];
      if (typeRules.min_people && partySize < typeRules.min_people) {
        return { valid: false, reason: `Minimum ${typeRules.min_people} people required for this event offer` };
      }
    }

    return { valid: true, offer };
  } catch (error) {
    console.error('Error validating event offer:', error);
    return { valid: false, reason: 'Error validating event offer' };
  }
};

// Get today's usage count for a specific event offer slot
export const getTodaysEventOfferUsage = (offer, slotLabel = 'All Day') => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const timeSlot = offer.slot_data?.time_slots?.find(slot => slot.label === slotLabel);

    if (!timeSlot) return 0;

    return timeSlot.current_uses_by_date?.[today] || 0;
  } catch (error) {
    console.error('Error getting today\'s event offer usage:', error);
    return 0;
  }
};

// Update current_uses in event offer slot_data when offer is redeemed (date-based)
export const updateEventOfferCurrentUses = async (offerId, slotLabel = 'All Day') => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get current offer data
    const { data: offer, error: fetchError } = await supabase
      .from('event_offers')
      .select('slot_data')
      .eq('id', offerId)
      .single();

    if (fetchError) throw fetchError;

    // Update the current_uses_by_date for the specified slot
    const updatedSlotData = { ...offer.slot_data };

    if (updatedSlotData.time_slots) {
      updatedSlotData.time_slots = updatedSlotData.time_slots.map(slot => {
        if (slot.label === slotLabel) {
          const currentUsesByDate = slot.current_uses_by_date || {};
          return {
            ...slot,
            // Keep legacy current_uses for backward compatibility
            current_uses: (slot.current_uses || 0) + 1,
            // Add new date-based tracking
            current_uses_by_date: {
              ...currentUsesByDate,
              [today]: (currentUsesByDate[today] || 0) + 1
            }
          };
        }
        return slot;
      });
    }

    // Update the offer with new slot_data
    const { data, error } = await supabase
      .from('event_offers')
      .update({ slot_data: updatedSlotData })
      .eq('id', offerId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating event offer current uses:', error);
    return { data: null, error };
  }
};


// Get user's event offer redemption history for a specific offer
export const getUserEventOfferRedemptions = async (userId, offerId) => {
  try {
    const { data, error } = await supabase
      .from('event_offer_redemptions')
      .select('*')
      .eq('user_id', userId)
      .eq('offer_id', offerId);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting user event offer redemptions:', error);
    return { data: [], error };
  }
};

// Get user's free event bookings
export const getUserFreeEventBookings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('event_bookings')
      .select(`
        *,
        events:event_id (
          title,
          description,
          cover_image_url,
          event_date,
          start_time,
          end_time,
          event_type,
          ticket_type
        ),
        event_offers:offer_id (
          title,
          discount_type,
          discount_value
        )
      `)
      .eq('user_id', userId)
      .eq('booking_type', 'free')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting user free event bookings:', error);
    return { data: [], error };
  }
};

// Cancel event booking
export const cancelEventBooking = async (bookingId, userId) => {
  try {
    const { data, error } = await supabase
      .from('event_bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error cancelling event booking:', error);
    return { data: null, error };
  }
};

// ========================
// RESTAURANT BOOKING SYSTEM (Updated)
// ========================

// Helper function to calculate booking end time (booking_time + 6 hours)
export const calculateBookingEndTime = (bookingTime) => {
  const [hours, minutes] = bookingTime.split(':');
  const bookingDate = new Date();
  bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  // Add 6 hours to booking time
  const endTime = new Date(bookingDate.getTime() + (6 * 60 * 60 * 1000));

  // Return in HH:MM:SS format for database storage
  return endTime.toTimeString().slice(0, 8);
};

// Create restaurant booking with cover charge (Transaction 1)
export const createRestaurantBooking = async (bookingData) => {
  try {
    const { data: booking, error: bookingError } = await supabase
      .from('restaurant_booking')
      .insert([{
        ...bookingData,
        booking_end_time: calculateBookingEndTime(bookingData.booking_time),
        status: 'pending'
      }])
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Handle zero advance payment (no cover charge) - auto-confirm booking
    if (bookingData.advance_payment === 0) {
      console.log('📋 Zero advance payment - auto-confirming booking');

      // Auto-confirm booking since no payment required
      const { error: confirmError } = await supabase
        .from('restaurant_booking')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (confirmError) throw confirmError;

      // Return booking data without transaction since no payment needed
      return {
        data: {
          booking: { ...booking, status: 'confirmed', confirmed_at: new Date().toISOString() },
          transaction: null,
          autoConfirmed: true
        },
        error: null
      };
    }

    // Create advance payment transaction for non-zero amounts
    const transactionData = {
      user_id: bookingData.user_id,
      booking_id: booking.id,
      amount: bookingData.advance_payment,
      currency: 'INR',
      status: 'pending',
      purpose: 'advance_payment'
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('restaurant_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (transactionError) throw transactionError;

    return {
      data: { booking, transaction },
      error: null
    };
  } catch (error) {
    console.error('Error creating restaurant booking:', error);
    return { data: null, error };
  }
};

// Get user's active restaurant booking (for pay bill button)
export const getUserActiveRestaurantBooking = async (userId, restaurantId) => {
  try {
    const { data: bookings, error } = await supabase
      .from('restaurant_booking')
      .select(`
        *,
        dinein_offers:offer_id (
          id,
          title,
          description,
          discount_type,
          discount_value
        ),
        restaurants:restaurant_id (
          name,
          cover_image_url
        )
      `)
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false }); // Get most recent first

    if (error) throw error;

    console.log('📊 Found bookings:', bookings?.length || 0);

    // Check each booking to find the most recent active one
    if (bookings && bookings.length > 0) {
      for (const booking of bookings) {
        console.log('📅 Checking booking validity:', {
          bookingId: booking.id,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          bookingEndTime: booking.booking_end_time,
          currentTime: new Date().toISOString()
        });

        // Skip bookings without end time
        if (!booking.booking_end_time) {
          console.log('⚠️ Skipping booking without end time:', booking.id);
          continue;
        }

        const now = new Date();
        const bookingDate = new Date(booking.booking_date);
        const [endHours, endMinutes] = booking.booking_end_time.split(':');

        // Create end time for comparison
        const bookingEndTime = new Date(bookingDate);
        bookingEndTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

        // If end time is early morning (like 03:30), it means next day
        if (parseInt(endHours) < 12 && parseInt(endHours) < 6) {
          bookingEndTime.setDate(bookingEndTime.getDate() + 1);
        }

        console.log('⏰ Time comparison:', {
          now: now.toISOString(),
          bookingEndTime: bookingEndTime.toISOString(),
          isExpired: now > bookingEndTime
        });

        // Check if booking is still active
        if (now <= bookingEndTime) {
          console.log('✅ Found active booking, showing Pay Bill button');
          return { data: booking, error: null };
        } else {
          console.log('❌ Booking expired:', booking.id);
        }
      }

      console.log('❌ No active bookings found');
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Error getting user active booking:', error);
    return { data: null, error };
  }
};

// Update booking status after payment
export const updateRestaurantBookingStatus = async (bookingId, status, additionalData = {}) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_booking')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating booking status:', error);
    return { data: null, error };
  }
};

// Calculate final payment breakdown (DEPRECATED - Use calculateRestaurantBreakdown from feeCalculator.ts)
// Kept for backward compatibility only
export const calculatePaymentBreakdown = (grossBillAmount, offer, coverCharge, restaurant = null) => {
  let discountAmount = 0;

  // Calculate discount based on offer
  if (offer) {
    if (offer.discount_type === 'percentage') {
      discountAmount = (grossBillAmount * offer.discount_value) / 100;
    } else if (offer.discount_type === 'flat') {
      discountAmount = offer.discount_value;
    } else if (offer.discount_type === 'bogo') {
      // For BOGO, apply 50% discount (buy one get one)
      discountAmount = grossBillAmount * 0.5;
    }
  }

  // If restaurant data is provided, use dynamic fee calculation
  if (restaurant) {
    const { calculateRestaurantBreakdown } = require('../utils/feeCalculator');
    const breakdown = calculateRestaurantBreakdown(
      grossBillAmount,
      restaurant,
      discountAmount,
      coverCharge
    );

    return {
      grossBillAmount: breakdown.billAmount,
      discountAmount: breakdown.discountAmount,
      afterDiscount: breakdown.afterDiscount,
      coverCharge: breakdown.coverCharge,
      convenienceFee: breakdown.convenienceFee,
      finalPayable: breakdown.customerPays,
      // For backend calculations
      commission: breakdown.commission,
      merchantDue: breakdown.merchantGets,
      platformEarnings: breakdown.platformEarns
    };
  }

  // Fallback to hardcoded 5% (for backward compatibility)
  const afterDiscount = grossBillAmount - discountAmount;
  const minusCover = Math.max(0, afterDiscount - coverCharge);

  const convenienceFee = Math.round(afterDiscount * 0.05); // 5% of after-discount amount
  const finalPayable = minusCover + convenienceFee;

  // Commission calculation (for merchant settlement)
  const commission = afterDiscount * 0.05; // 5% of after-discount amount
  const merchantDue = afterDiscount - commission;
  const platformEarnings = commission + convenienceFee;

  return {
    grossBillAmount,
    discountAmount,
    afterDiscount,
    coverCharge,
    convenienceFee,
    finalPayable: Math.max(0, finalPayable),
    // For backend calculations
    commission,
    merchantDue,
    platformEarnings
  };
};

// Create final bill payment (Transaction 2)
export const createRestaurantPayment = async (bookingId, paymentBreakdown) => {
  try {
    // Get booking details with restaurant data
    const { data: booking, error: bookingError } = await supabase
      .from('restaurant_booking')
      .select(`
        *,
        restaurants:restaurant_id (
          commission_rate,
          convenience_fee_value
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) throw bookingError;

    // FIXED: Use actual cover charge from booking record, not from calculation
    const actualCoverCharge = parseFloat(booking.total_cover_charge) || 0;

    // Get commission rate from restaurant settings (fallback to 5%)
    const commissionRate = booking.restaurants?.commission_rate || 5.0;

    // Get convenience fee rate from restaurant settings (fallback to 5%)
    const convenienceFeeRate = booking.restaurants?.convenience_fee_value || 5.0;

    // Calculate total_paid (T1 + T2)
    const totalPaid = actualCoverCharge + paymentBreakdown.finalPayable;

    console.log('💰 Payment breakdown debug:', {
      bookingId,
      actualCoverChargeFromDB: actualCoverCharge,
      passedCoverCharge: paymentBreakdown.coverCharge,
      grossBill: paymentBreakdown.grossBillAmount,
      afterDiscount: paymentBreakdown.afterDiscount,
      convenienceFee: paymentBreakdown.convenienceFee,
      commissionRate,
      convenienceFeeRate,
      totalPaid
    });

    // Create payment record
    const paymentData = {
      booking_id: bookingId,
      user_id: booking.user_id,
      restaurant_id: booking.restaurant_id,
      gross_bill_amount: paymentBreakdown.grossBillAmount,
      discount_amount: paymentBreakdown.discountAmount,
      cover_charge: actualCoverCharge, // Use actual cover charge from booking
      convenience_fee: paymentBreakdown.convenienceFee,
      convenience_fee_rate: convenienceFeeRate, // ✅ NEW: Store the fee rate used
      final_payable_amount: paymentBreakdown.finalPayable,
      total_paid: totalPaid, // ✅ NEW: T1 + T2 total
      commission_rate: commissionRate, // ✅ UPDATED: Use dynamic rate from DB
      commission_amount: paymentBreakdown.commission,
      merchant_due: paymentBreakdown.merchantDue,
      platform_earnings: paymentBreakdown.platformEarnings,
      status: 'pending'
    };

    const { data: payment, error: paymentError } = await supabase
      .from('restaurant_payments')
      .insert([paymentData])
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Create final payment transaction
    const transactionData = {
      user_id: booking.user_id,
      booking_id: bookingId,
      restaurant_payment_id: payment.id,
      amount: paymentBreakdown.finalPayable,
      currency: 'INR',
      status: 'pending',
      purpose: 'advance_payment' // This represents final bill payment
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('restaurant_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (transactionError) throw transactionError;

    return {
      data: { payment, transaction },
      error: null
    };
  } catch (error) {
    console.error('Error creating restaurant payment:', error);
    return { data: null, error };
  }
};

// Process successful payment (update statuses)
export const processSuccessfulPayment = async (transactionId, paymentGatewayResponse) => {
  try {
    // Update transaction status
    const { data: transaction, error: transactionError } = await supabase
      .from('restaurant_transactions')
      .update({
        status: 'success',
        gateway_response: paymentGatewayResponse,
        transaction_id: paymentGatewayResponse.transaction_id || `TXN_${Date.now()}`
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (transactionError) throw transactionError;

    // If this is a final payment, update payment and booking status
    if (transaction.restaurant_payment_id) {
      // Update payment status
      await supabase
        .from('restaurant_payments')
        .update({ status: 'paid' })
        .eq('id', transaction.restaurant_payment_id);

      // Update booking status to completed
      await supabase
        .from('restaurant_booking')
        .update({
          status: 'completed',
          final_bill_amount: transaction.amount
        })
        .eq('id', transaction.booking_id);
    } else {
      // This is advance payment, confirm the booking
      await supabase
        .from('restaurant_booking')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', transaction.booking_id);
    }

    return { data: transaction, error: null };
  } catch (error) {
    console.error('Error processing successful payment:', error);
    return { data: null, error };
  }
};

// Create offer redemption record
export const createOfferRedemption = async (offerId, userId, bookingDate, slotLabel = 'All Day', partySize = 1) => {
  try {
    const { data, error } = await supabase
      .from('dinein_offer_redemptions')
      .insert([{
        offer_id: offerId,
        user_id: userId,
        redemption_date: bookingDate,
        slot_label: slotLabel,
        quantity: partySize  // Track party size in redemption
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating offer redemption:', error);
    return { data: null, error };
  }
};

// Get booking details by ID for pay bill page
export const getBookingById = async (bookingId) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_booking')
      .select(`
        *,
        dinein_offers:offer_id (
          id,
          title,
          description,
          discount_type,
          discount_value
        ),
        restaurants:restaurant_id (
          name,
          cover_image_url,
          commission_rate,
          convenience_fee_enabled,
          convenience_fee_type,
          convenience_fee_value,
          convenience_fee_rules,
          min_convenience_fee,
          max_convenience_fee,
          min_fee_enabled,
          max_fee_enabled
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting booking by ID:', error);
    return { data: null, error };
  }
};

// ========================================
// EVENT BOOKING SYSTEM FUNCTIONS
// ========================================

// Calculate event booking end time (booking_time + 6 hours)
export const calculateEventBookingEndTime = (bookingTime) => {
  try {
    const [hours, minutes] = bookingTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours + 6, minutes, 0, 0);

    // Format back to HH:MM
    return endTime.toTimeString().slice(0, 5);
  } catch (error) {
    console.error('Error calculating event booking end time:', error);
    return bookingTime;
  }
};

// Create free event booking with cover charge (Transaction 1)
export const createFreeEventBooking = async (bookingData) => {
  try {
    console.log('🎫 Creating event booking:', bookingData);
    console.log('📅 Occurrence ID:', bookingData.occurrence_id);

    const { data: booking, error: bookingError } = await supabase
      .from('event_bookings')
      .insert([{
        ...bookingData,
        occurrence_id: bookingData.occurrence_id || null,  // ✅ Add occurrence_id
        booking_end_time: calculateEventBookingEndTime(bookingData.booking_time),
        status: 'pending',
        booking_type: 'free'
      }])
      .select()
      .single();

    if (bookingError) throw bookingError;
    console.log('✅ Event booking created:', booking);
    console.log('✅ Linked to occurrence:', booking.occurrence_id);

    // Handle zero advance payment (no cover charge) - auto-confirm booking
    if (bookingData.advance_payment === 0) {
      console.log('📋 Zero advance payment - auto-confirming event booking');

      // Auto-confirm booking since no payment required
      const { error: confirmError } = await supabase
        .from('event_bookings')
        .update({
          status: 'confirmed'
        })
        .eq('id', booking.id);

      if (confirmError) throw confirmError;

      // Create offer redemption record if offer was applied
      if (bookingData.offer_id) {
        const redemptionResult = await createEventOfferRedemption(
          bookingData.offer_id,
          bookingData.user_id,
          bookingData.booking_date,
          bookingData.time_section || 'All Day',
          bookingData.party_size || 1
        );

        if (redemptionResult.error) {
          console.error('⚠️ Failed to create offer redemption for auto-confirmed booking:', redemptionResult.error);
          // Don't throw error here - booking was successful, just log the redemption failure
        }
      }

      // Return booking data without transaction since no payment needed
      return {
        data: {
          booking: { ...booking, status: 'confirmed' },
          transaction: null,
          autoConfirmed: true
        },
        error: null
      };
    }

    // Create advance payment transaction for non-zero amounts
    const transactionData = {
      user_id: bookingData.user_id,
      event_booking_id: booking.id,
      amount: bookingData.advance_payment,
      currency: 'INR',
      status: 'pending',
      purpose: 'cover_charge'
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('event_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (transactionError) throw transactionError;
    console.log('✅ Event transaction created:', transaction);

    return {
      data: { booking, transaction },
      error: null
    };
  } catch (error) {
    console.error('Error creating event booking:', error);
    return { data: null, error };
  }
};

// Get user's active event booking (for pay bill button)
export const getUserActiveEventBooking = async (userId, eventId) => {
  try {
    const currentTime = new Date().toTimeString().slice(0, 5);
    const currentDate = new Date().toISOString().split('T')[0];

    console.log('🔍 Searching for active booking with filters:', {
      userId,
      eventId,
      currentTime,
      currentDate,
      statuses: ['confirmed']
    });

    const { data, error } = await supabase
      .from('event_bookings')
      .select(`
        *,
        events!inner(
          title,
          organizer_id,
          restaurant_id
        )
      `)
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .in('status', ['confirmed'])
      .gte('booking_end_time', currentTime) // Current time is before booking end time
      .eq('booking_date', currentDate) // Today's bookings only
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('🔍 Active booking query result:', { data, error });

    // If no active booking found, let's check if there are any recent bookings for this user/event
    if (!data && !error) {
      console.log('🔍 No active booking found, checking for any recent bookings...');
      const { data: recentBookings, error: recentError } = await supabase
        .from('event_bookings')
        .select('*')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(3);

      console.log('🔍 Recent bookings for debugging:', recentBookings);
    }

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting user active event booking:', error);
    return { data: null, error };
  }
};

// Create event payment record (Transaction 2) - similar to restaurant payment
export const createEventPayment = async (bookingId, paymentBreakdown) => {
  try {
    console.log('💳 Creating event payment record:', bookingId);

    // Get booking details with event info
    const { data: booking, error: bookingError } = await supabase
      .from('event_bookings')
      .select(`
        *,
        events:event_id (
          organizer_id,
          commission_rate,
          t2_convenience_fee_value
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) throw bookingError;

    // Use actual cover charge from booking record
    const actualCoverCharge = parseFloat(booking.total_cover_charge) || 0;

    // ✅ Get dynamic rates from event settings
    const commissionRate = booking.events?.commission_rate ?? 5;
    const convenienceFeeRate = booking.events?.t2_convenience_fee_value ?? 5;

    console.log('💰 Event payment breakdown debug:', {
      bookingId,
      actualCoverChargeFromDB: actualCoverCharge,
      passedCoverCharge: paymentBreakdown.coverCharge,
      grossBill: paymentBreakdown.grossBillAmount,
      afterDiscount: paymentBreakdown.afterDiscount,
      convenienceFee: paymentBreakdown.convenienceFee,
      commissionRate: commissionRate,
      convenienceFeeRate: convenienceFeeRate
    });

    // Create payment record with T1/T2 tracking
    const paymentData = {
      event_booking_id: bookingId,
      user_id: booking.user_id,
      event_id: booking.event_id,
      organizer_id: booking.events?.organizer_id || booking.user_id, // Get organizer from events table
      event_type: 'free',
      gross_amount: paymentBreakdown.grossBillAmount,
      discount_amount: paymentBreakdown.discountAmount,
      cover_charge: actualCoverCharge, // Use actual cover charge from booking
      convenience_fee_rate: convenienceFeeRate, // ✅ Use event's T2 convenience fee rate
      convenience_fee_amount: paymentBreakdown.convenienceFee,
      commission_rate: commissionRate, // ✅ Use event's commission rate
      commission_amount: paymentBreakdown.commission,
      organizer_due: paymentBreakdown.organizerDue,
      platform_earnings: paymentBreakdown.platformEarnings,
      status: 'pending',
      transaction_status: 'T2', // This is T2 (venue payment)
      // New T1/T2 tracking columns
      t1_commission_amount: 0, // No T1 for free events
      t2_commission_amount: paymentBreakdown.commission,
      t1_convenience_fee: 0, // No T1 for free events
      t2_convenience_fee: paymentBreakdown.convenienceFee,
      customer_total_paid: paymentBreakdown.finalPayable, // Only T2 payment for free events
      t1_organizer_due: 0, // No T1 for free events
      t2_organizer_due: paymentBreakdown.organizerDue,
      t1_status: 'paid', // Free events don't have T1, so mark as paid
      t2_status: 'pending', // T2 is pending until payment completes
      t1_final_payable_amount: 0, // No T1 for free events
      t2_final_payable_amount: paymentBreakdown.finalPayable // T2 payment amount
    };

    const { data: payment, error: paymentError } = await supabase
      .from('event_payments')
      .insert([paymentData])
      .select()
      .single();

    if (paymentError) throw paymentError;
    console.log('✅ Event payment record created:', payment);

    // Create final payment transaction
    const transactionData = {
      user_id: booking.user_id,
      event_booking_id: bookingId,
      event_payment_id: payment.id,
      amount: paymentBreakdown.finalPayable,
      currency: 'INR',
      status: 'pending',
      purpose: 'venue_payment'
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('event_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (transactionError) throw transactionError;
    console.log('✅ Event venue payment transaction created:', transaction);

    return {
      data: { payment, transaction },
      error: null
    };
  } catch (error) {
    console.error('Error creating event payment:', error);
    return { data: null, error };
  }
};

// Process successful event payment (update statuses)
export const processSuccessfulEventPayment = async (transactionId, paymentGatewayResponse) => {
  try {
    console.log('🎉 Processing successful event payment:', transactionId);

    // Update transaction status
    const { data: transaction, error: transactionError } = await supabase
      .from('event_transactions')
      .update({
        status: 'success',
        gateway_response: paymentGatewayResponse,
        transaction_id: paymentGatewayResponse.transaction_id || `TXN_${Date.now()}`
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (transactionError) throw transactionError;

    // If this is a final payment, update payment and booking status
    if (transaction.event_payment_id) {
      // Update payment status and T2 status
      await supabase
        .from('event_payments')
        .update({
          status: 'paid',
          t2_status: 'paid' // Mark T2 as paid
        })
        .eq('id', transaction.event_payment_id);

      // Update booking status to completed and set final amounts
      await supabase
        .from('event_bookings')
        .update({
          status: 'completed',
          gross_amount: transaction.amount, // Set from final payment
          final_amount: transaction.amount,
          transaction_status: 'T1,T2' // Update booking to show both transactions completed
        })
        .eq('id', transaction.event_booking_id);
    } else if (transaction.purpose === 'cover_charge') {
      // This is advance payment, confirm the booking and create offer redemption
      const { data: booking } = await supabase
        .from('event_bookings')
        .update({
          status: 'confirmed'
        })
        .eq('id', transaction.event_booking_id)
        .select()
        .single();

      // Create offer redemption record if offer was applied
      if (booking?.offer_id) {
        const redemptionResult = await createEventOfferRedemption(
          booking.offer_id,
          booking.user_id,
          booking.booking_date,
          booking.time_section || 'All Day',
          booking.party_size || 1
        );

        if (redemptionResult.error) {
          console.error('⚠️ Failed to create offer redemption, but payment was successful:', redemptionResult.error);
          // Don't throw error here - payment was successful, just log the redemption failure
        }
      }
    }

    console.log('✅ Event payment processed successfully');
    return { data: transaction, error: null };
  } catch (error) {
    console.error('Error processing successful event payment:', error);
    return { data: null, error };
  }
};

// Create event offer redemption record
export const createEventOfferRedemption = async (offerId, userId, bookingDate, slotLabel = 'All Day', partySize = 1) => {
  try {
    console.log('🎯 Creating event offer redemption:', { offerId, userId, bookingDate, slotLabel, partySize });

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ User not authenticated for offer redemption:', authError);
      return { data: null, error: authError || new Error('User not authenticated') };
    }

    // Verify the user ID matches the authenticated user
    if (user.id !== userId) {
      console.error('❌ User ID mismatch in offer redemption');
      return { data: null, error: new Error('User ID mismatch') };
    }

    const { data, error } = await supabase
      .from('event_offer_redemptions')
      .insert([{
        offer_id: offerId,
        user_id: userId,
        slot_label: slotLabel,
        redemption_date: bookingDate,
        quantity: partySize
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Database error creating event offer redemption:', error);
      throw error;
    }

    console.log('✅ Event offer redemption created:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error creating event offer redemption:', error);
    return { data: null, error };
  }
};

// Calculate event payment breakdown
export const calculateEventPaymentBreakdown = (grossBillAmount, offer, coverCharge) => {
  let discountAmount = 0;

  // Calculate discount based on offer
  if (offer) {
    if (offer.discount_type === 'percentage') {
      discountAmount = (grossBillAmount * offer.discount_value) / 100;
    } else if (offer.discount_type === 'flat') {
      discountAmount = offer.discount_value;
    } else if (offer.discount_type === 'bogo') {
      // For BOGO, apply 50% discount (buy one get one)
      discountAmount = grossBillAmount * 0.5;
    }
  }

  const afterDiscount = grossBillAmount - discountAmount;
  const minusCover = Math.max(0, afterDiscount - coverCharge);

  // Convenience fee should be 5% of after-discount amount
  const convenienceFee = Math.round(afterDiscount * 0.05); // 5% of after-discount amount
  const finalPayable = minusCover + convenienceFee;

  // Commission calculation (for organizer settlement)
  const commission = afterDiscount * 0.05; // 5% of after-discount amount
  const organizerDue = afterDiscount - commission;
  const platformEarnings = commission + convenienceFee;

  return {
    grossBillAmount,
    discountAmount,
    afterDiscount,
    coverCharge,
    convenienceFee,
    finalPayable: Math.max(0, finalPayable),
    // For backend calculations
    commission,
    organizerDue,
    platformEarnings
  };
};

// Get event booking by ID (for pay bill page)
export const getEventBookingById = async (bookingId) => {
  try {
    const { data: booking, error } = await supabase
      .from('event_bookings')
      .select(`
        *,
        event_offers:offer_id (
          id,
          title,
          description,
          discount_type,
          discount_value
        ),
        events:event_id (
          title,
          cover_image_url,
          description
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;

    return { data: booking, error: null };
  } catch (error) {
    console.error('Error getting event booking by ID:', error);
    return { data: null, error };
  }
};

// ===== PAID EVENT BOOKING SYSTEM =====

// Create paid event booking (T1 - Ticket Purchase)
export const createPaidEventBooking = async (ticketData) => {
  try {
    console.log('🎫 Creating paid event booking:', ticketData);
    console.log('📅 Occurrence ID:', ticketData.occurrence_id);

    // Generate ticket number
    const { data: ticketNumberData, error: ticketNumberError } = await supabase
      .rpc('generate_ticket_number');

    if (ticketNumberError) throw ticketNumberError;

    // Calculate booking end time (event start time + 6 hours)
    const bookingEndTime = calculateEventBookingEndTime(ticketData.booking_time);

    // Create booking record
    const bookingRecord = {
      user_id: ticketData.user_id,
      event_id: ticketData.event_id,
      occurrence_id: ticketData.occurrence_id || null,  // ✅ Add occurrence_id
      ticket_id: ticketData.ticket_id,
      tickets_count: ticketData.tickets_count,
      gross_amount: null, // Will be set in T2
      customer_name: ticketData.customer_name,
      customer_phone: ticketData.customer_phone,
      customer_email: ticketData.customer_email,
      status: 'pending',
      ticket_number: ticketNumberData,
      booking_date: ticketData.booking_date,
      booking_time: ticketData.booking_time,
      time_section: null, // Not used for paid events
      party_size: null, // Not used for paid events
      special_requests: ticketData.special_requests || null,
      booking_type: 'paid',
      offer_id: null, // Not used for paid events
      is_checked_in: false,
      checked_in_at: null,
      cover_charge_per_person: null, // Not used for paid events
      total_cover_charge: null, // Not used for paid events
      final_amount: null, // Will be set after T2
      advance_payment: ticketData.ticket_price, // Full ticket price
      booking_end_time: bookingEndTime
    };

    const { data: booking, error: bookingError } = await supabase
      .from('event_bookings')
      .insert([bookingRecord])
      .select()
      .single();

    if (bookingError) throw bookingError;
    console.log('✅ Paid event booking created:', booking);
    console.log('✅ Linked to occurrence:', booking.occurrence_id);

    // Get ticket details to calculate total amount with convenience fee
    const { data: ticketTypeDetails } = await supabase
      .from('event_ticket_types')
      .select('*')
      .eq('id', ticketData.ticket_id)
      .single();

    // Fetch event fee settings to calculate accurate convenience fee
    const { data: eventFeeSettings, error: feeError } = await supabase
      .from('events')
      .select(`
        commission_rate,
        t1_convenience_fee_enabled,
        t1_convenience_fee_type,
        t1_convenience_fee_value,
        t1_convenience_fee_rules,
        t1_min_fee_enabled,
        t1_min_convenience_fee,
        t1_max_fee_enabled,
        t1_max_convenience_fee
      `)
      .eq('id', ticketData.event_id)
      .single();

    if (feeError) {
      console.error('❌ Error fetching event fee settings:', feeError);
      throw feeError;
    }

    // Use dynamic fee calculator
    const { calculateEventT1Breakdown } = require('../utils/feeCalculator');
    const baseTicketPrice = parseFloat(ticketData.ticket_price);
    const feeBreakdown = calculateEventT1Breakdown(baseTicketPrice, eventFeeSettings);

    const convenienceFee = feeBreakdown.convenienceFee;
    const totalAmount = baseTicketPrice + convenienceFee;

    console.log('💰 T1 Transaction calculation (Dynamic):', {
      baseTicketPrice,
      convenienceFee,
      convenienceFeeRate: eventFeeSettings.t1_convenience_fee_value,
      totalAmount,
      ticketCoverEnabled: ticketTypeDetails?.ticket_cover_enabled
    });

    // Create transaction record for ticket purchase
    const transactionData = {
      user_id: ticketData.user_id,
      event_booking_id: booking.id,
      amount: totalAmount, // Include convenience fee in transaction amount
      currency: 'INR',
      status: 'pending',
      purpose: 'ticket_purchase'
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('event_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (transactionError) throw transactionError;
    console.log('✅ Ticket purchase transaction created:', transaction);

    return {
      data: {
        booking,
        transaction
      },
      error: null
    };
  } catch (error) {
    console.error('Error creating paid event booking:', error);
    return { data: null, error };
  }
};

// ===== NEW: CREATE PAID EVENT BOOKING WITH INDIVIDUAL TICKETS =====

// Create paid event booking with individual ticket records (T1 - Ticket Purchase)
export const createPaidEventBookingWithTickets = async (ticketData) => {
  try {
    console.log('🎫 Creating paid event booking with individual tickets:', ticketData);
    console.log('📅 Occurrence ID:', ticketData.occurrence_id);
    console.log('🎟️ Tickets Count:', ticketData.tickets_count);

    // ========================================
    // STEP 1: Generate Master Ticket Number
    // ========================================
    const { data: masterTicket, error: masterError } = await supabase
      .rpc('generate_master_ticket_number');

    if (masterError) {
      console.error('❌ Error generating master ticket:', masterError);
      throw masterError;
    }

    console.log('📋 Master Ticket Generated:', masterTicket);

    // Calculate booking end time
    const bookingEndTime = calculateEventBookingEndTime(ticketData.booking_time);

    // ========================================
    // STEP 2: Create Parent Booking Record
    // ========================================
    const bookingRecord = {
      user_id: ticketData.user_id,
      event_id: ticketData.event_id,
      occurrence_id: ticketData.occurrence_id || null,
      ticket_id: ticketData.ticket_id,
      tickets_count: ticketData.tickets_count,
      master_ticket: masterTicket,
      gross_amount: null,
      customer_name: ticketData.customer_name,
      customer_phone: ticketData.customer_phone,
      customer_email: ticketData.customer_email,
      status: 'pending',
      booking_type: 'paid',
      booking_date: ticketData.booking_date,
      booking_time: ticketData.booking_time,
      time_section: null,
      party_size: null,
      special_requests: ticketData.special_requests || null,
      offer_id: null,
      cover_charge_per_person: null,
      total_cover_charge: null,
      final_amount: null,
      advance_payment: ticketData.ticket_price,
      booking_end_time: bookingEndTime,
      total_checked_in: 0,
      all_checked_in: false,
      first_check_in_at: null,
      last_check_in_at: null
    };

    const { data: booking, error: bookingError } = await supabase
      .from('event_bookings')
      .insert([bookingRecord])
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Error creating parent booking:', bookingError);
      throw bookingError;
    }

    console.log('✅ Parent booking created:', booking.id);
    console.log('✅ Master Ticket:', booking.master_ticket);
    console.log('✅ Linked to occurrence:', booking.occurrence_id);

    // ========================================
    // STEP 3: Generate Individual Ticket Records
    // ========================================
    const individualTickets = [];
    const ticketPricePerTicket = parseFloat(ticketData.ticket_price) / ticketData.tickets_count;

    console.log(`🎟️ Generating ${ticketData.tickets_count} individual tickets...`);

    for (let i = 0; i < ticketData.tickets_count; i++) {
      // Generate unique ticket number
      const { data: uniqueTicketNumber, error: ticketError } = await supabase
        .rpc('generate_unique_ticket_number');

      if (ticketError) {
        console.error(`❌ Error generating ticket ${i + 1}:`, ticketError);
        throw ticketError;
      }

      console.log(`✅ Generated Ticket ${i + 1}/${ticketData.tickets_count}: ${uniqueTicketNumber}`);

      // Create individual ticket record
      const ticketRecord = {
        booking_id: booking.id,
        user_id: ticketData.user_id,
        event_id: ticketData.event_id,
        occurrence_id: ticketData.occurrence_id || null,
        ticket_type_id: ticketData.ticket_id,
        ticket_number: uniqueTicketNumber,
        guest_name: ticketData.customer_name,
        guest_phone: ticketData.customer_phone,
        guest_email: ticketData.customer_email,
        assigned_to_user_id: null,
        is_checked_in: false,
        checked_in_at: null,
        verified_by: null,
        status: 'active',
        ticket_price: ticketPricePerTicket,
        transfer_history: []
      };

      individualTickets.push(ticketRecord);
    }

    // Bulk insert all individual tickets
    const { data: createdTickets, error: ticketsError } = await supabase
      .from('event_checkins')
      .insert(individualTickets)
      .select();

    if (ticketsError) {
      console.error('❌ Error creating individual tickets:', ticketsError);
      throw ticketsError;
    }

    console.log(`✅ ${createdTickets.length} individual tickets created in event_checkins`);
    console.log('🎫 Ticket Numbers:', createdTickets.map(t => t.ticket_number).join(', '));

    // ========================================
    // STEP 4: Create Transaction Record with Dynamic Fees
    // ========================================
    const baseTicketPrice = parseFloat(ticketData.ticket_price);

    // Fetch event fee settings to calculate accurate convenience fee
    const { data: eventFeeSettings, error: feeError } = await supabase
      .from('events')
      .select(`
        commission_rate,
        t1_convenience_fee_enabled,
        t1_convenience_fee_type,
        t1_convenience_fee_value,
        t1_convenience_fee_rules,
        t1_min_fee_enabled,
        t1_min_convenience_fee,
        t1_max_fee_enabled,
        t1_max_convenience_fee
      `)
      .eq('id', ticketData.event_id)
      .single();

    if (feeError) {
      console.error('❌ Error fetching event fee settings:', feeError);
      throw feeError;
    }

    // Use dynamic fee calculator
    const { calculateEventT1Breakdown } = require('../utils/feeCalculator');
    const feeBreakdown = calculateEventT1Breakdown(baseTicketPrice, eventFeeSettings);

    const convenienceFee = feeBreakdown.convenienceFee;
    const totalAmount = baseTicketPrice + convenienceFee;

    console.log('💰 T1 Transaction calculation (Dynamic):', {
      baseTicketPrice,
      convenienceFee,
      convenienceFeeRate: eventFeeSettings.t1_convenience_fee_value,
      totalAmount
    });

    const transactionData = {
      user_id: ticketData.user_id,
      event_booking_id: booking.id,
      amount: totalAmount,
      currency: 'INR',
      status: 'pending',
      purpose: 'ticket_purchase'
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('event_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (transactionError) {
      console.error('❌ Error creating transaction:', transactionError);
      throw transactionError;
    }

    console.log('✅ Transaction created:', transaction.id);

    // ========================================
    // STEP 5: Return Complete Booking Data
    // ========================================
    console.log('🎉 Complete booking created successfully!');
    console.log('📊 Summary:', {
      booking_id: booking.id,
      master_ticket: booking.master_ticket,
      individual_tickets: createdTickets.length,
      transaction_id: transaction.id
    });

    return {
      data: {
        booking,
        tickets: createdTickets,
        transaction
      },
      error: null
    };

  } catch (error) {
    console.error('❌ Error creating booking with individual tickets:', error);
    return { data: null, error };
  }
};

// ===== HELPER FUNCTIONS FOR INDIVIDUAL TICKETS =====

// Get all individual tickets for a booking
export const getTicketsForBooking = async (bookingId) => {
  try {
    console.log('🎟️ Fetching tickets for booking:', bookingId);

    const { data, error } = await supabase
      .from('event_checkins')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    console.log(`✅ Found ${data?.length || 0} tickets for booking`);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error fetching tickets:', error);
    return { data: null, error };
  }
};

// Get ticket by ticket number (for QR scanning)
export const getTicketByNumber = async (ticketNumber) => {
  try {
    console.log('🎫 Fetching ticket:', ticketNumber);

    const { data, error } = await supabase
      .from('event_checkins')
      .select(`
        *,
        booking:event_bookings(*),
        event:events(*),
        occurrence:event_occurrences(*)
      `)
      .eq('ticket_number', ticketNumber)
      .single();

    if (error) throw error;

    console.log('✅ Ticket found:', data.id);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error fetching ticket:', error);
    return { data: null, error };
  }
};

// Check in a ticket
export const checkInTicket = async (ticketNumber, staffUserId) => {
  try {
    console.log('✅ Checking in ticket:', ticketNumber);

    const { data, error } = await supabase
      .from('event_checkins')
      .update({
        is_checked_in: true,
        checked_in_at: new Date().toISOString(),
        verified_by: staffUserId,
        status: 'used'
      })
      .eq('ticket_number', ticketNumber)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Ticket checked in successfully');
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error checking in ticket:', error);
    return { data: null, error };
  }
};

// Process successful paid ticket payment (T1)
export const processPaidTicketPayment = async (transactionId, paymentGatewayResponse) => {
  try {
    console.log('🎉 Processing successful paid ticket payment:', transactionId);

    // Update transaction status
    const { data: transaction, error: transactionError } = await supabase
      .from('event_transactions')
      .update({
        status: 'success',
        gateway_response: paymentGatewayResponse,
        transaction_id: paymentGatewayResponse.transaction_id || `TXN_${Date.now()}`
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update booking status to confirmed since ticket is paid
    const { error: bookingError } = await supabase
      .from('event_bookings')
      .update({
        status: 'confirmed'
      })
      .eq('id', transaction.event_booking_id);

    if (bookingError) throw bookingError;

    // Create event payment record (but don't mark as paid yet - that's for T2)
    const { data: bookingDetails } = await supabase
      .from('event_bookings')
      .select(`
        *,
        events!inner(
          organizer_id,
          commission_rate,
          t1_convenience_fee_enabled,
          t1_convenience_fee_type,
          t1_convenience_fee_value,
          t1_convenience_fee_rules,
          t1_min_fee_enabled,
          t1_min_convenience_fee,
          t1_max_fee_enabled,
          t1_max_convenience_fee
        )
      `)
      .eq('id', transaction.event_booking_id)
      .single();

    // Get ticket details to check if it has cover charge
    const { data: ticketDetails } = await supabase
      .from('event_ticket_types')
      .select('*')
      .eq('id', bookingDetails.ticket_id)
      .single();

    // Get event fee settings
    const eventFeeSettings = bookingDetails.events;
    const feeRate = eventFeeSettings.t1_convenience_fee_value ?? 5;

    // Calculate T1 financial details for ticket purchase
    // Note: transaction.amount includes convenience fee
    const totalPaidAmount = transaction.amount;

    // Calculate actual base price using the event's fee rate
    // If fee is enabled: totalPaid = basePrice × (1 + feeRate/100)
    // If fee is disabled: totalPaid = basePrice
    const convenienceFeeEnabled = eventFeeSettings.t1_convenience_fee_enabled || false;
    const baseTicketPrice = convenienceFeeEnabled
      ? totalPaidAmount / (1 + feeRate / 100)
      : totalPaidAmount;

    // Only include cover amount if ticket_cover_enabled is true
    // Multiply by tickets_count since ticket_cover_amount is per-ticket value
    const ticketCoverAmount = (ticketDetails?.ticket_cover_enabled && ticketDetails?.ticket_cover_amount)
      ? parseFloat(ticketDetails.ticket_cover_amount) * bookingDetails.tickets_count
      : 0;

    // Use dynamic fee calculator
    const { calculateEventT1Breakdown } = require('../utils/feeCalculator');
    const breakdown = calculateEventT1Breakdown(baseTicketPrice, eventFeeSettings);

    const convenienceFeeT1 = breakdown.convenienceFee;
    const commissionT1 = breakdown.commission;
    const organizerDueT1 = breakdown.organizerGets;
    const platformEarningsT1 = breakdown.platformEarns;
    const commissionRate = eventFeeSettings.commission_rate ?? 5;

    console.log('💰 T1 Payment calculations:', {
      totalPaidAmount,
      baseTicketPrice,
      ticketsCount: bookingDetails.tickets_count,
      ticketCoverPerUnit: ticketDetails?.ticket_cover_amount,
      ticketCoverAmount,
      convenienceFeeT1,
      convenienceFeeRate: feeRate,
      commissionT1,
      commissionRate,
      organizerDueT1,
      platformEarningsT1,
      ticketCoverEnabled: ticketDetails?.ticket_cover_enabled
    });

    const paymentData = {
      event_booking_id: transaction.event_booking_id,
      user_id: transaction.user_id,
      event_id: bookingDetails.event_id,
      organizer_id: bookingDetails.events.organizer_id,
      event_type: 'paid',
      ticket_price: baseTicketPrice, // Base ticket price without convenience fee
      cover_charge: null, // Not used for paid events
      convenience_fee_rate: feeRate, // ✅ Dynamic fee rate from database
      convenience_fee_amount: convenienceFeeT1, // ✅ Dynamically calculated convenience fee (T1 only)
      gross_amount: null, // Will be set in T2
      t1_final_payable_amount: totalPaidAmount, // T1 payment amount
      commission_rate: commissionRate, // ✅ Dynamic commission rate from database
      commission_amount: commissionT1, // ✅ Dynamically calculated commission (T1 only)
      organizer_due: organizerDueT1, // Base ticket price minus commission (T1 only)
      platform_earnings: platformEarningsT1, // Commission + convenience fee from T1
      payment_id: paymentGatewayResponse.transaction_id,
      status: 'ticket_paid', // Special status indicating T1 complete, T2 pending
      settlement_status: 'pending',
      settled_at: null,
      ticket_cover_amount: ticketCoverAmount, // Cover portion of ticket (0 if not enabled)
      discount_amount: null, // Not used for now
      transaction_status: 'T1', // This is T1 (ticket purchase)
      // New T1/T2 tracking columns
      t1_commission_amount: commissionT1, // T1 commission
      t2_commission_amount: 0, // T2 not completed yet
      t1_convenience_fee: convenienceFeeT1, // T1 convenience fee
      t2_convenience_fee: 0, // T2 not completed yet
      customer_total_paid: totalPaidAmount, // T1 payment amount
      t1_organizer_due: organizerDueT1, // T1 organizer due
      t2_organizer_due: 0, // T2 not completed yet
      t1_status: 'paid', // T1 is paid
      t2_status: 'pending', // T2 is pending
      t2_final_payable_amount: 0 // T2 not completed yet
    };

    const { data: payment, error: paymentError } = await supabase
      .from('event_payments')
      .insert([paymentData])
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update transaction with payment_id to link them
    const { error: transactionUpdateError } = await supabase
      .from('event_transactions')
      .update({ event_payment_id: payment.id })
      .eq('id', transactionId);

    if (transactionUpdateError) {
      console.error('Error linking transaction to payment:', transactionUpdateError);
      // Don't throw error here as the main payment is successful
    }

    console.log('✅ Paid ticket payment processed successfully');
    return { data: { transaction, payment }, error: null };
  } catch (error) {
    console.error('Error processing paid ticket payment:', error);
    return { data: null, error };
  }
};

// Calculate payment breakdown for paid events (T2 - Venue Payment)
export const calculatePaidEventPaymentBreakdown = (grossBillAmount, ticketDetails, discountAmount = 0) => {
  try {
    console.log('💰 Calculating paid event payment breakdown:', {
      grossBillAmount,
      ticketDetails,
      discountAmount
    });

    const afterDiscountAmount = grossBillAmount - discountAmount;
    const ticketCoverAmount = ticketDetails.ticket_cover_amount || 0;
    const ticketPrice = ticketDetails.ticket_price || 0;

    console.log('💰 T2 Calculation details:', {
      afterDiscountAmount,
      ticketCoverAmount,
      ticketPrice,
      willDeductCover: ticketCoverAmount > 0
    });

    // Deduct cover charge if ticket has cover
    const afterCoverDeduction = ticketCoverAmount > 0
      ? Math.max(0, afterDiscountAmount - ticketCoverAmount)
      : afterDiscountAmount;

    // Calculate convenience fee (5% of after-cover amount for T2)
    const convenienceFeeT2 = afterCoverDeduction * 0.05;
    const finalPayable = afterCoverDeduction + convenienceFeeT2;

    // Calculate commission (5% of after-cover-deduction amount for T2)
    const commissionT2 = afterCoverDeduction * 0.05;

    // Calculate organizer due for T2:
    // T1 organizer due (from ticket) + T2 venue amount after cover and commission deduction
    const organizerDueT1 = ticketPrice * 0.95; // What organizer got from T1 (ticket price - 5% commission)
    const organizerDueT2 = organizerDueT1 + (afterCoverDeduction - commissionT2);

    // Platform earnings: T1 + T2 fees and commissions
    const platformEarningsT1 = ticketPrice * 0.1; // 5% commission + 5% convenience fee from T1
    const platformEarningsT2 = commissionT2 + convenienceFeeT2; // T2 commission + convenience fee
    const totalPlatformEarnings = platformEarningsT1 + platformEarningsT2;

    const breakdown = {
      grossBillAmount,
      discountAmount,
      afterDiscount: afterDiscountAmount,
      ticketCoverAmount,
      afterCoverDeduction,
      convenienceFee: convenienceFeeT2, // Only T2 convenience fee for this payment
      finalPayable,
      commission: commissionT2, // Only T2 commission for this payment
      organizerDue: organizerDueT2, // Total organizer due (T1 + T2)
      platformEarnings: totalPlatformEarnings, // Total platform earnings (T1 + T2)
      ticketPrice: ticketPrice,
      // Additional breakdown for debugging
      t1Details: {
        ticketPrice,
        organizerDueT1,
        platformEarningsT1
      },
      t2Details: {
        convenienceFeeT2,
        commissionT2,
        platformEarningsT2
      }
    };

    console.log('✅ Paid event payment breakdown calculated:', breakdown);
    return breakdown;
  } catch (error) {
    console.error('Error calculating paid event payment breakdown:', error);
    throw error;
  }
};

// Create venue payment for paid events (T2)
export const createPaidEventVenuePayment = async (bookingId, paymentBreakdown) => {
  try {
    console.log('💳 Creating paid event venue payment:', { bookingId, paymentBreakdown });

    // Get booking and existing payment details
    const { data: booking, error: bookingError } = await supabase
      .from('event_bookings')
      .select(`
        *,
        events!inner(organizer_id)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) throw bookingError;

    // Get existing payment record to accumulate T1 + T2 values
    const { data: existingPayment, error: fetchError } = await supabase
      .from('event_payments')
      .select('*')
      .eq('event_booking_id', bookingId)
      .single();

    if (fetchError) throw fetchError;

    console.log('💰 T2 Update - Existing payment record:', existingPayment);
    console.log('💰 T2 Update - New breakdown:', paymentBreakdown);

    // Calculate accumulated values (T1 + T2)
    const accumulatedConvenienceFee = existingPayment.convenience_fee_amount + paymentBreakdown.convenienceFee;
    const accumulatedCommission = existingPayment.commission_amount + paymentBreakdown.commission;
    const accumulatedPlatformEarnings = existingPayment.platform_earnings + paymentBreakdown.platformEarnings;

    console.log('💰 T2 Update - Accumulated values:', {
      t1ConvenienceFee: existingPayment.convenience_fee_amount,
      t2ConvenienceFee: paymentBreakdown.convenienceFee,
      accumulatedConvenienceFee,
      t1Commission: existingPayment.commission_amount,
      t2Commission: paymentBreakdown.commission,
      accumulatedCommission,
      finalPlatformEarnings: accumulatedPlatformEarnings
    });

    // Calculate total organizer due (T1 + T2)
    const t2OrganizerDue = paymentBreakdown.organizerDue; // T2 organizer due from breakdown
    const totalOrganizerDue = (existingPayment.t1_organizer_due || 0) + t2OrganizerDue; // T1 + T2

    console.log('💰 T2 Update - Organizer Due Calculation:', {
      t1_organizer_due: existingPayment.t1_organizer_due,
      t2_organizer_due: t2OrganizerDue,
      total_organizer_due: totalOrganizerDue
    });

    // Update existing event payment record with T2 details and T1/T2 tracking
    const { data: payment, error: paymentUpdateError } = await supabase
      .from('event_payments')
      .update({
        convenience_fee_amount: accumulatedConvenienceFee, // T1 + T2 convenience fees
        gross_amount: paymentBreakdown.grossBillAmount, // T2 bill amount
        commission_amount: accumulatedCommission, // T1 + T2 commission
        organizer_due: totalOrganizerDue, // ✅ FIXED: T1 + T2 organizer due
        platform_earnings: accumulatedPlatformEarnings, // T1 + T2 platform earnings
        discount_amount: paymentBreakdown.discountAmount || 0, // T2 discount
        transaction_status: 'T1,T2', // Update to show both transactions completed
        // Update T1/T2 tracking columns
        t2_commission_amount: paymentBreakdown.commission, // T2 commission
        t2_convenience_fee: paymentBreakdown.convenienceFee, // T2 convenience fee
        customer_total_paid: (existingPayment.customer_total_paid || 0) + paymentBreakdown.finalPayable, // T1 + T2 total
        t2_organizer_due: t2OrganizerDue, // ✅ FIXED: T2 organizer due only (no subtraction)
        t2_status: 'pending', // T2 is pending until payment completes
        t2_final_payable_amount: paymentBreakdown.finalPayable // T2 payment amount
      })
      .eq('event_booking_id', bookingId)
      .select()
      .single();

    if (paymentUpdateError) throw paymentUpdateError;

    // Create transaction for venue payment (T2)
    const transactionData = {
      user_id: booking.user_id,
      event_booking_id: bookingId,
      event_payment_id: payment.id,
      amount: paymentBreakdown.finalPayable,
      currency: 'INR',
      status: 'pending',
      purpose: 'venue_payment'
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('event_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (transactionError) throw transactionError;

    console.log('✅ Paid event venue payment created successfully');
    return { data: { payment, transaction }, error: null };
  } catch (error) {
    console.error('Error creating paid event venue payment:', error);
    return { data: null, error };
  }
};

// Get user's active paid event booking (for pay bill button)
export const getUserActivePaidEventBooking = async (userId, eventId) => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];

    console.log('🔍 Searching for active paid event booking:', {
      userId,
      eventId,
      currentDate
    });

    // Get all confirmed paid bookings for this user and event
    const { data: allBookings, error } = await supabase
      .from('event_bookings')
      .select(`
        *,
        events!inner(
          title,
          organizer_id,
          restaurant_id
        ),
        event_payments(
          id,
          status,
          ticket_price,
          ticket_cover_amount
        )
      `)
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('booking_type', 'paid')
      .in('status', ['confirmed'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter for active bookings (future bookings or today's bookings that haven't ended)
    const activeBookings = allBookings?.filter(booking => {
      const bookingDate = booking.booking_date;

      // Future bookings are always active
      if (bookingDate > currentDate) {
        return true;
      }

      // For today's bookings, check if booking_end_time hasn't passed
      if (bookingDate === currentDate && booking.booking_end_time) {
        const bookingEndDateTime = new Date(`${bookingDate}T${booking.booking_end_time}:00`);
        return now < bookingEndDateTime;
      }

      return false;

    }) || [];

    const data = activeBookings.length > 0 ? activeBookings[0] : null;

    console.log('🔍 Active paid event booking result:', { data });
    return { data, error: null };
  } catch (error) {
    console.error('Error getting user active paid event booking:', error);
    return { data: null, error };
  }
};

// ==================== EXPERT FUNCTIONS ====================

/**
 * Get all active experts
 */
export const getExperts = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('experts')
      .select('*')
      .eq('is_active', true)
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting experts:', error);
    return { data: [], error };
  }
};

/**
 * Get expert by ID
 */
export const getExpertById = async (expertId) => {
  try {
    const { data, error } = await supabase
      .from('experts')
      .select('*')
      .eq('id', expertId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting expert by ID:', error);
    return { data: null, error };
  }
};

/**
 * Get expert recommendations
 */
export const getExpertRecommendations = async (expertId, scope = null) => {
  try {
    let query = supabase
      .from('expert_recommendations')
      .select(`
        *,
        experts (
          id,
          name,
          tag,
          cover_image_url,
          is_verified
        ),
        restaurants (
          id,
          name,
          address,
          city,
          cover_image_url,
          rating
        ),
        events (
          id,
          title,
          event_date,
          cover_image_url
        )
      `)
      .eq('is_active', true);

    if (expertId) {
      query = query.eq('expert_id', expertId);
    }

    if (scope) {
      query = query.contains('scope', [scope]);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting expert recommendations:', error);
    return { data: [], error };
  }
};

// ==================== ARTIST FUNCTIONS ====================

/**
 * Get artist by ID with all details
 */
export const getArtistById = async (artistId) => {
  try {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting artist by ID:', error);
    return { data: null, error };
  }
};

/**
 * Get all events for an artist
 */
export const getArtistEvents = async (artistId) => {
  try {
    const { data, error } = await supabase
      .from('event_artists')
      .select(`
        event_id,
        display_order,
        role,
        events (
          id,
          title,
          description,
          event_date,
          start_time,
          end_time,
          cover_image_url,
          event_type,
          ticket_type,
          is_active,
          restaurants (
            id,
            name,
            address,
            latitude,
            longitude
          ),
          event_venue (
            venue_data
          )
        )
      `)
      .eq('artist_id', artistId)
      .order('events(event_date)', { ascending: true });

    if (error) throw error;

    // Format the data to extract events
    const events = data?.map(item => item.events).filter(event => event !== null) || [];
    return { data: events, error: null };
  } catch (error) {
    console.error('Error getting artist events:', error);
    return { data: [], error };
  }
};

/**
 * Update artist Spotify ID
 */
export const updateArtistSpotifyId = async (artistId, spotifyId) => {
  try {
    const { data, error } = await supabase
      .from('artists')
      .update({ spotify_id: spotifyId, updated_at: new Date().toISOString() })
      .eq('id', artistId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating artist Spotify ID:', error);
    return { data: null, error };
  }
};

// ============================================
// USER FAVORITES FUNCTIONS
// ============================================

export const addToFavorites = async (userId, itemId, type) => {
  try {
    const favoriteData = {
      user_id: userId,
      type: type,
    };

    // Set the appropriate foreign key based on type
    if (type === 'event') {
      favoriteData.event_id = itemId;
    } else if (type === 'restaurant') {
      favoriteData.restaurant_id = itemId;
    } else if (type === 'artist') {
      favoriteData.artist_id = itemId;
    } else if (type === 'expert') {
      favoriteData.expert_id = itemId;
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .insert([favoriteData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return { data: null, error };
  }
};

export const removeFromFavorites = async (userId, itemId, type) => {
  try {
    let query = supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('type', type);

    // Match the appropriate foreign key
    if (type === 'event') {
      query = query.eq('event_id', itemId);
    } else if (type === 'restaurant') {
      query = query.eq('restaurant_id', itemId);
    } else if (type === 'artist') {
      query = query.eq('artist_id', itemId);
    } else if (type === 'expert') {
      query = query.eq('expert_id', itemId);
    }

    const { error } = await query;

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return { error };
  }
};

export const checkIsFavorite = async (userId, itemId, type) => {
  try {
    let query = supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type);

    // Match the appropriate foreign key
    if (type === 'event') {
      query = query.eq('event_id', itemId);
    } else if (type === 'restaurant') {
      query = query.eq('restaurant_id', itemId);
    } else if (type === 'artist') {
      query = query.eq('artist_id', itemId);
    } else if (type === 'expert') {
      query = query.eq('expert_id', itemId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found" error
    return { isFavorite: !!data, error: null };
  } catch (error) {
    console.error('Error checking favorite:', error);
    return { isFavorite: false, error };
  }
};

export const getUserFavorites = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        id,
        type,
        created_at,
        events (
          id,
          title,
          description,
          event_date,
          start_time,
          cover_image_url,
          cover_video_url,
          event_categories (
            name,
            icon
          )
        ),
        restaurants (
          id,
          name,
          description,
          address,
          city,
          cover_image_url,
          cover_video_url,
          rating,
          cuisines,
          price_range
        ),
        artists (
          id,
          name,
          bio,
          profile_image_url,
          genre
        ),
        experts (
          id,
          name,
          description,
          cover_image_url,
          tag,
          city
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting user favorites:', error);
    return { data: null, error };
  }
};

// ============================================
// EVENT LAYOUT FUNCTIONS
// ============================================

/**
 * Get layout for a specific occurrence
 */
export const getLayoutForOccurrence = async (occurrenceId) => {
  try {
    console.log('📐 Fetching layout for occurrence:', occurrenceId);

    const { data, error } = await supabase
      .from('event_layouts')
      .select('*')
      .eq('occurrence_id', occurrenceId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ Error fetching layout:', error);
      return { data: null, error };
    }

    console.log('✅ Layout fetched:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Exception fetching layout:', error);
    return { data: null, error };
  }
};

/**
 * Get all sections for a layout
 */
export const getSectionsForLayout = async (layoutId) => {
  try {
    console.log('🎯 Fetching sections for layout:', layoutId);

    const { data, error } = await supabase
      .from('event_layout_sections')
      .select('*')
      .eq('layout_id', layoutId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching sections:', error);
      return { data: null, error };
    }

    console.log('✅ Sections fetched:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Exception fetching sections:', error);
    return { data: null, error };
  }
};

/**
 * Get tickets for a specific section
 */
export const getTicketsForSection = async (sectionId, occurrenceId) => {
  try {
    console.log('🎫 Fetching tickets for section:', sectionId);

    const { data, error } = await supabase
      .from('event_ticket_types')
      .select('*')
      .eq('layout_section_id', sectionId)
      .eq('occurrence_id', occurrenceId)
      .eq('is_active', true)
      .order('price', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tickets:', error);
      return { data: null, error };
    }

    console.log('✅ Tickets fetched:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Exception fetching tickets:', error);
    return { data: null, error };
  }
};
