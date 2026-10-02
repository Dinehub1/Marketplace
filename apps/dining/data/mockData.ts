// Mock data for restaurants, offers, and other content
import { additionalRestaurants } from './additionalRestaurants';

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  cuisine: string;
  rating: number;
  distance: string;
  deliveryTime: string;
  offers: string[];
  priceRange: string;
  description: string;
  location: string;
  isOpen: boolean;
  category: string;
}

export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  backgroundColor: string;
  buttonText: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
}

export interface TableType {
  id: string;
  name: string;
  capacity: number;
  price: number;
  description: string;
  available: boolean;
  image: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  price?: number;
}

export interface Event {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  date: string;
  time: string;
  venue: string;
  price: number;
  description: string;
  category: string;
  duration: string;
  organizer: string;
  ticketTypes: TicketType[];
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string;
  available: number;
  features: string[];
}

export const mockOffers: Offer[] = [
  {
    id: '1',
    title: 'Flat 40% Off on First Order',
    subtitle: 'Use code: WELCOME40',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop',
    backgroundColor: '#4CAF50',
    buttonText: 'Order Now'
  },
  {
    id: '2',
    title: 'Free Delivery + 20% Off',
    subtitle: 'On orders above ₹299',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=200&fit=crop',
    backgroundColor: '#FF6B35',
    buttonText: 'Claim Offer'
  },
  {
    id: '3',
    title: 'Weekend Special: Buy 1 Get 1',
    subtitle: 'Valid on pizzas & burgers',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=200&fit=crop',
    backgroundColor: '#9C27B0',
    buttonText: 'Explore Deals'
  },
  {
    id: '4',
    title: 'Super Saver Combo',
    subtitle: 'Meal + Drink + Dessert = ₹199',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=200&fit=crop',
    backgroundColor: '#2196F3',
    buttonText: 'Order Combo'
  }
];

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Pizza',
    icon: '🍕',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=100&h=100&fit=crop'
  },
  {
    id: '2',
    name: 'Burger',
    icon: '🍔',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop'
  },
  {
    id: '3',
    name: 'Chinese',
    icon: '🥢',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=100&h=100&fit=crop'
  },
  {
    id: '4',
    name: 'Indian',
    icon: '🍛',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=100&h=100&fit=crop'
  },
  {
    id: '5',
    name: 'Desserts',
    icon: '🍰',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100&h=100&fit=crop'
  },
  {
    id: '6',
    name: 'Coffee',
    icon: '☕',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100&h=100&fit=crop'
  }
];

export const mockTrendingRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Bella Buono',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=200&fit=crop',
    cuisine: 'Multi-Cuisine Restaurants',
    rating: 4.5,
    distance: '7.5 Km',
    deliveryTime: '25-30 mins',
    offers: ['Flat 20% Off', '150 off with ONE + UP to 15% off with Bank Offers'],
    priceRange: '₹400 for Two',
    description: 'Fine dining restaurant with exquisite ambiance',
    location: 'Vijay nagar',
    isOpen: true,
    category: 'trending'
  },
  {
    id: '2',
    name: 'The Golden Spoon',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop',
    cuisine: 'Continental, Italian',
    rating: 4.7,
    distance: '3.2 Km',
    deliveryTime: '20-25 mins',
    offers: ['Buy 1 Get 1 Free', 'Free Delivery'],
    priceRange: '₹600 for Two',
    description: 'Luxurious dining experience with live music',
    location: 'MG Road',
    isOpen: true,
    category: 'trending'
  },
  {
    id: '3',
    name: 'Spice Garden',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=300&h=200&fit=crop',
    cuisine: 'Indian, Mughlai',
    rating: 4.3,
    distance: '5.1 Km',
    deliveryTime: '30-35 mins',
    offers: ['30% Off on First Order'],
    priceRange: '₹350 for Two',
    description: 'Authentic Indian flavors in traditional setting',
    location: 'Old City',
    isOpen: true,
    category: 'trending'
  }
];

