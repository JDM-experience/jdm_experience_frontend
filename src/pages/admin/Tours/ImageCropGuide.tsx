import { useState, type SyntheticEvent } from 'react';
import { Typography } from 'antd';

interface ImageCropGuideProps {
  src: string;
  alt: string;
  /** Target width/height aspect ratio the image is displayed at elsewhere on the site (e.g. 1.4
   *  for the Tours grid card, ~2.6 for the Featured Tours hero on desktop) -- object-fit: cover
   *  crops to exactly this shape, centered, wherever the image is actually shown. */
  ratio: number;
  label: string;
  description: string;
}

/**
 * Shows the full uploaded image with a dimmed mask everywhere EXCEPT the region that will
 * actually be visible once the site crops it to `ratio` (object-fit: cover always crops from the
 * center, matching the browser default used everywhere ProductImage is rendered) -- so an admin
 * can tell, before saving, whether the important part of a photo (e.g. a person's face) will be
 * cut off, without needing an actual cropping tool.
 */
export function ImageCropGuide({ src, alt, ratio, label, description }: ImageCropGuideProps) {
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  function handleLoad(e: SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    if (imgRatio > ratio) {
      // Source is wider than the target shape -- cover crops the left/right edges, full height visible.
      const width = (ratio / imgRatio) * 100;
      setBox({ left: (100 - width) / 2, top: 0, width, height: 100 });
    } else {
      // Source is taller/narrower than the target shape -- cover crops the top/bottom, full width visible.
      const height = (imgRatio / ratio) * 100;
      setBox({ left: 0, top: (100 - height) / 2, width: 100, height });
    }
  }

  return (
    <div>
      <Typography.Text strong style={{ display: 'block', marginBottom: 2 }}>
        {label}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
        {description}
      </Typography.Text>
      <div style={{ position: 'relative', width: '100%', lineHeight: 0, borderRadius: 6, overflow: 'hidden' }}>
        <img src={src} alt={alt} onLoad={handleLoad} style={{ width: '100%', display: 'block' }} />
        {box && (
          <div
            style={{
              position: 'absolute',
              left: `${box.left}%`,
              top: `${box.top}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
              // The huge spread dims everything OUTSIDE this box, leaving the box itself as the
              // only "see-through" (undimmed) region -- exactly what will be visible on the site.
              boxShadow: '0 0 0 9999px rgba(15,17,23,0.7)',
              outline: '2px dashed #E03D36',
              outlineOffset: -2,
            }}
          />
        )}
      </div>
    </div>
  );
}
