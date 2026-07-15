'use server';

import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGES = 3;
const CLOUDINARY_FOLDER = 'family-directory';

cloudinary.config({
  cloud_name: process.env.ADMIN_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.ADMIN_CLOUDINARY_API_KEY,
  api_secret: process.env.ADMIN_CLOUDINARY_API_SECRET,
});

function extractPublicId(cloudinaryUrl: string): string | null {
  const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)$/);
  if (!match) return null;
  let publicId = match[1];
  if (publicId.endsWith('.png') || publicId.endsWith('.jpg') || publicId.endsWith('.jpeg') || publicId.endsWith('.webp')) {
    publicId = publicId.substring(0, publicId.lastIndexOf('.'));
  }
  return publicId;
}

function generatePhotoFilename(familyCode: string, existingPhotos: string[]): string {
  const baseName = familyCode;
  const existingFilenames = new Set(
    existingPhotos
      .map(url => {
        const match = url.match(/\/([^/]+)$/);
        if (!match) return null;
        const name = match[1];
        return name.replace(/\.[^.]+$/, '');
      })
      .filter(Boolean)
  );

  if (!existingFilenames.has(baseName)) {
    return `${baseName}.png`;
  }

  let counter = 1;
  while (existingFilenames.has(`${baseName}-${counter}`)) {
    counter++;
  }
  return `${baseName}-${counter}.png`;
}

export async function uploadImage(
  familyCode: string,
  file: File,
  existingPhotos: string[]
): Promise<{ url: string; filename: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.');
  }

  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  if (existingPhotos.length >= MAX_IMAGES) {
    throw new Error(`Maximum ${MAX_IMAGES} photos allowed.`);
  }

  const filename = generatePhotoFilename(familyCode, existingPhotos);
  const publicId = `${CLOUDINARY_FOLDER}/${filename.replace(/\.[^.]+$/, '')}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const processed = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const dataUri = `data:image/jpeg;base64,${processed.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    public_id: publicId,
    overwrite: false,
    resource_type: 'image',
  });

  return { url: result.secure_url, filename };
}

export async function deleteImage(cloudinaryUrl: string): Promise<void> {
  const publicId = extractPublicId(cloudinaryUrl);
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch {
    // Image might not exist or already deleted
  }
}

export async function deleteFamilyImages(photos: string[]): Promise<void> {
  for (const photoUrl of photos) {
    await deleteImage(photoUrl);
  }
}

export async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, and WebP files are allowed.' };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size must be under 5MB.' };
  }
  return { valid: true };
}
