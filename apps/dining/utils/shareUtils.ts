import { Share } from 'react-native';

export interface EventShareData {
  title: string;
  subtitle: string;
  date: string;
  time: string;
  venue: string;
  price: number;
}

export const shareEvent = async (event: EventShareData) => {
  try {
    const shareMessage = `🎉 Check out this amazing event!\n\n🎵 ${event.title}\n📝 ${event.subtitle}\n📅 ${event.date}\n⏰ ${event.time}\n📍 ${event.venue}\n💰 Starting from ₹${event.price}\n\nBook your tickets now on DropBy!`;
    
    const result = await Share.share({
      message: shareMessage,
      title: `${event.title} - DropBy Event`,
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        console.log('Shared with activity type:', result.activityType);
      } else {
        console.log('Event shared successfully');
      }
    } else if (result.action === Share.dismissedAction) {
      console.log('Share dismissed');
    }
  } catch (error) {
    console.error('Error sharing event:', error);
  }
};
