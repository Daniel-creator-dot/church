# Bethel Baptist Church Management System

A comprehensive church management system with member management, donations, events, ministries, and reports.

## Features

- Member management and tracking
- Visitor registration and follow-up
- Attendance tracking
- Donation and giving management
- Event management
- Ministry/Department organization
- Live stream integration
- Bookstore management
- Prayer requests
- Announcements
- Devotional content
- Financial reports
- Multi-church support
- Role-based access control (Super Admin, Pastor, Church Administrator, Finance Officer, Department Leader, Media, Member)

## Tech Stack

- **Frontend:** React with TypeScript, Vite
- **Backend:** Express.js
- **Database:** SQLite
- **Styling:** CSS

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file based on `.env.example` and configure your settings

3. Initialize the database:
   ```bash
   node server/init-db.js
   ```

4. Start the backend server:
   ```bash
   node server/index.js
   ```

5. In a new terminal, start the frontend:
   ```bash
   npm run dev
   ```

## Default Admin

After initializing the database, you can create an admin user:
```bash
node server/add-admin.js
```

## Project Structure

- `src/` - React frontend components and logic
- `server/` - Express.js backend API and database
- `server/routes/` - API route handlers
- `server/schema.sql` - Database schema
