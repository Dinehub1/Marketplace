import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getTicketsForSection } from '../../config/supabase';
import { PremiumColors } from '../../constants/Colors';
import { SectionWithAvailability } from '../../utils/layoutService';
import { EventTicketType, TicketCard } from '../Tickets';

interface SectionTicketsModalProps {
  visible: boolean;
  section: SectionWithAvailability | null;
  occurrenceId: string;
  onClose: () => void;
  onContinue: (selectedTickets: { [key: string]: number }, tickets: any[]) => void;
}

export default function SectionTicketsModal({
  visible,
  section,
  occurrenceId,
  onClose,
  onContinue,
}: SectionTicketsModalProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (visible && section) {
      loadTickets();
    } else {
      // Reset state when modal closes
      setTickets([]);
      setSelectedTickets({});
    }
  }, [visible, section]);

  const loadTickets = async () => {
    if (!section) return;

    try {
      setLoading(true);
      console.log('🎫 Loading tickets for section:', section.id);

      const { data, error } = await getTicketsForSection(section.id, occurrenceId);

      if (error) {
        console.error('❌ Error loading tickets:', error);
        setTickets([]);
      } else {
        setTickets(data || []);
        console.log('✅ Loaded tickets:', data?.length || 0);
      }
    } catch (error) {
      console.error('❌ Exception loading tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketId, count]) => {
      const ticket = tickets.find((t: any) => t.id === ticketId);
      return total + (ticket ? parseFloat(ticket.price || 0) * count : 0);
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((total, count) => total + count, 0);
  };

  const handleContinue = () => {
    const totalTickets = getTotalTickets();
    if (totalTickets === 0) {
      return;
    }

    console.log('✅ Continuing with tickets:', selectedTickets);
    onContinue(selectedTickets, tickets);
  };

  if (!section) return null;

  // Parse metadata perks
  const perks = section.metadata?.perks || section.metadata?.description ? [section.metadata.description] : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.sectionName}>{section.name}</Text>
              <View style={styles.capacityRow}>
                <Ionicons name="people-outline" size={16} color={PremiumColors.text.secondary} />
                <Text style={styles.capacityText}>
                  {section.available_capacity} / {section.capacity_total} available
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={PremiumColors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Section Features */}
          {perks.length > 0 && (
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>What's Included:</Text>
              <View style={styles.featuresList}>
                {perks.map((perk: string, index: number) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={PremiumColors.accent.secondary} />
                    <Text style={styles.featureText}>{perk}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tickets Section */}
          <ScrollView
            style={styles.ticketsScrollView}
            contentContainerStyle={styles.ticketsContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.ticketsTitle}>Select Tickets</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PremiumColors.accent.secondary} />
                <Text style={styles.loadingText}>Loading tickets...</Text>
              </View>
            ) : tickets.length > 0 ? (
              tickets.map((ticket: any) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket as EventTicketType}
                  selectedQuantity={selectedTickets[ticket.id] || 0}
                  onQuantityChange={(ticketId, quantity) => {
                    setSelectedTickets(prev => ({
                      ...prev,
                      [ticketId]: quantity,
                    }));
                  }}
                  showQuantitySelector={true}
                  compact={false}
                />
              ))
            ) : (
              <View style={styles.noTicketsContainer}>
                <Ionicons name="ticket-outline" size={48} color={PremiumColors.text.tertiary} />
                <Text style={styles.noTicketsText}>No tickets available for this section</Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Continue Button */}
          {tickets.length > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleContinue}
                style={[
                  styles.continueButton,
                  getTotalTickets() === 0 && styles.continueButtonDisabled,
                ]}
                disabled={getTotalTickets() === 0}
              >
                <LinearGradient
                  colors={[PremiumColors.accent.secondary, '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.continueButtonGradient}
                >
                  <View style={styles.continueButtonContent}>
                    <Text style={styles.continueButtonText}>
                      Continue {getTotalTickets() > 0 && `(${getTotalTickets()})`}
                    </Text>
                    {getTotalAmount() > 0 && (
                      <Text style={styles.continueButtonAmount}>
                        ₹{getTotalAmount().toFixed(0)}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: PremiumColors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  sectionName: {
    fontSize: 22,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 8,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  capacityText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PremiumColors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresContainer: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: PremiumColors.background.secondary,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: PremiumColors.text.secondary,
    lineHeight: 18,
  },
  ticketsScrollView: {
    flex: 1,
  },
  ticketsContent: {
    padding: 20,
    paddingTop: 16,
  },
  ticketsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  noTicketsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  noTicketsText: {
    marginTop: 12,
    fontSize: 14,
    color: PremiumColors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.border,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  continueButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  continueButtonAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

