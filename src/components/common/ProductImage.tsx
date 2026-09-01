import type { CSSProperties } from 'react';
import { IMAGE_BASE_PATH } from '@/constants';

interface ProductImageProps {
  fileName: string;
  alt: string;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

/** Absolute URLs (real tour images) render as-is; bare filenames (legacy mock images) get IMAGE_BASE_PATH prefixed. */
function resolveSrc(fileName: string): string {
  return /^(https?:)?\/\//.test(fileName) || fileName.startsWith('data:') ? fileName : `${IMAGE_BASE_PATH}${fileName}`;
}

export function ProductImage({ fileName, alt, style, className, onClick }: ProductImageProps) {
  return <img src={resolveSrc(fileName)} alt={alt} style={style} className={className} onClick={onClick} />;
}
