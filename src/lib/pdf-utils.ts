import { PDFDocument, PDFPage } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

const TEMP_DIR = path.join(process.cwd(), 'temp');
const OUTPUT_DIR = path.join(process.cwd(), 'output');

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

// PDF to JPG - Convert PDF pages to images using pdf-to-img
export async function pdfToJpg(
  pdfBuffer: Buffer,
  pageNumber?: number
): Promise<Buffer[]> {
  await ensureDirectories();
  
  try {
    // Use pdf-to-img library which handles all the complexity
    let pdfToImgFunc: any;
    
    try {
      // Try dynamic import first (more reliable with ES modules)
      const pdfToImgModule = await import('pdf-to-img');
      
      // pdf-to-img exports { pdf } as a named export
      if (pdfToImgModule.pdf && typeof pdfToImgModule.pdf === 'function') {
        pdfToImgFunc = pdfToImgModule.pdf;
      } else if (pdfToImgModule.default && typeof pdfToImgModule.default === 'function') {
        pdfToImgFunc = pdfToImgModule.default;
      } else {
        throw new Error('pdf function not found in pdf-to-img module');
      }
    } catch (importError: any) {
      // Fallback to require if dynamic import fails
      try {
        const pdfToImgModule = require('pdf-to-img');
        if (pdfToImgModule.pdf && typeof pdfToImgModule.pdf === 'function') {
          pdfToImgFunc = pdfToImgModule.pdf;
        } else if (pdfToImgModule.default && typeof pdfToImgModule.default === 'function') {
          pdfToImgFunc = pdfToImgModule.default;
        } else {
          throw new Error('pdf function not found in pdf-to-img module');
        }
      } catch (requireError: any) {
        throw new Error(`Failed to import pdf-to-img: ${importError.message}. Please ensure pdf-to-img is installed: npm install pdf-to-img`);
      }
    }
    
    if (typeof pdfToImgFunc !== 'function') {
      throw new Error('pdf-to-img function not found. The module structure may have changed. Please check pdf-to-img documentation.');
    }
    
    const sharp = require('sharp');
    
    // pdf-to-img requires a file path instead of buffer
    // Save buffer to temporary file first
    const tempFilePath = path.join(TEMP_DIR, `pdf-${randomUUID()}.pdf`);
    await fs.writeFile(tempFilePath, pdfBuffer);
    
    try {
      // Convert PDF file to images using pdf-to-img
      // The library returns a document object with getPage() method or an async iterable
      let document: any;
      
      try {
        // pdf-to-img expects a file path and returns a document object or async iterable
        let result = pdfToImgFunc(tempFilePath, {
          scale: 2.0, // Higher resolution for better quality
        });
        
        // If it returns a promise, await it
        if (result && typeof result.then === 'function') {
          document = await result;
        } else {
          document = result;
        }
      } catch (callError: any) {
        throw new Error(`Failed to call pdf-to-img function: ${callError.message}`);
      }
      
      // Check what we got
      if (!document) {
        throw new Error('pdf-to-img returned null or undefined. The function may not be working correctly.');
      }
      
      const results: Buffer[] = [];
      
      // Check if it has a getPage method FIRST (document object - most reliable)
      // This should be checked before async iterable since document objects might have both
      // If it has getPage, use it (even if it also has async iterator)
      if (document && typeof document.getPage === 'function') {
        // Get total pages - check length property or metadata
        let totalPages = 0;
        if (typeof document.length === 'number' && !isNaN(document.length) && document.length > 0) {
          totalPages = Math.floor(document.length);
        } else if (document.metadata && typeof document.metadata.pages === 'number' && !isNaN(document.metadata.pages)) {
          totalPages = Math.floor(document.metadata.pages);
        }
        
        // Validate totalPages
        if (!Number.isInteger(totalPages) || totalPages <= 0) {
          throw new Error(`Invalid PDF page count: ${totalPages}. Document length: ${document.length}, Metadata: ${JSON.stringify(document.metadata || {})}`);
        }
        
        console.log(`Processing PDF with ${totalPages} pages using getPage method`);
        
        // Process pages using getPage method
        // pdf-to-img's getPage expects 1-indexed page numbers (page 1, 2, 3, etc.)
        const pagesToProcess: number[] = [];
        
        // Handle pageNumber - it might be undefined, NaN, or a valid number
        const isValidPageNumber = pageNumber !== undefined && 
                                  pageNumber !== null && 
                                  !isNaN(pageNumber) && 
                                  Number.isInteger(pageNumber) &&
                                  pageNumber >= 1 && 
                                  pageNumber <= totalPages;
        
        if (isValidPageNumber) {
          // Process specific page
          pagesToProcess.push(Math.floor(pageNumber));
        } else {
          // Process all pages (when pageNumber is undefined, null, NaN, or invalid)
          for (let i = 1; i <= totalPages; i++) {
            pagesToProcess.push(i);
          }
        }
        
        if (pagesToProcess.length === 0) {
          throw new Error(`No valid pages to process. Requested page: ${pageNumber}, Total pages: ${totalPages}`);
        }
        
        console.log(`Will process pages: ${pagesToProcess.join(', ')}`);
        
        for (const pageNum of pagesToProcess) {
          // Validate page number
          if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > totalPages) {
            console.warn(`Skipping invalid page number: ${pageNum}`);
            continue;
          }
          
          try {
            // Get page using getPage - pdf-to-img expects 1-indexed (page 1, 2, 3, etc.)
            // Based on the error message, getPage expects: pageNumber > 0 && pageNumber <= totalPages
            let page = document.getPage(pageNum);
            
            // getPage might return a promise
            if (page && typeof page.then === 'function') {
              page = await page;
            }
            
            if (!page) {
              throw new Error(`Failed to get page ${pageNum} - getPage returned null/undefined`);
            }
            
            // The page might be a Buffer, Uint8Array, ImageData, or other format
            // Handle different return types from pdf-to-img
            let imageData: Buffer;
            
            if (Buffer.isBuffer(page)) {
              imageData = page;
            } else if (page instanceof Uint8Array) {
              imageData = Buffer.from(page);
            } else if (page.data && Buffer.isBuffer(page.data)) {
              // If page has a data property with buffer
              imageData = page.data;
            } else if (page.data && page.data instanceof Uint8Array) {
              imageData = Buffer.from(page.data);
            } else if (typeof page === 'object' && 'buffer' in page) {
              // If page has a buffer property
              imageData = Buffer.from(page.buffer);
            } else {
              // Try to convert to buffer - might be ImageData or other format
              try {
                if (page instanceof ArrayBuffer) {
                  imageData = Buffer.from(page);
                } else if (page.buffer instanceof ArrayBuffer) {
                  imageData = Buffer.from(page.buffer, page.byteOffset || 0, page.byteLength || page.buffer.byteLength);
                } else {
                  // Last resort: try to create buffer from the object
                  imageData = Buffer.from(page as any);
                }
              } catch (convertError: any) {
                throw new Error(`Failed to convert page ${pageNum} to buffer: ${convertError.message}. Page type: ${typeof page}, keys: ${Object.keys(page || {}).join(', ')}`);
              }
            }
            
            // Verify we have valid image data
            if (!imageData || imageData.length === 0) {
              throw new Error(`Page ${pageNum} resulted in empty buffer`);
            }
            
            // Convert page to JPEG using sharp
            // If it's already a valid image format, sharp will handle it
            // If it's raw pixel data, we might need to specify format
            const jpegBuffer = await sharp(imageData, {
              failOn: 'none' // Don't fail on format detection
            }).jpeg({ quality: 95, mozjpeg: true }).toBuffer();
            
            if (!jpegBuffer || jpegBuffer.length < 1000) {
              throw new Error(`Failed to generate image for page ${pageNum} - buffer too small (${jpegBuffer?.length || 0} bytes)`);
            }
            
            results.push(Buffer.from(jpegBuffer));
          } catch (pageError: any) {
            console.error(`Error processing page ${pageNum}:`, pageError);
            throw new Error(`Failed to process page ${pageNum}: ${pageError.message}`);
          }
        }
        
        if (results.length === 0) {
          throw new Error('No pages were processed. The PDF may be empty or the requested page does not exist.');
        }
        
        return results;
      }
      // Check if it's an async iterable (fallback if getPage doesn't work)
      else if (document && typeof document[Symbol.asyncIterator] === 'function') {
        let pageIndex = 0;
        for await (const page of document) {
          pageIndex++;
          if (pageNumber !== undefined && pageIndex !== pageNumber) continue;
          
          // Convert page to JPEG using sharp
          const jpegBuffer = await sharp(page).jpeg({ quality: 95, mozjpeg: true }).toBuffer();
          if (!jpegBuffer || jpegBuffer.length < 1000) {
            throw new Error(`Failed to generate image for page ${pageIndex}`);
          }
          results.push(Buffer.from(jpegBuffer));
          if (pageNumber !== undefined && pageIndex === pageNumber) break;
        }
        if (results.length === 0) {
          throw new Error('No pages were processed from async iterable');
        }
        return results;
      }
      // Check if it's already an array
      else if (Array.isArray(document)) {
        const pages = document.filter(page => page != null);
        if (pages.length === 0) {
          throw new Error('pdf-to-img returned empty array. The PDF may be corrupted or the library may not be working correctly.');
        }
        
        for (let i = 0; i < pages.length; i++) {
          const pageIndex = i + 1;
          if (pageNumber !== undefined && pageIndex !== pageNumber) continue;
          
          const jpegBuffer = await sharp(pages[i]).jpeg({ quality: 95, mozjpeg: true }).toBuffer();
          if (!jpegBuffer || jpegBuffer.length < 1000) {
            throw new Error(`Failed to generate image for page ${pageIndex}`);
          }
          results.push(Buffer.from(jpegBuffer));
          if (pageNumber !== undefined && pageIndex === pageNumber) break;
        }
        
        if (results.length === 0) {
          throw new Error('No pages were processed. The PDF may be empty or the requested page does not exist.');
        }
        
        return results;
      }
      // Check if it's a sync iterable
      else if (document && typeof document[Symbol.iterator] === 'function') {
        const pages = Array.from(document);
        for (let i = 0; i < pages.length; i++) {
          const pageIndex = i + 1;
          if (pageNumber !== undefined && pageIndex !== pageNumber) continue;
          
          const jpegBuffer = await sharp(pages[i]).jpeg({ quality: 95, mozjpeg: true }).toBuffer();
          if (!jpegBuffer || jpegBuffer.length < 1000) {
            throw new Error(`Failed to generate image for page ${pageIndex}`);
          }
          results.push(Buffer.from(jpegBuffer));
          if (pageNumber !== undefined && pageIndex === pageNumber) break;
        }
        
        if (results.length === 0) {
          throw new Error('No pages were processed. The PDF may be empty or the requested page does not exist.');
        }
        
        return results;
      }
      else {
        throw new Error(`pdf-to-img returned an unsupported format. Got type: ${typeof document}, keys: ${Object.keys(document || {}).join(', ')}. Please check pdf-to-img documentation.`);
      }
    } finally {
      // Clean up temporary file
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }
    }
  } catch (error: any) {
    console.error('PDF to JPG conversion error:', error);
    throw new Error(`PDF to JPG conversion failed: ${error.message || 'Unknown error'}`);
  }
}

