# StayHub – House Booking System

A full-stack web application for booking houses, apartments, and vacation homes at affordable prices. StayHub connects guests with property owners, providing a safe, private, and cost-effective alternative to hotels.

## Features

### For Guests
- User registration and authentication
- Search properties by location, price, and availability
- View detailed property information with images and amenities
- Book properties with date selection
- View and manage booking history
- Cancel bookings before check-in date
- Leave reviews and ratings
- Add properties to wishlist
- Contact hosts

### For Hosts
- Register as a property owner
- Add, edit, and delete property listings
- Upload property images
- Set pricing, availability, and house rules
- View and manage booking requests
- Accept or reject bookings
- View reviews for owned properties

### For Admins
- Admin dashboard with system statistics
- Manage users (activate, deactivate, delete)
- Manage property listings
- Monitor all bookings
- View system analytics

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL (Remote - FreeSQLDatabase)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Git

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=sql12.freesqldatabase.com
DB_NAME=sql12813205
DB_USER=sql12813205
DB_PASSWORD=T5FQwZnk7r
DB_PORT=3306

# JWT Secret
JWT_SECRET=your-secret-key-change-in-production

# Server Port
PORT=3000
```

**Note**: The database credentials are already configured. You can use them directly or update with your own database credentials.

### 4. Initialize Database

Run the database initialization script to create all necessary tables:

```bash
node database/init.js
```

This will:
- Create all required database tables
- Set up indexes for better performance
- Create a default admin user:
  - **Username**: `admin`
  - **Password**: `admin123`
  - **Email**: `admin@stayhub.com`

### 5. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Project Structure

```
Project/
├── config/
│   └── database.js          # Database connection configuration
├── database/
│   ├── schema.sql           # Database schema
│   └── init.js              # Database initialization script
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── properties.js        # Property management routes
│   ├── bookings.js          # Booking management routes
│   ├── reviews.js           # Review routes
│   ├── wishlist.js          # Wishlist routes
│   ├── notifications.js     # Notification routes
│   └── admin.js             # Admin routes
├── public/
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   ├── js/
│   │   ├── auth.js          # Authentication utilities
│   │   ├── api.js           # API utility functions
│   │   └── main.js          # Main page functionality
│   ├── index.html           # Homepage
│   ├── login.html           # Login page
│   ├── register.html        # Registration page
│   ├── properties.html      # Properties listing page
│   ├── property-details.html # Property details page
│   ├── profile.html         # User profile page
│   ├── bookings.html        # Bookings page
│   ├── wishlist.html        # Wishlist page
│   ├── host-dashboard.html  # Host dashboard
│   └── admin-dashboard.html # Admin dashboard
├── server.js                # Express server setup
├── package.json             # Project dependencies
├── .gitignore              # Git ignore file
└── README.md               # This file
```

## Database Schema

The database includes the following tables:

- **users**: User accounts (guests, hosts, admins)
- **properties**: Property listings
- **bookings**: Booking records
- **reviews**: Property reviews and ratings
- **wishlist**: User wishlist items
- **notifications**: System notifications

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id/status` - Update user status (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Properties
- `GET /api/properties` - Get all properties (with filters)
- `GET /api/properties/featured` - Get featured properties
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property (Host/Admin only)
- `PUT /api/properties/:id` - Update property (Host/Admin only)
- `DELETE /api/properties/:id` - Delete property (Host/Admin only)
- `GET /api/properties/host/my-properties` - Get host's properties

### Bookings
- `POST /api/bookings` - Create booking (Guest only)
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/status` - Update booking status (Host/Admin only)
- `PUT /api/bookings/:id/cancel` - Cancel booking (Guest only)
- `GET /api/bookings/admin/all` - Get all bookings (Admin only)

### Reviews
- `POST /api/reviews` - Create review (Guest only)
- `GET /api/reviews/property/:property_id` - Get property reviews

### Wishlist
- `POST /api/wishlist/:property_id` - Add to wishlist
- `DELETE /api/wishlist/:property_id` - Remove from wishlist
- `GET /api/wishlist` - Get user's wishlist

### Notifications
- `GET /api/notifications` - Get user's notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/properties` - Get all properties (Admin view)

## Default Accounts

After running the database initialization:

- **Admin Account**:
  - Username: `admin`
  - Password: `admin123`
  - Role: Admin

## Usage Guide

### For Guests

1. **Register/Login**: Create an account or login with existing credentials
2. **Browse Properties**: Use the search and filter options to find properties
3. **View Details**: Click on any property to see detailed information
4. **Book Property**: Select check-in and check-out dates, then submit booking request
5. **Manage Bookings**: View all your bookings and cancel if needed (before check-in)
6. **Add to Wishlist**: Save favorite properties for later
7. **Leave Reviews**: Review properties after your stay

### For Hosts

1. **Register as Host**: Select "List my property (Host)" during registration
2. **Add Property**: Go to Host Dashboard and add your property details
3. **Manage Listings**: Edit or delete your property listings
4. **Handle Bookings**: Accept or reject booking requests from guests
5. **View Reviews**: See what guests say about your properties

### For Admins

1. **Login**: Use the admin account credentials
2. **Dashboard**: View system statistics and analytics
3. **Manage Users**: Activate, deactivate, or delete user accounts
4. **Manage Properties**: View and delete any property listing
5. **Monitor Bookings**: View all bookings in the system

## Error Handling

The application includes comprehensive error handling for:
- Database connection errors
- Authentication failures
- Validation errors
- Network errors
- Authorization errors

All errors are returned with meaningful messages to help users understand what went wrong.

## Security Features

- Password hashing using bcryptjs
- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- CORS configuration

## Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify your database credentials in `.env`
2. Check if the database server is accessible
3. Ensure the database exists and is active
4. Check firewall settings if using a remote database

### Port Already in Use

If port 3000 is already in use:

1. Change the PORT in `.env` file
2. Or stop the process using port 3000

### Module Not Found Errors

If you get module not found errors:

```bash
npm install
```

### Database Tables Not Created

If tables are missing:

```bash
node database/init.js
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please create an issue in the repository.

## Future Enhancements

- Image upload functionality
- Payment integration
- Email notifications
- Advanced search with map integration
- Real-time chat between guests and hosts
- Mobile app version

---

**StayHub** - Affordable housing for everyone! 🏠

