# TokTickIT 

## Prerequisites
- Node.js (v18+)
- PostgreSQL (e.g., via pgAdmin)

## Database Setup
1. Open pgAdmin (or your preferred PostgreSQL client) and create a new database named `toktickit`.
2. Copy `.env.example` to `.env` in the root and/or server directories.
3. Update `DATABASE_URL` in `.env` with your postgres credentials. 
   Example: `DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/toktickit?schema=public"`

## Installation
Run `npm install` in both the client and server directories:
```bash
cd server
npm install
cd ../client
npm install
```

## Running the Application
**Backend (Server)**
```bash
cd server
npm run dev
```

**Frontend (Client)**
```bash
cd client
npm run dev
```

## Testing
Run tests for both ends:
```bash
# Server tests
cd server
npm run test

# Client tests
cd client
npm run test
```