export const mockPopularRestaurants: Restaurant[] = [
  {
    id: '4',
    name: 'Farzi Cafe',
    image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=200&fit=crop',
    cuisine: 'Indian, Chinese, Mughlai',
    rating: 4.6,
    distance: '2.8 Km',
    deliveryTime: '15-20 mins',
    offers: ['Happy Hours 5-7 PM'],
    priceRange: '₹800 for Two',
    description: 'Modern Indian bistro with innovative dishes',
    location: 'Connaught Place',
    isOpen: true,
    category: 'popular'
  },
  {
    id: '5',
    name: 'The Bear Spot',
    image: 'https://images.unsplash.com/photo-1592861956120-e524fc739696?w=300&h=200&fit=crop',
    cuisine: 'Flame-grilled',
    rating: 4.4,
    distance: '4.5 Km',
    deliveryTime: '25-30 mins',
    offers: ['Weekend Special BBQ'],
    priceRange: '₹700 for Two',
    description: 'Cozy spot for grilled specialties',
    location: 'Khan Market',
    isOpen: true,
    category: 'popular'
  },
  {
    id: '6',
    name: 'Coco Lounge',
    image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=300&h=200&fit=crop',
    cuisine: 'American pub',
    rating: 4.2,
    distance: '6.3 Km',
    deliveryTime: '35-40 mins',
    offers: ['Live Music Nights'],
    priceRange: '₹900 for Two',
    description: 'Trendy pub with craft cocktails',
    location: 'Cyber City',
    isOpen: false,
    category: 'popular'
  }
];

export const mockAllRestaurants = [...mockTrendingRestaurants, ...mockPopularRestaurants, ...additionalRestaurants];

// User mock data
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  location: {
    address: string;
    city: string;
    state: string;
  };
}

export const mockUser: User = {
  id: '1',
  name: 'Khatiwala Tank',
  phone: '+91 1234567890',
  email: 'user@DropBy.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  location: {
    address: 'Khatiwala Tank, Indore, Madhya Pradesh',
    city: 'Indore',
    state: 'Madhya Pradesh'
  }
};

// Orders mock data
export interface Order {
  id: string;
  restaurantName: string;
  restaurantImage: string;
  items: string[];
  total: number;
  status: 'preparing' | 'on-the-way' | 'delivered' | 'cancelled';
  orderTime: string;
  deliveryTime?: string;
}

export const mockOrders: Order[] = [
  {
    id: '1',
    restaurantName: 'Bella Buono',
    restaurantImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&h=100&fit=crop',
    items: ['Margherita Pizza', 'Garlic Bread', 'Cold Coffee'],
    total: 650,
    status: 'on-the-way',
    orderTime: '2024-01-15 14:30',
    deliveryTime: '15:00'
  },
  {
    id: '2',
    restaurantName: 'Spice Garden',
    restaurantImage: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=100&h=100&fit=crop',
    items: ['Butter Chicken', 'Naan', 'Basmati Rice'],
    total: 450,
    status: 'delivered',
    orderTime: '2024-01-14 19:45',
    deliveryTime: '20:30'
  },
  {
    id: '3',
    restaurantName: 'Farzi Cafe',
    restaurantImage: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=100&h=100&fit=crop',
    items: ['Truffle Pasta', 'Mocktail'],
    total: 850,
    status: 'preparing',
    orderTime: '2024-01-15 13:15'
  }
];

// Table booking mock data
export const mockTableTypes: TableType[] = [
  {
    id: '1',
    name: 'Cozy Corner',
    capacity: 2,
    price: 200,
    description: 'Perfect for couples, romantic ambiance',
    available: true,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'
  },
  {
    id: '2',
    name: 'Family Table',
    capacity: 4,
    price: 400,
    description: 'Great for families and small groups',
    available: true,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop'
  },
  {
    id: '3',
    name: 'Group Dining',
    capacity: 6,
    price: 600,
    description: 'Spacious table for larger gatherings',
    available: false,
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop'
  },
  {
    id: '4',
    name: 'VIP Booth',
    capacity: 8,
    price: 1000,
    description: 'Private booth with premium service',
    available: true,
    image: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=400&h=300&fit=crop'
  }
];

export const mockTimeSlots: TimeSlot[] = [
  { id: '1', time: '12:00 PM', available: true },
  { id: '2', time: '12:30 PM', available: false },
  { id: '3', time: '1:00 PM', available: true },
  { id: '4', time: '1:30 PM', available: true },
  { id: '5', time: '2:00 PM', available: false },
  { id: '6', time: '2:30 PM', available: true },
  { id: '7', time: '7:00 PM', available: true },
  { id: '8', time: '7:30 PM', available: true },
  { id: '9', time: '8:00 PM', available: false },
  { id: '10', time: '8:30 PM', available: true },
  { id: '11', time: '9:00 PM', available: true },
  { id: '12', time: '9:30 PM', available: true }
];

