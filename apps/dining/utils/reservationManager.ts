import { supabase } from '../config/supabase';

export interface TicketReservation {
  id: string;
  user_id: string;
  event_id: string;
  occurrence_id: string | null;
  ticket_type_id: string;
  quantity: number;
  status: 'active' | 'confirmed' | 'expired' | 'cancelled';
  reserved_at: string;
  expires_at: string;
  booking_id: string | null;
}

export interface ReservationResult {
  success: boolean;
  data?: TicketReservation;
  error?: string;
  availableTickets?: number;
}

/**
 * Creates a ticket reservation for a user
 * This will automatically reserve tickets and reduce available inventory
 */
export const createTicketReservation = async (
  userId: string,
  eventId: string,
  ticketTypeId: string,
  quantity: number,
  occurrenceId?: string
): Promise<ReservationResult> => {
  try {
    console.log('🎫 Creating reservation:', {
      userId,
      eventId,
      ticketTypeId,
      quantity,
      occurrenceId,
    });

    const { data, error } = await supabase
      .from('event_ticket_reservations')
      .insert({
        user_id: userId,
        event_id: eventId,
        occurrence_id: occurrenceId || null,
        ticket_type_id: ticketTypeId,
        quantity: quantity,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Reservation error:', error);
      
      // Check if it's an availability error
      if (error.message.includes('Not enough tickets available')) {
        const match = error.message.match(/Only (\d+) tickets remaining/);
        const available = match ? parseInt(match[1]) : 0;
        
        return {
          success: false,
          error: `Only ${available} ticket(s) available`,
          availableTickets: available,
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to reserve tickets',
      };
    }

    console.log('✅ Reservation created:', data.id);
    return {
      success: true,
      data: data as TicketReservation,
    };
  } catch (error) {
    console.error('❌ Exception creating reservation:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

/**
 * Updates an existing reservation quantity
 * Used when user increases/decreases ticket count
 */
export const updateReservationQuantity = async (
  reservationId: string,
  newQuantity: number
): Promise<ReservationResult> => {
  try {
    if (newQuantity === 0) {
      // If quantity is 0, cancel the reservation
      return await cancelReservation(reservationId);
    }

    console.log('🔄 Updating reservation:', reservationId, 'to quantity:', newQuantity);

    const { data, error } = await supabase
      .from('event_ticket_reservations')
      .update({
        quantity: newQuantity,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // Reset timer
      })
      .eq('id', reservationId)
      .eq('status', 'active')
      .select()
      .single();

    if (error) {
      console.error('❌ Update error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update reservation',
      };
    }

    console.log('✅ Reservation updated');
    return {
      success: true,
      data: data as TicketReservation,
    };
  } catch (error) {
    console.error('❌ Exception updating reservation:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

/**
 * Cancels a specific reservation
 */
export const cancelReservation = async (
  reservationId: string
): Promise<ReservationResult> => {
  try {
    console.log('❌ Cancelling reservation:', reservationId);

    const { data, error } = await supabase
      .from('event_ticket_reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId)
      .eq('status', 'active')
      .select()
      .single();

    if (error) {
      console.error('❌ Cancel error:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel reservation',
      };
    }

    console.log('✅ Reservation cancelled');
    return {
      success: true,
      data: data as TicketReservation,
    };
  } catch (error) {
    console.error('❌ Exception cancelling reservation:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

/**
 * Cancels all active reservations for a user (optionally filtered by event)
 */
export const cancelUserReservations = async (
  userId: string,
  eventId?: string
): Promise<{ success: boolean; count: number }> => {
  try {
    console.log('❌ Cancelling all reservations for user:', userId, 'event:', eventId);

    const { data, error } = await supabase.rpc('cancel_user_reservations', {
      p_user_id: userId,
      p_event_id: eventId || null,
    });

    if (error) {
      console.error('❌ Cancel error:', error);
      return { success: false, count: 0 };
    }

    const count = data?.[0]?.cancelled_count || 0;
    console.log(`✅ Cancelled ${count} reservation(s)`);
    return { success: true, count };
  } catch (error) {
    console.error('❌ Exception cancelling reservations:', error);
    return { success: false, count: 0 };
  }
};

/**
 * Confirms all active reservations for a user when booking is successful
 */
export const confirmReservations = async (
  userId: string,
  bookingId: string,
  eventId: string
): Promise<{ success: boolean; count: number }> => {
  try {
    console.log('✅ Confirming reservations for booking:', bookingId);

    const { data, error } = await supabase.rpc('confirm_reservations', {
      p_user_id: userId,
      p_booking_id: bookingId,
      p_event_id: eventId,
    });

    if (error) {
      console.error('❌ Confirm error:', error);
      return { success: false, count: 0 };
    }

    const count = data?.[0]?.confirmed_count || 0;
    console.log(`✅ Confirmed ${count} reservation(s)`);
    return { success: true, count };
  } catch (error) {
    console.error('❌ Exception confirming reservations:', error);
    return { success: false, count: 0 };
  }
};

/**
 * Gets all active reservations for a user with full details
 */
export const getUserActiveReservations = async (
  userId: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase.rpc('get_user_active_reservations', {
      p_user_id: userId,
    });

    if (error) {
      console.error('❌ Error fetching reservations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Exception fetching reservations:', error);
    return [];
  }
};

/**
 * Gets all active reservations for a user with full event and ticket details
 * Used for displaying reservation cards on home page
 */
export const getUserActiveReservationsWithDetails = async (
  userId: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('event_ticket_reservations')
      .select(`
        id,
        quantity,
        status,
        reserved_at,
        expires_at,
        event_id,
        occurrence_id,
        ticket_type_id,
        events:event_id (
          id,
          title,
          cover_image_url,
          event_date,
          start_time,
          city
        ),
        event_ticket_types:ticket_type_id (
          id,
          name,
          price
        ),
        event_occurrences:occurrence_id (
          id,
          occurrence_date,
          start_utc_timestamp
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching reservations with details:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Exception fetching reservations with details:', error);
    return [];
  }
};

/**
 * Gets active reservations for a specific event
 * Used to restore reservation state when user returns to booking page
 */
export const getUserEventReservations = async (
  userId: string,
  eventId: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('event_ticket_reservations')
      .select(`
        id,
        ticket_type_id,
        quantity,
        expires_at,
        status
      `)
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('❌ Error fetching event reservations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Exception fetching event reservations:', error);
    return [];
  }
};

/**
 * Gets the earliest expiry time from user's active reservations
 * Used to show a single countdown timer
 */
export const getEarliestReservationExpiry = async (
  userId: string,
  eventId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('event_ticket_reservations')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('status', 'active')
      .order('expires_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.expires_at;
  } catch (error) {
    return null;
  }
};

/**
 * Checks if a ticket type has available capacity
 */
export const checkTicketAvailability = async (
  ticketTypeId: string
): Promise<{ available: number; total: number; reserved: number; sold: number }> => {
  try {
    const { data, error } = await supabase
      .from('event_ticket_types')
      .select('total_quantity, sold_quantity, reserved_quantity')
      .eq('id', ticketTypeId)
      .single();

    if (error || !data) {
      return { available: 0, total: 0, reserved: 0, sold: 0 };
    }

    const available = data.total_quantity - data.sold_quantity - data.reserved_quantity;

    return {
      available: Math.max(0, available),
      total: data.total_quantity,
      reserved: data.reserved_quantity,
      sold: data.sold_quantity,
    };
  } catch (error) {
    return { available: 0, total: 0, reserved: 0, sold: 0 };
  }
};

