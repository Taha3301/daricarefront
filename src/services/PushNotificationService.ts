import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { API_BASE_URL } from '../config/api';
import { storage } from '../utils/storage';

export class PushNotificationService {
  static async init() {
    if (Capacitor.getPlatform() !== 'web') {
      await this.createChannel();
      await this.registerPush();
    }
  }

  private static async createChannel() {
    if (Capacitor.getPlatform() === 'android') {
      await PushNotifications.createChannel({
        id: 'default',
        name: 'Default',
        description: 'Default notification channel',
        importance: 5, // High/Max importance
        visibility: 1,
        vibration: true,
      });
    }
  }

  private static async registerPush() {
    // Check permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('User denied permissions!');
    }

    // Add listeners before registration to avoid missing the first token
    PushNotifications.addListener('registration', (token) => {
      console.log('[PushService] Registration success, token: ' + token.value);
      storage.setItem('fcm_token', token.value);
      this.saveTokenToBackend(token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('[PushService] Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PushService] Push received: ' + JSON.stringify(notification));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('[PushService] Push action performed: ' + JSON.stringify(notification));
    });

    // Register with Apple / Google to receive tokens
    try {
      console.log('[PushService] Calling PushNotifications.register()...');
      await PushNotifications.register();
    } catch (err) {
      console.error('[PushService] Registration FAILED:', err);
    }
  }

  static async register() {
    if (Capacitor.getPlatform() !== 'web') {
      await PushNotifications.register();
    }
  }

  static async saveTokenToBackend(token?: string) {
    const fcmToken = token || storage.getItem('fcm_token');
    const accessToken = storage.getItem('access_token');
    
    console.log('[PushService] saveTokenToBackend attempt:', { 
      hasToken: !!fcmToken, 
      hasAccess: !!accessToken 
    });

    if (!fcmToken || !accessToken) {
      console.warn('[PushService] Cannot sync token: fcmToken or accessToken missing', {
        fcmToken: !!fcmToken,
        accessToken: !!accessToken
      });
      return;
    }

    try {
      console.log('[PushService] Patching /auth/fcm-token...');
      const response = await fetch(`${API_BASE_URL}/auth/fcm-token`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ token: fcmToken })
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errText}`);
      }

      console.log('[PushService] FCM Token synced with backend SUCCESSFULLY');
    } catch (error) {
      console.error('[PushService] FAILED to sync FCM token:', error);
    }
  }
}