// Events mock data
export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Live Jazz Night',
    subtitle: 'Smooth jazz with dinner',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    date: '2024-01-20',
    time: '8:00 PM',
    venue: 'The Grand Hotel',
    price: 1500,
    description: 'Experience an evening of smooth jazz with our live band while enjoying a curated dinner menu.',
    category: 'Music',
    duration: '3 hours',
    organizer: 'The Grand Hotel',
    ticketTypes: [
      {
        id: '1',
        name: 'Standard',
        price: 1500,
        description: 'General seating with dinner',
        available: 50,
        features: ['Dinner included', 'General seating', 'Welcome drink']
      },
      {
        id: '2',
        name: 'Premium',
        price: 2500,
        description: 'Front row seating with premium menu',
        available: 20,
        features: ['Premium dinner', 'Front row seating', '2 welcome drinks', 'Meet & greet']
      },
      {
        id: '3',
        name: 'VIP',
        price: 4000,
        description: 'Private table with exclusive service',
        available: 5,
        features: ['Private table', 'Exclusive menu', 'Unlimited drinks', 'Personal service', 'Artist interaction']
      }
    ]
  },
  {
    id: '2',
    title: 'Wine Tasting Evening',
    subtitle: 'Premium wines from around the world',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    date: '2024-01-22',
    time: '6:30 PM',
    venue: 'Vineyard Restaurant',
    price: 2000,
    description: 'Join us for an exclusive wine tasting featuring premium wines paired with gourmet appetizers.',
    category: 'Food & Drink',
    duration: '2.5 hours',
    organizer: 'Vineyard Restaurant',
    ticketTypes: [
      {
        id: '1',
        name: 'Regular',
        price: 2000,
        description: 'Wine tasting with appetizers',
        available: 30,
        features: ['5 wine samples', 'Gourmet appetizers', 'Tasting notes']
      },
      {
        id: '2',
        name: 'Connoisseur',
        price: 3500,
        description: 'Extended tasting with rare wines',
        available: 15,
        features: ['8 wine samples', 'Premium appetizers', 'Sommelier guidance', 'Take-home bottle']
      }
    ]
  },
  {
    id: '3',
    title: 'New Year Gala Dinner',
    subtitle: 'Celebrate in style',
    image: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400&h=300&fit=crop',
    date: '2024-12-31',
    time: '9:00 PM',
    venue: 'Grand Ballroom',
    price: 5000,
    description: 'Ring in the new year with an elegant gala dinner featuring live entertainment and fireworks.',
    category: 'Celebration',
    duration: '5 hours',
    organizer: 'Grand Ballroom',
    ticketTypes: [
      {
        id: '1',
        name: 'Standard',
        price: 5000,
        description: 'Gala dinner with entertainment',
        available: 100,
        features: ['5-course dinner', 'Live entertainment', 'Midnight toast', 'Party favors']
      },
      {
        id: '2',
        name: 'Premium',
        price: 8000,
        description: 'Premium seating with champagne',
        available: 50,
        features: ['Premium seating', '7-course dinner', 'Champagne service', 'VIP area access']
      }
    ]
  },{
    id: '4',
    title: 'Live Music Night',
    subtitle: 'Live music with dinner',
    image: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400&h=300&fit=crop',
    date: '2024-01-20',
    time: '8:00 PM',
    venue: 'The Grand Hotel',
    price: 5000,
    description: 'Experience an evening of smooth jazz with our live band while enjoying a curated dinner menu.',
    category: 'Music',
    duration: '3 hours',
    organizer: 'The Grand Hotel',
    ticketTypes: [
      {
        id: '1',
        name: 'Standard',
        price: 5000,
        description: 'Gala dinner with entertainment',
        available: 100,
        features: ['5-course dinner', 'Live entertainment', 'Midnight toast', 'Party favors']
      },
      {
        id: '2',
        name: 'Premium',
        price: 8000,
        description: 'Premium seating with champagne',
        available: 50,
        features: ['Premium seating', '7-course dinner', 'Champagne service', 'VIP area access']
      }, {
        id: '3',
        name: 'Early Bird',
        price: 499,
        description: 'Early bird dinner with entertainment',
        available: 50,
        features: ['Premium seating', '7-course dinner', 'Champagne service', 'VIP area access']
      }
    ]
  }
];

// Menu Images Interface
export interface MenuImage {
  id: string;
  title: string;
  category: string;
  image: string;
}

// Menu Images Data
export const mockMenuImages: MenuImage[] = [
  {
    id: '1',
    title: 'Food Menu',
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop'
  },
  {
    id: '2', 
    title: 'Drinks Menu',
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop'
  },
  {
    id: '3',
    title: 'Buffet Menu',
    category: 'Buffet Special',
    image: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800&h=600&fit=crop'
  },
  {
    id: '4',
    title: 'Dessert Menu',
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&h=600&fit=crop'
  },
  {
    id: '5',
    title: 'Breakfast Menu',
    category: 'Breakfast',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop'
  },
  {
    id: '6',
    title: 'Kids Menu',
    category: 'Kids Special',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop'
  }
];