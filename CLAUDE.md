# CLAUDE.md - Love In Action Platform

## Quick Start

```bash
# Backend
cd love_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_charities
python manage.py createsuperuser
python manage.py runserver

# Frontend (in another terminal)
cd love_frontend
npm install
npm run dev
```

Open http://localhost:5173 for the frontend and http://localhost:8000/admin for Django admin.

---

## Project Overview

**Love In Action (LIA)** is a life events donation platform where hosts create celebration pages and guests donate to curated charities instead of giving traditional gifts.

### Supported Event Types
- **Wedding** — Couples redirect gifts to causes they care about
- **Christening** — New parents celebrate with charitable giving
- **Birthday** — Milestone celebrations with purpose
- **Memorial** — Honor loved ones through their legacy causes

### Business Model
- **Aggregator model** — We facilitate donations to registered charities, we are NOT a charity
- **Revenue** — Transaction fees passed to donor OR optional tips (decide during build)
- **Charity relationship** — Curated list of verified Irish charities (CHY number holders)

---

## Technical Stack

### Backend
- **Framework:** Django 6.x + Django REST Framework
- **Database:** PostgreSQL
- **Authentication:** Django built-in + DRF token auth (or SimpleJWT)
- **Payments:** Stripe Checkout (NOT Stripe Connect for MVP)

### Frontend
- **Framework:** React 18+ with React Router
- **Styling:** Tailwind CSS (or keep existing Bootstrap if faster)
- **HTTP Client:** Axios
- **State:** React Context or Zustand (keep simple)

### Infrastructure
- **Hosting:** Render (backend + frontend)
- **Database:** Render PostgreSQL (or existing)
- **Domain:** loveinaction.com (existing)
- **Email:** SendGrid or Django's console backend for MVP

---

## Data Models

### User (extend Django's AbstractUser or use default)
```python
# Use Django's built-in User model for MVP
# Fields: id, email, password, first_name, last_name, date_joined
```

### Event
```python
class Event(models.Model):
    class EventType(models.TextChoices):
        WEDDING = 'wedding', 'Wedding'
        CHRISTENING = 'christening', 'Christening'
        BIRTHDAY = 'birthday', 'Birthday'
        MEMORIAL = 'memorial', 'Memorial'
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        ACTIVE = 'active', 'Active'
        CLOSED = 'closed', 'Closed'
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    slug = models.SlugField(unique=True, max_length=100)
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    title = models.CharField(max_length=200)  # e.g., "Welcome Baby"
    story = models.TextField(blank=True)  # Markdown supported
    cover_photo = models.URLField(blank=True)
    event_date = models.DateField(null=True, blank=True)  # Nullable for memorials
    location = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    goal_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_public = models.BooleanField(default=False)  # Show in examples
    charities = models.ManyToManyField('Charity', through='EventCharity')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    def total_raised(self):
        return self.donations.filter(status='succeeded').aggregate(
            total=models.Sum('amount')
        )['total'] or 0
    
    def donor_count(self):
        return self.donations.filter(status='succeeded').values('donor_email').distinct().count()
```

### Charity
```python
class Charity(models.Model):
    class Category(models.TextChoices):
        CHILDREN = 'children', 'Children'
        HEALTH = 'health', 'Health'
        ANIMALS = 'animals', 'Animals'
        ENVIRONMENT = 'environment', 'Environment'
        INTERNATIONAL = 'international', 'International'
        HOMELESSNESS = 'homelessness', 'Homelessness'
        MENTAL_HEALTH = 'mental_health', 'Mental Health'
        OTHER = 'other', 'Other'
    
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    logo = models.URLField(blank=True)
    website = models.URLField()
    registration_number = models.CharField(max_length=50)  # CHY number
    registration_country = models.CharField(max_length=2, default='IE')
    category = models.CharField(max_length=20, choices=Category.choices)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    contact_email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = 'Charities'
    
    def __str__(self):
        return self.name
```

### EventCharity (through table)
```python
class EventCharity(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    charity = models.ForeignKey(Charity, on_delete=models.CASCADE)
    display_order = models.PositiveIntegerField(default=0)
    custom_message = models.TextField(blank=True)  # Host's note about why this charity
    
    class Meta:
        ordering = ['display_order']
        unique_together = ['event', 'charity']
```

