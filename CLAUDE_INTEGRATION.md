# CLAUDE.md - Love That Gives Back Integration Phase

## Current Status

Backend and frontend code have been generated. Now we need to:
1. Wire everything together
2. Fix integration issues
3. Test end-to-end
4. Deploy

---

## Phase 1: Backend Verification

### 1.1 Check Project Structure

First, verify the backend structure matches expectations:

```
love_backend/
├── love_backend/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── events/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── charities/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── management/commands/seed_charities.py
├── donations/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── manage.py
└── requirements.txt
```

### 1.2 Requirements Check

Ensure `requirements.txt` includes:

```
Django>=5.0
djangorestframework>=3.14
django-cors-headers>=4.3
psycopg2-binary>=2.9
stripe>=7.0
python-dotenv>=1.0
gunicorn>=21.0
whitenoise>=6.6
Pillow>=10.0
```

Install if needed:
```bash
pip install -r requirements.txt
```

### 1.3 Settings Configuration

**love_backend/settings.py** must include:

```python
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-change-in-production')
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    # Local apps
    'events',
    'charities',
    'donations',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be first
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS Configuration
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS', 
    'http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173'
).split(',')
CORS_ALLOW_CREDENTIALS = True

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}

# Database
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR}/db.sqlite3',
        conn_max_age=600
    )
}

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Stripe
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '')

# Frontend URL for redirects
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

### 1.4 URL Configuration

**love_backend/urls.py**:

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/events/', include('events.urls')),
    path('api/charities/', include('charities.urls')),
    path('api/donations/', include('donations.urls')),
    path('api/auth/', include('rest_framework.urls')),
]
```

### 1.5 App URLs

**events/urls.py**:
```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.EventListView.as_view(), name='event-list'),
    path('<slug:slug>/', views.EventDetailView.as_view(), name='event-detail'),
    path('dashboard/', views.UserEventsView.as_view(), name='user-events'),
    path('dashboard/create/', views.CreateEventView.as_view(), name='create-event'),
    path('dashboard/<int:pk>/', views.ManageEventView.as_view(), name='manage-event'),
]
```

**charities/urls.py**:
```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.CharityListView.as_view(), name='charity-list'),
    path('<slug:slug>/', views.CharityDetailView.as_view(), name='charity-detail'),
]
```

**donations/urls.py**:
```python
from django.urls import path
from . import views

urlpatterns = [
    path('create-session/', views.create_donation_session, name='create-session'),
    path('webhook/', views.stripe_webhook, name='stripe-webhook'),
    path('event/<int:event_id>/', views.EventDonationsView.as_view(), name='event-donations'),
]
```

### 1.6 Run Migrations

```bash
cd love_backend
python manage.py makemigrations events charities donations
python manage.py migrate
python manage.py createsuperuser
```

### 1.7 Seed Charities

Create the management command if not exists:

