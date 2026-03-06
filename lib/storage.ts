import { apiFetch } from './api';

interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export type UploadPurpose =
  | 'avatar'
  | 'logo'
  | 'profile-cover'
  | 'course-cover'
  | 'download-cover'
  | 'post-image';

export async function getPresignedUrl(
  purpose: UploadPurpose,
  contentType: string,
): Promise<PresignedUrlResponse> {
  return apiFetch<PresignedUrlResponse>('/storage/presigned-url', {
    method: 'POST',
    body: JSON.stringify({ purpose, contentType }),
  });
}

export function uploadToS3(
  uploadUrl: string,
  blob: Blob,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    xhr.send(blob);
  });
}
