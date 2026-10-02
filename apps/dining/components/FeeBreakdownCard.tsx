import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PremiumColors } from '../constants/Colors';

interface FeeBreakdownCardProps {
  billAmount: number;
  discountAmount?: number;
  coverCharge?: number;
  convenienceFee: number;
  finalPayable: number;
  feeRate?: number;
  showCommission?: boolean;
  commission?: number;
  merchantGets?: number;
}

/**
 * FeeBreakdownCard Component
 * 
 * Displays a detailed breakdown of payment fees for restaurant bills.
 * Uses dynamic fee calculation from the database.
 * 
 * @param billAmount - Original bill amount
 * @param discountAmount - Discount applied (optional)
 * @param coverCharge - Cover charge already paid (optional)
 * @param convenienceFee - Calculated convenience fee
 * @param finalPayable - Final amount customer pays
 * @param feeRate - Fee percentage rate (for display)
 * @param showCommission - Whether to show commission details (admin view)
 * @param commission - Commission amount (optional)
 * @param merchantGets - Amount merchant receives (optional)
 */
export default function FeeBreakdownCard({
  billAmount,
  discountAmount = 0,
  coverCharge = 0,
  convenienceFee,
  finalPayable,
  feeRate,
  showCommission = false,
  commission,
  merchantGets
}: FeeBreakdownCardProps) {
  const afterDiscount = billAmount - discountAmount;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="receipt-outline" size={20} color={PremiumColors.accent.primary} />
        <Text style={styles.headerText}>Payment Breakdown</Text>
      </View>

      {/* Bill Details */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Bill Amount</Text>
          <Text style={styles.value}>₹{billAmount.toFixed(2)}</Text>
        </View>

        {discountAmount > 0 && (
          <View style={styles.row}>
            <Text style={[styles.label, styles.discountText]}>
              <Ionicons name="pricetag" size={14} color="#10b981" /> Discount
            </Text>
            <Text style={[styles.value, styles.discountText]}>
              - ₹{discountAmount.toFixed(2)}
            </Text>
          </View>
        )}

        {discountAmount > 0 && (
          <View style={[styles.row, styles.subtotalRow]}>
            <Text style={styles.subtotalLabel}>After Discount</Text>
            <Text style={styles.subtotalValue}>₹{afterDiscount.toFixed(2)}</Text>
          </View>
        )}
      </View>

      {/* Fees Section */}
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.feeLabel}>
            <Text style={styles.label}>Convenience Fee</Text>
            {feeRate && (
              <Text style={styles.feeRateText}>({feeRate}%)</Text>
            )}
          </View>
          <Text style={styles.value}>₹{convenienceFee.toFixed(2)}</Text>
        </View>

        {coverCharge > 0 && (
          <View style={styles.row}>
            <Text style={[styles.label, styles.coverText]}>
              <Ionicons name="ticket" size={14} color="#8b5cf6" /> Cover Charge (Paid)
            </Text>
            <Text style={[styles.value, styles.coverText]}>
              - ₹{coverCharge.toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {/* Total Section */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>You Pay</Text>
          <Text style={styles.totalValue}>₹{finalPayable.toFixed(2)}</Text>
        </View>
      </View>

      {/* Commission Details (Admin/Debug View) */}
      {showCommission && commission !== undefined && merchantGets !== undefined && (
        <View style={styles.commissionSection}>
          <Text style={styles.commissionHeader}>Settlement Details</Text>
          <View style={styles.row}>
            <Text style={styles.commissionLabel}>Platform Commission</Text>
            <Text style={styles.commissionValue}>₹{commission.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.commissionLabel}>Merchant Gets</Text>
            <Text style={styles.merchantValue}>₹{merchantGets.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* Info Footer */}
      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={14} color="#64748b" />
        <Text style={styles.footerText}>
          Fees are calculated based on restaurant settings
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  section: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
  },
  value: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  feeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feeRateText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  discountText: {
    color: '#10b981',
  },
  coverText: {
    color: '#8b5cf6',
  },
  subtotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  subtotalLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  subtotalValue: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  totalSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: PremiumColors.accent.primary,
  },
  commissionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  commissionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  commissionLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  commissionValue: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
  },
  merchantValue: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
});

