const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function isExpoPushToken(token: string): boolean {
  return /^ExponentPushToken\[.+\]$/.test(token);
}

export async function sendPushNotification(
  token: string | null | undefined,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  if (!token || !isExpoPushToken(token)) return;

  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify([{ to: token, title, body, data, sound: 'default' }]),
    });
  } catch (err) {
    console.warn('[push] Failed to send push notification', err);
  }
}
