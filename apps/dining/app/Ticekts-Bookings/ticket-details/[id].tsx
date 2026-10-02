import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { Fragment, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QRCodeGenerator from '../../../components/QRCodeGenerator';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface TicketDetails {
  id: string;
  event_id: string;
  event_title: string;
  event_description?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  event_type: 'one_day' | 'multi_day' | 'daily_event';
  ticket_type: 'free' | 'paid';
  cover_image_url: string;
  booking_type: 'free' | 'paid';
  ticket_number?: string;
  status: string;
  party_size: number;
  tickets_count: number;
  special_requests?: string;
  pay_bill_enabled?: boolean;
  
  // Venue details
  venue_name?: string;
  venue_address?: string;
  city: string;
  state: string;
  restaurant_id?: string;
  
  // Payment details - for paid events
  ticket_price?: string;
  convenience_fee_amount?: string;
    ticket_cover_amount?: string;
    discount_amount?: string;
    calculated_final_amount?: string;
    
    // Cover charge - for free events
  cover_charge?: string;
  total_cover_charge?: string;
  
  // Offer details
  offer_title?: string;
  offer_discount_value?: string;
  offer_discount_type?: string;
  
  // Customer details
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  
  // Status details
  is_checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;

  // Multiple tickets for paid events
  individual_tickets?: IndividualTicket[];
}

interface IndividualTicket {
  id: string;
  ticket_number: string;
  ticket_type_name: string;
  ticket_price: string;
  ticket_cover_amount?: string;
  qr_code_data: string;
  is_checked_in?: boolean;
  checked_in_at?: string;
  verified_by?: string;
  status?: string;
  guest_name?: string;
}

export default function TicketDetailsScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTicketDetails();
    }
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      
      console.log('🎫 Fetching ticket details for booking:', id);
      
       const { data: ticketData, error } = await supabase
         .from('event_bookings')
         .select(`
           *,
           events!inner(
             id,
             title,
             description,
             event_date,
             event_end_date,
             start_time,
             end_time,
             event_type,
             ticket_type,
             cover_image_url,
             city,
             state,
             restaurant_id,
             pay_bill_enabled,
             restaurants(
               name,
               address
             )
           ),
           event_ticket_types(
             id,
             name,
             price,
             ticket_cover_enabled,
             ticket_cover_amount
           ),
          event_payments(
            event_type,
            ticket_price,
            convenience_fee_amount,
            ticket_cover_amount,
              cover_charge,
              discount_amount,
              t1_commission_amount,
            t2_commission_amount,
            t1_convenience_fee,
            t2_convenience_fee,
            customer_total_paid,
            t1_organizer_due,
            t2_organizer_due,
            t1_status,
            t2_status,
            transaction_status,
            t1_final_payable_amount,
            t2_final_payable_amount
          ),
           event_offers(
             title,
             discount_value,
             discount_type
           ),
           users!inner(
             full_name,
             phone_number
           )
         `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching ticket details:', error);
        setTicket(null);
        return;
      }

      if (ticketData) {
        const payment = ticketData.event_payments?.[0];
        const eventType = ticketData.events.ticket_type || ticketData.booking_type;
        
        console.log('📋 Booking data fetched:', ticketData.id);
        console.log('🎟️ Tickets count:', ticketData.tickets_count);
        console.log('📋 Master ticket:', ticketData.master_ticket);
        
        // Fetch individual tickets from event_checkins table for paid events
        const individualTickets: IndividualTicket[] = [];
        if (eventType === 'paid' && ticketData.tickets_count > 0) {
          console.log('🔍 Fetching individual tickets from event_checkins...');
          
          const { data: checkinTickets, error: checkinError } = await supabase
            .from('event_checkins')
            .select(`
              id,
              ticket_number,
              ticket_price,
              is_checked_in,
              checked_in_at,
              verified_by,
              status,
              guest_name,
              guest_phone,
              created_at,
              event_ticket_types:ticket_type_id(
                name,
                ticket_cover_enabled,
                ticket_cover_amount
              )
            `)
            .eq('booking_id', ticketData.id)
            .order('created_at', { ascending: true });
          
          if (checkinError) {
            console.error('❌ Error fetching individual tickets:', checkinError);
          } else if (checkinTickets && checkinTickets.length > 0) {
            console.log(`✅ Found ${checkinTickets.length} individual tickets`);
            console.log('🎫 Ticket numbers:', checkinTickets.map(t => t.ticket_number).join(', '));
            
            checkinTickets.forEach((ticket, index) => {
              console.log(`Ticket ${index + 1}:`, {
                number: ticket.ticket_number,
                price: ticket.ticket_price,
                checked_in: ticket.is_checked_in,
                status: ticket.status
              });
              
              const ticketType: any = Array.isArray(ticket.event_ticket_types) ? ticket.event_ticket_types[0] : ticket.event_ticket_types;
              const fallbackType: any = Array.isArray(ticketData.event_ticket_types) ? ticketData.event_ticket_types[0] : ticketData.event_ticket_types;
              individualTickets.push({
                id: ticket.id,
                ticket_number: ticket.ticket_number,
                ticket_type_name: ticketType?.name || fallbackType?.name || 'General Admission',
                ticket_price: ticket.ticket_price?.toString() || '0',
                ticket_cover_amount: ticketType?.ticket_cover_enabled 
                  ? (ticketType?.ticket_cover_amount?.toString() || '0')
                  : '0',
                qr_code_data: ticket.ticket_number,
                is_checked_in: ticket.is_checked_in || false,
                checked_in_at: ticket.checked_in_at,
                verified_by: ticket.verified_by,
                status: ticket.status || 'active',
                guest_name: ticket.guest_name
              });
            });
          } else {
            console.log('⚠️ No individual tickets found in event_checkins');
          }
        }

        const transformedTicket: TicketDetails = {
          id: ticketData.id,
          event_id: ticketData.event_id,
          event_title: ticketData.events.title || 'Untitled Event',
          event_description: ticketData.events.description,
          event_date: ticketData.events.event_date || new Date().toISOString().split('T')[0],
          start_time: ticketData.events.start_time || '00:00',
          end_time: ticketData.events.end_time || '23:59',
          event_type: ticketData.events.event_type || 'one_day',
          ticket_type: eventType,
          cover_image_url: ticketData.events.cover_image_url || '',
          booking_type: ticketData.booking_type,
          ticket_number: ticketData.ticket_number,
          status: ticketData.status || 'pending',
          party_size: ticketData.party_size || 1,
          tickets_count: ticketData.tickets_count || 1,
          special_requests: ticketData.special_requests,
          pay_bill_enabled: ticketData.events.pay_bill_enabled || false,
          
          venue_name: ticketData.events.restaurants?.name,
          venue_address: ticketData.events.restaurants?.address,
          city: ticketData.events.city || 'Unknown City',
          state: ticketData.events.state || 'Unknown State',
          restaurant_id: ticketData.events.restaurant_id,
          
          // Payment details for paid events
          ticket_price: payment?.ticket_price,
          convenience_fee_amount: payment?.t1_convenience_fee || payment?.convenience_fee_amount,
          ticket_cover_amount: payment?.ticket_cover_amount || '0',
          discount_amount: payment?.discount_amount,
          calculated_final_amount: (() => {
            // For paid events, use T1 final payable amount
            if (eventType === 'paid') {
              const t1FinalAmount = parseFloat(payment?.t1_final_payable_amount || '0');
              if (t1FinalAmount > 0) {
                return t1FinalAmount.toString();
              }
              
              // Fallback calculation if T1 final amount not available
              const ticketPrice = parseFloat(payment?.ticket_price || '0');
              const t1ConvenienceFee = parseFloat(payment?.t1_convenience_fee || '0');
              const ticketsCount = ticketData.tickets_count || 1;
              
              const t1Total = (ticketPrice * ticketsCount) + t1ConvenienceFee;
              return t1Total > 0 ? t1Total.toString() : '0';
            }
            
            // For free events, use T2 final payable amount or fallback
            const t2FinalAmount = parseFloat(payment?.t2_final_payable_amount || '0');
            if (t2FinalAmount > 0) {
              return t2FinalAmount.toString();
              }
              
              // Fallback calculation
              const ticketPrice = parseFloat(payment?.ticket_price || '0');
              const convenienceFee = parseFloat(payment?.convenience_fee_amount || '0');
            const discount = parseFloat(payment?.discount_amount || '0');
            const ticketsCount = ticketData.tickets_count || 1;
            
            const total = (ticketPrice * ticketsCount) + convenienceFee - discount;
            return total > 0 ? total.toString() : '0';
          })(),
          
          // Cover charge for free events
          cover_charge: payment?.cover_charge || ticketData.total_cover_charge,
          total_cover_charge: ticketData.total_cover_charge,
          
          offer_title: ticketData.event_offers?.title,
          offer_discount_value: ticketData.event_offers?.discount_value,
          offer_discount_type: ticketData.event_offers?.discount_type,
          
          customer_name: ticketData.users.full_name || ticketData.customer_name || 'N/A',
          customer_phone: ticketData.users.phone_number || ticketData.customer_phone || 'N/A',
          customer_email: ticketData.customer_email,
          
          is_checked_in: ticketData.is_checked_in,
          checked_in_at: ticketData.checked_in_at,
          created_at: ticketData.created_at,
          updated_at: ticketData.updated_at,
          
          individual_tickets: individualTickets.length > 0 ? individualTickets : undefined,
        };
        
        setTicket(transformedTicket);
      } else {
        setTicket(null);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCompactDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const maskPhoneNumber = (phone: string) => {
    if (phone.length >= 10) {
      const lastFour = phone.slice(-4);
      const firstPart = phone.slice(0, 4);
      return `${firstPart}XXXXXX${lastFour}`;
    }
    return phone;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      case 'completed':
        return '#2196F3';
      default:
        return '#666666';
    }
  };

  const generateQRData = (ticketNumber?: string) => {
    if (!ticket) return '';
    
    if (ticketNumber) {
      return ticketNumber;
    }
    
    if (ticket.ticket_type === 'paid' && ticket.ticket_number) {
      return ticket.ticket_number;
    } else {
      return `BK-${ticket.id.slice(-8).toUpperCase()}`;
    }
  };

  const handleVenuePress = () => {
    if (ticket?.restaurant_id) {
      router.push(`/restaurant/${ticket.restaurant_id}` as any);
    }
  };

  const handleEventPress = () => {
    if (ticket?.event_id) {
      router.push(`/events/${ticket.event_id}` as any);
    }
  };

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <StatusBar barStyle="light-content" backgroundColor="#131315" />
        
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Details</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading ticket details...</Text>
        </View>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.wrapper}>
        <StatusBar barStyle="light-content" backgroundColor="#131315" />
        
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Details</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Ticket Not Found</Text>
          <Text style={styles.errorSubtitle}>
            The ticket you're looking for doesn't exist or has been removed.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#131315" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Details</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
            <Text style={styles.statusText}>
              {`${ticket.status.charAt(0).toUpperCase()}${ticket.status.slice(1)}`}
            </Text>
          </View>
          {ticket.is_checked_in && (
            <View style={styles.checkedInBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              <Text style={styles.checkedInText}>
                {`Checked in on ${formatDateTime(ticket.checked_in_at!)}`}
              </Text>
            </View>
          )}
        </View>

        {/* Event Info Section */}
        <View style={styles.eventSection}>
          <View style={styles.eventHeader}>
            <TouchableOpacity
              style={styles.eventInfo}
              onPress={handleEventPress}
              activeOpacity={0.7}
            >
              <Text style={styles.eventTitle}>{ticket.event_title}</Text>
              {ticket.venue_name && (
                <TouchableOpacity onPress={handleVenuePress} activeOpacity={0.7}>
                  <Text style={styles.venueName}>
                    {ticket.venue_name}
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={styles.venueAddress}>
                {[ticket.venue_address, ticket.city, ticket.state].filter(Boolean).join(', ')}
              </Text>
              {/* Only show party size for free events */}
              {ticket.ticket_type === 'free' && ticket.party_size > 0 && (
                <View style={styles.partyRow}>
                  <Ionicons name="people-outline" size={16} color="#AAAAAA" />
                  <Text style={styles.partyText}>
                    {`${ticket.party_size} ${ticket.party_size === 1 ? 'Guest' : 'Guests'}`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleEventPress}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: ticket.cover_image_url }}
                style={styles.eventImage}
                defaultSource={require('../../../assets/default-image.jpg')}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date & Time Section */}
        <View style={styles.dateTimeCard}>
          <View style={styles.dateTimeCardRow}>
            <Ionicons name="calendar-outline" size={16} color="#4CAF50" />
            <Text style={styles.dateTimeCardText}>
              {formatCompactDate(ticket.event_date)}
            </Text>
          </View>
          <View style={styles.dateTimeDot} />
          <View style={styles.dateTimeCardRow}>
            <Ionicons name="time-outline" size={16} color="#4CAF50" />
            <Text style={styles.dateTimeCardText}>
              {`${formatTime(ticket.start_time)} - ${formatTime(ticket.end_time)}`}
            </Text>
          </View>
        </View>

        {/* QR Code / M-Ticket Section */}
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>
            {`${ticket.ticket_type === 'paid' ? 'M-Ticket' : 'Booking Confirmation'}`}
          </Text>

          {/* For Paid Events - Show Individual Tickets */}
          {ticket.ticket_type === 'paid' && ticket.individual_tickets ? (
            <View>
              {ticket.individual_tickets.map((individualTicket, index) => (
                <View key={individualTicket.id} style={[styles.qrCard, index > 0 && { marginTop: 16 }]}>
                  <View style={styles.ticketHeader}>
                    <View style={styles.ticketHeaderLeft}>
                      <Text style={styles.ticketTypeLabel}>{individualTicket.ticket_type_name}</Text>
                      <Text style={styles.ticketNumberSmall}>#{individualTicket.ticket_number}</Text>
                    </View>
                    <View style={styles.ticketHeaderRight}>
                      <Text style={styles.ticketPriceLabel}>{`₹${individualTicket.ticket_price}`}</Text>
                      {individualTicket.status && (
                        <View style={[
                          styles.ticketStatusBadge,
                          { backgroundColor: individualTicket.status === 'used' ? '#4CAF50' : 
                                           individualTicket.status === 'cancelled' ? '#F44336' :
                                           individualTicket.status === 'transferred' ? '#2196F3' : '#FF9800' }
                        ]}>
                          <Text style={styles.ticketStatusText}>
                            {individualTicket.status.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {/* Check-in Status Badge */}
                  {individualTicket.is_checked_in && (
                    <View style={styles.checkedInTicketBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.checkedInTicketText}>
                        ✓ Checked In
                      </Text>
                      {individualTicket.checked_in_at && (
                        <Text style={styles.checkedInTimeText}>
                          {formatDateTime(individualTicket.checked_in_at)}
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {/* Guest Name if different from booking */}
                  {individualTicket.guest_name && individualTicket.guest_name !== ticket.customer_name && (
                    <View style={styles.guestNameSection}>
                      <Ionicons name="person-outline" size={14} color="#AAAAAA" />
                      <Text style={styles.guestNameText}>Guest: {individualTicket.guest_name}</Text>
                    </View>
                  )}
                  
                  <View style={styles.qrContainer}>
                    <QRCodeGenerator
                      value={generateQRData(individualTicket.ticket_number)}
                      size={180}
                      backgroundColor="#FFFFFF"
                      color="#000000"
                    
                    />
                  </View>
                  <View style={styles.qrInfo}>
                    <Text style={styles.qrLabel}>Ticket Number</Text>
                    <Text style={styles.qrValue} numberOfLines={1} adjustsFontSizeToFit>
                      {individualTicket.ticket_number}
                    </Text>
                    {individualTicket.ticket_cover_amount && 
                     !isNaN(parseFloat(individualTicket.ticket_cover_amount)) && 
                     parseFloat(individualTicket.ticket_cover_amount) > 0 && (
                      <Text style={styles.coverAmountText}>
                        {`Redeemable: ₹${parseFloat(individualTicket.ticket_cover_amount).toFixed(0)}`}
                      </Text>
                    )}
                    {individualTicket.verified_by && (
                      <Text style={styles.verifiedByText}>
                        Verified by: {individualTicket.verified_by}
                      </Text>
                    )}
                    <Text style={styles.qrInstruction}>
                      {individualTicket.is_checked_in 
                        ? 'This ticket has been used for entry'
                        : 'Show this QR code at the venue for entry'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.qrCard}>
              <View style={styles.qrContainer}>
                <QRCodeGenerator
                  value={generateQRData()}
                  size={160}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              </View>
              <View style={styles.qrInfo}>
                <Text style={styles.qrLabel}>Booking Reference</Text>
                <Text style={styles.qrValue} numberOfLines={1} adjustsFontSizeToFit>
                  {`BK-${ticket.id.slice(-8).toUpperCase()}`}
                </Text>
                <Text style={styles.qrInstruction}>
                  Show this QR code to confirm your booking
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Offer Section - Only show if offer exists and has valid data */}
        {ticket.offer_title && ticket.offer_discount_value && (
          <View style={styles.offerSection}>
            <Text style={styles.sectionTitle}>Offer Applied</Text>
            <View style={styles.offerCard}>
              <View style={styles.offerIcon}>
                <Ionicons name="gift" size={20} color="#FF9800" />
              </View>
              <View style={styles.offerInfo}>
                <Text style={styles.offerTitle}>{ticket.offer_title || 'Special Offer'}</Text>
                <Text style={styles.offerDescription}>
                  {ticket.offer_discount_type === 'percentage' 
                    ? `${ticket.offer_discount_value || '0'}% discount applied`
                    : `₹${ticket.offer_discount_value || '0'} discount applied`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Details Section */}
        {ticket.ticket_type === 'paid' ? (
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.paymentCard}>
              {ticket.individual_tickets && ticket.individual_tickets.length > 1 ? (
                <Fragment>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>{`Booking Amount (${ticket.tickets_count}x)`}</Text>
                    <Text style={styles.paymentValue}>
                      {`₹${parseFloat(ticket.ticket_price || '0').toFixed(0)}`}
                    </Text>
                  </View>
                  {/* Cover amount is not added to total - it's redeemable */}
                </Fragment>
              ) : (
                <Fragment>
                  {ticket.ticket_price && parseFloat(ticket.ticket_price) > 0 && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Booking Amount</Text>
                      <Text style={styles.paymentValue}>{`₹${ticket.ticket_price || '0'}`}</Text>
                    </View>
                  )}
                  {/* Cover amount is not added to total - it's redeemable */}
                </Fragment>
              )}
              
              {ticket.convenience_fee_amount && parseFloat(ticket.convenience_fee_amount) > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Convenience Fee (T1)</Text>
                  <Text style={styles.paymentValue}>{`₹${ticket.convenience_fee_amount || '0'}`}</Text>
                </View>
              )}
              
              {ticket.discount_amount && parseFloat(ticket.discount_amount) > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Discount</Text>
                  <Text style={[styles.paymentValue, { color: '#4CAF50' }]}>{`-₹${ticket.discount_amount || '0'}`}</Text>
                </View>
              )}
              
              <View style={styles.paymentDivider} />
              <View style={styles.paymentRow}>
                <Text style={styles.paymentTotalLabel}>Total Paid</Text>
                <Text style={styles.paymentTotalValue}>
                  {`₹${(() => {
                    // Use the calculated_final_amount which now contains the correct T1/T2 amount
                    if (ticket.calculated_final_amount && parseFloat(ticket.calculated_final_amount) > 0) {
                      return parseFloat(ticket.calculated_final_amount).toFixed(0);
                    }
                    
                    // Fallback calculation for backward compatibility
                    if (ticket.ticket_type === 'paid') {
                      const ticketPrice = parseFloat(ticket.ticket_price || '0');
                      const t1ConvenienceFee = parseFloat(ticket.convenience_fee_amount || '0');
                      const ticketsCount = ticket.tickets_count || 1;
                      
                      const t1Total = (ticketPrice * ticketsCount) + t1ConvenienceFee;
                      return t1Total > 0 ? t1Total.toFixed(0) : '0';
                    }
                    
                    const ticketPrice = parseFloat(ticket.ticket_price || '0');
                    const convenienceFee = parseFloat(ticket.convenience_fee_amount || '0');
                    const discount = parseFloat(ticket.discount_amount || '0');
                    const ticketsCount = ticket.tickets_count || 1;
                    
                    const total = (ticketPrice * ticketsCount) + convenienceFee - discount;
                    return total > 0 ? total.toFixed(0) : '0';
                  })()}`}
                </Text>
              </View>
              
              {/* Cover Amount Display - Show as redeemable amount */}
              {ticket.ticket_type === 'paid' && 
               ticket.ticket_cover_amount && 
               !isNaN(parseFloat(ticket.ticket_cover_amount)) && 
               parseFloat(ticket.ticket_cover_amount) > 0 && (
                <View style={styles.coverAmountSection}>
                  <View style={styles.coverAmountRow}>
                    <Text style={styles.coverAmountLabel}>Redeemable Cover Amount</Text>
                    <Text style={styles.coverAmountValue}>
                      {`₹${parseFloat(ticket.ticket_cover_amount).toFixed(0)}`}
                    </Text>
                  </View>
                  <Text style={styles.coverAmountNote}>
                    This amount will be adjusted against your final bill at the venue
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          ticket.cover_charge && parseFloat(ticket.cover_charge) > 0 && (
            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitle}>Cover Charge</Text>
              <View style={styles.paymentCard}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>
                    {`Cover Charge (${ticket.party_size} ${ticket.party_size === 1 ? 'Guest' : 'Guests'})`}
                  </Text>
                  <Text style={styles.paymentValue}>{`₹${ticket.cover_charge || '0'}`}</Text>
                </View>
                <View style={styles.paymentDivider} />
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentTotalLabel}>Amount Paid</Text>
                  <Text style={styles.paymentTotalValue}>{`₹${ticket.cover_charge || '0'}`}</Text>
                </View>
              </View>
            </View>
          )
        )}

        {/* Customer Details Section */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>Your Details</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Name</Text>
              <Text style={styles.customerValue}>{ticket.customer_name}</Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Phone</Text>
              <Text style={styles.customerValue}>{maskPhoneNumber(ticket.customer_phone)}</Text>
            </View>
            {ticket.customer_email && (
              <View style={styles.customerRow}>
                <Text style={styles.customerLabel}>Email</Text>
                <Text style={styles.customerValue}>{ticket.customer_email}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Special Requests Section */}
        {ticket.special_requests && (
          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>Special Requests</Text>
            <View style={styles.requestsCard}>
              <Text style={styles.requestsText}>{ticket.special_requests}</Text>
            </View>
          </View>
        )}

        {/* Booking Information Section */}
        <View style={styles.bookingInfoSection}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
          <View style={styles.bookingInfoCard}>
            <View style={styles.bookingInfoRow}>
              <Text style={styles.bookingInfoLabel}>Booking ID</Text>
              <Text style={styles.bookingInfoValue} numberOfLines={1} adjustsFontSizeToFit>
                {`${ticket.ticket_type === 'paid' ? 'T1' : 'BK'}-${ticket.id.slice(-8).toUpperCase()}`}
              </Text>
            </View>
            {ticket.ticket_type === 'paid' && ticket.tickets_count > 1 && (
              <View style={styles.bookingInfoRow}>
                <Text style={styles.bookingInfoLabel}>Total Tickets</Text>
                <Text style={styles.bookingInfoValue}>{ticket.tickets_count}</Text>
              </View>
            )}
            <View style={styles.bookingInfoRow}>
              <Text style={styles.bookingInfoLabel}>Booking Date</Text>
              <Text style={styles.bookingInfoValue}>{formatDateTime(ticket.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Pay Bill Button - Only show when pay_bill_enabled is true */}
        {ticket.pay_bill_enabled && (
          <View style={styles.payBillSection}>
            <TouchableOpacity
              style={styles.payBillButton}
              onPress={() => router.push(`/event-pay-bill/${ticket.id}` as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="card-outline" size={20} color="#FFFFFF" />
              <Text style={styles.payBillButtonText}>Pay Bill</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#131315',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    backgroundColor: '#131315',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#131315',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
  },
  statusSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 6,
  },
  checkedInText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  eventSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  eventHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 32,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 12,
    lineHeight: 20,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partyText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  eventImage: {
    width: 100,
    height: 100, // 3:4 ratio (120:160)
    borderRadius: 12,
    backgroundColor: '#333333',
  },
  dateTimeCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  dateTimeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  dateTimeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#4CAF50',
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  qrSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  qrCard: {
    backgroundColor: '#1e1e20',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  ticketHeaderLeft: {
    flex: 1,
  },
  ticketHeaderRight: {
    alignItems: 'flex-end',
  },
  ticketTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ticketNumberSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: '#AAAAAA',
  },
  ticketPriceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  ticketStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ticketStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkedInTicketBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  checkedInTicketText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  checkedInTimeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 2,
    opacity: 0.9,
  },
  guestNameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  guestNameText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#AAAAAA',
  },
  verifiedByText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 4,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  qrInfo: {
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 8,
  },
  qrValue: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
    maxWidth: '100%',
  },
  coverAmountText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  qrInstruction: {
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 16,
  },
  offerSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  offerCard: {
    backgroundColor: '#1e1e20',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  paymentSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  paymentCard: {
    backgroundColor: '#1e1e20',
    borderRadius: 16,
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  paymentValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 8,
  },
  paymentTotalLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  paymentTotalValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  customerSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  customerCard: {
    backgroundColor: '#1e1e20',
    borderRadius: 16,
    padding: 16,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  customerLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  customerValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  requestsSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  requestsCard: {
    backgroundColor: '#1e1e20',
    borderRadius: 16,
    padding: 16,
  },
  requestsText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  bookingInfoSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  bookingInfoCard: {
    backgroundColor: '#1e1e20',
    borderRadius: 16,
    padding: 16,
  },
  bookingInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  bookingInfoLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  bookingInfoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    maxWidth: '60%',
  },
  coverAmountSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  coverAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  coverAmountLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  coverAmountValue: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '700',
  },
  coverAmountNote: {
    fontSize: 12,
    color: '#AAAAAA',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 16,
  },
  payBillSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  payBillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  payBillButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
