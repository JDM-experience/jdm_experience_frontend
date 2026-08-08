import type { CSSProperties } from 'react';
import { IMAGE_BASE_PATH } from '@/constants';

interface ProductImageProps {
  fileName: string;
  alt: string;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function ProductImage({ fileName, alt, style, className, onClick }: ProductImageProps) {
  return <img src={`${IMAGE_BASE_PATH}${fileName}`} alt={alt} style={style} className={className} onClick={onClick} />;
}
