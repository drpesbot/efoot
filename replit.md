# eFootball Mobile 2025 Player Management System

## Overview

This is a Flask-based web application for managing eFootball Mobile 2025 players. The system provides a player database with CRUD operations, real-time updates via WebSockets, and an admin interface for managing player data. The application supports Arabic RTL layout and includes player statistics, images, and playing styles management.

## System Architecture

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **Database**: SQLAlchemy ORM with SQLite (configurable to PostgreSQL via DATABASE_URL)
- **Real-time Communication**: Flask-SocketIO for WebSocket connections
- **Image Processing**: PIL (Pillow) for image resizing and optimization
- **Session Management**: Flask sessions with configurable secret key

### Frontend Architecture
- **UI Framework**: Tailwind CSS for responsive design
- **Icons**: Font Awesome for UI icons
- **Real-time Updates**: Socket.IO client for live data synchronization
- **Layout**: Arabic RTL support with modern glass-effect design
- **JavaScript**: Vanilla JS for client-side interactions

### Security
- **Admin Authentication**: Simple password-based admin access (session-based)
- **File Upload Security**: Restricted file types and size limits (16MB max)
- **Input Validation**: Secure filename handling and file type validation

## Key Components

### Models (models.py)
- **Player Model**: Core entity with attributes:
  - Basic info: name, rating, position, team, nationality, age
  - Media: image_path for player photos
  - Advanced data: JSON-stored stats and playing styles
  - Timestamps: created_at for tracking

### Routes (routes.py)
- **Public Routes**: 
  - `/` - Main player listing page
  - `/api/players` - Player data API
- **Admin Routes**:
  - `/api/check_admin` - Admin authentication
  - `/api/add_player` - Player creation
  - `/api/delete_player` - Player deletion
  - Image upload handling with resizing

### Real-time Features
- **WebSocket Events**:
  - `player_added` - Broadcast new player additions
  - `player_deleted` - Broadcast player removals
  - Live UI updates without page refresh

### File Management
- **Upload Directory**: `static/uploads/` for player images
- **Image Processing**: Automatic resizing to 400x400px thumbnails
- **Security**: Filename sanitization and type validation

## Data Flow

1. **Player Creation**:
   - Admin submits player form → Backend validation → Database storage → WebSocket broadcast → UI update

2. **Player Display**:
   - Page load → API request → Database query → JSON response → Client-side rendering

3. **Real-time Updates**:
   - Admin action → Database operation → SocketIO emission → All connected clients update

4. **Image Upload**:
   - File selection → Validation → Secure storage → Image resizing → Database path update

## External Dependencies

### Python Packages
- Flask: Web framework
- Flask-SQLAlchemy: Database ORM
- Flask-SocketIO: WebSocket support
- Pillow: Image processing
- Werkzeug: WSGI utilities

### Frontend Libraries
- Tailwind CSS 2.2.19: Utility-first CSS framework
- Font Awesome 6.4.0: Icon library
- Socket.IO: Real-time communication

### Environment Variables
- `SESSION_SECRET`: Flask session encryption key
- `DATABASE_URL`: Database connection string (defaults to SQLite)
- `ADMIN_PASSWORD`: Admin authentication password

## Deployment Strategy

### Development Setup
- **Entry Point**: `main.py` runs Flask-SocketIO server
- **Configuration**: Environment-based settings with sensible defaults
- **Database**: Auto-creates tables on startup
- **Static Files**: Served from `static/` directory

### Production Considerations
- **Database**: Configurable via DATABASE_URL (supports PostgreSQL)
- **Proxy Support**: ProxyFix middleware for reverse proxy deployment
- **File Storage**: Local filesystem (can be extended to cloud storage)
- **Security**: Admin password should be hashed and stored securely

### Scalability Features
- **Connection Pooling**: SQLAlchemy engine with pool recycling
- **CORS Support**: SocketIO configured for cross-origin requests
- **Image Optimization**: Automatic resizing reduces storage requirements

## Changelog

- June 28, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.