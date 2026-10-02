import { getCityContentAvailability, getContentSections, getTabsForCity } from './contentAvailability';

/**
 * Debug function to test content availability for different cities
 * Call this from the console to test the logic
 */
export async function debugContentAvailability(cityName: string) {
  console.log(`\n🔍 Testing content availability for: ${cityName}`);
  console.log('=' .repeat(50));
  
  try {
    // Get content availability
    const availability = await getCityContentAvailability(cityName);
    console.log('📊 Content Availability:', availability);
    
    // Get sections
    const sections = getContentSections(availability);
    console.log('📱 Content Sections:', sections);
    
    // Get tabs
    const tabs = getTabsForCity(availability);
    console.log('🔗 Available Tabs:', tabs);
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`City: ${availability.city}`);
    console.log(`Total Content: ${availability.totalContent}`);
    console.log(`Show Coming Soon: ${sections.showComingSoon}`);
    console.log(`Available Sections: ${sections.availableSections.join(', ') || 'None'}`);
    console.log(`Tab Count: ${tabs.length}`);
    
    return {
      availability,
      sections,
      tabs,
      shouldShowComingSoon: sections.showComingSoon
    };
  } catch (error) {
    console.error('❌ Error testing content availability:', error);
    return null;
  }
}

/**
 * Test multiple cities at once
 */
export async function testMultipleCities() {
  const cities = ['Indore', 'Mumbai', 'Bhopal', 'Delhi', 'Pune'];
  
  console.log('\n🌍 Testing Content Availability for Multiple Cities');
  console.log('=' .repeat(60));
  
  for (const city of cities) {
    await debugContentAvailability(city);
    console.log('\n' + '-'.repeat(50) + '\n');
  }
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).debugContentAvailability = debugContentAvailability;
  (window as any).testMultipleCities = testMultipleCities;
}
