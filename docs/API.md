> [[ARABIC_HEADER]] هذا الملف (docs/API.md) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

# 📡 API Documentation - HM CAR

## Base URL

```
Development: http://localhost:4001/api/v2
Production: https://your-domain.com/api/v2
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## 🔐 Auth Endpoints

### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "client"
  }
}
```

### Register

```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "phone": "+966500000000"
}
```

### Verify Token

```http
GET /auth/verify
```

**Headers:** `Authorization: Bearer <token>`

---

## 🚗 Cars Endpoints

### List Cars

```http
GET /cars
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| make | string | Filter by make |
| minPrice | number | Minimum price |
| maxPrice | number | Maximum price |
| year | number | Filter by year |
| status | string | active, sold, all |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Mercedes-Benz S-Class 2024",
      "make": "Mercedes-Benz",
      "model": "S-Class",
      "year": 2024,
      "price": 450000,
      "images": ["..."],
      "mileage": 5000,
      "fuelType": "Gasoline",
      "transmission": "Automatic"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50
  }
}
```

### Get Car Details

```http
GET /cars/:id
```

---

## 🔨 Auctions Endpoints

### List Auctions

```http
GET /auctions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | active, upcoming, ended |
| page | number | Page number |
| limit | number | Items per page |

### Get Auction Details

```http
GET /auctions/:id
```

### Place Bid

```http
POST /auctions/:id/bid
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 50000
}
```

---

## ❤️ Favorites Endpoints

### List Favorites

```http
GET /favorites
```

**Headers:** `Authorization: Bearer <token>`

### Add to Favorites

```http
POST /favorites
```

**Request Body:**
```json
{
  "carId": "..."
}
```

### Remove from Favorites

```http
DELETE /favorites/:carId
```

### Check if Favorited

```http
GET /favorites/check/:carId
```

---

## 💬 Messages Endpoints

### List Conversations

```http
GET /messages/conversations
```

**Headers:** `Authorization: Bearer <token>`

### Get Conversation Messages

```http
GET /messages/conversation/:userId
```

### Send Message

```http
POST /messages
```

**Request Body:**
```json
{
  "receiverId": "...",
  "content": "Hello!"
}
```

### Get Unread Count

```http
GET /messages/unread-count
```

---

## ⚖️ Comparisons Endpoints

### Get Comparisons

```http
GET /comparisons
```

### Add Car to Comparison

```http
POST /comparisons/add
```

**Request Body:**
```json
{
  "carId": "..."
}
```

### Remove from Comparison

```http
DELETE /comparisons/remove/:carId
```

### Compare Cars (Public)

```http
POST /comparisons/compare
```

**Request Body:**
```json
{
  "carIds": ["id1", "id2", "id3"]
}
```

---

## ⭐ Reviews Endpoints

### List Reviews

```http
GET /reviews
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | approved, pending, rejected |
| carId | string | Filter by car |

### Get Car Reviews

```http
GET /reviews/car/:carId
```

### Submit Review

```http
POST /reviews
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "carId": "...",
  "rating": 5,
  "comment": "Great car!"
}
```

---

## 📧 Contact Endpoint

### Send Contact Message

```http
POST /contact
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+966500000000",
  "subject": "Inquiry",
  "message": "I'm interested in..."
}
```

---

## ⚙️ Settings Endpoints

### Get Public Settings

```http
GET /settings/public
```

**Response:**
```json
{
  "success": true,
  "data": {
    "socialLinks": {
      "twitter": "...",
      "instagram": "...",
      "whatsapp": "..."
    },
    "contactInfo": {
      "phone": "...",
      "email": "...",
      "address": "..."
    }
  }
}
```

---

## 🚨 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Invalid request data |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Access denied |
| 404 | NOT_FOUND | Resource not found |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeded |
| 500 | SERVER_ERROR | Internal server error |

---

**Last Updated:** February 2026
