# SkillForge LMS - Full Stack Online Course Selling Platform

SkillForge LMS is a production-ready, SaaS-enabled, high-performance Online Learning Management System (LMS) and e-commerce course selling platform. It features JWT-based role authentication, interactive video playback state saving, an automated quiz grader, INR/GST billing compliance, verifiable PDF certificate generation, and an administrator management panel.

---

## System Architecture

The application is structured as a decoupled client-server architecture:
```
                                +---------------------------+
                                |     Next.js Web Client     |
                                |       (Port 3000)         |
                                +-------------+-------------+
                                              |
                                              | HTTPS / REST
                                              v
                                +-------------+-------------+
                                |    Express / TS Server    |
                                |       (Port 5000)         |
                                +-------------+-------------+
                                              |
                                              | Prisma ORM
                                              v
                                +-------------+-------------+
                                |     PostgreSQL Engine     |
                                |       (Port 5432)         |
                                +---------------------------+
```

---

## Core Features & Technologies

### 1. Technology Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Axios, Lucide Icons, Canvas-Confetti.
- **Backend:** Node.js, Express, TypeScript, Prisma Client ORM, PDFKit, QRCode, BCrypt, Razorpay Node SDK.
- **Database:** PostgreSQL.
- **Packaging:** Docker, Docker Compose.

### 2. User & Student Dashboard
- Dual Auth: Traditional Email/Password or Phone/OTP authentication.
- Grid-view listing of active courses, interactive progress bars, downloadable invoice logs, and verifiable Landscape PDF certificates.

### 3. Course Playback Console
- Modular video player, progress tracking (sends watch percentage and checkpoints to database), downloads area for supplementary resources.

### 4. Admin Management Center
- Overview statistics (revenue totals, certificate count, student metrics).
- Categories management panel.
- Course syllabus and drag-and-drop hierarchy sorter.
- User management toggles.

### 5. Compliance & Billing
- Automated 18% CGST/SGST invoice compilation.
- Verifiable certificate verification route with dynamic QR code authentication.

---

## Local Setup & Configuration

### Prerequisites
- Node.js v20+ or v21+
- PostgreSQL server instance running locally on port `5432`

### 1. Environment Configurations

#### Backend (`backend/.env`)
Create `backend/.env` with the following variables:
```env
PORT=5000
NODE_ENV=development

# Database connection
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/skillforge?schema=public"

# Auth Secrets
JWT_SECRET="your_high_entropy_access_token_secret_key"
JWT_REFRESH_SECRET="your_high_entropy_refresh_token_secret_key"

# Payments (Razorpay)
RAZORPAY_KEY_ID="rzp_test_mockkeyid"
RAZORPAY_KEY_SECRET="rzp_test_mockkeysecret"
RAZORPAY_WEBHOOK_SECRET="rzp_webhook_secret"

# Notifications (set to "mock" to print emails/SMS to server terminal console)
SMS_OTP_PROVIDER="mock"
EMAIL_PROVIDER="mock"
EMAIL_FROM="noreply@skillforge.com"

# Company GST Details
COMPANY_NAME="SkillForge Academy Private Limited"
COMPANY_GSTIN="27AAAAA1111A1Z1"
COMPANY_STATE="Maharashtra"
COMPANY_ADDRESS="101, Tech Hub, Hiranandani Gardens, Powai, Mumbai - 400076"
GST_RATE_PERCENT=18
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### 2. Step-by-Step Installation

#### Step A: Configure & Sync Database
1. Update `DATABASE_URL` in `backend/.env` with your PostgreSQL database password.
2. Navigate to `backend/` and run:
   ```bash
   npx prisma db push
   ```
   This will synchronize the database schema and build index relations.

#### Step B: Launch Backend Server
1. Install dependencies and start the development server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. The server will run on `http://localhost:5000`. You can check the health check endpoint at `http://localhost:5000/health`.

#### Step C: Launch Frontend Client
1. Navigate to the client directory, install packages, and boot the Next.js server:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
2. Open `http://localhost:3000` in your web browser.

---

## Running with Docker Compose

To deploy the entire stack instantly without local configuration:

1. Ensure Docker Desktop is active.
2. Run the following command in the root repository directory:
   ```bash
   docker-compose up --build
   ```
3. Docker will automatically launch a PostgreSQL container, configure the schema using Prisma, launch the Express server on port `5000`, and start the Next.js App Router on port `3000`.

---

## API Endpoints Reference

### Authentications (`/api/auth`)
- `POST /register`: Registers student or admin.
- `POST /login`: Standard password validation. Returns JWT access & refresh tokens.
- `POST /otp/request`: Dispatches a verification OTP code to email/SMS.
- `POST /otp/verify`: Logs in user using OTP.
- `POST /refresh`: Rotates expired Access Token using the Refresh Token.

### Course Content (`/api/courses`)
- `GET /`: Retrieve published courses with category and sorting filters.
- `GET /:idOrSlug`: Retrieve comprehensive metadata for a specific course.
- `POST /`: (Admin) Create a course.
- `PUT /:id`: (Admin) Modify course description/price/metadata.

### Progress & Student Actions (`/api/student`)
- `GET /purchased-courses`: Load all courses completed/enrolled by the user, invoice references, and certificates.
- `POST /progress`: Upsert lesson completion check and video duration watched.
- `GET /progress/:courseId`: Calculate percentage progress for a course.

### Payments (`/api/payments`)
- `POST /order`: Initialize standard or mock Razorpay order.
- `POST /verify`: Cryptographically verify transaction signature, unlock course, and compile invoice.

### Certificates (`/api/certificates`)
- `POST /generate`: Check progress and issue verifiable Landscape PDF certificate.
- `GET /my`: Retrieve certificates list of the logged-in student.
- `GET /verify/:token`: Verify credentials validity against db.
