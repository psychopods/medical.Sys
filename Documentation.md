# Street Children Fingerprint Management System (TRHM)
## Comprehensive Technical Documentation & System Reference

**Document Version:** 1.1  
**Prepared By:** MITzKITs Development Team  
**Approved By:** Project Management & Operations  
**Date:** August 2026  

---

### Document Revision History

| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| **1.0** | 15 June 2026 | MITzKITs Development Team | Initial Architectural Release |
| **1.1** | 19 August 2026 | MITzKITs Development Team | Comprehensive Documentation Refactoring, RBAC Matrix Update, Dynamic Services Admin & Offline Sync Engine Enhancements |

---

## Table of Contents

- [Acronyms and Abbreviations](#acronyms-and-abbreviations)
- [Chapter 1: Project Introduction](#chapter-1-project-introduction)
  - [1.1 Executive Summary](#11-executive-summary)
  - [1.2 Business Problem](#12-business-problem)
  - [1.3 System Objectives](#13-system-objectives)
  - [1.4 Project Scope](#14-project-scope)
- [Chapter 2: System Architecture & Technology Stack](#chapter-2-system-architecture--technology-stack)
  - [2.1 High-Level Multi-Tier Architecture](#21-high-level-multi-tier-architecture)
  - [2.2 System Use Cases](#22-system-use-cases)
  - [2.3 Technology Stack](#23-technology-stack)
  - [2.4 System & Environment Requirements](#24-system--environment-requirements)
- [Chapter 3: System Modules and User Interfaces](#chapter-3-system-modules-and-user-interfaces)
  - [3.1 Overview](#31-overview)
  - [3.2 Public Pages](#32-public-pages)
  - [3.3 Operational Dashboard Modules](#33-operational-dashboard-modules)
- [Chapter 4: User Roles & Access Control (RBAC)](#chapter-4-user-roles--access-control-rbac)
  - [4.1 Overview](#41-overview)
  - [4.2 User Roles & Responsibilities](#42-user-roles--responsibilities)
  - [4.3 RBAC Permission Model](#43-rbac-permission-model)
  - [4.4 Role-Based Access Control Matrix](#44-role-based-access-control-matrix)
- [Chapter 5: Data Model & Database Schema](#chapter-5-data-model--database-schema)
  - [5.1 Overview](#51-overview)
  - [5.2 Entity Relationship Model](#52-entity-relationship-model)
  - [5.3 Core Database Entities](#53-core-database-entities)
  - [5.4 Entity Relationships](#54-entity-relationships)
  - [5.5 Data Integrity & Security Controls](#55-data-integrity--security-controls)
- [Chapter 6: REST API Reference](#chapter-6-rest-api-reference)
  - [6.1 Introduction & Architecture](#61-introduction--architecture)
  - [6.2 Authentication & Authorization Headers](#62-authentication--authorization-headers)
  - [6.3 Standard API Response Structure](#63-standard-api-response-structure)
  - [6.4 Endpoints Directory](#64-endpoints-directory)
  - [6.5 HTTP Status Codes](#65-http-status-codes)
- [Chapter 7: Offline Synchronization Engine](#chapter-7-offline-synchronization-engine)
  - [7.1 Overview & Architecture](#71-overview--architecture)
  - [7.2 Synchronization Process & Workflow](#72-synchronization-process--workflow)
  - [7.3 Synchronization API Endpoints](#73-synchronization-api-endpoints)
  - [7.4 Conflict Resolution Policies](#74-conflict-resolution-policies)
  - [7.5 Synchronization Status Indicators](#75-synchronization-status-indicators)
- [Chapter 8: Security Architecture](#chapter-8-security-architecture)
- [Chapter 9: Deployment & Installation Guide](#chapter-9-deployment--installation-guide)
- [Chapter 10: Maintenance & Troubleshooting](#chapter-10-maintenance--troubleshooting)
- [Appendices](#appendices)

---

## Acronyms and Abbreviations

| Acronym | Full Form |
| :--- | :--- |
| **API** | Application Programming Interface |
| **RBAC** | Role-Based Access Control |
| **JWT** | JSON Web Token |
| **ERD** | Entity Relationship Diagram |
| **SDK** | Software Development Kit |
| **OTP** | One-Time Password |
| **UI / UX** | User Interface / User Experience |
| **REST** | Representational State Transfer |
| **TRHM** | Tanzania Rural Health Movement |
| **UUID** | Universally Unique Identifier |
| **PWA** | Progressive Web Application |

---

## Chapter 1: Project Introduction

### 1.1 Executive Summary
The **Street Children Fingerprint Management System** is an enterprise-grade biometric identification, healthcare management, and record-tracking platform engineered specifically for the **Tanzania Rural Health Movement (TRHM)**. The platform enables healthcare practitioners, outreach workers, and administrative personnel to register vulnerable street children, enroll biometric fingerprint templates, verify identities in real time, record medical treatments, and manage outreach programs across online and offline field environments.

By integrating biometric fingerprint recognition with an offline-first architecture, the platform eliminates identity ambiguity, prevents duplicate registrations, ensures continuity of care, and safeguards sensitive health and demographic data.

---

### 1.2 Business Problem
Non-Governmental Organizations (NGOs) and healthcare outreach teams serving street children face severe operational obstacles:
- **High Identity Ambiguity:** Street children often lack formal identification documents, birth certificates, or permanent home addresses.
- **Duplicate Registrations:** Children may register under different names across outreach locations, skewing organizational metrics and leading to redundant medical interventions.
- **Inconsistent Medical Histories:** Without reliable identification, tracking vaccination histories, recurring medical conditions, and prescribed treatments becomes unreliable.
- **Unreliable Network Infrastructure:** Field outreach activities take place in remote or low-connectivity zones where continuous internet access cannot be guaranteed.
- **Manual Data Processing Bottlenecks:** Paper-based registries are vulnerable to damage, loss, security breaches, and inefficient querying.

The platform directly resolves these challenges through biometric identification, localized offline storage, automated background synchronization, and granular Role-Based Access Control.

---

### 1.3 System Objectives
The primary technical and operational objectives of the system are:
1. **Biometric Identity Resolution:** Uniquely identify street children using biometric fingerprint matching ($1:1$ verification and $1:N$ identification).
2. **Duplicate Prevention:** Eliminate duplicate registration entries across outreach centers.
3. **Offline Field Continuity:** Provide seamless offline data entry, biometric matching, and record creation via local database caching.
4. **Data Synchronization Engine:** Automatically push local offline edits and pull server updates upon network reconnection.
5. **Role-Scoped Security:** Enforce strict access control through granular RBAC permissions.
6. **Outreach & Public Engagement:** Provide dynamic public outreach management tools to showcase programs, emergency services, and community impact.

---

### 1.4 Project Scope

#### In Scope
- **Staff Authentication:** Secure login via JWT, session persistence, password reset flow, and HttpOnly cookies.
- **User & Role Management:** Creation, editing, role mapping, and permission assignment for system operators.
- **Patient Demographics & Photo Registration:** Capturing child profiles, estimated birth year, gender, primary outreach location, and photos.
- **Biometric Fingerprint Module:** Enrollment, template quality scoring, $1:1$ verification, and $1:N$ identification using hardware fingerprint scanners.
- **Dynamic Public Services System:** Backend REST API, database table (`public_services`), public view (`/services`), and administrator management dashboard (`/services-admin`).
- **Dashboard Analytics:** Real-time metrics on registered patients, biometric enrollments, active staff, and system notifications.
- **Offline Synchronization Engine:** SQLite local storage, sync status tracking, conflict resolution policies, and delta synchronization endpoints.
- **Audit Logging & System Security:** Comprehensive audit logs for patient modifications, user access, and biometric activities.

#### Out of Scope
- Financial accounting and payroll management.
- Native mobile application builds (iOS / Android app store releases; covered via Progressive Web App - PWA).
- SMS gateway dispatching (password recovery uses internal OTP and verification tokens).
- External National ID / Passports registry integrations.

---

## Chapter 2: System Architecture & Technology Stack

### 2.1 High-Level Multi-Tier Architecture

The platform follows a multi-tier client-server architecture. Presentation, business logic, data storage, and biometric engine layers are decoupled to maximize scalability, security, and maintainability.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           System End Users                              │
│ ─────────────────────────────────────────────────────────────────────── │
│   Super User  │  Nurse  │  Doctor  │  Lab Tech  │  Pharmacist  │ Staff  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Front-End Application (PWA)                       │
│ ─────────────────────────────────────────────────────────────────────── │
│  • React 18 & Vite              • WebRTC Camera Module                  │
│  • React Router DOM (v6)        • Offline SQLite Engine (sql.js / WASM) │
│  • Vanilla CSS Modern Design    • Biometric Hardware SDK Bridge         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / REST / JWT
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Express.js REST API                            │
│ ─────────────────────────────────────────────────────────────────────── │
│  • Authentication Middleware    • Patient & Biometric Router            │
│  • RBAC Permission Validator    • Offline Sync Engine Routes            │
│  • Public Services API          • Audit Logger & Notification Service   │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
                    ▼                                 ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│       Central MySQL Database          │ │    Fingerprint Engine & SDK   │
│ ───────────────────────────────────── │ │ ───────────────────────────── │
│  • Staff Users & RBAC Permissions     │ │  • Template Extractor         │
│  • Patients & Biometric Templates     │ │  • Quality Rating Validator   │
│  • Outreach Locations                 │ │  • 1:1 Matcher                │
│  • Public Services & Audit Logs       │ │  • 1:N Identifier             │
└───────────────────────────────────────┘ └───────────────────────────────┘
```

---

### 2.2 System Use Cases

The primary interaction workflows between system actors and application features are detailed below:

```
┌─────────────────┐       ┌──────────────────────────────────────────┐
│   Super User    │ ────► │ Manage Users, Roles, Permissions & Audit │
└─────────────────┘       └──────────────────────────────────────────┘
                                 │
┌─────────────────┐              ├─────► Manage Public Services (/services-admin)
│  Nurse / Staff  │ ────► ┌──────┴───────────────────────────────────┐
└─────────────────┘       │ Register Patient, Capture & Enroll Fingerprints
                          └──────┬───────────────────────────────────┘
                                 │
┌─────────────────┐              ├─────► Perform Offline Operations & Data Sync
│ Doctor / Lab    │ ────► ┌──────┴───────────────────────────────────┐
└─────────────────┘       │ Perform Biometric Verification (1:1 & 1:N)│
                          └──────────────────────────────────────────┘
```

---

### 2.3 Technology Stack

| Architecture Layer | Technology / Library | Purpose & Function |
| :--- | :--- | :--- |
| **Front-End Core** | React 18 & Vite | Single Page Application framework and ultra-fast bundler |
| **Routing** | React Router DOM v6 | Declarative client-side routing and protected route guards |
| **Styling & UI** | Vanilla CSS3 | Custom responsive design system, dark glassmorphism, and animations |
| **Biometric Capture** | Hardware SDK / WebSockets | Direct communication with USB fingerprint scanner devices |
| **Camera Access** | WebRTC API | Direct browser media capture for patient identification photos |
| **Offline Storage** | SQLite (sql.js / WASM) | Local browser storage for full offline patient registration and biometrics |
| **Back-End Core** | Node.js & Express.js | Scalable REST API application server written in TypeScript |
| **Database** | MySQL 8.0+ | Relational primary database storing staff, patients, templates, and audit logs |
| **Security & Auth** | JWT (jsonwebtoken) & bcryptjs | Token-based stateless authentication and secure salted password hashing |
| **ORM / Querying** | mysql2/promise | High-performance pooled MySQL connection driver |

---

### 2.4 System & Environment Requirements

#### Minimum System Requirements
- **Node.js:** v18.0.0+
- **Database:** MySQL 8.0+ (or MariaDB 10.5+)
- **Memory (RAM):** 4 GB
- **Browser:** Modern Chromium-based browser (Chrome, Edge, Brave) with WebSockets & WebRTC enabled.
- **Hardware:** Compatible USB Optical Fingerprint Scanner device.

#### Recommended Production Environment
- **Node.js:** v20.x LTS
- **Database:** MySQL 8.0 Enterprise / Cloud Database instance with connection pooling.
- **Memory (RAM):** 8 GB or higher.
- **Network:** HTTPS enabled with TLS 1.3 certificates.

---

## Chapter 3: System Modules and User Interfaces

### 3.1 Overview
The platform consists of two main operational sections: **Public Pages** (accessible to all visitors) and **Dashboard Modules** (restricted to authenticated personnel based on assigned RBAC permissions).

---

### 3.2 Public Pages

#### 1. Home Page (`/home`)
Landing page providing an introduction to TRHM, street children support programs, mission statements, and navigation shortcuts.

#### 2. Login Page (`/login`)
Secure authentication interface allowing staff members to log in using email/username and password. Upon verification, JWT tokens and user permissions are issued.

#### 3. Forgot Password Page (`/forgot-password`)
Self-service credential recovery workflow utilizing verification tokens and email/OTP verification.

#### 4. Street Medicine Page (`/street-medicine`)
Public overview of outreach medical activities, field clinical procedures, and community health interventions.

#### 5. Public Services Page (`/services`)
Dynamic page displaying services provided by TRHM (First Aid, Health Education, Immunizations, Rehabilitation, Hygiene Kits, Emergency Transport). Data is fetched dynamically from `GET /api/public-services`.

#### 6. About Page (`/about`), Gallery Page (`/gallery`), Join Page (`/join`)
Informational pages displaying organizational history, outreach photographs, and volunteer engagement forms.

---

### 3.3 Operational Dashboard Modules

#### 1. Main Dashboard (`/dashboard`)
Operational command center displaying total patient registrations, biometric enrollment counts, active outreach locations, notifications, and recent activity logs.

#### 2. Patient Registration Module (`/patient`)
Allows nurses and staff to create child profiles, capture full names, estimated birth year, gender, assign primary outreach locations, and upload photo identification.

#### 3. Fingerprint Enrollment Module (`/biometrics/enroll`)
Captures optical fingerprint scans, evaluates template quality scores (0–100), binds template strings to patient IDs, and saves enrollment records locally or centrally.

#### 4. Fingerprint Verification Module (`/biometrics/verify`)
Executes $1:1$ template verification against a known patient record or $1:N$ identification search across all registered biometric templates to resolve unidentified patients.

#### 5. Staff Management Module (`/users`)
Allows Super Users to add staff members, update user details, reset passwords, lock/unlock accounts, and assign roles.

#### 6. Role & Permission Management (`/roles`)
Allows Super Users to view role definitions, assign RBAC permissions, and adjust operational access levels.

#### 7. Public Services Manager (`/services-admin`)
Administrative CRUD panel allowing authorized users to create, update, reorder, and delete public services displayed on the main web application.

#### 8. Notifications Module (`/notifications`)
Centralized broadcast system for creating, sending, and viewing organizational announcements and urgent field alerts.

---

## Chapter 4: User Roles & Access Control (RBAC)

### 4.1 Overview
The application enforces strict **Role-Based Access Control (RBAC)**. Every operational action (API endpoint, navigation item, button) is authorized against the authenticated user's permission list.

---

### 4.2 User Roles & Responsibilities

1. **Super User:** Highest administrative authority. Full access to user management, roles, permissions, audit logs, system configurations, and content management.
2. **Nurse:** Field healthcare practitioner responsible for patient registration, biometric enrollment, identity verification, and medical record entry.
3. **Doctor:** Senior medical professional responsible for reviewing patient medical records, diagnosing conditions, verifying identities, and prescribing treatments.
4. **Laboratory Technician:** Specialized healthcare staff responsible for biometric quality assurance, diagnostic lab test logging, and identity resolution.
5. **Pharmacist:** Pharmacy administrator responsible for dispensing medication, reviewing prescription histories, and managing treatment support logs.
6. **Staff Member:** Field outreach assistant responsible for demographic data collection, location assignment, offline data entry, and synchronization.

---

### 4.3 RBAC Permission Model

Authorization decisions follow a strict 4-step hierarchy:

$$\text{User} \longrightarrow \text{Assigned Role} \longrightarrow \text{Permission Slugs} \longrightarrow \text{Granted Access}$$

---

### 4.4 Role-Based Access Control Matrix

| Feature / Permission | Super User | Nurse | Doctor | Lab Tech | Pharmacist | Staff |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Authenticate / Login** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **View Dashboard** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Register Patient** | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| **Update Patient Profile** | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Search & View Patients** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Upload Patient Photograph** | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| **Capture & Enroll Fingerprint**| ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| **Verify Fingerprints (1:1 & 1:N)**| ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Manage Users (`admin:*`)** | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Manage Roles & Permissions** | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Public Services Manager (`/services-admin`)** | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Create System Notifications** | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **View Notifications** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **View System Audit Logs** | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Work Offline (Local SQLite)** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Synchronize Data Engine** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Chapter 5: Data Model & Database Schema

### 5.1 Overview
The database engine is built on MySQL 8.0+ using InnoDB tables, foreign key constraints, UTF8MB4 encoding, and strict indexed primary keys (`UUID` / `CHAR(36)`).

---

### 5.2 Entity Relationship Model

```
 ┌───────────────┐        ┌───────────────┐        ┌──────────────────┐
 │  staff_users  │───────►│     roles     │───────►│ role_permissions │
 └───────┬───────┘        └───────────────┘        └────────┬─────────┘
         │                                                  │
         │                                                  ▼
         │                                         ┌──────────────────┐
         │                                         │   permissions    │
         │                                         └──────────────────┘
         ▼
 ┌───────────────┐        ┌───────────────┐        ┌──────────────────┐
 │   patients    │───────►│  locations    │        │ public_services  │
 └───────┬───────┘        └───────────────┘        └──────────────────┘
         │
         ▼
 ┌───────────────┐        ┌───────────────┐        ┌──────────────────┐
 │  fingerprints │        │ notifications │        │    audit_logs    │
 └───────────────┘        └───────────────┘        └──────────────────┘
```

---

### 5.3 Core Database Entities

#### 1. `staff_users`
Stores user credentials, profile information, and role assignments.
- `id` (`CHAR(36)`, PK)
- `username` (`VARCHAR(50)`, UNIQUE)
- `email` (`VARCHAR(100)`, UNIQUE)
- `password_hash` (`VARCHAR(255)`)
- `role_id` (`CHAR(36)`, FK -> `roles.id`)

#### 2. `patients`
Stores demographic profiles for registered street children.
- `id` (`CHAR(36)`, PK)
- `custom_serial_id` (`VARCHAR(50)`, UNIQUE)
- `full_name` (`VARCHAR(150)`)
- `gender` (`ENUM('Male', 'Female', 'Other')`)
- `estimated_birth_year` (`INT`)
- `primary_location_id` (`CHAR(36)`, FK -> `locations.id`)

#### 3. `fingerprints`
Stores biometric fingerprint templates and quality metrics.
- `id` (`CHAR(36)`, PK)
- `patient_id` (`CHAR(36)`, FK -> `patients.id`)
- `finger_index` (`INT` - 1: R.Thumb, 2: R.Index, etc.)
- `template_data` (`LONGTEXT`)
- `quality_score` (`INT`)

#### 4. `public_services`
Stores dynamic service offerings managed via `/services-admin`.
- `id` (`CHAR(36)`, PK)
- `title` (`VARCHAR(150)`)
- `description` (`TEXT`)
- `image_url` (`VARCHAR(255)`)
- `display_order` (`INT`)
- `version` (`INT`)

---

### 5.4 Sample Data Payloads

#### Sample Patient JSON Entity
```json
{
  "id": "e001b123-3e5f-11ed-b878-0242ac120002",
  "customSerialId": "KID-2026-0042",
  "fullName": "Juma Bakari",
  "gender": "Male",
  "estimatedBirthYear": 2014,
  "primaryLocationId": "loc-9988-7766",
  "createdByStaffId": "staff-3333-2222"
}
```

#### Sample Public Service JSON Entity
```json
{
  "id": "srv-1001-2026",
  "title": "Emergency First Aid & Trauma Care",
  "description": "Immediate wound dressing, infection treatment, and emergency stabilization.",
  "imageUrl": "/images/services/first-aid.jpeg",
  "displayOrder": 1
}
```

---

## Chapter 6: REST API Reference

### 6.1 Introduction & Architecture
All back-end API endpoints accept and return JSON payloads (`Content-Type: application/json`). Requests are served over HTTPS and authenticated via JWT headers or HttpOnly cookies.

---

### 6.2 Authentication Header
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

---

### 6.3 Standard API Response Structure

#### Successful Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

#### Error Response (`400` / `401` / `403` / `500`)
```json
{
  "success": false,
  "message": "Missing required permission: admin:create",
  "error": "Forbidden"
}
```

---

### 6.4 Endpoints Directory Summary

| Method | Endpoint | Description | Auth / Permission |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate staff user & return JWT token | Public |
| `POST` | `/api/auth/logout` | Invalidate active session & clear cookies | Bearer Token |
| `GET` | `/api/patient` | List all registered patient records | `patients:read` |
| `POST` | `/api/patient` | Create a new patient profile | `patients:create` |
| `POST` | `/api/biometrics/enroll` | Enroll fingerprint template for a patient | `biometrics:create` |
| `POST` | `/api/biometrics/verify-1to1` | Verify fingerprint against specific patient | `biometrics:read` |
| `POST` | `/api/biometrics/identify-1toN`| Search database to identify unknown fingerprint | `biometrics:read` |
| `GET` | `/api/public-services` | Fetch list of active public services | Public |
| `POST` | `/api/public-services` | Create new public service card | `admin:create` |
| `PUT` | `/api/public-services/:id` | Update existing service card | `admin:update` |
| `DELETE`| `/api/public-services/:id` | Remove a public service card | `admin:delete` |
| `POST` | `/api/sync/push` | Upload locally created offline records | Bearer Token |
| `GET` | `/api/sync/delta` | Download modified server records since timestamp | Bearer Token |

---

## Chapter 7: Offline Synchronization Engine

### 7.1 Overview & Architecture
The system features an **Offline-First Synchronization Engine**. When field staff operate in remote areas without internet connectivity, the application transparently writes patient profiles, biometric templates, and logs to a local browser-based SQLite database.

---

### 7.2 Synchronization Workflow

```
[Field Staff Action] ──► [Is Online?]
                            │
               ┌────────────┴────────────┐
               ▼ YES                     ▼ NO
       [Send to REST API]       [Save to Local SQLite]
               │                         │
               ▼                         ▼
      [Commit to MySQL]         [Mark is_dirty = 1]
                                         │
                                [Network Restored]
                                         │
                                         ▼
                            [Push Pending Local Changes]
                                         │
                                         ▼
                            [Pull Server Delta Updates]
```

---

### 7.3 Synchronization Status Indicators

| Status Label | Visual Badge | Operational Meaning |
| :--- | :--- | :--- |
| **Online** | 🟢 Green | Connected to API server; live sync active |
| **Offline** | 🔴 Red | Network disconnected; local SQLite saving active |
| **Syncing** | 🟡 Yellow | Delta synchronization in progress |
| **Synced** | 🔵 Blue | All local changes pushed and server updates received |
| **Conflict** | 🟠 Orange | Timestamp collision detected; pending manual resolution |

---

## Chapter 8: Security Architecture

The platform implements multi-layered security controls to protect sensitive demographic and biometric health information:

1. **Stateless JWT Tokens:** Short-lived access tokens signed with HMAC-SHA256 (`JWT_SESSION_SECRET`).
2. **Password Encryption:** Salted password hashing using `bcrypt` (10 rounds).
3. **Database Integrity:** Primary/Foreign key strict constraints and referential integrity actions (`ON DELETE RESTRICT` / `ON DELETE CASCADE`).
4. **Audit Trail Logging:** Every critical modification (patient registration, biometric match, permission update) writes an entry to `audit_logs`.
5. **XSS & Injection Protection:** Parameterized MySQL queries via `mysql2` drivers prevent SQL injection vulnerabilities.

---

## Chapter 9: Deployment & Installation Guide

### 1. Clone Project Repository
```bash
git clone https://github.com/psychopods/medical.Sys.git
cd medical.Sys
```

### 2. Configure Back-End API
```bash
cd API
npm install
cp .env.example .env
# Configure PORT, DB_HOST, DB_PORT, USER_ROOT, DB_PASSWORD, JWT_SESSION_SECRET
npm run dev
```

### 3. Configure Front-End Application
```bash
cd ../fingerprint-system
npm install
npm run dev
```

### 4. Database Setup
```bash
mysql -u root -p < API/database/MYSQL/MySQL_SYS_Database.sql
```

---

## Chapter 10: Maintenance & Troubleshooting

### Common Operational Errors & Resolutions

#### 1. `401 Unauthorized: {"message":"Missing session token."}`
- **Cause:** Missing or expired JWT Authorization header.
- **Resolution:** Log out and log back in to refresh storage tokens.

#### 2. `Fingerprint Scanner Not Detected`
- **Cause:** USB hardware scanner disconnected or SDK service inactive.
- **Resolution:** Verify scanner USB connection, restart browser SDK bridge service, and refresh page.

#### 3. `Offline Sync Conflict (Status 409)`
- **Cause:** Record modified concurrently on server and offline client.
- **Resolution:** Engine applies "Server-Wins" rule or presents collision in administrative sync logs.

---

## Appendices

### Appendix A: Project Development Schedule & Milestones
- **Phase 1:** Architectural Specification & Database Design.
- **Phase 2:** Authentication, RBAC Engine & User Management.
- **Phase 3:** Patient Registration & Hardware Biometric Integration.
- **Phase 4:** Offline SQLite Engine & Delta Synchronization.
- **Phase 5:** Dynamic Public Services Management & Production Hardening.

---
*End of Technical Documentation — Street Children Fingerprint Management System (TRHM)*