// Compress PDF
export async function compressPdf(pdfBuffer: Buffer, quality: number = 80): Promise<Buffer> {
  await ensureDirectories();
  try {
    // Load PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Save with optimization options
    // pdf-lib doesn't have built-in compression, but we can optimize structure
    const optimizedBuffer = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
    });
    
    // Return optimized buffer (actual compression would require additional tools)
    return optimizedBuffer;
  } catch (error: any) {
    // If compression fails, return original
    console.error('PDF compression error:', error);
    return pdfBuffer;
  }
}


// PDF to Word (extract text and create DOCX)
export async function pdfToWord(pdfBuffer: Buffer): Promise<Buffer> {
  await ensureDirectories();
  try {
    let fullText = '';
    
    // Use pdfjs-dist for text extraction (better Bun compatibility than pdf-parse)
    // Use legacy build for Node.js/Bun environments to avoid PDFWorker initialization issues
    try {
      // Try to use pdfjs-dist legacy build first (required for Node.js/Bun)
      let getDocument: any = null;
      
      try {
        // Use require first for legacy build (more reliable in Bun/Node.js)
        try {
          // Try legacy build path first (recommended for Node.js/Bun)
          const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
          getDocument = pdfjsLib.getDocument || pdfjsLib.default?.getDocument;
        } catch (legacyError) {
          // Try regular require
          try {
            const pdfjsLib = require('pdfjs-dist');
            getDocument = pdfjsLib.getDocument || pdfjsLib.default?.getDocument;
          } catch (requireError) {
            // Try dynamic import as last resort
            try {
              const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs').catch(async () => {
                return await import('pdfjs-dist');
              });
              getDocument = (pdfjsLib as any).getDocument || (pdfjsLib as any).default?.getDocument;
            } catch (importError) {
              // Will try pdf-parse fallback
            }
          }
        }
      } catch (importError) {
        // Will try pdf-parse fallback
      }
      
      if (getDocument && typeof getDocument === 'function') {
        // Load the PDF document
        const loadingTask = getDocument({
          data: new Uint8Array(pdfBuffer),
          useSystemFonts: true, // Use system fonts to avoid font loading issues
        });
        
        const pdfDocument = await loadingTask.promise;
        const numPages = pdfDocument.numPages;
        
        if (numPages === 0) {
          throw new Error('PDF has no pages');
        }
        
        // Extract text from each page
        const textParts: string[] = [];
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          try {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Combine text items from the page
            const pageText = textContent.items
              .map((item: any) => item.str || '')
              .join(' ')
              .trim();
            
            if (pageText) {
              textParts.push(pageText);
            }
          } catch (pageError: any) {
            console.warn(`Failed to extract text from page ${pageNum}:`, pageError.message);
            // Continue with other pages
          }
        }
        
        fullText = textParts.join('\n\n');
      } else {
        throw new Error('pdfjs-dist getDocument not available');
      }
    } catch (error: any) {
      // Fallback: try pdf-parse if pdfjs-dist fails
      try {
        let pdfParseFunc: any = null;
        
        try {
          const pdfParseModule = require('pdf-parse');
          
          // pdf-parse can export in different ways
          if (typeof pdfParseModule === 'function') {
            pdfParseFunc = pdfParseModule;
          } else if (pdfParseModule.default && typeof pdfParseModule.default === 'function') {
            pdfParseFunc = pdfParseModule.default;
          } else if (pdfParseModule.pdfParse && typeof pdfParseModule.pdfParse === 'function') {
            pdfParseFunc = pdfParseModule.pdfParse;
          } else {
            // Try to find any function in the module
            for (const key in pdfParseModule) {
              if (typeof pdfParseModule[key] === 'function') {
                pdfParseFunc = pdfParseModule[key];
                break;
              }
            }
          }
        } catch (requireError: any) {
          throw new Error(`pdf-parse module not found: ${requireError.message}`);
        }
        
        if (pdfParseFunc && typeof pdfParseFunc === 'function') {
          const data = await pdfParseFunc(pdfBuffer);
          fullText = data.text || '';
        } else {
          throw new Error('pdf-parse function not found in module');
        }
      } catch (parseError: any) {
        throw new Error(`PDF text extraction failed: ${error.message || 'Unknown error'}. Fallback also failed: ${parseError.message}`);
      }
    }
    
    if (!fullText.trim()) {
      fullText = 'No text found in PDF';
    }
    
    const { Document, Packer, Paragraph, TextRun } = require('docx');
    
    // Split text into paragraphs
    const paragraphs = fullText
      .split('\n\n')
      .filter((p: string) => p.trim().length > 0)
      .map((text: string) => 
        new Paragraph({
          children: [new TextRun(text.trim())]
        })
      );
    
    // If no paragraphs, add a single paragraph
    if (paragraphs.length === 0) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun('No text found in PDF')]
        })
      );
    }
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });

    return await Packer.toBuffer(doc);
  } catch (error: any) {
    throw new Error('PDF to Word conversion failed: ' + (error.message || 'Unknown error'));
  }
}

