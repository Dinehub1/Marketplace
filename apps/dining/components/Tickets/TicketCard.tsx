import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PremiumColors } from '../../constants/Colors';

// Type definition for Event Ticket based on updated database structure
export interface EventTicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  strike_price?: number; // Original price for discount calculation
  total_quantity: number;
  sold_quantity: number;
  features?: string[];
  is_active: boolean;
  ticket_cover_enabled?: boolean;
  ticket_cover_amount?: number;
  ticket_cover_title?: string;
  entry_fee_amount?: number;
  valid_from?: string; // ISO timestamp
  valid_until?: string; // ISO timestamp
  occurrence_id?: string; // Link to event_occurrences
  min_purchase_amount?: number;
  max_purchase_amount?: number;
  is_available: boolean;
  is_sold_out: boolean;
  initial_quantity?: number;
}

interface TicketCardProps {
  ticket: EventTicketType;
  onPress?: (ticket: EventTicketType) => void;
  selectedQuantity?: number;
  onQuantityChange?: (ticketId: string, quantity: number) => void;
  showQuantitySelector?: boolean;
  compact?: boolean; // For smaller display in lists
}

export default function TicketCard({
  ticket,
  onPress,
  selectedQuantity = 0,
  onQuantityChange,
  showQuantitySelector = false,
  compact = false,
}: TicketCardProps) {
  // Calculate discount percentage if strike_price exists
  const calculateDiscount = (): number | null => {
    if (!ticket.strike_price || ticket.strike_price <= ticket.price) {
      return null;
    }
    const discount = ((ticket.strike_price - ticket.price) / ticket.strike_price) * 100;
    return Math.round(discount);
  };

  // Calculate available quantity
  const getAvailableQuantity = (): number => {
    return ticket.total_quantity - (ticket.sold_quantity || 0);
  };

  // Check if ticket is currently valid based on valid_from and valid_until
  const isTicketValid = (): boolean => {
    const now = new Date();
    
    if (ticket.valid_from) {
      const validFrom = new Date(ticket.valid_from);
      if (now < validFrom) return false;
    }
    
    if (ticket.valid_until) {
      const validUntil = new Date(ticket.valid_until);
      if (now > validUntil) return false;
    }
    
    return true;
  };

  // Format validity dates for display
  const formatValidityPeriod = (): string | null => {
    if (!ticket.valid_from && !ticket.valid_until) return null;
    
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };
    
    if (ticket.valid_from && ticket.valid_until) {
      return `Valid: ${formatDate(ticket.valid_from)} - ${formatDate(ticket.valid_until)}`;
    } else if (ticket.valid_from) {
      return `Valid from: ${formatDate(ticket.valid_from)}`;
    } else if (ticket.valid_until) {
      return `Valid until: ${formatDate(ticket.valid_until)}`;
    }
    
    return null;
  };

  const discount = calculateDiscount();
  const availableQty = getAvailableQuantity();
  const isValid = isTicketValid();
  const validityPeriod = formatValidityPeriod();

  // Determine ticket availability status
  const canPurchase = 
    ticket.is_active && 
    ticket.is_available && 
    !ticket.is_sold_out && 
    isValid && 
    availableQty > 0;

  const handleQuantityChange = (change: number) => {
    if (!onQuantityChange) return;
    
    const newQuantity = selectedQuantity + change;
    const minQty = ticket.min_purchase_amount || 1;
    const maxQty = Math.min(
      ticket.max_purchase_amount || 10,
      availableQty
    );
    
    if (newQuantity >= 0 && newQuantity <= maxQty) {
      onQuantityChange(ticket.id, newQuantity);
    }
  };

  const getStatusBadge = () => {
    if (ticket.is_sold_out) {
      return (
        <View style={[styles.statusBadge, styles.soldOutBadge]}>
          <Text style={styles.statusBadgeText}>SOLD OUT</Text>
        </View>
      );
    }
    
    if (!ticket.is_active) {
      return (
        <View style={[styles.statusBadge, styles.inactiveBadge]}>
          <Text style={styles.statusBadgeText}>INACTIVE</Text>
        </View>
      );
    }
    
    if (!isValid) {
      return (
        <View style={[styles.statusBadge, styles.expiredBadge]}>
          <Text style={styles.statusBadgeText}>EXPIRED</Text>
        </View>
      );
    }
    
    if (availableQty <= 10 && availableQty > 0) {
      return (
        <View style={[styles.statusBadge, styles.limitedBadge]}>
          <Text style={styles.statusBadgeText}>ONLY {availableQty} LEFT</Text>
        </View>
      );
    }
    
    return null;
  };

  if (compact) {
    // Compact view for lists
    return (
      <TouchableOpacity
        style={[
          styles.compactCard,
          !canPurchase && styles.disabledCard,
        ]}
        onPress={() => canPurchase && onPress?.(ticket)}
        disabled={!canPurchase}
        activeOpacity={0.7}
      >
        <View style={styles.compactHeader}>
          <View style={styles.compactInfo}>
            <Text style={styles.compactTicketName}>{ticket.name}</Text>
            {ticket.description && (
              <Text style={styles.compactDescription} numberOfLines={1}>
                {ticket.description}
              </Text>
            )}
          </View>
          
          <View style={styles.compactPricing}>
            {discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discount}% OFF</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              {ticket.strike_price && ticket.strike_price > ticket.price && (
                <Text style={styles.strikePrice}>₹{ticket.strike_price.toLocaleString()}</Text>
              )}
              <Text style={styles.compactPrice}>₹{ticket.price.toLocaleString()}</Text>
            </View>
          </View>
        </View>
        
        {getStatusBadge()}
      </TouchableOpacity>
    );
  }

  // Full card view
  return (
    <TouchableOpacity
      style={[
        styles.card,
        !canPurchase && styles.disabledCard,
      ]}
      onPress={() => canPurchase && onPress?.(ticket)}
      disabled={!canPurchase && !showQuantitySelector}
      activeOpacity={0.7}
    >
      {/* Discount Badge - Top Right */}
      {discount && canPurchase && (
        <View style={styles.discountCornerBadge}>
          <Text style={styles.discountCornerText}>{discount}% OFF</Text>
        </View>
      )}

      {/* Ticket Header */}
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketName}>{ticket.name}</Text>
          {ticket.description && (
            <Text style={styles.ticketDescription} numberOfLines={2}>
              {ticket.description}
            </Text>
          )}
        </View>
      </View>

      {/* Price Section */}
      <View style={styles.priceSection}>
        <View style={styles.priceContainer}>
          {ticket.strike_price && ticket.strike_price > ticket.price && (
            <Text style={styles.strikePriceLabel}>
              ₹{ticket.strike_price.toLocaleString()}
            </Text>
          )}
          <Text style={styles.currentPrice}>₹{ticket.price.toLocaleString()}</Text>
          {ticket.ticket_cover_enabled && (
            <Text style={styles.coverChargeLabel}>
              Total Amount
            </Text>
          )}
        </View>

        {/* Quantity Selector */}
        {showQuantitySelector && canPurchase && (
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                selectedQuantity === 0 && styles.quantityButtonDisabled,
              ]}
              onPress={() => handleQuantityChange(-1)}
              disabled={selectedQuantity === 0}
            >
              <Ionicons name="remove" size={18} color={selectedQuantity === 0 ? '#666' : '#fff'} />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{selectedQuantity}</Text>
            
            <TouchableOpacity
              style={[
                styles.quantityButton,
                selectedQuantity >= Math.min(ticket.max_purchase_amount || 10, availableQty) && 
                  styles.quantityButtonDisabled,
              ]}
              onPress={() => handleQuantityChange(1)}
              disabled={selectedQuantity >= Math.min(ticket.max_purchase_amount || 10, availableQty)}
            >
              <Ionicons 
                name="add" 
                size={18} 
                color={
                  selectedQuantity >= Math.min(ticket.max_purchase_amount || 10, availableQty) 
                    ? '#666' 
                    : '#fff'
                } 
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Features */}
      {ticket.features && ticket.features.length > 0 && (
        <View style={styles.featuresSection}>
          {ticket.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={14} color={PremiumColors.accent.secondary} />
              <Text style={styles.featureText} numberOfLines={1}>
                {feature}
              </Text>
            </View>
          ))}
          {ticket.features.length > 3 && (
            <Text style={styles.moreFeatures}>+{ticket.features.length - 3} more</Text>
          )}
        </View>
      )}
        {/* Cover Charge Details */}
        {ticket.ticket_cover_enabled && ticket.ticket_cover_amount && (
          <View style={styles.coverChargeInfo}>
            <Text style={styles.coverChargeText}>
              ₹{ticket.entry_fee_amount?.toLocaleString() || 0} Entry + 
              ₹{ticket.ticket_cover_amount.toLocaleString()} Redeemable
            </Text>
          </View>
        )}

      {/* Status Badge */}
      {getStatusBadge()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  disabledCard: {
    opacity: 0.6,
  },
  discountCornerBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  discountCornerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ticketHeader: {
    marginBottom: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketName: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  ticketDescription: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
    lineHeight: 18,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.border,
  },
  priceContainer: {
    flex: 1,
  },
  strikePriceLabel: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: PremiumColors.accent.secondary,
    marginBottom: 2,
  },
  coverChargeLabel: {
    fontSize: 11,
    color: PremiumColors.text.tertiary,
    fontWeight: '500',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.tertiary,
    borderRadius: 8,
    padding: 4,
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: PremiumColors.accent.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    minWidth: 30,
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    color: PremiumColors.accent.secondary,
    fontWeight: '600',
    marginTop: 4,
  },
 
  coverChargeInfo: {
    backgroundColor: 'rgba(0, 67, 45, 0.21)',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  coverChargeText: {
    fontSize: 12,
    color: PremiumColors.accent.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  soldOutBadge: {
    backgroundColor: '#F44336',
  },
  inactiveBadge: {
    backgroundColor: '#9E9E9E',
  },
  expiredBadge: {
    backgroundColor: '#FF9800',
  },
  limitedBadge: {
    backgroundColor: '#FF6B35',
  },
  
  // Compact styles
  compactCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    marginRight: 12,
  },
  compactTicketName: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 2,
  },
  compactDescription: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
  },
  compactPricing: {
    alignItems: 'flex-end',
  },
  discountBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strikePrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  compactPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.accent.secondary,
  },
});

