# TicketCard Component

A reusable, feature-rich ticket card component for displaying event tickets with support for the updated database structure including recurring events, validity periods, purchase limits, and discount pricing.

## Features

✅ **Discount Display** - Automatically calculates and displays discount percentage from `strike_price`  
✅ **Validity Period** - Shows ticket validity based on `valid_from` and `valid_until`  
✅ **Purchase Limits** - Enforces `min_purchase_amount` and `max_purchase_amount`  
✅ **Stock Management** - Real-time availability tracking with sold/available quantities  
✅ **Status Badges** - Visual indicators for sold out, limited, inactive, and expired tickets  
✅ **Cover Charge Support** - Displays cover charge breakdown for entry fee + redeemable amount  
✅ **Recurring Events** - Supports `occurrence_id` for linking to specific event occurrences  
✅ **Quantity Selector** - Optional interactive quantity selection for booking  
✅ **Compact Mode** - Space-efficient layout for lists  
✅ **Features Display** - Shows ticket features/inclusions  

## Database Structure

The component works with the `event_ticket_types` table with the following key fields:

```typescript
interface EventTicketType {
  id: string;
  event_id: string;
  occurrence_id?: string;           // NEW: Link to specific occurrence
  name: string;
  description?: string;
  price: number;
  strike_price?: number;            // NEW: For discount calculation
  total_quantity: number;
  sold_quantity: number;
  features?: string[];
  is_active: boolean;
  is_available: boolean;            // NEW: Availability flag
  is_sold_out: boolean;             // NEW: Sold out flag
  valid_from?: string;              // NEW: Validity start date
  valid_until?: string;             // NEW: Validity end date
  min_purchase_amount?: number;     // NEW: Minimum tickets per purchase
  max_purchase_amount?: number;     // NEW: Maximum tickets per purchase
  ticket_cover_enabled?: boolean;
  ticket_cover_amount?: number;
  ticket_cover_title?: string;
  entry_fee_amount?: number;
}
```

## Installation

```typescript
import { TicketCard, EventTicketType } from '../../components/Tickets';
```

## Basic Usage

### Simple Display

```typescript
<TicketCard
  ticket={ticketData}
  onPress={(ticket) => console.log('Selected:', ticket.name)}
/>
```

### With Quantity Selector

```typescript
const [selectedQty, setSelectedQty] = useState(0);

<TicketCard
  ticket={ticketData}
  selectedQuantity={selectedQty}
  onQuantityChange={(ticketId, qty) => setSelectedQty(qty)}
  showQuantitySelector={true}
/>
```

### Compact Mode

```typescript
<TicketCard
  ticket={ticketData}
  compact={true}
  onPress={(ticket) => handleTicketSelection(ticket)}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `ticket` | `EventTicketType` | ✅ | - | Ticket data object |
| `onPress` | `(ticket: EventTicketType) => void` | ❌ | - | Callback when ticket is pressed |
| `selectedQuantity` | `number` | ❌ | `0` | Currently selected quantity |
| `onQuantityChange` | `(ticketId: string, qty: number) => void` | ❌ | - | Callback for quantity changes |
| `showQuantitySelector` | `boolean` | ❌ | `false` | Show quantity selector controls |
| `compact` | `boolean` | ❌ | `false` | Use compact layout |

## Visual Features

### Discount Badge
- Automatically displayed when `strike_price > price`
- Shows percentage discount in top-right corner
- Red accent color for attention

### Status Badges
- **SOLD OUT**: Red badge when `is_sold_out = true`
- **INACTIVE**: Gray badge when `is_active = false`
- **EXPIRED**: Orange badge when current time > `valid_until`
- **LIMITED**: Orange badge when available quantity ≤ 10

### Price Display
- Strike-through original price if discount exists
- Large, prominent current price
- Cover charge label if applicable

### Validity Period
- Shows formatted date range for `valid_from` and `valid_until`
- Automatically validates if ticket is currently bookable

## Examples

### Regular Ticket with Discount

```typescript
const regularTicket: EventTicketType = {
  id: 'ticket-1',
  event_id: 'event-123',
  name: 'General Admission',
  description: 'Access to main event area',
  price: 499,
  strike_price: 699,  // 29% discount
  total_quantity: 500,
  sold_quantity: 120,
  is_active: true,
  is_available: true,
  is_sold_out: false,
  min_purchase_amount: 1,
  max_purchase_amount: 10,
};

