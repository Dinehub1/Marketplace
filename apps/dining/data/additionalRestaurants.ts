// Additional restaurants for extended selection
import { Restaurant } from './mockData';

export const additionalRestaurants: Restaurant[] = [
  // Indian Regional Specialties
  {
    id: '7', name: 'Mughal Darbar', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop',
    cuisine: 'Indian, Mughlai', rating: 4.4, distance: '2.3 km', deliveryTime: '30-35 mins',
    offers: ['25% OFF', 'Free Delivery'], priceRange: '₹500 for Two',
    description: 'Authentic Mughlai cuisine with royal flavors', location: 'Palasia', isOpen: true, category: 'indian'
  },
  {
    id: '8', name: 'South Indian Express', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&h=200&fit=crop',
    cuisine: 'South Indian', rating: 4.2, distance: '1.8 km', deliveryTime: '20-25 mins',
    offers: ['Free Delivery', 'Combo Deals'], priceRange: '₹200 for Two',
    description: 'Crispy dosas and authentic South Indian flavors', location: 'Rajwada', isOpen: true, category: 'indian'
  },
  {
    id: '9', name: 'Punjabi Tadka', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&h=200&fit=crop',
    cuisine: 'Punjabi, North Indian', rating: 4.3, distance: '1.9 km', deliveryTime: '25-30 mins',
    offers: ['20% OFF', 'Family Pack'], priceRange: '₹400 for Two',
    description: 'Rich Punjabi flavors with homestyle cooking', location: 'Vijay Nagar', isOpen: true, category: 'indian'
  },
  {
    id: '10', name: 'Hyderabadi Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=300&h=200&fit=crop',
    cuisine: 'Hyderabadi, Biryani', rating: 4.7, distance: '3.1 km', deliveryTime: '40-45 mins',
    offers: ['Family Pack 30% OFF'], priceRange: '₹600 for Two',
    description: 'Authentic Hyderabadi biryani with fragrant spices', location: 'New Palasia', isOpen: true, category: 'indian'
  },
  {
    id: '11', name: 'Pizza Corner', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=200&fit=crop',
    cuisine: 'Italian, Pizza', rating: 4.1, distance: '1.4 km', deliveryTime: '25-30 mins',
    offers: ['Buy 2 Get 1'], priceRange: '₹300 for Two',
    description: 'Crispy thin crust pizzas with fresh toppings', location: 'AB Road', isOpen: true, category: 'italian'
  },
  {
    id: '12', name: 'Pasta La Vista', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300&h=200&fit=crop',
    cuisine: 'Italian, Pasta', rating: 4.0, distance: '2.2 km', deliveryTime: '30-35 mins',
    offers: ['15% OFF'], priceRange: '₹450 for Two',
    description: 'Fresh pasta made with imported ingredients', location: 'Race Course Road', isOpen: true, category: 'italian'
  },
  {
    id: '13', name: 'Golden Dragon', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=200&fit=crop',
    cuisine: 'Chinese, Asian', rating: 4.2, distance: '1.6 km', deliveryTime: '25-30 mins',
    offers: ['20% OFF'], priceRange: '₹350 for Two',
    description: 'Authentic Chinese cuisine with traditional flavors', location: 'Treasure Island', isOpen: true, category: 'chinese'
  },
  {
    id: '14', name: 'Thai Basil', image: 'https://images.unsplash.com/photo-1559314809-0f31657def5e?w=300&h=200&fit=crop',
    cuisine: 'Thai, Asian', rating: 4.4, distance: '2.3 km', deliveryTime: '30-35 mins',
    offers: ['Authentic Thai'], priceRange: '₹450 for Two',
    description: 'Authentic Thai cuisine with traditional spices', location: 'TI Mall', isOpen: true, category: 'thai'
  },
  {
    id: '15', name: 'Sushi Zen', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300&h=200&fit=crop',
    cuisine: 'Japanese, Sushi', rating: 4.6, distance: '3.2 km', deliveryTime: '35-40 mins',
    offers: ['Premium Set 30% OFF'], priceRange: '₹800 for Two',
    description: 'Fresh sushi and authentic Japanese cuisine', location: 'C21 Mall', isOpen: true, category: 'japanese'
  },
  {
    id: '16', name: 'Quick Bites', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop',
    cuisine: 'Fast Food, Snacks', rating: 3.9, distance: '0.5 km', deliveryTime: '10-15 mins',
    offers: ['Super Fast Delivery'], priceRange: '₹150 for Two',
    description: 'Quick and tasty snacks for every craving', location: 'Geeta Bhawan', isOpen: true, category: 'fastfood'
  },
  {
    id: '17', name: 'Burger Palace', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=200&fit=crop',
    cuisine: 'American, Burgers', rating: 4.2, distance: '1.5 km', deliveryTime: '15-20 mins',
    offers: ['Free Fries'], priceRange: '₹250 for Two',
    description: 'Juicy burgers with crispy fries', location: 'Phoenix Citadel', isOpen: true, category: 'fastfood'
  },
  {
    id: '18', name: 'Coffee Corner', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&h=200&fit=crop',
    cuisine: 'Cafe, Coffee', rating: 4.3, distance: '0.8 km', deliveryTime: '10-15 mins',
    offers: ['Coffee & Snacks'], priceRange: '₹200 for Two',
    description: 'Cozy cafe with aromatic coffee and pastries', location: 'Sapna Sangeeta', isOpen: true, category: 'cafe'
  },
  {
    id: '19', name: 'Fresh Bakery', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=200&fit=crop',
    cuisine: 'Bakery, Desserts', rating: 4.1, distance: '1.1 km', deliveryTime: '15-20 mins',
    offers: ['Fresh Baked Daily'], priceRange: '₹180 for Two',
    description: 'Fresh baked goods and custom cakes', location: 'Bhawarkua', isOpen: true, category: 'bakery'
  },
  {
    id: '20', name: 'Sweet Dreams', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop',
    cuisine: 'Desserts, Sweets', rating: 4.6, distance: '1.5 km', deliveryTime: '20-25 mins',
    offers: ['Sweet Deals'], priceRange: '₹250 for Two',
    description: 'Traditional and modern desserts', location: 'Chappan Dukan', isOpen: true, category: 'desserts'
  },
  {
    id: '21', name: 'Ice Cream Parlour', image: 'https://images.unsplash.com/photo-1560008511-11c63416e52d?w=300&h=200&fit=crop',
    cuisine: 'Ice Cream, Desserts', rating: 4.3, distance: '1.2 km', deliveryTime: '15-20 mins',
    offers: ['Cool Treats'], priceRange: '₹150 for Two',
    description: 'Premium ice creams and sundaes', location: 'Chappan Dukan', isOpen: true, category: 'desserts'
  },
  {
    id: '22', name: 'Green Bowl', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop',
    cuisine: 'Healthy, Salads', rating: 4.4, distance: '1.9 km', deliveryTime: '25-30 mins',
    offers: ['Organic & Fresh'], priceRange: '₹350 for Two',
    description: 'Nutritious bowls and fresh salads', location: 'Scheme 54', isOpen: true, category: 'healthy'
  },
  {
    id: '23', name: 'Vegan Kitchen', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop',
    cuisine: 'Vegan, Healthy', rating: 4.4, distance: '2.0 km', deliveryTime: '25-30 mins',
    offers: ['Plant Based'], priceRange: '₹400 for Two',
    description: 'Pure vegan cuisine with plant-based options', location: 'Scheme 78', isOpen: true, category: 'vegan'
  },
  {
    id: '24', name: 'BBQ Nation', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop',
    cuisine: 'BBQ, Grill', rating: 4.6, distance: '2.9 km', deliveryTime: '35-40 mins',
    offers: ['Weekend Special'], priceRange: '₹700 for Two',
    description: 'Live grill experience with BBQ specialties', location: 'Treasure Island', isOpen: true, category: 'bbq'
  },
  {
    id: '25', name: 'Mediterranean Delights', image: 'https://images.unsplash.com/photo-1544510808-efac33203fcc?w=300&h=200&fit=crop',
    cuisine: 'Mediterranean, Healthy', rating: 4.3, distance: '2.6 km', deliveryTime: '30-35 mins',
    offers: ['Healthy Options'], priceRange: '₹500 for Two',
    description: 'Fresh Mediterranean cuisine with healthy options', location: 'Orbit Mall', isOpen: true, category: 'international'
  },
  {
    id: '26', name: 'Korean BBQ', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop',
    cuisine: 'Korean, BBQ', rating: 4.5, distance: '3.1 km', deliveryTime: '35-40 mins',
    offers: ['K-Food Special'], priceRange: '₹800 for Two',
    description: 'Authentic Korean BBQ with live grilling', location: 'C21 Mall', isOpen: true, category: 'korean'
  },
  {
    id: '27', name: 'Mumbai Street Food', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop',
    cuisine: 'Street Food, Chaat', rating: 4.3, distance: '1.4 km', deliveryTime: '20-25 mins',
    offers: ['Authentic Street'], priceRange: '₹120 for Two',
    description: 'Authentic Mumbai street food experience', location: 'Chappan Dukan', isOpen: true, category: 'streetfood'
  },
  {
    id: '28', name: 'Kolkata Rolls', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop',
    cuisine: 'Bengali, Rolls', rating: 4.4, distance: '1.7 km', deliveryTime: '20-25 mins',
    offers: ['Roll Combo'], priceRange: '₹200 for Two',
    description: 'Authentic Kolkata style kathi rolls', location: 'MG Road', isOpen: true, category: 'streetfood'
  },
  {
    id: '29', name: 'Bengali Flavors', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300&h=200&fit=crop',
    cuisine: 'Bengali, Fish', rating: 4.3, distance: '2.4 km', deliveryTime: '30-35 mins',
    offers: ['Traditional Taste'], priceRange: '₹400 for Two',
    description: 'Authentic Bengali cuisine with fish specialties', location: 'Bengali Square', isOpen: true, category: 'regional'
  },
  {
    id: '30', name: 'Desi Dhaba', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop',
    cuisine: 'Punjabi, Dhaba Style', rating: 4.2, distance: '2.1 km', deliveryTime: '25-30 mins',
    offers: ['Highway Style'], priceRange: '₹300 for Two',
    description: 'Authentic dhaba style Punjabi food', location: 'Ring Road', isOpen: true, category: 'punjabi'
  },
  {
    id: '31', name: 'Royal Palace Restaurant', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=200&fit=crop',
    cuisine: 'Multi-Cuisine, Fine Dining', rating: 4.7, distance: '3.5 km', deliveryTime: '45-50 mins',
    offers: ['Royal Experience'], priceRange: '₹1200 for Two',
    description: 'Luxury dining with exquisite ambiance', location: 'Brilliant Convention Centre', isOpen: true, category: 'finedining'
  },
  {
    id: '32', name: 'Taco Bell Express', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop',
    cuisine: 'Mexican, Fast Food', rating: 4.1, distance: '1.3 km', deliveryTime: '20-25 mins',
    offers: ['Fiesta Deals'], priceRange: '₹300 for Two',
    description: 'Mexican fast food with bold flavors', location: 'Phoenix Citadel', isOpen: true, category: 'mexican'
  },
  {
    id: '33', name: 'Biryani House', image: 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=300&h=200&fit=crop',
    cuisine: 'Biryani, Hyderabadi', rating: 4.6, distance: '2.5 km', deliveryTime: '35-40 mins',
    offers: ['Dum Special'], priceRange: '₹500 for Two',
    description: 'Authentic dum biryani with aromatic spices', location: 'Palasia', isOpen: true, category: 'biryani'
  },
  {
    id: '34', name: 'Night Owl Kitchen', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop',
    cuisine: 'Multi-Cuisine, Late Night', rating: 4.0, distance: '2.1 km', deliveryTime: '25-30 mins',
    offers: ['Open 24/7'], priceRange: '₹300 for Two',
    description: 'Late night dining with variety of cuisines', location: 'Vijay Nagar', isOpen: true, category: 'latenight'
  },
  {
    id: '35', name: 'Sandwich Factory', image: 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=300&h=200&fit=crop',
    cuisine: 'Sandwiches, Fast Food', rating: 4.0, distance: '0.9 km', deliveryTime: '15-20 mins',
    offers: ['Quick Bites'], priceRange: '₹180 for Two',
    description: 'Fresh sandwiches and quick meals', location: 'Corporate Office Area', isOpen: true, category: 'fastfood'
  },
];
