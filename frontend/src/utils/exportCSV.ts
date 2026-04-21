import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { UserSession } from '../types/profile';

const CSV_HEADER = 'Date,Session Name,Players,Buy-In,Rebuys,Cash Out,Net Result';

function toCSVDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateSessionCSV(
  sessions: UserSession[],
  username: string
): { csv: string; filename: string } {
  const rows = sessions.map((s) =>
    [
      toCSVDate(s.date),
      s.sessionCode,
      s.playerCount,
      (s.buyIn ?? 0).toFixed(2),
      (s.rebuys ?? 0).toFixed(2),
      (s.cashOut ?? 0).toFixed(2),
      (s.net ?? 0).toFixed(2),
    ].join(',')
  );

  const csv = [CSV_HEADER, ...rows].join('\n');
  const filename = `pokercircle_history_${username}_${todayDate()}.csv`;

  return { csv, filename };
}

export async function exportSessionsToCSV(
  sessions: UserSession[],
  username: string
): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  const { csv, filename } = generateSessionCSV(sessions, username);
  const fileUri = (FileSystem.cacheDirectory ?? '') + filename;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: 'utf8',
  });

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Export Session History',
  });
}
