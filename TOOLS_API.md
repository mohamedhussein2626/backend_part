# Tools API Documentation

## Image Tools API

### Base URL: `/api/image`

#### 1. Compress Image
**Endpoint:** `POST /api/image/compress`

**Request:**
- FormData with:
  - `file`: Image file (required)
  - `quality`: Number (optional, default: 80)

**Response:**
```json
{
  "success": true,
  "message": "Image compressed successfully",
  "file": "base64_encoded_image",
  "originalSize": 1024000,
  "compressedSize": 512000,
  "compressionRatio": "50.00%"
}
```

#### 2. Resize Image
**Endpoint:** `POST /api/image/resize`

**Request:**
- FormData with:
  - `file`: Image file (required)
  - `width`: Number (optional)
  - `height`: Number (optional)
  - `maintainAspectRatio`: Boolean (optional, default: true)

**Response:**
```json
{
  "success": true,
  "message": "Image resized successfully",
  "file": "base64_encoded_image",
  "metadata": {
    "width": 800,
    "height": 600,
    "format": "jpeg",
    "size": 102400
  }
}
```

#### 3. Crop Image
**Endpoint:** `POST /api/image/crop`

**Request:**
- FormData with:
  - `file`: Image file (required)
  - `x`: Number (required) - X coordinate
  - `y`: Number (required) - Y coordinate
  - `width`: Number (required) - Crop width
  - `height`: Number (required) - Crop height

**Response:**
```json
{
  "success": true,
  "message": "Image cropped successfully",
  "file": "base64_encoded_image",
  "metadata": { ... }
}
```

#### 4. JPG to Word
**Endpoint:** `POST /api/image/jpg-to-word`

**Request:**
- FormData with:
  - `file`: Image file (required)

**Response:**
```json
{
  "success": true,
  "message": "JPG converted to Word successfully",
  "file": "base64_encoded_docx",
  "filename": "converted.docx"
}
```

#### 5. Image Text Converter (OCR)
**Endpoint:** `POST /api/image/image-text-converter`

**Request:**
- FormData with:
  - `file`: Image file (required)

**Response:**
```json
{
  "success": true,
  "message": "Text extracted successfully",
  "text": "Extracted text from image..."
}
```

#### 6. Word Counter
**Endpoint:** `POST /api/image/word-counter`

**Request:**
- FormData with:
  - `file`: Image file (required)

**Response:**
```json
{
  "success": true,
  "message": "Word count completed",
  "wordCount": 150,
  "characterCount": 1200,
  "characterCountNoSpaces": 1000,
  "paragraphCount": 3,
  "text": "Extracted text..."
}
```

## PDF Tools API

### Base URL: `/api/pdf`

#### 1. PDF to JPG
**Endpoint:** `POST /api/pdf/pdf-to-jpg`

**Request:**
- FormData with:
  - `file`: PDF file (required)
  - `pageNumber`: Number (optional) - Specific page to convert

**Note:** Requires additional setup (pdf2pic library)

#### 2. Compress PDF
**Endpoint:** `POST /api/pdf/compress`

**Request:**
- FormData with:
  - `file`: PDF file (required)

**Response:**
```json
{
  "success": true,
  "message": "PDF compressed successfully",
  "file": "base64_encoded_pdf",
  "originalSize": 2048000,
  "compressedSize": 1536000,
  "compressionRatio": "25.00%"
}
```

#### 3. Split PDF
**Endpoint:** `POST /api/pdf/split`

**Request:**
- FormData with:
  - `file`: PDF file (required)
  - `pageRanges`: JSON string - Array of `{start: number, end: number}`

**Example:**
```json
{
  "pageRanges": "[{\"start\": 1, \"end\": 5}, {\"start\": 6, \"end\": 10}]"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PDF split successfully",
  "files": [
    {
      "file": "base64_encoded_pdf",
      "filename": "split_1.pdf",
      "pageRange": {"start": 1, "end": 5}
    }
  ]
}
```

#### 4. PDF to Word
**Endpoint:** `POST /api/pdf/pdf-to-word`

**Request:**
- FormData with:
  - `file`: PDF file (required)

**Response:**
```json
{
  "success": true,
  "message": "PDF converted to Word successfully",
  "file": "base64_encoded_docx",
  "filename": "converted.docx"
}
```

#### 5. Crop PDF
**Endpoint:** `POST /api/pdf/crop`

**Request:**
- FormData with:
  - `file`: PDF file (required)
  - `pageNumber`: Number (required)
  - `x`: Number (required)
  - `y`: Number (required)
  - `width`: Number (required)
  - `height`: Number (required)

**Response:**
```json
{
  "success": true,
  "message": "PDF cropped successfully",
  "file": "base64_encoded_pdf",
  "metadata": {
    "pageCount": 1,
    "size": 102400
  }
}
```

#### 6. Word to PDF
**Endpoint:** `POST /api/pdf/word-to-pdf`

**Request:**
- FormData with:
  - `file`: Word document file (required)

**Note:** Requires additional setup (puppeteer or similar)

## Error Responses

All endpoints return error responses in this format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

## Notes

- All file responses are base64 encoded strings
- File uploads use `multipart/form-data`
- Some features require additional dependencies (noted in responses)
- Files are processed in memory (no disk storage)
- All endpoints support CORS from `http://localhost:3001`