**charities/management/commands/seed_charities.py**:
```python
from django.core.management.base import BaseCommand
from charities.models import Charity

class Command(BaseCommand):
    help = 'Seed database with Irish charities'

    def handle(self, *args, **options):
        charities = [
            {
                'name': 'Barretstown',
                'slug': 'barretstown',
                'description': 'Providing free, specially designed camps and programmes for children and their families living with a serious illness.',
                'website': 'https://www.barretstown.org',
                'registration_number': 'CHY12385',
                'category': 'children',
                'is_verified': True,
                'is_active': True,
            },
            {
                'name': 'Irish Cancer Society',
                'slug': 'irish-cancer-society',
                'description': 'Working to prevent cancer, save lives and improve the lives of those affected by cancer.',
                'website': 'https://www.cancer.ie',
                'registration_number': 'CHY5863',
                'category': 'health',
                'is_verified': True,
                'is_active': True,
            },
            {
                'name': 'ISPCA',
                'slug': 'ispca',
                'description': 'The Irish Society for the Prevention of Cruelty to Animals.',
                'website': 'https://www.ispca.ie',
                'registration_number': 'CHY5619',
                'category': 'animals',
                'is_verified': True,
                'is_active': True,
            },
            {
                'name': 'Simon Communities',
                'slug': 'simon-communities',
                'description': 'Preventing and addressing homelessness across Ireland.',
                'website': 'https://www.simon.ie',
                'registration_number': 'CHY5477',
                'category': 'homelessness',
                'is_verified': True,
                'is_active': True,
            },
            {
                'name': 'Pieta House',
                'slug': 'pieta-house',
                'description': 'Providing free therapy to those engaging in self-harm, with suicidal ideation, or bereaved by suicide.',
                'website': 'https://www.pieta.ie',
                'registration_number': 'CHY16084',
                'category': 'mental_health',
                'is_verified': True,
                'is_active': True,
            },
            {
                'name': 'Concern Worldwide',
                'slug': 'concern-worldwide',
                'description': 'Working to transform the lives of the world\'s poorest people.',
                'website': 'https://www.concern.net',
                'registration_number': 'CHY5745',
                'category': 'international',
                'is_verified': True,
                'is_active': True,
            },
            {
                'name': 'LauraLynn',
                'slug': 'lauralynn',
                'description': 'Ireland\'s only children\'s hospice.',
                'website': 'https://www.lauralynn.ie',
                'registration_number': 'CHY16010',
                'category': 'children',
                'is_verified': True,
                'is_active': True,
            },
            {
                'name': 'Barnardos Ireland',
                'slug': 'barnardos',
                'description': 'Working with vulnerable children and their families.',
                'website': 'https://www.barnardos.ie',
                'registration_number': 'CHY6015',
                'category': 'children',
                'is_verified': True,
                'is_active': True,
            },
        ]

        for charity_data in charities:
            charity, created = Charity.objects.update_or_create(
                slug=charity_data['slug'],
                defaults=charity_data
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(f'{status}: {charity.name}')

        self.stdout.write(self.style.SUCCESS(f'Seeded {len(charities)} charities'))
```

Run it:
```bash
python manage.py seed_charities
```

### 1.8 Test Backend

```bash
python manage.py runserver
```

Test these endpoints in browser or curl:
- http://localhost:8000/api/charities/ - Should return charity list
- http://localhost:8000/admin/ - Should show admin login

---

## Phase 2: Frontend Verification

### 2.1 Check Project Structure

```
love_frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
└── .env
```

### 2.2 Environment Setup

**love_frontend/.env**:
```
VITE_API_URL=http://localhost:8000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 2.3 API Service

**src/services/api.js**:
```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// API functions
export const getCharities = () => api.get('/charities/');
export const getCharity = (slug) => api.get(`/charities/${slug}/`);

export const getEvent = (slug) => api.get(`/events/${slug}/`);
export const getUserEvents = () => api.get('/events/dashboard/');
export const createEvent = (data) => api.post('/events/dashboard/create/', data);
export const updateEvent = (id, data) => api.put(`/events/dashboard/${id}/`, data);

export const createDonationSession = (data) => api.post('/donations/create-session/', data);
export const getEventDonations = (eventId) => api.get(`/donations/event/${eventId}/`);

export const login = (credentials) => api.post('/auth/login/', credentials);
export const register = (data) => api.post('/auth/register/', data);

