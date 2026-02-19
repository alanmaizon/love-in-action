import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file from the project root (love_backend/)
load_dotenv(BASE_DIR / '.env')

# Load secrets from AWS Parameter Store (if enabled)
# This must run BEFORE any os.environ.get() calls below
from love_backend.aws_config import load_parameters_from_ssm
load_parameters_from_ssm()

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'corsheaders',
    # Health checks
    'health_check',
    'health_check.db',
    'health_check.cache',
    'health_check.storage',
    # Local apps
    'events',
    'charities',
    'donations',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'csp.middleware.CSPMiddleware',
]

# =============================================================================
# Authentication Backends
# =============================================================================
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',  # Default Django backend (admin login)
]

ROOT_URLCONF = 'love_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'love_backend.wsgi.application'

# Database
DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# =============================================================================
# AWS S3 Storage (for static files and media uploads)
# =============================================================================
AWS_S3_BUCKET_NAME = os.environ.get('AWS_S3_BUCKET_NAME', '')

if AWS_S3_BUCKET_NAME:
    # Use S3 for static files in production
    AWS_S3_REGION_NAME = os.environ.get('AWS_REGION', 'eu-west-1')
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_S3_BUCKET_NAME}.s3.amazonaws.com'
    AWS_DEFAULT_ACL = None
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }

    # Static files on S3
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3StaticStorage'
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'

    # Media files on S3
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
else:
    # Local development - use WhiteNoise
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================================================================
# REST Framework
# =============================================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'love_backend.auth_cognito.CognitoAuthentication',
        'rest_framework.authentication.SessionAuthentication',  # Keep for Django admin
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'donations': '10/minute',  # Custom rate for donation endpoint
    },
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ] if not DEBUG else [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'EXCEPTION_HANDLER': 'love_backend.exceptions.custom_exception_handler',
}

# =============================================================================
# CORS
# =============================================================================
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = [
        origin.strip() for origin in
        os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
        if origin.strip()
    ]

CORS_ALLOW_CREDENTIALS = True

# =============================================================================
# Session & CSRF cookies
# =============================================================================
SESSION_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
CSRF_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_AGE = 86400 * 7  # 1 week

# CSRF trusted origins - required for cross-origin requests
if DEBUG:
    CSRF_TRUSTED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]
else:
    CSRF_TRUSTED_ORIGINS = [
        origin.strip() for origin in
        os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',')
        if origin.strip()
    ]

# Ensure CSRF cookie is sent with cross-origin requests
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript to read the cookie

# =============================================================================
# Caching (Redis)
# =============================================================================
REDIS_URL = os.environ.get('REDIS_URL')

if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'SOCKET_CONNECT_TIMEOUT': 5,
                'SOCKET_TIMEOUT': 5,
                'RETRY_ON_TIMEOUT': True,
                'MAX_CONNECTIONS': 50,
            },
            'KEY_PREFIX': 'lia',
        }
    }
    SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
    SESSION_CACHE_ALIAS = 'default'
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }

# Cache timeouts (in seconds)
CACHE_TTL_SHORT = 60 * 5        # 5 minutes
CACHE_TTL_MEDIUM = 60 * 30      # 30 minutes
CACHE_TTL_LONG = 60 * 60 * 24   # 24 hours

# =============================================================================
# Celery (Background Tasks)
# =============================================================================
if REDIS_URL:
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL
    CELERY_ACCEPT_CONTENT = ['json']
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_RESULT_SERIALIZER = 'json'
    CELERY_TIMEZONE = TIME_ZONE
    CELERY_TASK_TRACK_STARTED = True
    CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
    CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

# =============================================================================
# Stripe
# =============================================================================
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')

# Frontend URL for Stripe redirects
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

# =============================================================================
# Email
# =============================================================================
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')

DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'Love In Action <noreply@loveinaction.com>')

# =============================================================================
# Security Headers (Production)
# =============================================================================
if not DEBUG:
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

    # Content Security Policy
    CSP_DEFAULT_SRC = ("'self'",)
    CSP_SCRIPT_SRC = ("'self'", "https://js.stripe.com")
    CSP_FRAME_SRC = ("'self'", "https://js.stripe.com", "https://hooks.stripe.com")
    CSP_CONNECT_SRC = ("'self'", "https://api.stripe.com")
    CSP_IMG_SRC = ("'self'", "data:", "https:")
    CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
else:
    # Disable CSP in development
    CSP_DEFAULT_SRC = None

# =============================================================================
# Logging
# =============================================================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'cloudwatch': {
            'level': 'INFO',
            'class': 'watchtower.CloudWatchLogHandler',
            'log_group_name': os.environ.get('AWS_CLOUDWATCH_LOG_GROUP', '/lia/django'),
            'log_stream_name': os.environ.get('AWS_CLOUDWATCH_LOG_STREAM', 'application'),
            'formatter': 'verbose',
        } if os.environ.get('AWS_CLOUDWATCH_LOG_GROUP') else {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'cloudwatch'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['console', 'cloudwatch', 'mail_admins'],
            'level': 'ERROR',
            'propagate': False,
        },
        'donations': {
            'handlers': ['console', 'cloudwatch'],
            'level': 'INFO',
            'propagate': False,
        },
        'stripe': {
            'handlers': ['console', 'cloudwatch'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# =============================================================================
# AWS CloudWatch Configuration
# =============================================================================
AWS_CLOUDWATCH_LOG_GROUP = os.environ.get('AWS_CLOUDWATCH_LOG_GROUP', '')

# =============================================================================
# Sentry (Error Tracking)
# =============================================================================
SENTRY_DSN = os.environ.get('SENTRY_DSN')
if SENTRY_DSN and not DEBUG:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.redis import RedisIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
        send_default_pii=False,
        environment=os.environ.get('ENVIRONMENT', 'production'),
    )

# =============================================================================
# AWS Cognito Configuration
# =============================================================================
AWS_COGNITO_REGION = os.environ.get('AWS_COGNITO_REGION', 'eu-west-1')
AWS_COGNITO_USER_POOL_ID = os.environ.get('AWS_COGNITO_USER_POOL_ID', '')
AWS_COGNITO_APP_CLIENT_ID = os.environ.get('AWS_COGNITO_APP_CLIENT_ID', '')

# =============================================================================
# AWS General Configuration
# =============================================================================
AWS_REGION = os.environ.get('AWS_REGION', 'eu-west-1')

# =============================================================================
# AWS SQS (Donation notification queue - replaces Celery)
# =============================================================================
AWS_SQS_DONATION_QUEUE_URL = os.environ.get('AWS_SQS_DONATION_QUEUE_URL', '')

# =============================================================================
# AWS DynamoDB (Activity log)
# =============================================================================
AWS_DYNAMODB_ACTIVITY_TABLE = os.environ.get('AWS_DYNAMODB_ACTIVITY_TABLE', 'lia-activity-log')
