# DocTrack 🩺

DocTrack is a full-stack, professional **Patient Data & Electronic Medical Records (EMR) Management System** designed specifically for doctors and small clinics. 

It provides patient demographic registration, appointment scheduling, EMR timeline logs, drag-and-drop document vaults, and AI-assisted clinical note formatting, history summaries, and multimodal OCR report extraction.

---

## 📸 Interface Preview (Visual Mockups)

*Add screenshots of your running application here to showcase the premium UI design.*

| Dashboard | Patient Timeline |
| :---: | :---: |
| ![Dashboard Mockup](https://raw.githubusercontent.com/anittakurian/DocTrack/main/frontend/public/favicon.svg) <br> *Sleek metrics dashboard* | ![Patient Detail Mockup](https://raw.githubusercontent.com/anittakurian/DocTrack/main/frontend/public/favicon.svg) <br> *EMR consultation notes and logs* |

| AI Assistant Composer | Document OCR Extractor |
| :---: | :---: |
| ![AI Composer Mockup](https://raw.githubusercontent.com/anittakurian/DocTrack/main/frontend/public/favicon.svg) <br> *SOAP clinical note formatter* | ![OCR Mockup](https://raw.githubusercontent.com/anittakurian/DocTrack/main/frontend/public/favicon.svg) <br> *Prescription data extractor* |

---

## 🚀 Key Features

*   **Secure Doctor Authentication**: JWT-based session controls (`djangorestframework-simplejwt`).
*   **Strict Tenancy Isolation**: Multi-doctor isolation ensures each practitioner can only query, modify, or view their own registered patients and appointments.
*   **Demographics EMR Vault**: Full CRUD logs with cascading soft-delete (automatically cancels future appointments on patient deletion).
*   **EMR Visit Timeline**: Visual timeline log displaying visit dates, symptoms, diagnoses, prescriptions, and custom follow-up notes.
*   **Appointment Scheduler**: Custom appointment calendar showing scheduled, completed, and cancelled visits.
*   **AI Clinical Assistant (Gemini API Integration)**:
    *   **SOAP Formatter**: Auto-formats doctor visit shorthand scribbles into formatted SOAP summaries.
    *   **Clinical EMR Summarizer**: Synthesizes historical patient visit records into a singular clinical summary.
    *   **Multimodal OCR**: Processes prescription/lab images and extracts medical entities directly into the consultation note fields.
    *   *Mock Fallback Mode: Seamless local testing even without active Gemini keys.*

---

## 🛠️ Technology Stack

### Backend
*   **Django 5.x** & **Django REST Framework (DRF)**
*   **SimpleJWT** (JWT Authentication)
*   **Neon PostgreSQL** (Production) / SQLite (Local development)
*   **Cloudinary** (Secure medical report storage)
*   **Google Generative AI** (`gemini-1.5-flash` model integration)
*   **drf-spectacular** (Interactive Swagger & Redoc OpenAPI specs)

### Frontend
*   **React 19** & **Vite** & **TypeScript**
*   **Tailwind CSS** (Custom theme configurations)
*   **TanStack React Query v5** (Server state management & polling)
*   **React Router v7** (Secure SPAs routing)
*   **Lucide React** (Vector icons)

---

## 📂 Project Directory Structure

```text
DocTrack/
├── backend/                 # Django EMR API
│   ├── doctrack/            # Settings and root urls
│   ├── api/                 # EMR models, serializers, views, and AI logic
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment credentials template
│
└── frontend/                # React Vite SPA Client
    ├── src/
    │   ├── components/      # UI Shell Layout and custom components
    │   ├── context/         # AuthContext JWT session management
    │   ├── pages/           # Pages (Dashboard, Patients, Appointments, Details)
    │   └── services/        # Axios API client interceptors
    ├── tailwind.config.js   # Theme design tokens
    ├── vercel.json          # SPA rewrite rules
    └── .env.example         # Client API url template
```

---

## 💻 Local Quick Start

### Prerequisites
*   Python 3.11+
*   Node.js 18+ & npm

### 1. Backend Setup
1. Open a terminal and navigate to the project directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   ..\venv\Scripts\activate
   # On macOS/Linux:
   source ../venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment secrets:
   * Copy `.env.example` to `.env`
   * *(Optional)* Fill in your `GEMINI_API_KEY` for AI features and `CLOUDINARY_*` details for document uploads. Leaving them blank triggers the automatic mock fallbacks.
5. Build the database and run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
6. Start the API server:
   ```bash
   python manage.py runserver
   ```
   The API will run at `http://localhost:8000/`. You can view Swagger documentation at `http://localhost:8000/api/schema/swagger-ui/`.

---

### 2. Frontend Setup
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd frontend
   ```
2. Install package node modules:
   ```bash
   npm install
   ```
3. Configure environment variables:
   * Copy `.env.example` to `.env`
   * Verify it points to the local backend: `VITE_API_URL=http://localhost:8000`
4. Start the Vite development hot-reload server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 🌐 Production Deployment Guide

### Database (Neon PostgreSQL)
1. Provision a database on [Neon.tech](https://neon.tech/).
2. Copy your Connection String (`DATABASE_URL`).

### Storage (Cloudinary)
1. Sign up on [Cloudinary.com](https://cloudinary.com/) and retrieve your **Cloud Name**, **API Key**, and **API Secret**.

### Backend (Render Web Service)
*   **Root Directory**: `backend`
*   **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
*   **Start Command**: `gunicorn doctrack.wsgi`
*   **Environment Variables**:
    *   `SECRET_KEY`: *[Secure random string]*
    *   `DEBUG`: `False`
    *   `DATABASE_URL`: *[Your Neon Connection String]*
    *   `ALLOWED_HOSTS`: `[your-render-subdomain].onrender.com`
    *   `CLOUDINARY_CLOUD_NAME`: *[Cloud Name]*
    *   `CLOUDINARY_API_KEY`: *[API Key]*
    *   `CLOUDINARY_API_SECRET`: *[API Secret]*
    *   `GEMINI_API_KEY`: *[Your Gemini API Key]*

### Frontend (Vercel SPA Project)
*   **Root Directory**: `frontend`
*   **Framework Preset**: `Vite`
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`
*   **Environment Variable**:
    *   `VITE_API_URL`: `https://[your-render-subdomain].onrender.com` (Your backend Render URL)

---

## 📄 License
This project is licensed under the MIT License.
