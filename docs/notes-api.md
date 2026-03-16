# Notes API Documentation

## Overview
The Notes API provides CRUD operations for managing user notes with features like pinning, archiving, and offline support.

## Base URL
```
/api/notes
```

## Endpoints

### 1. Get All Notes
Retrieves all notes for a user with optional filtering.

**Endpoint:** `GET /api/notes`

**Query Parameters:**
| Parameter | Type | Required | Description |
|------------|------|----------|-------------|
| userId | string | Yes | The user's unique identifier |
| archived | string | No | Filter by archived status (`true` or `false`) |
| pinned | string | No | Filter by pinned status (`true` or `false`) |

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/notes?userId=user123&archived=false"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "user123",
      "title": "My First Note",
      "content": "This is the note content with **markdown** formatting.",
      "isPinned": false,
      "isArchived": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T12:45:00.000Z"
    }
  ]
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "User ID is required"
}
```

---

### 2. Create Note
Creates a new note for a user.

**Endpoint:** `POST /api/notes`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string | Yes | The user's unique identifier |
| title | string | No (max 200 chars) | Note title, defaults to "Untitled Note" |
| content | string | No (max 5000 chars) | Note content |

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/notes" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "title": "Shopping List", "content": "- Milk\n- Eggs\n- Bread"}'
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user123",
    "title": "Shopping List",
    "content": "- Milk\n- Eggs\n- Bread",
    "isPinned": false,
    "isArchived": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Content cannot be more than 5000 characters"
}
```

---

### 3. Get Single Note
Retrieves a specific note by ID.

**Endpoint:** `GET /api/notes/[id]`

**Query Parameters:**
| Parameter | Type | Required | Description |
|------------|------|----------|-------------|
| userId | string | Yes | The user's unique identifier |

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/notes/507f1f77bcf86cd799439011?userId=user123"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user123",
    "title": "My Note",
    "content": "Note content",
    "isPinned": true,
    "isArchived": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:45:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Note not found"
}
```

---

### 4. Update Note
Updates an existing note.

**Endpoint:** `PUT /api/notes/[id]`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string | Yes | The user's unique identifier |
| title | string | No (max 200 chars) | Note title |
| content | string | No (max 5000 chars) | Note content |
| isPinned | boolean | No | Pin/unpin the note |
| isArchived | boolean | No | Archive/unarchive the note |

**Example Request:**
```bash
curl -X PUT "http://localhost:3000/api/notes/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "title": "Updated Title", "content": "Updated content", "isPinned": true}'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user123",
    "title": "Updated Title",
    "content": "Updated content",
    "isPinned": true,
    "isArchived": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Note not found"
}
```

---

### 5. Delete Note
Deletes a note permanently.

**Endpoint:** `DELETE /api/notes/[id]`

**Query Parameters:**
| Parameter | Type | Required | Description |
|------------|------|----------|-------------|
| userId | string | Yes | The user's unique identifier |

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/notes/507f1f77bcf86cd799439011?userId=user123"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {}
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Note not found"
}
```

---

## Rate Limiting

All endpoints are subject to rate limiting:
- **Limit:** 100 requests per minute
- **Headers:** Standard rate limit headers are not currently returned
- **Response:** `429 Too Many Requests` with error message

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Common Error Codes
| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid or missing required fields |
| 404 | Not Found - Resource doesn't exist or doesn't belong to user |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Unexpected server error |

---

## Data Schema

### Note Object
```typescript
interface Note {
  _id: string;           // MongoDB ObjectId
  userId: string;        // User's unique identifier
  title: string;         // Note title (max 200 chars)
  content: string;       // Note content (max 5000 chars)
  isPinned: boolean;     // Whether note is pinned
  isArchived: boolean;   // Whether note is archived
  createdAt: Date;       // Creation timestamp
  updatedAt: Date;       // Last modification timestamp
}
```

---

## Security Features

1. **Input Sanitization:** All user input is sanitized to prevent XSS attacks
2. **User Isolation:** Users can only access their own notes
3. **Rate Limiting:** Prevents abuse of the API
4. **Validation:** Input validation for all fields with appropriate error messages

---

## Offline Support

The NotesView component includes offline capability:
- Changes are saved to localStorage when offline
- A banner indicates offline status
- Data syncs when connection is restored