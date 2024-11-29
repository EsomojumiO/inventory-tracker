import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

class NotificationService {
  constructor() {
    this.lastNotificationId = 0;
  }

  async initialize() {
    await this.requestUserPermission();
    this.createDefaultChannels();
    this.setupMessageHandlers();
  }

  async requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      const token = await this.getFCMToken();
      await this.registerDeviceToken(token);
    }
  }

  createDefaultChannels() {
    PushNotification.createChannel(
      {
        channelId: 'inventory-alerts',
        channelName: 'Inventory Alerts',
        channelDescription: 'Notifications for inventory alerts',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Channel 'inventory-alerts' created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: 'orders',
        channelName: 'Orders',
        channelDescription: 'Notifications for orders',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Channel 'orders' created: ${created}`)
    );
  }

  setupMessageHandlers() {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background Message:', remoteMessage);
      this.handleNotification(remoteMessage);
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground Message:', remoteMessage);
      this.handleNotification(remoteMessage);
    });

    // Handle notification open
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      // Handle navigation based on notification type
      this.handleNotificationOpen(remoteMessage);
    });
  }

  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      await AsyncStorage.setItem('fcmToken', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async registerDeviceToken(token) {
    try {
      await axios.post(`${API_URL}/notifications/register-device`, {
        token,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Error registering device token:', error);
    }
  }

  handleNotification(remoteMessage) {
    const { notification, data } = remoteMessage;
    const channelId = data?.type === 'order' ? 'orders' : 'inventory-alerts';

    PushNotification.localNotification({
      channelId,
      title: notification.title,
      message: notification.body,
      data: data,
      smallIcon: 'ic_notification',
      largeIcon: '',
      priority: 'high',
      vibrate: true,
      playSound: true,
      id: ++this.lastNotificationId,
    });
  }

  handleNotificationOpen(remoteMessage) {
    const { data } = remoteMessage;
    // Navigation logic based on notification type
    switch (data?.type) {
      case 'low_stock':
        // Navigate to inventory screen
        break;
      case 'order':
        // Navigate to order details screen
        break;
      case 'supplier':
        // Navigate to supplier screen
        break;
      default:
        // Default navigation
        break;
    }
  }

  // Method to subscribe to specific topics
  async subscribeToTopic(topic) {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  // Method to unsubscribe from specific topics
  async unsubscribeFromTopic(topic) {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }

  // Method to handle custom notifications
  async sendCustomNotification(title, message, data = {}) {
    PushNotification.localNotification({
      channelId: 'inventory-alerts',
      title,
      message,
      data,
      priority: 'high',
      vibrate: true,
      playSound: true,
      id: ++this.lastNotificationId,
    });
  }
}

export default new NotificationService();
