import { useState, type SyntheticEvent } from 'react';
import { Typography } from 'antd';

interface ImageCropGuideProps {
  src: string;
  alt: string;
  /** Target width/height aspect ratio the image is displayed at elsewhere on the site (e.g. 1.4
   *  for the Tours grid card, ~2.6 for the Featured Tours hero on desktop) -- object-fit: cover
   *  crops to this shape wherever the image is actually shown. */
  ratio: number;
  label: string;
  description: string;
  /** Focal point (0-100% of image width/height) fed to CSS `object-position` on the live site --
   *  defaults to centered (50/50), matching the browser's own object-fit: cover default. */
  focalX?: number;
  focalY?: number;
}

/**
 * Shows the full uploaded image with a dimmed mask everywhere EXCEPT the region that will
 * actually be visible once the site crops it to `ratio` at the given focal point (mirrors exactly
 * how CSS `object-fit: cover` + `object-position` computes the visible crop window) -- so an
 * admin can tell, before saving, whether the important part of a photo (e.g. a car) will be cut
 * off.
 */
export function ImageCropGuide({ src, alt, ratio, label, description, focalX = 50, focalY = 50 }: ImageCropGuideProps) {
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);

  function handleLoad(e: SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    setNatural({ width: img.naturalWidth, height: img.naturalHeight });
  }

  let box: { left: number; top: number; width: number; height: number } | null = null;
  if (natural) {
    const imgRatio = natural.width / natural.height;
    // Same two cases as object-fit: cover -- crop window is full-height (source wider than target)
    // or full-width (source narrower), sized in percent of the whole image.
    const width = imgRatio > ratio ? (ratio / imgRatio) * 100 : 100;
    const height = imgRatio > ratio ? 100 : (imgRatio / ratio) * 100;
    // Mirrors CSS object-position's own formula: the crop window's offset is `focal%` of the
    // leftover (100 - windowSize)% slack -- at focal=50 this reduces to the old centered formula.
    box = {
      left: (focalX / 100) * (100 - width),
      top: (focalY / 100) * (100 - height),
      width,
      height,
    };
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
