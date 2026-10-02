import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { MedicineItem, MedicineOrder } from '../../services/mockData';

interface OrderSummaryProps {
  order: Partial<MedicineOrder>;
  items: MedicineItem[];
  showHeader?: boolean;
  showDelivery?: boolean;
  showPayment?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  order,
  items,
  showHeader = true,
  showDelivery = true,
  showPayment = true,
}) => {
  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + item.totalPrice, 0);
  };

  const calculateDeliveryFee = () => {
    // Free delivery for orders over $50
    const subtotal = calculateSubtotal();
    return subtotal > 50 ? 0 : 5.99;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.08; // 8% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee() + calculateTax();
  };

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order Summary</Text>
        {order.orderNumber && (
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
        )}
      </View>
    );
  };

  const renderItem = (item: MedicineItem) => (
    <View key={item.id} style={styles.itemContainer}>
      <View style={styles.itemIcon}>
        <Text style={styles.itemEmoji}>{item.imageUrl}</Text>
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemGeneric}>{item.genericName}</Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemDosage}>{item.dosage}</Text>
          <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
          {item.prescriptionRequired && (
            <View style={styles.prescriptionBadge}>
              <Ionicons name="document-text" size={12} color={Colors.warning} />
              <Text style={styles.prescriptionText}>Rx</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.itemPricing}>
        <Text style={styles.itemUnitPrice}>${item.unitPrice.toFixed(2)} each</Text>
        <Text style={styles.itemTotalPrice}>${item.totalPrice.toFixed(2)}</Text>
      </View>
    </View>
  );

  const renderDeliveryInfo = () => {
    if (!showDelivery || !order.deliveryAddress) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Delivery Address</Text>
        </View>
        <Text style={styles.deliveryAddress}>{order.deliveryAddress}</Text>
        {order.deliveryDate && (
          <Text style={styles.deliveryDate}>
            Expected delivery: {new Date(order.deliveryDate).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  const renderPaymentInfo = () => {
    if (!showPayment || !order.paymentMethod) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="card" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Payment Method</Text>
        </View>
        <Text style={styles.paymentMethod}>{order.paymentMethod}</Text>
      </View>
    );
  };

  const renderPricingBreakdown = () => {
    const subtotal = calculateSubtotal();
    const deliveryFee = calculateDeliveryFee();
    const tax = calculateTax();
    const total = calculateTotal();

    return (
      <View style={styles.pricingContainer}>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Subtotal</Text>
          <Text style={styles.pricingValue}>${subtotal.toFixed(2)}</Text>
        </View>
        
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Delivery Fee</Text>
          <Text style={[
            styles.pricingValue,
            deliveryFee === 0 && styles.freeDelivery
          ]}>
            {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
          </Text>
        </View>
        
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Tax</Text>
          <Text style={styles.pricingValue}>${tax.toFixed(2)}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
        
        {deliveryFee === 0 && (
          <Text style={styles.savingsText}>
            🎉 You saved $5.99 on delivery!
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.itemsSection}>
          <Text style={styles.itemsSectionTitle}>
            Items ({items.length})
          </Text>
          {items.map(renderItem)}
        </View>
        
        {renderDeliveryInfo()}
        {renderPaymentInfo()}
        {renderPricingBreakdown()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
  },
  orderNumber: {
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  content: {
    maxHeight: 400,
  },
  itemsSection: {
    padding: Spacing.lg,
  },
  itemsSectionTitle: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  itemIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.gray100,
    borderRadius: Spacing.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  itemEmoji: {
    fontSize: 20,
  },
  itemDetails: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemName: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  itemGeneric: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  itemDosage: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  itemQuantity: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  prescriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.sm,
  },
  prescriptionText: {
    fontSize: Fonts.size.xs,
    color: Colors.warning,
    fontWeight: Fonts.weight.medium,
  },
  itemPricing: {
    alignItems: 'flex-end',
  },
  itemUnitPrice: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  itemTotalPrice: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
  },
  section: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
  },
  deliveryAddress: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.sm,
    marginBottom: Spacing.sm,
  },
  deliveryDate: {
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  paymentMethod: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  pricingContainer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pricingLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  pricingValue: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    fontWeight: Fonts.weight.medium,
  },
  freeDelivery: {
    color: Colors.success,
    fontWeight: Fonts.weight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray200,
    marginVertical: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  totalLabel: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.bold,
    color: Colors.primary,
  },
  savingsText: {
    fontSize: Fonts.size.sm,
    color: Colors.success,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