export default api;
```

### 2.4 Auth Context

**src/context/AuthContext.jsx**:
```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      api.get('/auth/me/')
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { username: email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async (data) => {
    const res = await api.post('/auth/register/', data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### 2.5 Protected Route

**src/components/ProtectedRoute.jsx**:
```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### 2.6 Main App Setup

**src/App.jsx**:
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import EventPage from './pages/EventPage';
import DonationForm from './pages/DonationForm';
import DonationSuccess from './pages/DonationSuccess';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import ManageEvent from './pages/ManageEvent';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/event/:slug" element={<EventPage />} />
          <Route path="/donate/:slug" element={<DonationForm />} />
          <Route path="/donate/:slug/success" element={<DonationSuccess />} />
          
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/create" element={
            <ProtectedRoute><CreateEvent /></ProtectedRoute>
          } />
          <Route path="/dashboard/event/:id" element={
            <ProtectedRoute><ManageEvent /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### 2.7 Install Dependencies

```bash
cd love_frontend
npm install axios react-router-dom @stripe/stripe-js
npm run dev
```

---

## Phase 3: Stripe Integration Testing

### 3.1 Get Stripe Test Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy the test keys
3. Add to backend `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```
4. Add to frontend `.env`:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```

### 3.2 Test Webhook Locally

Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8000/api/donations/webhook/
```

Copy the webhook signing secret and add to backend `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 3.3 Test Donation Flow

1. Start backend: `python manage.py runserver`
2. Start frontend: `npm run dev`
3. Start Stripe listener: `stripe listen --forward-to localhost:8000/api/donations/webhook/`
4. Create a test event via Django admin
5. Navigate to the event page
6. Click donate, fill form
7. Use test card: `4242 4242 4242 4242`, any future date, any CVC
8. Verify donation appears in database

---

## Phase 4: Common Issues & Fixes

### CORS Errors

If you see CORS errors in browser console:

1. Verify `corsheaders` is installed and in `INSTALLED_APPS`
2. Verify `CorsMiddleware` is FIRST in `MIDDLEWARE`
3. Check `CORS_ALLOWED_ORIGINS` includes your frontend URL exactly

### 404 on API Routes

1. Check URL patterns have trailing slashes consistently
2. Verify app URLs are included in main `urls.py`
3. Check serializer and view match expected data structure

### Stripe Webhook Fails

1. Verify webhook secret matches (copy from Stripe CLI output)
2. Check `@csrf_exempt` decorator on webhook view
3. Verify raw request body is used, not parsed JSON

### Auth Token Issues

1. Verify `rest_framework.authtoken` is in `INSTALLED_APPS`
2. Run migrations: `python manage.py migrate`
3. Check token is being stored in localStorage
4. Verify Authorization header format: `Token xxx` (not `Bearer xxx`)

### Database Migration Issues

```bash
# Reset migrations if needed
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete
rm db.sqlite3
python manage.py makemigrations events charities donations
python manage.py migrate
```

---

## Phase 5: Deployment Checklist

### Backend (Render)

1. Set environment variables:
   - `SECRET_KEY` (generate new one for production)
   - `DEBUG=False`
   - `DATABASE_URL` (from Render PostgreSQL)
   - `ALLOWED_HOSTS=your-backend-url.onrender.com,lovethatgivesback.com`
   - `CORS_ALLOWED_ORIGINS=https://lovethatgivesback.com`
   - `STRIPE_SECRET_KEY=sk_live_xxx`
   - `STRIPE_WEBHOOK_SECRET=whsec_xxx`
   - `FRONTEND_URL=https://lovethatgivesback.com`

2. Build command: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`

3. Start command: `gunicorn love_backend.wsgi:application`

### Frontend (Render or Vercel)

1. Set environment variables:
   - `VITE_API_URL=https://your-backend-url.onrender.com/api`
   - `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx`

2. Build command: `npm run build`

3. Publish directory: `dist`

### Stripe Production Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-backend-url.onrender.com/api/donations/webhook/`
3. Select events: `checkout.session.completed`, `checkout.session.expired`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Quick Command Reference

```bash
# Backend
cd love_backend
source venv/bin/activate  # If using virtualenv
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py seed_charities
python manage.py createsuperuser
python manage.py runserver

# Frontend
cd love_frontend
npm install
npm run dev

# Stripe CLI
stripe login
stripe listen --forward-to localhost:8000/api/donations/webhook/

# Test card
4242 4242 4242 4242
```

---

## Next Prompt for Claude Code

After placing this file in your project, tell Claude Code:

> "Read CLAUDE_INTEGRATION.md. The backend and frontend are generated but not working together yet. Let's go through Phase 1 step by step - start by checking the project structure and identifying what's missing or misconfigured."

This will systematically work through getting everything connected and running.
