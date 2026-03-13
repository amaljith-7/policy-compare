# Prominent Compare

An internal tool for insurance brokers to compare quotes from multiple insurers using AI-powered PDF extraction.

## Features

- 🤖 **AI-Powered PDF Extraction** - Automatically extract quote data from insurer PDFs using Claude API
- 📊 **Side-by-Side Comparison** - Compare multiple insurance quotes in a clean, modern interface
- 📱 **Share Quotes** - Share comparisons via WhatsApp or Email
- 👥 **User Management** - Role-based access control (RBAC) for team collaboration
- 🏢 **Insurer Management** - Configure and manage insurance providers

## Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query + Zustand

**Backend:**
- Django 4.2+
- Django REST Framework
- PostgreSQL (production) / SQLite (development)
- Claude API (Anthropic) for PDF extraction

## Prerequisites

- **Node.js** 20+ and npm/yarn/pnpm
- **Python** 3.10+
- **Docker & Docker Compose** (for containerized setup)
- **OpenAI API Key** (for PDF extraction)

---

## Getting Started

### Option 1: Docker Setup (Recommended)

This is the easiest way to get started. Docker will handle all dependencies and services.

#### 1. Clone the repository

```bash
git clone <repository-url>
cd prominent-compare
```

#### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=your-openai-api-key-here
```

#### 3. Start the application

```bash
docker-compose up --build
```

This will start:
- **PostgreSQL** database on `localhost:5432`
- **Django backend** on `http://localhost:8000`
- **Next.js frontend** on `http://localhost:3000`

#### 4. Access the application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api

#### 5. Create a superuser (first time only)

In a new terminal, run:

```bash
docker-compose exec backend python manage.py createsuperuser
```

Follow the prompts to create an admin account.

---

### Option 2: Local Development Setup

For local development without Docker.

#### Backend Setup

1. **Create a virtual environment**

```bash
# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

2. **Install dependencies**

```bash
pip install -r requirements.txt
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key-here
DATABASE_URL=sqlite:///db.sqlite3
```

4. **Run migrations**

```bash
python manage.py migrate
```

5. **Create a superuser**

```bash
python manage.py createsuperuser
```

6. **Start the development server**

```bash
python manage.py runserver
```

Backend will be available at http://localhost:8000

#### Frontend Setup

1. **Navigate to frontend directory**

```bash
cd frontend
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Create `.env.local` in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

4. **Start the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Frontend will be available at http://localhost:3000

---

## Project Structure

```
prominent-compare/
├── backend/                 # Django backend
│   ├── core/               # Core settings and base models
│   ├── quotes/             # Quote management and PDF extraction
│   ├── insurers/           # Insurer configuration
│   └── users/              # User management and auth
├── frontend/               # Next.js frontend
│   ├── app/                # App Router pages
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utilities and API client
├── docker-compose.yml      # Docker services configuration
├── Dockerfile.backend      # Backend Docker image
├── Dockerfile.frontend     # Frontend Docker image
└── requirements.txt        # Python dependencies
```

---

## Common Tasks

### Running Migrations

**Docker:**
```bash
docker-compose exec backend python manage.py migrate
```

**Local:**
```bash
python manage.py migrate
```

### Creating Database Migrations

**Docker:**
```bash
docker-compose exec backend python manage.py makemigrations
```

**Local:**
```bash
python manage.py makemigrations
```

### Accessing Django Admin

Navigate to http://localhost:8000/admin and log in with your superuser credentials.

### Stopping Services

**Docker:**
```bash
docker-compose down
```

To also remove volumes (database data):
```bash
docker-compose down -v
```

### Viewing Logs

**Docker:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## API Documentation

Once the backend is running, you can explore the API at:
- **API Root**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/

### Key Endpoints

- `POST /api/auth/login/` - User login
- `GET /api/auth/me/` - Current user profile
- `GET /api/quotes/` - List all quotes
- `POST /api/quotes/extract/` - Extract data from PDF
- `GET /api/insurers/` - List insurers
- `GET /api/users/` - List users

---

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | - |
| `DEBUG` | Debug mode | `True` |
| `ALLOWED_HOSTS` | Allowed host names | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |
| `OPENAI_API_KEY` | OpenAI API key for PDF extraction | - |
| `DATABASE_URL` | Database connection string | `sqlite:///db.sqlite3` |

### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000/api` |

---

## Troubleshooting

### Port Already in Use

If ports 3000, 8000, or 5432 are already in use, you can modify them in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change 3001 to any available port
```

### Database Connection Issues

If using Docker and the backend can't connect to the database, ensure the database service is fully started:

```bash
docker-compose up db
# Wait a few seconds, then start other services
docker-compose up backend frontend
```

### Frontend Can't Connect to Backend

Ensure `NEXT_PUBLIC_API_URL` in your frontend `.env.local` matches your backend URL.

### PDF Extraction Not Working

Verify your `OPENAI_API_KEY` is set correctly in the `.env` file and is valid.

---

## Development Workflow

1. **Start services**: `docker-compose up` or run backend/frontend separately
2. **Make changes**: Edit code in your preferred editor
3. **Hot reload**: Both Next.js and Django support hot reloading
4. **Test changes**: Changes reflect automatically in the browser
5. **Commit**: Commit your changes when ready

---

## Production Deployment

For production deployment:

1. Set `DEBUG=False` in backend environment
2. Use PostgreSQL instead of SQLite
3. Set a strong `SECRET_KEY`
4. Configure proper `ALLOWED_HOSTS`
5. Use a production-grade web server (Gunicorn + Nginx)
6. Set up SSL/TLS certificates
7. Configure proper CORS settings

---

## License

[Add your license here]

## Support

For issues or questions, please contact [your-contact-info]
