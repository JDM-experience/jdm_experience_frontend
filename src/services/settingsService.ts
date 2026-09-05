// Calls the real Node.js backend directly — see adminUserService.ts for why this bypasses the
// mock facade convention. The public Contact page and the admin Website Settings page both need
// this to be live: hardcoding this content in React is exactly what this feature replaces.
import { httpClient } from './httpClient';
import type { ApiEnvelope } from '@/types/api';
import type {
  AboutContent,
  ContactSettings,
  PolicyPage,
  PolicyType,
  SocialLink,
  SocialPlatform,
  UpdateAboutContentInput,
  UpdateContactSettingsInput,
  UpdatePolicyInput,
} from '@/types/settings';

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

export async function removeSocialLink(id: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/settings/social-media/${id}`);
}

export async function getAboutContent(): Promise<AboutContent | null> {
  const res = await httpClient.get<ApiEnvelope<AboutContent | null>>('/settings/about');
  return res.data;
}

export async function updateAboutContent(input: UpdateAboutContentInput): Promise<AboutContent | null> {
  const res = await httpClient.put<ApiEnvelope<AboutContent | null>>('/settings/about', input);
  return res.data;
}

/** Public: only policy types with actual content configured. */
export async function getPolicies(): Promise<PolicyPage[]> {
  const res = await httpClient.get<ApiEnvelope<PolicyPage[]>>('/settings/policies');
  return res.data;
}

/** Staff-only: one policy type for the editor, even if it has no content yet. */
export async function getPolicyForAdmin(type: PolicyType): Promise<PolicyPage> {
  const res = await httpClient.get<ApiEnvelope<PolicyPage>>(`/settings/policies/${type}/admin`);
  return res.data;
}

export async function updatePolicy(type: PolicyType, input: UpdatePolicyInput): Promise<PolicyPage> {
  const res = await httpClient.put<ApiEnvelope<PolicyPage>>(`/settings/policies/${type}`, input);
  return res.data;
}
