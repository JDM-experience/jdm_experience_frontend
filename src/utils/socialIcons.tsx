import type { ReactNode } from 'react';
import { FacebookOutlined, InstagramOutlined, TikTokOutlined, TwitterOutlined, YoutubeOutlined } from '@ant-design/icons';
import type { SocialLink, SocialPlatform } from '@/types/settings';

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  TWITTER: 'X / Twitter',
  YOUTUBE: 'YouTube',
};

export const SOCIAL_ICONS: Record<SocialPlatform, ReactNode> = {
  FACEBOOK: <FacebookOutlined />,
  INSTAGRAM: <InstagramOutlined />,
  TIKTOK: <TikTokOutlined />,
  TWITTER: <TwitterOutlined />,
  YOUTUBE: <YoutubeOutlined />,
};

/** A link only counts as "configured" when it's enabled and has a real URL -- an unset/disabled
 *  platform must never render an icon, empty container, or dead "#" link on the public site. */
export function visibleSocialLinks(links: SocialLink[]): SocialLink[] {
  return links.filter((link) => link.enabled && link.url.trim().length > 0);
}