### Donation
```python
class Donation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUCCEEDED = 'succeeded', 'Succeeded'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='donations')
    charity = models.ForeignKey(Charity, on_delete=models.CASCADE)
    donor_name = models.CharField(max_length=200)
    donor_email = models.EmailField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='EUR')
    message = models.TextField(blank=True)
    is_anonymous = models.BooleanField(default=False)
    stripe_session_id = models.CharField(max_length=200, blank=True)
    stripe_payment_intent = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.donor_name} - €{self.amount} to {self.charity.name}"
```

---

## API Endpoints

### Public Endpoints (no auth)
```
GET  /api/events/<slug>/           # Public event page data
GET  /api/charities/               # List all active charities
GET  /api/charities/<slug>/        # Single charity details
POST /api/donations/create-session/ # Create Stripe checkout session
POST /api/webhooks/stripe/         # Stripe webhook handler
```

### Authenticated Endpoints (host)
```
POST /api/auth/register/           # Create account
POST /api/auth/login/              # Get token
GET  /api/auth/me/                 # Current user profile

GET  /api/dashboard/events/        # List user's events
POST /api/dashboard/events/        # Create new event
GET  /api/dashboard/events/<id>/   # Get event details
PUT  /api/dashboard/events/<id>/   # Update event
DEL  /api/dashboard/events/<id>/   # Delete event

GET  /api/dashboard/events/<id>/donations/  # List donations for event
```

### Admin Endpoints (superuser)
```
# Use Django Admin for MVP
/admin/
```

---

## Stripe Integration

### Environment Variables
```
STRIPE_SECRET_KEY=sk_live_xxx (or sk_test_xxx for testing)
STRIPE_PUBLISHABLE_KEY=pk_live_xxx (or pk_test_xxx)
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Create Checkout Session
```python
# views.py
import stripe
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response

stripe.api_key = settings.STRIPE_SECRET_KEY

@api_view(['POST'])
def create_donation_session(request):
    data = request.data
    event = Event.objects.get(slug=data['event_slug'])
    charity = Charity.objects.get(id=data['charity_id'])
    
    amount_cents = int(float(data['amount']) * 100)
    
    # Create pending donation record
    donation = Donation.objects.create(
        event=event,
        charity=charity,
        donor_name=data.get('donor_name', 'Anonymous'),
        donor_email=data.get('donor_email', ''),
        amount=data['amount'],
        message=data.get('message', ''),
        is_anonymous=data.get('is_anonymous', False),
        status='pending'
    )
    
    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price_data': {
                'currency': 'eur',
                'product_data': {
                    'name': f'Donation to {charity.name}',
                    'description': f'Via {event.title}',
                },
                'unit_amount': amount_cents,
            },
            'quantity': 1,
        }],
        mode='payment',
        success_url=f'{settings.FRONTEND_URL}/donate/{event.slug}/success?session_id={{CHECKOUT_SESSION_ID}}',
        cancel_url=f'{settings.FRONTEND_URL}/event/{event.slug}',
        customer_email=data.get('donor_email'),
        metadata={
            'donation_id': str(donation.id),
            'event_id': str(event.id),
            'charity_id': str(charity.id),
        }
    )
    
    donation.stripe_session_id = session.id
    donation.save()
    
    return Response({'checkout_url': session.url, 'session_id': session.id})
```

### Webhook Handler
```python
@api_view(['POST'])
def stripe_webhook(request):
    payload = request.body
    sig = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        return Response({'error': str(e)}, status=400)
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        donation_id = session['metadata'].get('donation_id')
        
        if donation_id:
            donation = Donation.objects.get(id=donation_id)
            donation.status = 'succeeded'
            donation.stripe_payment_intent = session.get('payment_intent', '')
            donation.save()
            
            # TODO: Send confirmation email
    
    elif event['type'] == 'checkout.session.expired':
        session = event['data']['object']
        donation_id = session['metadata'].get('donation_id')
        
        if donation_id:
            Donation.objects.filter(id=donation_id).update(status='failed')
    
    return Response({'status': 'ok'})
