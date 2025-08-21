# Day Planner Backend API

A robust backend API for a day planner application built with Express.js, TypeScript, and SQLite. This API provides comprehensive CRUD operations for managing tasks, events, and categories with advanced filtering, pagination, and validation.

## 🚀 Features

- **Task Management**: Create, update, delete, and organize tasks with priorities and due dates
- **Event Management**: Schedule and manage events with date ranges and locations  
- **Category System**: Organize tasks and events with color-coded categories
- **Advanced Filtering**: Filter by completion status, priority, categories, and date ranges
- **Pagination**: Efficient data retrieval with customizable page sizes
- **Input Validation**: Comprehensive validation using Joi
- **Error Handling**: Robust error handling with descriptive messages
- **TypeScript**: Full type safety and excellent developer experience
- **SQLite Database**: Lightweight, serverless database with foreign key constraints

## 📋 Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd day-planner-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file** (optional):
   ```bash
   cp .env.example .env
   ```

4. **Initialize the database**:
   ```bash
   npm run db:init
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001` by default.

## 📜 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:init` - Initialize SQLite database
- `npm test` - Run tests (Jest)

## 🗄️ Database Schema

### Tables

#### Categories
- `id` (TEXT, PRIMARY KEY) - UUID
- `name` (TEXT, NOT NULL, UNIQUE) - Category name
- `color` (TEXT, NOT NULL) - Hex color code
- `description` (TEXT, OPTIONAL) - Category description
- `createdAt` (TEXT, NOT NULL) - ISO timestamp
- `updatedAt` (TEXT, NOT NULL) - ISO timestamp

#### Tasks
- `id` (TEXT, PRIMARY KEY) - UUID
- `title` (TEXT, NOT NULL) - Task title
- `description` (TEXT, OPTIONAL) - Task description
- `completed` (BOOLEAN, DEFAULT FALSE) - Completion status
- `priority` (TEXT, DEFAULT 'medium') - Priority level (low, medium, high)
- `dueDate` (TEXT, OPTIONAL) - ISO date string
- `categoryId` (TEXT, FOREIGN KEY) - Reference to categories.id
- `createdAt` (TEXT, NOT NULL) - ISO timestamp
- `updatedAt` (TEXT, NOT NULL) - ISO timestamp

#### Events
- `id` (TEXT, PRIMARY KEY) - UUID
- `title` (TEXT, NOT NULL) - Event title
- `description` (TEXT, OPTIONAL) - Event description
- `startDate` (TEXT, NOT NULL) - ISO datetime string
- `endDate` (TEXT, NOT NULL) - ISO datetime string
- `allDay` (BOOLEAN, DEFAULT FALSE) - All-day event flag
- `location` (TEXT, OPTIONAL) - Event location
- `categoryId` (TEXT, FOREIGN KEY) - Reference to categories.id
- `createdAt` (TEXT, NOT NULL) - ISO timestamp
- `updatedAt` (TEXT, NOT NULL) - ISO timestamp

## 🔌 API Endpoints

### Health Check
- `GET /api/health` - API health status

### Categories

#### Get All Categories
```http
GET /api/categories?sortBy=name&sortOrder=asc
```

#### Get Category by ID
```http
GET /api/categories/:id
```

#### Get Category Usage Statistics
```http
GET /api/categories/:id/usage
```

#### Create Category
```http
POST /api/categories
Content-Type: application/json

{
  "name": "Work",
  "color": "#3B82F6",
  "description": "Work-related tasks and events"
}
```

#### Update Category
```http
PUT /api/categories/:id
Content-Type: application/json

{
  "name": "Personal",
  "color": "#EF4444"
}
```

#### Delete Category
```http
DELETE /api/categories/:id
```

#### Force Delete Category
```http
DELETE /api/categories/:id/force
```

#### Get Category Statistics
```http
GET /api/categories/stats/summary
```

### Tasks

#### Get All Tasks
```http
GET /api/tasks?page=1&limit=20&completed=false&priority=high&categoryId=uuid&dueDateFrom=2024-01-01&dueDateTo=2024-12-31&sortBy=dueDate&sortOrder=asc
```

#### Get Task by ID
```http
GET /api/tasks/:id
```

