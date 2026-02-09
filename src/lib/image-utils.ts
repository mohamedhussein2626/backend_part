import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const TEMP_DIR = path.join(process.cwd(), 'temp');
const OUTPUT_DIR = path.join(process.cwd(), 'output');

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

// Compress image
export async function compressImage(
  inputBuffer: Buffer,
  quality: number = 80
): Promise<Buffer> {
  await ensureDirectories();
  
  // Get image metadata to determine format
  const metadata = await sharp(inputBuffer).metadata();
  const format = metadata.format;
  
  // Compress based on format
  if (format === 'jpeg' || format === 'jpg') {
    return await sharp(inputBuffer)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  } else if (format === 'png') {
    return await sharp(inputBuffer)
      .png({ quality: Math.floor(quality * 0.9), compressionLevel: 9 })
      .toBuffer();
  } else if (format === 'webp') {
    return await sharp(inputBuffer)
      .webp({ quality })
      .toBuffer();
  } else {
    // For other formats, convert to JPEG
    return await sharp(inputBuffer)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }
}

// Resize image
export async function resizeImage(
  inputBuffer: Buffer,
  width?: number,
  height?: number,
  maintainAspectRatio: boolean = true
): Promise<Buffer> {
  await ensureDirectories();
  
  if (!width && !height) {
    throw new Error('Width or height must be specified');
  }
  
  const sharpInstance = sharp(inputBuffer);
  const imageMetadata = await sharpInstance.metadata();
  
  const options: any = {};
  
  if (width && height) {
    if (maintainAspectRatio) {
      // Calculate dimensions maintaining aspect ratio
      const aspectRatio = (imageMetadata.width || 1) / (imageMetadata.height || 1);
      if (width / height > aspectRatio) {
        // Height is the limiting factor
        options.width = Math.round(height * aspectRatio);
        options.height = height;
      } else {
        // Width is the limiting factor
        options.width = width;
        options.height = Math.round(width / aspectRatio);
      }
      options.fit = 'inside';
    } else {
      options.width = width;
      options.height = height;
      options.fit = 'fill';
    }
  } else if (width) {
    options.width = width;
    if (maintainAspectRatio && imageMetadata.height) {
      const aspectRatio = (imageMetadata.width || 1) / (imageMetadata.height || 1);
      options.height = Math.round(width / aspectRatio);
    }
  } else if (height) {
    options.height = height;
    if (maintainAspectRatio && imageMetadata.width) {
      const aspectRatio = (imageMetadata.width || 1) / (imageMetadata.height || 1);
      options.width = Math.round(height * aspectRatio);
    }
  }
  
  // Ensure we have valid dimensions
  if (!options.width || !options.height) {
    throw new Error('Invalid resize dimensions');
  }
  
  // Get original format from metadata
  const imageFormat = imageMetadata.format;
  
  // Resize with proper options
  const resizeOptions: any = {
    width: options.width,
    height: options.height,
    fit: maintainAspectRatio ? 'inside' : 'fill',
    withoutEnlargement: false
  };
  
  // Resize and maintain format (reuse sharpInstance)
  const resizedInstance = sharpInstance.resize(resizeOptions);
  
  // Maintain original format if possible, otherwise convert to JPEG
  if (imageFormat === 'png') {
    return await resizedInstance.png({ quality: 90, compressionLevel: 9 }).toBuffer();
  } else if (imageFormat === 'webp') {
    return await resizedInstance.webp({ quality: 90 }).toBuffer();
  } else {
    return await resizedInstance.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  }
}

// Crop image
export async function cropImage(
  inputBuffer: Buffer,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Buffer> {
  await ensureDirectories();
  return await sharp(inputBuffer)
    .extract({ left: x, top: y, width, height })
    .toBuffer();
}

// Convert image to different format
export async function convertImageFormat(
  inputBuffer: Buffer,
  format: 'jpeg' | 'png' | 'webp' | 'gif'
): Promise<Buffer> {
  await ensureDirectories();
  return await sharp(inputBuffer).toFormat(format).toBuffer();
}

// Get image metadata
export async function getImageMetadata(inputBuffer: Buffer) {
  const metadata = await sharp(inputBuffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: inputBuffer.length,
  };
}

// Clean up temporary files
export async function cleanupFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File might not exist, ignore error
  }
}