```

---

## Frontend Routes

```jsx
// App.jsx routes
<Routes>
  {/* Public */}
  <Route path="/" element={<LandingPage />} />
  <Route path="/how-it-works" element={<HowItWorks />} />
  <Route path="/charities" element={<CharityList />} />
  <Route path="/event/:slug" element={<EventPage />} />
  <Route path="/donate/:slug" element={<DonationForm />} />
  <Route path="/donate/:slug/success" element={<DonationSuccess />} />
  
  {/* Auth */}
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  
  {/* Dashboard (protected) */}
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
    <Route index element={<EventList />} />
    <Route path="create" element={<CreateEvent />} />
    <Route path="event/:id" element={<ManageEvent />} />
    <Route path="event/:id/donations" element={<ViewDonations />} />
  </Route>
</Routes>
```

---

## Seed Data: Irish Charities

```python
# management/commands/seed_charities.py

CHARITIES = [
    {
        'name': 'Barretstown',
        'slug': 'barretstown',
        'description': 'Providing free, specially designed camps and programmes for children and their families living with a serious illness.',
        'website': 'https://www.barretstown.org',
        'registration_number': 'CHY12385',
        'category': 'children',
        'logo': 'https://www.barretstown.org/logo.png',
    },
    {
        'name': 'Irish Cancer Society',
        'slug': 'irish-cancer-society',
        'description': 'Working to prevent cancer, save lives and improve the lives of those affected by cancer.',
        'website': 'https://www.cancer.ie',
        'registration_number': 'CHY5863',
        'category': 'health',
        'logo': 'https://www.cancer.ie/logo.png',
    },
    {
        'name': 'ISPCA',
        'slug': 'ispca',
        'description': 'The Irish Society for the Prevention of Cruelty to Animals works to prevent cruelty to animals.',
        'website': 'https://www.ispca.ie',
        'registration_number': 'CHY5619',
        'category': 'animals',
        'logo': 'https://www.ispca.ie/logo.png',
    },
    {
        'name': 'Simon Communities',
        'slug': 'simon-communities',
        'description': 'Preventing and addressing homelessness across Ireland.',
        'website': 'https://www.simon.ie',
        'registration_number': 'CHY5477',
        'category': 'homelessness',
        'logo': 'https://www.simon.ie/logo.png',
    },
    {
        'name': 'Pieta House',
        'slug': 'pieta-house',
        'description': 'Providing free therapy to those engaging in self-harm, with suicidal ideation, or bereaved by suicide.',
        'website': 'https://www.pieta.ie',
        'registration_number': 'CHY16084',
        'category': 'mental_health',
        'logo': 'https://www.pieta.ie/logo.png',
    },
    {
        'name': 'Concern Worldwide',
        'slug': 'concern-worldwide',
        'description': 'Working to transform the lives of the world\'s poorest people.',
        'website': 'https://www.concern.net',
        'registration_number': 'CHY5745',
        'category': 'international',
        'logo': 'https://www.concern.net/logo.png',
    },
    {
        'name': 'LauraLynn',
        'slug': 'lauralynn',
        'description': 'Ireland\'s only children\'s hospice, providing palliative care for children with life-limiting conditions.',
        'website': 'https://www.lauralynn.ie',
        'registration_number': 'CHY16010',
        'category': 'children',
        'logo': 'https://www.lauralynn.ie/logo.png',
    },
    {
        'name': 'Barnardos Ireland',
        'slug': 'barnardos',
        'description': 'Working with vulnerable children and their families to transform their lives.',
        'website': 'https://www.barnardos.ie',
        'registration_number': 'CHY6015',
        'category': 'children',
        'logo': 'https://www.barnardos.ie/logo.png',
    },
    {
        'name': 'Irish Hospice Foundation',
        'slug': 'irish-hospice-foundation',
        'description': 'Supporting people in Ireland through dying, death, and bereavement.',
        'website': 'https://hospicefoundation.ie',
        'registration_number': 'CHY6830',
        'category': 'health',
        'logo': 'https://hospicefoundation.ie/logo.png',
    },
    {
        'name': 'Temple Street Foundation',
        'slug': 'temple-street',
        'description': 'Supporting Children\'s Health Ireland at Temple Street to provide world-class care.',
        'website': 'https://www.templestreet.ie',
        'registration_number': 'CHY7492',
        'category': 'children',
        'logo': 'https://www.templestreet.ie/logo.png',
    },
]
```

---

## Weekend Sprint Checklist

### Saturday Morning: Backend Foundation
- [ ] Review existing code structure
- [ ] Create/update models (Event, Charity, Donation, EventCharity)
- [ ] Run migrations
- [ ] Create serializers
- [ ] Create API views (public event, charity list, donation create)
- [ ] Set up URLs
- [ ] Seed charity data
- [ ] Test with Django shell / browsable API

### Saturday Afternoon: Stripe Integration
- [ ] Install stripe package
- [ ] Add environment variables
- [ ] Create checkout session endpoint
- [ ] Create webhook endpoint
- [ ] Test with Stripe CLI (`stripe listen --forward-to localhost:8000/api/webhooks/stripe/`)
- [ ] Verify donation status updates on payment

### Saturday Evening: Frontend Public Pages
- [ ] Landing page with value prop
- [ ] Event page (`/event/:slug`) showing story, charities, donation button
- [ ] Donation form with amount selection, donor details
- [ ] Stripe Checkout redirect
- [ ] Success page with confirmation message

### Sunday Morning: Host Dashboard
- [ ] Login/Signup pages
- [ ] Protected route wrapper
- [ ] Dashboard layout
- [ ] Event list (user's events)
- [ ] Create event form (wizard or single page)
- [ ] Charity selection (checkboxes from list)
- [ ] Event management page (view donations, share link)

### Sunday Afternoon: Templates & Polish
- [ ] Christening template/theme
- [ ] Wedding template/theme
- [ ] Mobile responsive checks
- [ ] Loading states
- [ ] Error handling
- [ ] Form validation

### Sunday Evening: Deploy
- [ ] Update environment variables on Render
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test Stripe in live mode (small real donation)
- [ ] Set up Stripe webhook in dashboard
- [ ] Final end-to-end test

---

## Key Files to Create/Modify

### Backend Structure
```
love_backend/
├── love_backend/
│   ├── settings.py          # Add Stripe keys, CORS, etc.
│   ├── urls.py               # Include app URLs
├── events/                   # New app or modify existing
│   ├── models.py             # Event, EventCharity
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
├── charities/                # New app
│   ├── models.py             # Charity
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── management/
│   │   └── commands/
│   │       └── seed_charities.py
├── donations/                # New app
│   ├── models.py             # Donation
│   ├── serializers.py
│   ├── views.py              # create_session, webhook
│   ├── urls.py
```

### Frontend Structure
```
love_frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── CharityCard.jsx
│   │   ├── DonationForm.jsx
│   │   ├── EventCard.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── EventPage.jsx
│   │   ├── DonationSuccess.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── CreateEvent.jsx
│   │   └── ManageEvent.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   └── api.js            # Axios instance
│   ├── App.jsx
│   └── main.jsx
```

---

## Environment Variables

### Backend (.env)
```
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgres://user:pass@host:5432/dbname
ALLOWED_HOSTS=loveinaction.com,localhost
CORS_ALLOWED_ORIGINS=https://loveinaction.com,http://localhost:3000

STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

FRONTEND_URL=https://loveinaction.com
```

### Frontend (.env)
```
VITE_API_URL=https://api.loveinaction.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

---

## Commands Reference

```bash
# Backend
python manage.py makemigrations
python manage.py migrate
python manage.py seed_charities
python manage.py createsuperuser
python manage.py runserver

# Frontend
npm install
npm run dev
npm run build

# Stripe CLI (for local webhook testing)
stripe listen --forward-to localhost:8000/api/webhooks/stripe/

# Deploy
git push origin main  # If Render auto-deploys from GitHub
```

---

## Notes for Claude Code

1. **Preserve what works** — If existing auth, user model, or deployment config works, keep it
2. **Keep it simple** — No Stripe Connect, no charity dashboards, no complex features for MVP
3. **Mobile first** — Most guests will access from phones
4. **Test with real Stripe** — Use test mode but go through full flow
5. **Alan's christening is the first real event** — End of March deadline