<TicketCard ticket={regularTicket} />
```

### VIP Ticket with Cover Charge

```typescript
const vipTicket: EventTicketType = {
  id: 'ticket-2',
  event_id: 'event-123',
  name: 'VIP Couple Entry',
  description: 'Exclusive VIP area access',
  price: 2999,
  total_quantity: 100,
  sold_quantity: 85,
  features: [
    'VIP lounge access',
    'Complimentary drinks worth ₹1500',
    'Priority entry',
  ],
  is_active: true,
  ticket_cover_enabled: true,
  ticket_cover_amount: 1500,
  entry_fee_amount: 1499,
  is_available: true,
  is_sold_out: false,
};

<TicketCard ticket={vipTicket} />
```

### Recurring Event Ticket

```typescript
const recurringTicket: EventTicketType = {
  id: 'ticket-3',
  event_id: 'recurring-event',
  occurrence_id: 'occurrence-saturday-8pm',  // Specific occurrence
  name: 'Saturday Night Show',
  description: 'This Saturday at 8 PM',
  price: 799,
  total_quantity: 150,
  sold_quantity: 60,
  is_active: true,
  is_available: true,
  is_sold_out: false,
  min_purchase_amount: 2,  // Must buy at least 2
  max_purchase_amount: 8,
  valid_from: '2024-01-20T00:00:00Z',
  valid_until: '2024-01-21T23:59:59Z',
};

<TicketCard ticket={recurringTicket} />
```

### Managing Multiple Tickets

```typescript
const [selectedTickets, setSelectedTickets] = useState<{[key: string]: number}>({});

const handleQuantityChange = (ticketId: string, quantity: number) => {
  setSelectedTickets(prev => ({
    ...prev,
    [ticketId]: quantity,
  }));
};

return (
  <View>
    {tickets.map(ticket => (
      <TicketCard
        key={ticket.id}
        ticket={ticket}
        selectedQuantity={selectedTickets[ticket.id] || 0}
        onQuantityChange={handleQuantityChange}
        showQuantitySelector={true}
      />
    ))}
    
    {/* Calculate total */}
    <Text>
      Total: ₹{
        Object.entries(selectedTickets)
          .reduce((total, [id, qty]) => {
            const ticket = tickets.find(t => t.id === id);
            return total + (ticket ? ticket.price * qty : 0);
          }, 0)
      }
    </Text>
  </View>
);
```

## Validation Logic

The component automatically validates:

1. **Availability**: Checks `is_active`, `is_available`, `is_sold_out`
2. **Stock**: Calculates available = `total_quantity - sold_quantity`
3. **Validity Period**: Validates current time against `valid_from` and `valid_until`
4. **Purchase Limits**: Enforces `min_purchase_amount` and `max_purchase_amount`

## Styling

The component uses the app's `PremiumColors` theme:
- Dark background with subtle borders
- Accent green for prices and active elements
- Status-specific colors for badges
- Responsive touch feedback

## Integration with Book Event Page

In `app/book-event/[id].tsx`:

```typescript
import { TicketCard, EventTicketType } from '../../components/Tickets';

// Replace old hardcoded ticket display
<View style={styles.ticketCardsContainer}>
  {getCoverChargeTickets().map((ticket) => (
    <TicketCard
      key={ticket.id}
      ticket={ticket as EventTicketType}
      onPress={(selectedTicket) => {
        setSelectedTicketForInclusions(selectedTicket);
        setShowInclusionsModal(true);
      }}
    />
  ))}
</View>
```

## Future Enhancements

- [ ] Animation for quantity changes
- [ ] Swipe gestures for compact mode
- [ ] Ticket comparison mode
- [ ] Wishlist/save for later
- [ ] Share ticket details
- [ ] Calendar integration for validity periods

## Related Components

- `GuestSelectorModal` - For selecting party size
- `EventOrganizerCard` - Event organizer information
- `EventTicketCard` - Booked ticket display (in Booking-Tickets folder)

## Notes

- The component is fully typed with TypeScript
- All date handling uses ISO 8601 format
- Quantity selector respects both purchase limits and available stock
- Discount percentage is rounded to nearest integer
- Cover charge breakdown is only shown when `ticket_cover_enabled = true`

## Support

For issues or feature requests, please check the project documentation or contact the development team.