#### Create Task
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "Complete project proposal",
  "description": "Finish the Q1 project proposal document",
  "priority": "high",
  "dueDate": "2024-01-15T10:00:00.000Z",
  "categoryId": "category-uuid"
}
```

#### Update Task
```http
PUT /api/tasks/:id
Content-Type: application/json

{
  "title": "Updated task title",
  "completed": true,
  "priority": "medium"
}
```

#### Toggle Task Completion
```http
PATCH /api/tasks/:id/toggle
```

#### Delete Task
```http
DELETE /api/tasks/:id
```

#### Get Task Statistics
```http
GET /api/tasks/stats/summary
```

### Events

#### Get All Events
```http
GET /api/events?page=1&limit=20&categoryId=uuid&startDateFrom=2024-01-01&startDateTo=2024-12-31&sortBy=startDate&sortOrder=asc
```

#### Get Event by ID
```http
GET /api/events/:id
```

#### Get Events in Date Range
```http
GET /api/events/range/2024-01-01T00:00:00.000Z/2024-01-31T23:59:59.999Z
```

#### Create Event
```http
POST /api/events
Content-Type: application/json

{
  "title": "Team Meeting",
  "description": "Weekly team sync meeting",
  "startDate": "2024-01-15T14:00:00.000Z",
  "endDate": "2024-01-15T15:00:00.000Z",
  "allDay": false,
  "location": "Conference Room A",
  "categoryId": "category-uuid"
}
```

#### Update Event
```http
PUT /api/events/:id
Content-Type: application/json

{
  "title": "Updated meeting title",
  "location": "Virtual - Zoom"
}
```

#### Delete Event
```http
DELETE /api/events/:id
```

#### Get Today's Events
```http
GET /api/events/filter/today
```

#### Get This Week's Events
```http
GET /api/events/filter/week
```

#### Get Events for Specific Month
```http
GET /api/events/month/2024/1
```

## 📝 Request/Response Format

### Standard Response Format
```json
{
  "success": boolean,
  "data": object | array,
  "message": string,
  "error": string
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## 🎨 Query Parameters

### Pagination
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `sortBy` (string) - Field to sort by
- `sortOrder` ('asc' | 'desc', default: 'desc') - Sort direction

### Task Filters
- `completed` (boolean) - Filter by completion status
- `priority` ('low' | 'medium' | 'high') - Filter by priority
- `categoryId` (UUID) - Filter by category
- `dueDateFrom` (ISO date) - Filter tasks due from this date
- `dueDateTo` (ISO date) - Filter tasks due until this date

### Event Filters
- `categoryId` (UUID) - Filter by category
- `startDateFrom` (ISO datetime) - Filter events starting from this date
- `startDateTo` (ISO datetime) - Filter events starting until this date

## 🔒 Validation Rules

### Category
- `name`: Required, 1-100 characters, must be unique
- `color`: Required, valid hex color code (#RRGGBB or #RGB)
- `description`: Optional, max 500 characters

### Task
- `title`: Required, 1-255 characters
- `description`: Optional, max 1000 characters
- `priority`: Optional, one of: 'low', 'medium', 'high'
- `dueDate`: Optional, valid ISO date
- `categoryId`: Optional, valid UUID

### Event
- `title`: Required, 1-255 characters
- `description`: Optional, max 1000 characters
- `startDate`: Required, valid ISO datetime
- `endDate`: Required, valid ISO datetime (must be after startDate)
- `allDay`: Optional, boolean
- `location`: Optional, max 255 characters
- `categoryId`: Optional, valid UUID

## 🚨 Error Codes

- `400` - Bad Request (Validation errors)
- `404` - Not Found (Resource doesn't exist)
- `409` - Conflict (Duplicate resource)
- `500` - Internal Server Error

## 🧪 Testing

To test the API, you can use tools like:
- **Postman**: Import the collection (create one from this documentation)
- **curl**: Command-line HTTP client
- **HTTPie**: User-friendly HTTP client
- **Insomnia**: REST client

Example curl request:
```bash
# Create a new task
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task",
    "priority": "medium"
  }'
```

## 🔧 Configuration

Environment variables (optional):
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Troubleshooting

### Common Issues

1. **Database locked error**: Make sure only one instance is running
2. **Port already in use**: Change the PORT environment variable
3. **TypeScript compilation errors**: Run `npm run build` to check for issues

### Support

For support or questions, please open an issue in the repository.
