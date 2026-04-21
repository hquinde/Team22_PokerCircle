import Expo from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(
  token: string | null | undefined,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  if (!token || !Expo.isExpoPushToken(token)) return;

  const [ticket] = await expo.sendPushNotificationsAsync([
    { to: token, title, body, data, sound: 'default' },
  ]);

  if (ticket && 'details' in ticket && ticket.details?.error === 'DeviceNotRegistered') {
    console.warn(`[push] DeviceNotRegistered for token ${token}`);
  }
}
