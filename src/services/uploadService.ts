// Calls the real Node.js backend directly — see adminUserService.ts for why this bypasses the
// mock facade convention. Uploads a raw file (not JSON), so this goes through
// httpClient.upload() rather than .post().
import { httpClient } from './httpClient';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

/** Uploads an image file, returns its public URL. Pass that straight into
 *  tourService.addTourImage() to attach it to a tour. */
export async function uploadTourImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await httpClient.upload<ApiEnvelope<{ url: string }>>('/uploads/tour-image', formData);
  return res.data.url;
}
