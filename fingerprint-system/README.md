# Fingerprint System - Child Registration & Biometric Management

A comprehensive web-based application for managing child registrations with biometric fingerprint capture, user management, role-based access control, and offline support.

## Features

### Core Features
- **Child Registration** - Register new children with personal information and optional photos
- **Fingerprint Capture** - Capture and store biometric fingerprint data
- **Fingerprint Verification** - Verify existing children using fingerprint scanning
- **Offline Mode** - Work offline and sync data when connection is restored
- **Print Reports** - Generate and print reports for registrations and fingerprints
- **User Tracking** - Track who registered each child with timestamps

### User Management
- **Role-Based Access Control** - Different dashboards for different roles
- **JWT Authentication** - Secure login with JSON Web Tokens
- **User CRUD Operations** - Create, read, update, delete system users
- **Role Management** - Create and manage user roles
- **Permission Management** - Assign permissions to roles
- **Audit Logs** - Track system activities

### Dashboards by Role
- **Super User** - Full system access and management
- **Nurse** - Child registration and fingerprint capture
- **Doctor** - Medical records and patient care
- **Lab Technician** - Laboratory results and tests
- **Pharmacist** - Pharmacy and medication management
- **Staff** - Basic system access

## Technology Stack

### Frontend
- **React 18** - UI framework
- **React Router DOM** - Navigation and routing
- **CSS3** - Styling with responsive design
- **WebRTC** - Camera access for photos


## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn package manager
- Modern web browser with camera support

## Installation
- Navigate to fingerprint-system folder(cd fingerprint-system)
- install  Install Frontend Dependencies(npm install)
- Run the project(npm run dev)

### 1. Clone the repository

```bash
git clone https://github.com/psychopods/medical.Sys.git
cd medical.Sys

###  System APIs

# Authentication
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/reset-password

# Categories
GET    /api/permission_categories
POST   /api/permission_categories
PUT    /api/permission_categories/{id}
DELETE /api/permission_categories/{id}

# Permissions
GET    /api/permissions
POST   /api/permissions
PUT    /api/permissions/{id}
DELETE /api/permissions/{id}

# Roles
GET    /api/roles
POST   /api/roles
PUT    /api/roles/{id}
DELETE /api/roles/{id}

# Role Permissions
GET    /api/roles/{roleId}/permissions
POST   /api/roles/{roleId}/permissions
DELETE /api/roles/{roleId}/permissions/{permissionId}

# Staff Users
GET    /api/staff_users
POST   /api/staff_users
PUT    /api/staff_users/{id}
DELETE /api/staff_users/{id}
GET    /api/staff_users/generate_username

# Other
GET    /api/online_users
GET    /api/audit_logs
POST   /api/send_credentials

# Child Management
GET    /api/child_locations
GET    /api/children_profiles
POST   /api/children_profiles ------ register new child
GET    /api/children_profiles/generate_id
GET    /api/biometric_fingerprints