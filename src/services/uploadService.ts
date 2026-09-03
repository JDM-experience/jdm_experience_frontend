// Direct-to-Supabase image uploads. The backend (POST /uploads/tour-images) only issues a
// one-time signed URL; the file bytes go straight from the browser to Supabase Storage and
// never through the API. The returned `publicUrl` is a CDN URL — pass it to createTour({ images })
// or addTourImage({ imageUrl }).
import { httpClient } from './httpClient';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** Matches the bucket's file_size_limit. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface SignedUpload {
  path: string;
  signedUrl: string;
  token: string;
  publicUrl: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

function isAllowedType(type: string): type is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

/** Shared by every image-upload use case (tour images, payment method images, payment proofs) --
 *  only the signing endpoint differs; the actual browser->Supabase PUT is identical. */
async function uploadImage(file: File, signEndpoint: string): Promise<string> {
  if (!isAllowedType(file.type)) {
    throw new Error('Unsupported image type. Use JPEG, PNG, WebP, or AVIF.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large (max 5 MB).');
  }

  const res = await httpClient.post<ApiEnvelope<SignedUpload>>(signEndpoint, {
    fileName: file.name,
    contentType: file.type,
  });
  const { signedUrl, publicUrl } = res.data;

  const upload = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type, 'x-upsert': 'true' },
    body: file,
  });
  if (!upload.ok) {
    throw new Error(`Upload failed (${upload.status}). Please try again.`);
  }

  return publicUrl;
}

/**
 * Uploads one image file to Supabase Storage and resolves to its permanent CDN URL.
 * Throws an Error with a user-friendly message on a rejected type/size or a failed upload.
 */
export async function uploadTourImage(file: File): Promise<string> {
  return uploadImage(file, '/uploads/tour-images');
}

/** SUPER_ADMIN only (enforced server-side) -- for the admin Payment Methods page. */
export async function uploadPaymentMethodImage(file: File): Promise<string> {
  return uploadImage(file, '/uploads/payment-method-images');
}

/** Any authenticated user -- for a customer's payment-proof screenshot/photo at checkout. */
export async function uploadPaymentProofImage(file: File): Promise<string> {
  return uploadImage(file, '/uploads/payment-proofs');
}
