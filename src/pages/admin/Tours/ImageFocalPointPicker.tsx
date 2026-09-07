import type { MouseEvent } from 'react';
import { Typography } from 'antd';

interface ImageFocalPointPickerProps {
  src: string;
  alt: string;
  focalX: number;
  focalY: number;
  onChange: (focalX: number, focalY: number) => void;
}

/**
 * Click anywhere on the full image to move the focal point (the red dot) -- this is the point
 * CSS `object-position` will try to keep visible everywhere the image is cropped with
 * `object-fit: cover` on the live site (Tours grid, Featured Tours hero, Tour Detail, etc), so
 * e.g. clicking on a car keeps it centered even in a very wide/narrow crop.
 */
export function ImageFocalPointPicker({ src, alt, focalX, focalY, onChange }: ImageFocalPointPickerProps) {
  function handleClick(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onChange(Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y)));
  }

  return (
    <div>
      <Typography.Text strong style={{ display: 'block', marginBottom: 2 }}>
        Click the part of the photo to keep centered
      </Typography.Text>
      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
        e.g. click on the car. The previews below update live to show what stays visible at each crop shape.
      </Typography.Text>
      <div
        onClick={handleClick}
        style={{
          position: 'relative',
          width: '100%',
          lineHeight: 0,
          borderRadius: 6,
          overflow: 'hidden',
          cursor: 'crosshair',
        }}
      >
        <img src={src} alt={alt} draggable={false} style={{ width: '100%', display: 'block', userSelect: 'none' }} />
        <div
          style={{
            position: 'absolute',
            left: `${focalX}%`,
            top: `${focalY}%`,
            width: 22,
            height: 22,
            marginLeft: -11,
            marginTop: -11,
            borderRadius: '50%',
            background: 'rgba(224,61,54,0.85)',
            border: '2px solid #fff',
            boxShadow: '0 1px 6px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
