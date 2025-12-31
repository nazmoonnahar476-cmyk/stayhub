# Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Create .env File
Create a `.env` file in the root directory with the following content:

```env
DB_HOST=sql12.freesqldatabase.com
DB_NAME=sql12813205
DB_USER=sql12813205
DB_PASSWORD=T5FQwZnk7r
DB_PORT=3306
JWT_SECRET=nazmoonnahar476
PORT=3000

```

## Step 3: Initialize Database
```bash
npm run init-db
```

Or:
```bash
node database/init.js
```

## Step 4: Start the Server
```bash
npm start
```

For development (with auto-reload):
```bash
npm run dev
```

## Step 5: Access the Application
Open your browser and go to: `http://localhost:3000`

## Default Admin Account
- **Username**: `admin`
- **Password**: `admin123`

## Testing the Application

1. **As a Guest**:
   - Register a new account
   - Browse properties
   - Book a property
   - View your bookings

2. **As a Host**:
   - Register with role "Host"
   - Add a property listing
   - Manage bookings

3. **As an Admin**:
   - Login with admin credentials
   - Access admin dashboard
   - Manage users and properties

## Troubleshooting

### Database Connection Error
- Verify database credentials in `.env`
- Check if the database server is accessible
- Ensure the database exists

### Port Already in Use
- Change PORT in `.env` file
- Or stop the process using port 3000

### Module Not Found
```bash
npm install
```

### Tables Not Created
```bash
npm run init-db
```

