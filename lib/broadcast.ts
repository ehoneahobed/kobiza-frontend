import { apiFetch } from './api';

export async function getRecipientCount(communityId: string): Promise<{ count: number }> {
  return apiFetch(`/broadcast/${communityId}/recipients`);
}

export async function sendBroadcast(
  communityId: string,
  subject: string,
  body: string,
): Promise<{ sent: number }> {
  return apiFetch(`/broadcast/${communityId}/send`, {
    method: 'POST',
    body: JSON.stringify({ subject, body }),
  });
}