// Crop PDF
export async function cropPdf(
  pdfBuffer: Buffer,
  pageNumber: number,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Buffer> {
  await ensureDirectories();
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  
  if (pageNumber < 1 || pageNumber > pages.length) {
    throw new Error('Invalid page number');
  }

  const page = pages[pageNumber - 1];
  const { width: pageWidth, height: pageHeight } = page.getSize();
  
  // Create new PDF with cropped page
  const newDoc = await PDFDocument.create();
  const [copiedPage] = await newDoc.copyPages(pdfDoc, [pageNumber - 1]);
  const newPage = newDoc.addPage([width, height]);
  
  // Copy content with offset
  const embeddedPage = await newDoc.embedPage(copiedPage, {
    left: -x,
    bottom: pageHeight - y - height,
    right: width - x,
    top: pageHeight - y,
  });
  
  newPage.drawPage(embeddedPage);
  
  return await newDoc.save();
}

// Word to PDF
export async function wordToPdf(wordBuffer: Buffer): Promise<Buffer> {
  await ensureDirectories();
  try {
    // Use mammoth to extract text from Word document
    // Mammoth will handle validation and provide better error messages
    const mammoth = require('mammoth');
    const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
    
    // Extract text from Word document - try both methods
    let text = '';
    try {
      // Method 1: Extract raw text (simpler, faster)
      const result = await mammoth.extractRawText({ buffer: wordBuffer });
      text = result.value || '';
      
      // If raw text extraction fails or is empty, try converting to HTML then extract
      if (!text || !text.trim()) {
        try {
          const htmlResult = await mammoth.convertToHtml({ buffer: wordBuffer });
          // Extract text from HTML (simple approach)
          text = htmlResult.value
            .replace(/<[^>]*>/g, ' ') // Remove HTML tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        } catch (htmlError: any) {
          // If HTML conversion also fails, use the raw text even if empty
          console.warn('HTML conversion failed, using raw text:', htmlError.message);
        }
      }
    } catch (mammothError: any) {
      // Provide helpful error messages based on the error type
      const errorMessage = mammothError.message || 'Unknown error';
      
      if (errorMessage.includes('zip file') || errorMessage.includes('ZIP') || errorMessage.includes('central directory')) {
        throw new Error('Invalid Word document format. The file appears to be corrupted or is not a valid DOCX file. Please ensure you are uploading a valid Microsoft Word document (.docx format). Note: .doc files (older format) are not supported - please convert to .docx first.');
      } else if (errorMessage.includes('not a valid') || errorMessage.includes('invalid')) {
        throw new Error(`Invalid Word document: ${errorMessage}. Please ensure the file is a valid Microsoft Word document (.docx format).`);
      } else {
        throw new Error(`Failed to extract text from Word document: ${errorMessage}`);
      }
    }
    
    if (!text || !text.trim()) {
      throw new Error('No text found in Word document. The document may be empty, contain only images, or the file format is not supported.');
    }
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Embed standard fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Page dimensions (US Letter: 8.5 x 11 inches = 612 x 792 points)
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 72; // 1 inch margin
    const maxWidth = pageWidth - (margin * 2);
    
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;
    const fontSize = 12;
    const lineHeight = fontSize * 1.5;
    const paragraphSpacing = 6;
    
    // Split text into paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    
    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim().replace(/\n/g, ' ');
      if (!trimmedPara) {
        yPosition -= paragraphSpacing;
        continue;
      }
      
      // Word wrapping algorithm
      const words = trimmedPara.split(/\s+/);
      let currentLine = '';
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = helveticaFont.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth > maxWidth && currentLine) {
          // Need to wrap - draw current line
          if (yPosition < margin + lineHeight) {
            // Need new page
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
          }
          
          currentPage.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          
          yPosition -= lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      // Draw remaining line of paragraph
      if (currentLine) {
        if (yPosition < margin + lineHeight) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }
        
        currentPage.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        
        yPosition -= lineHeight + paragraphSpacing;
      }
    }
    
    // Save PDF and return buffer
    const pdfBytes = await pdfDoc.save();
    // pdf-lib returns Uint8Array, convert to Buffer
    return Buffer.from(pdfBytes.buffer, pdfBytes.byteOffset, pdfBytes.byteLength);
  } catch (error: any) {
    throw new Error('Word to PDF conversion failed: ' + (error.message || 'Unknown error'));
  }
}

// JPG to Word (create Word document with image)
export async function jpgToWord(imageBuffer: Buffer): Promise<Buffer> {
  await ensureDirectories();
  try {
    const { Document, Packer, Paragraph, ImageRun } = require('docx');
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 400,
                  height: 300,
                },
              }),
            ],
          }),
        ],
      }],
    });

    return await Packer.toBuffer(doc);
  } catch (error) {
    throw new Error('JPG to Word conversion requires docx package');
  }
}

// Get PDF metadata
export async function getPdfMetadata(pdfBuffer: Buffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  return {
    pageCount: pages.length,
    size: pdfBuffer.length,
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

