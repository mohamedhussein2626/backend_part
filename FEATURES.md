# Toolur - Features Documentation

## Overview

Toolur is a comprehensive web application that provides powerful PDF and Image manipulation tools. The application consists of a modern Next.js frontend and an Elysia.js backend API, offering a wide range of file conversion and editing capabilities.

## Tech Stack

### Backend
- **Runtime**: Bun (JavaScript runtime)
- **Framework**: Elysia.js (Fast, friendly web framework)
- **Database**: PostgreSQL (via Neon)
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs for password hashing
- **File Processing Libraries**:
  - `sharp` - High-performance image processing
  - `pdf-lib` - PDF manipulation and creation
  - `pdfjs-dist` - PDF text extraction (legacy build for Node.js/Bun compatibility)
  - `pdf-to-img` - PDF to image conversion
  - `tesseract.js` - OCR (Optical Character Recognition)
  - `mammoth` - Word document processing
  - `docx` - Word document creation
  - `jimp` - Image manipulation
  - `canvas` - Canvas rendering

### Frontend
- **Framework**: Next.js 16.1.2 (with Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Authentication**: Client-side JWT token management

## Features

### PDF Tools

#### 1. PDF to JPG
- **Endpoint**: `POST /api/pdf/pdf-to-jpg`
- **Description**: Converts PDF pages to high-quality JPG images
- **Features**:
  - Convert all pages or specific page
  - High-resolution output (2x scale)
  - JPEG quality: 95%
- **Request Parameters**:
  - `file`: PDF file (required)
  - `pageNumber`: Optional page number (1-indexed)
- **Response**: Base64-encoded JPG image(s)

#### 2. PDF to Word
- **Endpoint**: `POST /api/pdf/pdf-to-word`
- **Description**: Extracts text from PDF and creates a Word document
- **Features**:
  - Text extraction using pdfjs-dist (legacy build)
  - Fallback to pdf-parse if needed
  - Preserves paragraph structure
- **Request Parameters**:
  - `file`: PDF file (required)
- **Response**: Base64-encoded DOCX file

#### 3. Word to PDF
- **Endpoint**: `POST /api/pdf/word-to-pdf`
- **Description**: Converts Word documents to PDF format
- **Features**:
  - Text extraction from DOCX files
  - Proper word wrapping and pagination
  - Standard page formatting (US Letter)
- **Request Parameters**:
  - `file`: Word document (DOCX) (required)
- **Response**: Base64-encoded PDF file

#### 4. Compress PDF
- **Endpoint**: `POST /api/pdf/compress`
- **Description**: Optimizes PDF file size
- **Features**:
  - Structure optimization
  - Maintains document quality
- **Request Parameters**:
  - `file`: PDF file (required)
  - `quality`: Compression quality (optional, default: 80)
- **Response**: Compressed PDF file

#### 5. Split PDF
- **Endpoint**: `POST /api/pdf/split`
- **Description**: Splits PDF into multiple files
- **Features**:
  - Split by page ranges
  - Individual PDF files per range
- **Request Parameters**:
  - `file`: PDF file (required)
  - `ranges`: Page ranges (e.g., "1-3,4-6")
- **Response**: Array of PDF files

#### 6. Crop PDF
- **Endpoint**: `POST /api/pdf/crop`
- **Description**: Crops specific pages of a PDF
- **Features**:
  - Crop specific page
  - Define crop area with coordinates
- **Request Parameters**:
  - `file`: PDF file (required)
  - `pageNumber`: Page to crop (required)
  - `x`, `y`, `width`, `height`: Crop dimensions (required)
- **Response**: Cropped PDF file

### Image Tools

#### 1. Resize Image
- **Endpoint**: `POST /api/image/resize`
- **Description**: Resizes images to specified dimensions
- **Features**:
  - Custom width and height
  - Maintain aspect ratio option
  - Supports all common image formats
- **Request Parameters**:
  - `file`: Image file (required)
  - `width`: Target width (optional)
  - `height`: Target height (optional)
  - `maintainAspectRatio`: Boolean (optional, default: true)
- **Response**: Resized image with metadata

#### 2. Crop Image
- **Endpoint**: `POST /api/image/crop`
- **Description**: Crops images to specified area
- **Features**:
  - Precise coordinate-based cropping
  - Maintains image quality
- **Request Parameters**:
  - `file`: Image file (required)
  - `x`, `y`: Starting coordinates (required)
  - `width`, `height`: Crop dimensions (required)
- **Response**: Cropped image with metadata

#### 3. Compress Image
- **Endpoint**: `POST /api/image/compress`
- **Description**: Compresses images to reduce file size
- **Features**:
  - Adjustable quality settings
  - Maintains visual quality
  - Shows compression ratio
- **Request Parameters**:
  - `file`: Image file (required)
  - `quality`: Compression quality 1-100 (optional, default: 80)
- **Response**: Compressed image with size comparison

#### 4. JPG to Word
- **Endpoint**: `POST /api/image/jpg-to-word`
- **Description**: Converts JPG images to Word documents
- **Features**:
  - Embeds image in Word document
  - Proper formatting
- **Request Parameters**:
  - `file`: Image file (required)
- **Response**: Base64-encoded DOCX file

#### 5. Image Text Converter (OCR)
- **Endpoint**: `POST /api/image/image-text-converter`
- **Description**: Extracts text from images using OCR
- **Features**:
  - Optical Character Recognition
  - Supports multiple languages
  - High accuracy text extraction
- **Request Parameters**:
  - `file`: Image file (required)
- **Response**: Extracted text

#### 6. Word Counter
- **Endpoint**: `POST /api/image/word-counter`
- **Description**: Counts words, characters, and paragraphs in image text
- **Features**:
  - OCR text extraction
  - Word count
  - Character count (with/without spaces)
  - Paragraph count
- **Request Parameters**:
  - `file`: Image file (required)
- **Response**: Word count statistics and extracted text

## Authentication

### User Authentication
- **Register**: `POST /api/user/register`
- **Login**: `POST /api/user/login`
- Uses JWT tokens stored in HTTP-only cookies

### Admin Authentication
- **Register**: `POST /api/admin/register`
- **Login**: `POST /api/admin/login`
- Separate admin authentication system

## Usage Tracking

All tool usage is automatically tracked:
- **User Stats**: `GET /api/usage/user` - Get user's own usage statistics
- **Admin Stats**: `GET /api/usage/admin/all` - Get all users' statistics (admin only)

Statistics include:
- Total tool uses
- Usage by tool name
- Active users count
- Tool popularity metrics

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "file": "base64_encoded_data",
  "metadata": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- HTTP-only cookies for token storage
- CORS protection
- Input validation
- File type validation

## Performance

- High-performance image processing with Sharp
- Efficient PDF processing
- Async/await for non-blocking operations
- Optimized file handling
- Temporary file cleanup

## File Format Support

### PDF Tools
- PDF input/output
- DOCX input/output
- JPG output

### Image Tools
- JPEG/PNG/GIF/WebP input
- JPEG/PNG output
- DOCX output (for JPG to Word)

## Development

### Backend Setup
```bash
cd toolur_v1_backend/elysia-app
bun install
bun run db:generate
bun run db:push
bun run dev
```

### Frontend Setup
```bash
cd toolur_v1_fronend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
NODE_ENV="development"
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## Version

- Backend: 1.0.50
- Frontend: 0.1.0

