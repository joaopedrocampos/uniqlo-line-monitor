# Phase 2 & Phase 3 Design Document

## Overview

This document outlines the design for:
- **Phase 2**: Photo uploads with local storage (abstracted for future Cloudinary migration)
- **Phase 3**: Historical patterns showing typical busy times

## Phase 2: Photo Uploads

### Storage Abstraction Pattern

```
backend/src/services/storage/
├── index.js              # Exports current storage implementation
├── LocalStorage.js       # Local file storage implementation
└── CloudinaryStorage.js  # Future: Cloudinary implementation
```

**Interface contract:**
- `upload(file)` → `{ url, publicId }`
- `delete(publicId)` → `void`
- `getUrl(publicId)` → `string`

### Local Storage Implementation

- Files saved to `backend/uploads/` directory
- Served via Express static middleware at `/uploads/*`
- `publicId` = UUID + original extension
- `url` = `{BASE_URL}/uploads/{publicId}`

### API Endpoints

**POST /api/photos**
- Upload a photo and associate with a report
- Multipart form data with `file` and `reportId`
- Returns: `{ success, photo: { id, url, reportId } }`

**GET /api/photos/:reportId**
- Get photos for a specific report
- Returns: `{ photos: [{ id, url, createdAt }] }`

**DELETE /api/photos/:photoId**
- Delete a specific photo
- Returns: `{ success, message }`

### Flow

1. User submits report via existing endpoint
2. User optionally uploads photo with returned `reportId`
3. Photo stored locally, URL saved to database
4. Report's `has_photo` flag updated

## Phase 3: Historical Patterns

### API Endpoint

**GET /api/history**
- Query params: `days` (default: 7)
- Returns aggregated patterns

### Response Format

```json
{
  "summary": "Typically busy: Weekdays 12-2pm, 5-7pm",
  "patterns": {
    "busyHours": [12, 13, 17, 18],
    "busyDays": ["Monday", "Friday"],
    "quietHours": [9, 10, 20, 21],
    "quietDays": ["Sunday"]
  },
  "dataPoints": 45,
  "periodDays": 7
}
```

### Pattern Calculation Logic

1. Query reports from last N days
2. Group by hour of day and day of week
3. Calculate average status score per hour (no_line=0, short=1, long=2)
4. Identify peak hours (score > 1.0) and quiet hours (score < 0.5)
5. Generate human-readable summary

## Testing Strategy

**Framework:** Jest

**Test Categories:**
1. Unit tests for storage service
2. Unit tests for pattern calculation
3. Integration tests for API endpoints
4. Mock database for isolated testing

## File Structure Changes

```
backend/
├── src/
│   ├── services/
│   │   ├── storage/
│   │   │   ├── index.js
│   │   │   └── LocalStorage.js
│   │   └── historyService.js
│   ├── routes/
│   │   ├── photos.js (new)
│   │   └── history.js (new)
│   └── index.js (updated)
├── uploads/ (new, gitignored)
├── tests/
│   ├── storage.test.js
│   ├── history.test.js
│   └── api.test.js
├── jest.config.js
└── package.json (updated)
```
