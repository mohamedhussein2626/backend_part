import { Elysia } from 'elysia';
import {
  resizeImage,
  cropImage,
  convertImageFormat,
  getImageMetadata,
} from '../lib/image-utils';
import { jpgToWord } from '../lib/pdf-utils';
import { authMiddleware } from '../lib/auth-middleware';
import { trackToolUsage } from '../lib/usage-tracker';

export const imageTools = new Elysia()
  .use(authMiddleware)
  
  // Resize Image
  .post('/resize', async ({ request, set, userId }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const width = formData.get('width') ? parseInt(formData.get('width') as string) : undefined;
      const height = formData.get('height') ? parseInt(formData.get('height') as string) : undefined;
      const maintainAspectRatio = formData.get('maintainAspectRatio') !== 'false';

      if (!file) {
        set.status = 400;
        return { success: false, message: 'No file provided' };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const resized = await resizeImage(buffer, width, height, maintainAspectRatio);

      // Track usage
      await trackToolUsage(userId, 'Resize Image', 'image', '/api/image/resize');

      return {
        success: true,
        message: 'Image resized successfully',
        file: resized.toString('base64'),
        metadata: await getImageMetadata(resized),
      };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message || 'Resize failed' };
    }
  })
  
  // Crop Image
  .post('/crop', async ({ request, set, userId }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const x = parseInt(formData.get('x') as string);
      const y = parseInt(formData.get('y') as string);
      const width = parseInt(formData.get('width') as string);
      const height = parseInt(formData.get('height') as string);

      if (!file) {
        set.status = 400;
        return { success: false, message: 'No file provided' };
      }

      if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
        set.status = 400;
        return { success: false, message: 'Invalid crop parameters' };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const cropped = await cropImage(buffer, x, y, width, height);

      // Track usage
      await trackToolUsage(userId, 'Crop Image', 'image', '/api/image/crop');

      return {
        success: true,
        message: 'Image cropped successfully',
        file: cropped.toString('base64'),
        metadata: await getImageMetadata(cropped),
      };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message || 'Crop failed' };
    }
  })
  
  // JPG to Word
  .post('/jpg-to-word', async ({ request, set, userId }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        set.status = 400;
        return { success: false, message: 'No file provided' };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const wordDoc = await jpgToWord(buffer);

      // Track usage
      await trackToolUsage(userId, 'JPG to Word', 'image', '/api/image/jpg-to-word');

      return {
        success: true,
        message: 'JPG converted to Word successfully',
        file: wordDoc.toString('base64'),
        filename: 'converted.docx',
      };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message || 'Conversion failed' };
    }
  })
  
  // Image Text Converter (OCR) - requires tesseract.js
  .post('/image-text-converter', async ({ request, set, userId }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        set.status = 400;
        return { success: false, message: 'No file provided' };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Use tesseract.js for OCR
      const { createWorker } = require('tesseract.js');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(buffer);
      await worker.terminate();

      // Track usage
      await trackToolUsage(userId, 'Image Text Converter', 'image', '/api/image/image-text-converter');

      return {
        success: true,
        message: 'Text extracted successfully',
        text,
      };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message || 'Text extraction failed' };
    }
  })
  
  // Word Counter (count words in image text)
  .post('/word-counter', async ({ request, set, userId }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        set.status = 400;
        return { success: false, message: 'No file provided' };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Extract text using OCR
      const { createWorker } = require('tesseract.js');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(buffer);
      await worker.terminate();

      // Count words
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      const characters = text.length;
      const charactersNoSpaces = text.replace(/\s/g, '').length;
      const paragraphs = text.split(/\n\n/).filter(p => p.trim().length > 0).length;

      // Track usage
      await trackToolUsage(userId, 'Word Counter', 'image', '/api/image/word-counter');

      return {
        success: true,
        message: 'Word count completed',
        wordCount: words.length,
        characterCount: characters,
        characterCountNoSpaces: charactersNoSpaces,
        paragraphCount: paragraphs,
        text,
      };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message || 'Word counting failed' };
    }
  });

