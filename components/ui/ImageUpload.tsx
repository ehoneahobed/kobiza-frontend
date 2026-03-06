'use client';

import { useState, useRef, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from './Button';
import { getPresignedUrl, uploadToS3, UploadPurpose } from '@/lib/storage';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: number;
  maxSizeMB?: number;
  label?: string;
  purpose: UploadPurpose;
  shape?: 'round' | 'rect';
}

export function ImageUpload({
  value,
  onChange,
  aspectRatio,
  maxSizeMB = 5,
  label,
  purpose,
  shape = 'rect',
}: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
      setError('Please select a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be under ${maxSizeMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    if (fileRef.current) fileRef.current.value = '';
  };

  const getCroppedBlob = async (): Promise<Blob> => {
    if (!imageSrc || !croppedAreaPixels) throw new Error('No image to crop');

    const image = new Image();
    image.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
        'image/jpeg',
        0.9,
      );
    });
  };

  const handleCropConfirm = async () => {
    setUploading(true);
    setProgress(0);
    setError('');
    try {
      const blob = await getCroppedBlob();
      const { uploadUrl, publicUrl } = await getPresignedUrl(purpose, 'image/jpeg');
      await uploadToS3(uploadUrl, blob, 'image/jpeg', setProgress);
      onChange(publicUrl);
      setImageSrc(null);
    } catch (err: any) {
      setError(err.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleUrlPaste = () => {
    if (urlValue.trim()) {
      onChange(urlValue.trim());
      setUrlValue('');
      setShowUrlInput(false);
    }
  };

  const isRound = shape === 'round';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-[#1F2937]">{label}</label>
      )}

      {/* Preview / Dropzone */}
      {value ? (
        <div className="relative group">
          <div
            className={`overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6] ${
              isRound ? 'w-20 h-20 rounded-full' : 'w-full h-40 rounded-xl'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label ?? 'Uploaded image'}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium ${
              isRound ? 'rounded-full' : 'rounded-xl'
            }`}
          >
            Change
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed border-[#D1D5DB] hover:border-[#0D9488] transition-colors flex flex-col items-center justify-center gap-2 text-[#6B7280] hover:text-[#0D9488] ${
            isRound
              ? 'w-20 h-20 rounded-full'
              : 'w-full h-40 rounded-xl'
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          {!isRound && <span className="text-xs">Click to upload</span>}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* URL fallback */}
      {!showUrlInput ? (
        <button
          type="button"
          onClick={() => setShowUrlInput(true)}
          className="text-xs text-[#6B7280] hover:text-[#0D9488] self-start"
        >
          or paste URL
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://..."
            className="flex-1 rounded-lg border border-[#6B7280] px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlPaste())}
          />
          <button
            type="button"
            onClick={handleUrlPaste}
            className="text-xs text-[#0D9488] font-medium hover:underline"
          >
            Set
          </button>
          <button
            type="button"
            onClick={() => { setShowUrlInput(false); setUrlValue(''); }}
            className="text-xs text-[#6B7280] hover:text-[#1F2937]"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-[#EF4444]">{error}</p>
      )}

      {/* Crop Modal */}
      {imageSrc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-[#F3F4F6]">
              <h3 className="font-semibold text-[#1F2937]">Crop Image</h3>
              <p className="text-xs text-[#6B7280]">
                {aspectRatio
                  ? `Aspect ratio: ${aspectRatio === 1 ? '1:1 (square)' : aspectRatio >= 3 ? '3:1 (banner)' : '16:9 (widescreen)'}`
                  : 'Free crop'}
              </p>
            </div>

            <div className="relative w-full" style={{ height: 320 }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio || undefined}
                cropShape={isRound ? 'round' : 'rect'}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="px-4 py-2">
              <label className="text-xs text-[#6B7280]">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[#0D9488]"
              />
            </div>

            {uploading && (
              <div className="px-4 pb-2">
                <div className="w-full bg-[#F3F4F6] rounded-full h-2">
                  <div
                    className="bg-[#0D9488] h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-[#6B7280] mt-1">{progress}% uploaded</p>
              </div>
            )}

            {error && (
              <p className="text-xs text-[#EF4444] px-4 pb-2">{error}</p>
            )}

            <div className="flex gap-3 p-4 border-t border-[#F3F4F6]">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => { setImageSrc(null); setError(''); }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCropConfirm}
                loading={uploading}
              >
                Upload
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
