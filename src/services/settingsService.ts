// Calls the real Node.js backend directly — see adminUserService.ts for why this bypasses the
// mock facade convention. The public Contact page and the admin Website Settings page both need
// this to be live: hardcoding this content in React is exactly what this feature replaces.
import { httpClient } from './httpClient';
import type { ContactSettings, SocialLink, SocialPlatform, UpdateContactSettingsInput } from '@/types/settings';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function getContactSettings(): Promise<ContactSettings | null> {
  const res = await httpClient.get<ApiEnvelope<ContactSettings | null>>('/settings/contact');
  return res.data;
}

export async function updateContactSettings(input: UpdateContactSettingsInput): Promise<ContactSettings | null> {
  const res = await httpClient.put<ApiEnvelope<ContactSettings | null>>('/settings/contact', input);
  return res.data;
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  const res = await httpClient.get<ApiEnvelope<SocialLink[]>>('/settings/social-media');
  return res.data;
}

/**
 * Upserts a platform's link: updates it if a row already exists for that platform, otherwise
 * creates it. The admin Settings page only ever works from `getSocialLinks()`'s current list, not
 * a pre-known id, so this hides the create-vs-update distinction from the caller.
 */
export async function saveSocialLink(
  existingLinks: SocialLink[],
  platform: SocialPlatform,
  input: { url: string; enabled: boolean },
): Promise<SocialLink> {
  const current = existingLinks.find((link) => link.platform === platform);
  if (current) {
    const res = await httpClient.put<ApiEnvelope<SocialLink>>(`/settings/social-media/${current.id}`, input);
    return res.data;
  }
  const res = await httpClient.post<ApiEnvelope<SocialLink>>('/settings/social-media', { platform, ...input });
  return res.data;
}
