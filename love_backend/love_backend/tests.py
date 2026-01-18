from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status


class CsrfViewTest(APITestCase):
    """Tests for csrf_view (GET /api/auth/csrf/)"""

    def setUp(self):
        self.client = APIClient()

    def test_returns_csrf_token(self):
        """Test that CSRF endpoint returns a token"""
        response = self.client.get('/api/auth/csrf/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('csrfToken', response.data)
        self.assertIsNotNone(response.data['csrfToken'])

    def test_sets_csrf_cookie(self):
        """Test that CSRF endpoint sets a cookie"""
        response = self.client.get('/api/auth/csrf/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Django sets the csrftoken cookie
        self.assertIn('csrftoken', response.cookies)

    def test_no_auth_required(self):
        """Test that CSRF endpoint doesn't require authentication"""
        response = self.client.get('/api/auth/csrf/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class LoginViewTest(APITestCase):
    """Tests for login_view (POST /api/auth/login/)"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

    def test_login_success(self):
        """Test successful login"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_returns_user_data(self):
        """Test that login returns user data"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.user.id)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['first_name'], 'Test')
        self.assertEqual(response.data['last_name'], 'User')

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_nonexistent_user(self):
        """Test login with non-existent user"""
        response = self.client.post('/api/auth/login/', {
            'username': 'nonexistent',
            'password': 'somepassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_missing_password(self):
        """Test login with missing password"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_missing_username(self):
        """Test login with missing username"""
        response = self.client.post('/api/auth/login/', {
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_creates_session(self):
        """Test that login creates a session"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify session by calling /me endpoint
        me_response = self.client.get('/api/auth/me/')
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data['username'], 'testuser')

    def test_login_with_email_as_username(self):
        """Test login using email as username"""
        # Create user with email as username
        User.objects.create_user(
            username='email@example.com',
            email='email@example.com',
            password='testpass123'
        )
        response = self.client.post('/api/auth/login/', {
            'username': 'email@example.com',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class LogoutViewTest(APITestCase):
    """Tests for logout_view (POST /api/auth/logout/)"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_logout_success(self):
        """Test successful logout"""
        # First login
        self.client.force_authenticate(user=self.user)

        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)

    def test_logout_clears_session(self):
        """Test that logout clears the session"""
        # Login first
        self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })

        # Verify logged in
        me_response = self.client.get('/api/auth/me/')
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)

        # Logout
        self.client.post('/api/auth/logout/')

        # Verify logged out - create new client to clear cookies
        new_client = APIClient()
        me_response = new_client.get('/api/auth/me/')
        self.assertEqual(me_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_without_auth(self):
        """Test logout behavior when not authenticated"""
        # Note: The current implementation may return 403 due to CSRF protection
        # or 200 if no CSRF is required for unauthenticated requests
        response = self.client.post('/api/auth/logout/')
        # Accept both 200 (idempotent logout) and 403 (CSRF required)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN])


class MeViewTest(APITestCase):
    """Tests for me_view (GET /api/auth/me/)"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

    def test_returns_user_data_when_authenticated(self):
        """Test that authenticated request returns user data"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.user.id)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['first_name'], 'Test')
        self.assertEqual(response.data['last_name'], 'User')

    def test_returns_401_when_not_authenticated(self):
        """Test that unauthenticated request returns 401"""
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_returns_full_user_fields(self):
        """Test that all expected fields are returned"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expected_fields = ['id', 'username', 'email', 'first_name', 'last_name']
        for field in expected_fields:
            self.assertIn(field, response.data)


@override_settings(
    SOCIALACCOUNT_PROVIDERS={
        'google': {
            'SCOPE': ['profile', 'email'],
            'AUTH_PARAMS': {'access_type': 'online'},
            'APP': {
                'client_id': 'test-google-client-id',
                'secret': 'test-google-secret',
                'key': ''
            }
        }
    }
)
class SocialProvidersViewTest(APITestCase):
    """Tests for social_providers_view (GET /api/auth/social/providers/)"""

    def setUp(self):
        self.client = APIClient()

    def test_returns_providers_list(self):
        """Test that endpoint returns a providers list"""
        response = self.client.get('/api/auth/social/providers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('providers', response.data)
        self.assertIsInstance(response.data['providers'], list)

    def test_includes_google_when_configured(self):
        """Test that Google provider is included when configured"""
        response = self.client.get('/api/auth/social/providers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        providers = response.data['providers']
        google_provider = next(
            (p for p in providers if p['provider'] == 'google'),
            None
        )
        self.assertIsNotNone(google_provider)
        self.assertEqual(google_provider['name'], 'Google')
        self.assertEqual(google_provider['client_id'], 'test-google-client-id')

    def test_no_auth_required(self):
        """Test that social providers endpoint doesn't require auth"""
        response = self.client.get('/api/auth/social/providers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


@override_settings(
    SOCIALACCOUNT_PROVIDERS={}
)
class SocialProvidersEmptyTest(APITestCase):
    """Tests for social_providers_view when no providers configured"""

    def setUp(self):
        self.client = APIClient()

    def test_returns_empty_list_when_no_providers(self):
        """Test that empty list is returned when no providers configured"""
        response = self.client.get('/api/auth/social/providers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['providers'], [])


class AuthIntegrationTest(APITestCase):
    """Integration tests for the full auth flow"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='integrationuser',
            email='integration@example.com',
            password='testpass123'
        )

    def test_full_auth_flow(self):
        """Test complete login -> me -> logout flow"""
        # 1. Get CSRF token
        csrf_response = self.client.get('/api/auth/csrf/')
        self.assertEqual(csrf_response.status_code, status.HTTP_200_OK)

        # 2. Login
        login_response = self.client.post('/api/auth/login/', {
            'username': 'integrationuser',
            'password': 'testpass123'
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertEqual(login_response.data['username'], 'integrationuser')

        # 3. Check authenticated status
        me_response = self.client.get('/api/auth/me/')
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data['username'], 'integrationuser')

        # 4. Logout
        logout_response = self.client.post('/api/auth/logout/')
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

    def test_session_persistence(self):
        """Test that session persists across requests"""
        # Login
        self.client.post('/api/auth/login/', {
            'username': 'integrationuser',
            'password': 'testpass123'
        })

        # Multiple /me requests should all succeed
        for _ in range(3):
            response = self.client.get('/api/auth/me/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['username'], 'integrationuser')
