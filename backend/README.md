# QuickServe Backend

Backend server for QuickServe Restaurant Management System.

## Features

- RESTful API for menu, orders, users, and analytics
- Real-time WebSocket communication
- JWT authentication
- MongoDB database
- Automatic inventory management
- Order tracking and analytics

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`

3. Start MongoDB

4. Run the server:
```bash
npm run dev
```

## API Documentation

See the main README in the admin folder for complete API documentation.

## Environment Variables

- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `ADMIN_USERNAME` - Admin username
- `ADMIN_PASSWORD` - Admin password
