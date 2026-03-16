# Finance API Documentation

## Base URL
```
/api/finance
```

## Endpoints

### 1. Get Expenses
Retrieves expenses for a specific month.

**Endpoint:** `GET /api/finance/expenses`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| month | string | Format: YYYY-MM | Current month |
| categoryId | string | Filter by category ID | All |

**Response:**
```json
{
  "success": true,
  "expenses": [
    {
      "_id": "expense_id",
      "amount": 5000,
      "categoryId": {
        "_id": "cat_id",
        "name": "Food",
        "color": "#f97316",
        "icon": "🍔"
      },
      "date": "2024-01-15T00:00:00.000Z",
      "note": "Lunch",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 5000
}
```

### 2. Search Expenses
Advanced search with filtering, sorting, and highlighting.

**Endpoint:** `GET /api/finance/search`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search term (matches note field) |
| categoryId | string | Filter by category |
| dateFrom | string | Start date (YYYY-MM-DD) |
| dateTo | string | End date (YYYY-MM-DD) |
| amountMin | number | Minimum amount |
| amountMax | number | Maximum amount |
| booleanOperator | string | AND or OR for filters |
| sortBy | string | Field to sort by (date, amount) |
| sortOrder | string | asc or desc |
| page | number | Page number |
| limit | number | Results per page (max 100) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "expense_id",
      "amount": 5000,
      "categoryId": { ... },
      "date": "2024-01-15",
      "note": "Lunch",
      "highlightedNote": "<mark>Lunch</mark>"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  },
  "performance": {
    "queryTimeMs": 45,
    "meetsTarget": true
  }
}
```

### 3. Get Analytics
Comprehensive financial analytics including trends, projections, and budget analysis.

**Endpoint:** `GET /api/finance/analytics`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| month | string | Format: YYYY-MM |

**Response:**
```json
{
  "success": true,
  "analytics": {
    "summary": {
      "totalExpenses": 50000,
      "totalIncome": 100000,
      "balance": 50000,
      "monthOverMonthChange": 15.5,
      "transactionCount": 25
    },
    "averages": {
      "daily": 1666.67,
      "weekly": 11666.67,
      "threeMonthRolling": 48000
    },
    "projections": {
      "monthEndEstimate": 55000,
      "basedOnDays": 15,
      "totalDaysInMonth": 31,
      "confidenceLevel": "high",
      "trend": "increasing"
    },
    "topCategories": [
      {
        "categoryId": "cat_id",
        "name": "Food",
        "color": "#f97316",
        "icon": "🍔",
        "amount": 15000,
        "percentage": 30,
        "previousAmount": 12000,
        "change": 25
      }
    ],
    "monthlyTrend": [...],
    "budgetVariance": {
      "budget": 40000,
      "actual": 50000,
      "remaining": -10000,
      "percentageUsed": 125,
      "isOverBudget": true,
      "isWarning": true
    },
    "categoryBudgets": [...],
    "alerts": {
      "unusualSpikes": 2,
      "isOverBudget": true,
      "budgetWarning": true,
      "spendingIncreased": true,
      "increasePercentage": 15.5
    }
  }
}
```

### 4. Get Stats
Basic monthly statistics.

**Endpoint:** `GET /api/finance/stats`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| month | string | Format: YYYY-MM |

### 5. Create Expense
Add a new expense.

**Endpoint:** `POST /api/finance/expenses`

**Request Body:**
```json
{
  "amount": 5000,
  "categoryId": "category_id",
  "date": "2024-01-15",
  "note": "Lunch"
}
```

### 6. Get Categories
List all finance categories.

**Endpoint:** `GET /api/finance/categories`

### 7. Budget Management
**Endpoint:** `GET/POST /api/finance/budgets`

**Request Body:**
```json
{
  "amount": 50000,
  "categoryId": null,
  "month": "2024-01"
}
```

## Rate Limiting

All finance endpoints are rate-limited to **100 requests per minute** per IP address.

**Response headers:**
- `X-RateLimit-Limit`: 100
- `X-RateLimit-Remaining`: 95
- `X-RateLimit-Reset`: 1705312800

When rate limited (429):
```json
{
  "success": false,
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

## Performance Targets

- Search queries: < 500ms response time
- Analytics calculations: < 1s response time
- Pagination supports up to 10,000 transactions
