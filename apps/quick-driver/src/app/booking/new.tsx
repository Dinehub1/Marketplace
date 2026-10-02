import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Button, Card, Chip, Row } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useApp } from '@/lib/app-context';
import { calcFare, inr, isNightNow, PROMOS, ServiceId, SERVICES } from '@/lib/data';

function Stepper({
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  return (
    <Row>
      <Button title="−" small variant="secondary" onPress={() => onChange(Math.max(min, value - step))} />
      <ThemedText type="smallBold">
        {value} {unit}
      </ThemedText>
      <Button title="+" small variant="secondary" onPress={() => onChange(Math.min(max, value + step))} />
    </Row>
  );
}

export default function NewBookingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { bookTrip } = useApp();
  const params = useLocalSearchParams<{ service?: string }>();

  const [serviceId, setServiceId] = useState<ServiceId>(
    (SERVICES.some((s) => s.id === params.service) ? params.service : 'instant') as ServiceId
  );
  const service = SERVICES.find((s) => s.id === serviceId)!;

  const [pickup, setPickup] = useState('Current location — Vijay Nagar, Indore');
  const [drop, setDrop] = useState('');
  const [km, setKm] = useState(serviceId === 'outstation' ? 120 : 8);
  const [hours, setHours] = useState(2);
  const [insurance, setInsurance] = useState(false);
  const [night, setNight] = useState(isNightNow());
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [corporateSent, setCorporateSent] = useState(false);

  const promo = PROMOS.find((p) => p.code === promoCode);
  const fare = useMemo(
    () => calcFare({ service: serviceId, km, hours, night, insurance, promo }),
    [serviceId, km, hours, night, insurance, promo]
  );

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];
  const needsDrop = serviceId === 'instant' || serviceId === 'outstation';
  const canBook = pickup.trim().length > 0 && (!needsDrop || drop.trim().length > 0);

  if (serviceId === 'corporate') {
    return (
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scroll, styles.centered]}>
          <ServicePicker selected={serviceId} onSelect={setServiceId} />
          <Card style={styles.corporateCard}>
            <ThemedText style={styles.bigIcon}>💼</ThemedText>
            <ThemedText type="smallBold">Corporate — drivers for your team</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Dedicated verified drivers, monthly consolidated invoice, priority support and a usage
              dashboard for your admin.
            </ThemedText>
            {corporateSent ? (
              <ThemedText type="smallBold" style={{ color: '#10B981' }}>
                ✓ Request sent — our team will call you within the hour.
              </ThemedText>
            ) : (
              <Button title="Request a callback" onPress={() => setCorporateSent(true)} />
            )}
          </Card>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <ServicePicker selected={serviceId} onSelect={setServiceId} />

        <Card>
          <ThemedText type="smallBold">Pickup</ThemedText>
          <TextInput
            style={inputStyle}
            value={pickup}
            onChangeText={setPickup}
            placeholder="Pickup location"
            placeholderTextColor={theme.textSecondary}
          />
          {needsDrop && (
            <>
              <ThemedText type="smallBold">
                {serviceId === 'outstation' ? 'Destination city' : 'Drop'}
              </ThemedText>
              <TextInput
                style={inputStyle}
                value={drop}
                onChangeText={setDrop}
                placeholder={serviceId === 'outstation' ? 'e.g. Bhopal, Ujjain, Mhow' : 'Drop location'}
                placeholderTextColor={theme.textSecondary}
              />
            </>
          )}
        </Card>

        <Card>
          {serviceId === 'hourly' && (
            <Row>
              <ThemedText type="smallBold">How long do you need the driver?</ThemedText>
              <Stepper value={hours} onChange={setHours} min={2} max={12} step={1} unit="hr" />
            </Row>
          )}
          {(serviceId === 'instant' || serviceId === 'outstation') && (
            <Row>
              <ThemedText type="smallBold">
                {serviceId === 'outstation' ? 'Approx. round trip' : 'Approx. distance'}
              </ThemedText>
              <Stepper
                value={km}
                onChange={setKm}
                min={serviceId === 'outstation' ? 60 : 2}
                max={serviceId === 'outstation' ? 600 : 40}
                step={serviceId === 'outstation' ? 20 : 2}
                unit="km"
              />
            </Row>
          )}
          {serviceId === 'daily' && (
            <ThemedText type="small" themeColor="textSecondary">
              Full day = up to 12 hours with one professional driver.
            </ThemedText>
          )}
          <Row>
            <View style={styles.toggleText}>
              <ThemedText type="smallBold">Trip insurance</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                ₹100 · covers your car during the trip
              </ThemedText>
            </View>
            <Switch value={insurance} onValueChange={setInsurance} trackColor={{ true: BRAND }} />
          </Row>
          <Row>
            <View style={styles.toggleText}>
              <ThemedText type="smallBold">Night trip (10 PM – 6 AM)</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                ₹150 surcharge applies
              </ThemedText>
            </View>
            <Switch value={night} onValueChange={setNight} trackColor={{ true: BRAND }} />
          </Row>
        </Card>

        <Card>
          <ThemedText type="smallBold">Apply a promo</ThemedText>
          <View style={styles.chipRow}>
            {PROMOS.map((p) => (
              <Chip
                key={p.code}
                label={p.code}
                selected={promoCode === p.code}
                onPress={() => setPromoCode(promoCode === p.code ? null : p.code)}
              />
            ))}
          </View>
        </Card>

        <Card>
          <ThemedText type="smallBold">Fare estimate</ThemedText>
          {fare.lines.map((line) => (
            <Row key={line.label}>
              <ThemedText type="small" themeColor="textSecondary">
                {line.label}
              </ThemedText>
              <ThemedText type="small" style={line.amount < 0 ? { color: '#10B981' } : undefined}>
                {line.amount < 0 ? `−${inr(line.amount)}` : inr(line.amount)}
              </ThemedText>
            </Row>
          ))}
          <Row>
            <ThemedText type="smallBold">Total (pay by cash / UPI / wallet)</ThemedText>
            <ThemedText type="subtitle" style={{ color: BRAND }}>
              {inr(fare.total)}
            </ThemedText>
          </Row>
          <ThemedText type="small" themeColor="textSecondary">
            No hidden charges. Final fare may vary slightly with actual distance/time.
          </ThemedText>
        </Card>

        <Button
          title="Book now — driver assigned within minutes"
          disabled={!canBook}
          onPress={() => {
            const id = bookTrip({
              service: serviceId,
              serviceTitle: service.title,
              pickup,
              drop: needsDrop ? drop : service.title,
              fare,
            });
            router.replace({ pathname: '/booking/trip', params: { id } });
          }}
        />
      </ScrollView>
    </ThemedView>
  );
}

function ServicePicker({
  selected,
  onSelect,
}: {
  selected: ServiceId;
  onSelect: (id: ServiceId) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {SERVICES.map((s) => (
        <Chip
          key={s.id}
          label={`${s.icon} ${s.title}`}
          selected={selected === s.id}
          onPress={() => onSelect(s.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scroll: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  centered: {
    justifyContent: 'flex-start',
  },
  corporateCard: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  bigIcon: {
    fontSize: 40,
    lineHeight: 48,
  },
  input: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 16,
    fontWeight: '500',
  },
  toggleText: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
