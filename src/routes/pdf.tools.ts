import { Elysia } from 'elysia';
import {
  pdfToWord,
  getPdfMetadata,
  wordToPdf,
  pdfToJpg,
} from '../lib/pdf-utils';
import { authMiddleware } from '../lib/auth-middleware';
import { trackToolUsage } from '../lib/usage-tracker';

export const pdfTools = new Elysia()
  .use(authMiddleware)
  // PDF to JPG
  .post('/pdf-to-jpg', async ({ request, set, userId }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const pageNumberStr = formData.get('pageNumber') as string | null;
      let pageNumber: number | undefined = undefined;
      if (pageNumberStr && pageNumberStr.trim() !== '') {
        const parsed = parseInt(pageNumberStr, 10);
        if (!isNaN(parsed) && parsed > 0) {
          pageNumber = parsed;
        }
      }

      if (!file) {
        set.status = 400;
        return { success: false, message: 'No file provided' };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const images = await pdfToJpg(buffer, pageNumber);
      
      // Track usage
      if (userId) {
        await trackToolUsage(userId, 'PDF to JPG', 'pdf', '/api/pdf/pdf-to-jpg');
      }

      // Convert images to base64
      const imageData = images.map((img, idx) => ({
        file: img.toString('base64'),
        fileType: 'image/jpeg',
        filename: `page-${pageNumber || idx + 1}.jpg`,
        pageNumber: pageNumber || idx + 1
      }));

      // Return single file with all metadata, or multiple files
      if (imageData.length === 1) {
        return {
          success: true,
          message: `Converted ${images.length} page${images.length !== 1 ? 's' : ''} to JPG.`,
          file: imageData[0].file,
          filename: imageData[0].filename,
          fileType: imageData[0].fileType,
        };
      } else {
        return {
          success: true,
          message: `Converted ${images.length} page${images.length !== 1 ? 's' : ''} to JPG.`,
          files: imageData,
          fileType: 'image/jpeg',
        };
      }
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message || 'Conversion failed' };
    }
  })
  
  // PDF to Word
  .post('/pdf-to-word', async ({ request, set, userId }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        set.status = 400;
        return { success: false, message: 'No file provided' };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const wordDoc = await pdfToWord(buffer);

      // Track usage
      await trackToolUsage(userId, 'PDF to Word', 'pdf', '/api/pdf/pdf-to-word');

      return {
        success: true,
        message: 'PDF converted to Word successfully',
        file: wordDoc.toString('base64'),
        filename: 'converted.docx',
      };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message || 'Conversion failed' };
    }
  })
  
  
  // Get PDF Metadata
  .post('/metadata', async ({ request, set, userId }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        set.status = 400;
        return { success: false, message: 'No file provided' };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const metadata = await getPdfMetadata(buffer);

      return {
        success: true,
        metadata,
      };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message || 'Failed to get PDF metadata' };
    }
  })
  
  // Word to PDF
  .post('/word-to-pdf', async ({ request, set, userId }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        set.status = 400;
        return { success: false, message: 'No file provided' };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfDoc = await wordToPdf(buffer);

      // Track usage
      await trackToolUsage(userId, 'Word to PDF', 'pdf', '/api/pdf/word-to-pdf');

      return {
        success: true,
        message: 'Word converted to PDF successfully',
        file: pdfDoc.toString('base64'),
        filename: 'converted.pdf',
      };
    } catch (error: any) {
      set.status = 500;
      return {
        success: false,
        message: error.message || 'Word to PDF requires additional setup (puppeteer)',
      };
    }
  });

