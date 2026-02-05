"""
AWS Cognito JWT Authentication Backend for Django REST Framework.

Validates JWT tokens issued by AWS Cognito User Pools.
Automatically creates/updates Django users on first authentication.

AWS Services practiced:
- Cognito User Pools (authentication)
- IAM (understanding token-based auth)
"""

import json
import logging
import time
import urllib.request

from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

try:
    from jose import jwt, JWTError
except ImportError:
    raise ImportError("Install python-jose: pip install 'python-jose[cryptography]'")

logger = logging.getLogger(__name__)

# Cache for Cognito JWKS (JSON Web Key Set)
_jwks_cache = {'keys': None, 'fetched_at': 0}
JWKS_CACHE_TTL = 3600  # 1 hour


def get_cognito_jwks():
    """
    Fetch the JSON Web Key Set from Cognito.
    Cached for 1 hour to avoid repeated HTTP calls.
    """
    now = time.time()
    if _jwks_cache['keys'] and (now - _jwks_cache['fetched_at']) < JWKS_CACHE_TTL:
        return _jwks_cache['keys']

    region = settings.AWS_COGNITO_REGION
    pool_id = settings.AWS_COGNITO_USER_POOL_ID
    jwks_url = f'https://cognito-idp.{region}.amazonaws.com/{pool_id}/.well-known/jwks.json'

    try:
        with urllib.request.urlopen(jwks_url, timeout=5) as response:
            jwks = json.loads(response.read().decode('utf-8'))
            _jwks_cache['keys'] = jwks['keys']
            _jwks_cache['fetched_at'] = now
            logger.info("Fetched Cognito JWKS successfully")
            return jwks['keys']
    except Exception as e:
        logger.error(f"Failed to fetch Cognito JWKS: {e}")
        # Return cached keys if available, even if stale
        if _jwks_cache['keys']:
            return _jwks_cache['keys']
        raise AuthenticationFailed('Unable to verify token: key server unavailable')


def decode_cognito_token(token):
    """
    Decode and validate a Cognito JWT token.

    Validates:
    - Signature (using Cognito's public keys)
    - Expiration
    - Issuer (must match our User Pool)
    - Token use (must be 'id' token)
    """
    region = settings.AWS_COGNITO_REGION
    pool_id = settings.AWS_COGNITO_USER_POOL_ID
    client_id = settings.AWS_COGNITO_APP_CLIENT_ID
    issuer = f'https://cognito-idp.{region}.amazonaws.com/{pool_id}'

    # Get the key ID from the token header (without verifying yet)
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise AuthenticationFailed('Invalid token header')

    kid = unverified_header.get('kid')
    if not kid:
        raise AuthenticationFailed('Token missing key ID')

    # Find the matching public key from JWKS
    keys = get_cognito_jwks()
    key = next((k for k in keys if k['kid'] == kid), None)
    if not key:
        # Key not found - maybe keys rotated, clear cache and retry
        _jwks_cache['keys'] = None
        keys = get_cognito_jwks()
        key = next((k for k in keys if k['kid'] == kid), None)
        if not key:
            raise AuthenticationFailed('Token signing key not found')

    # Verify and decode the token
    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=['RS256'],
            audience=client_id,
            issuer=issuer,
            options={
                'verify_exp': True,
                'verify_aud': True,
                'verify_iss': True,
            }
        )
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token has expired')
    except JWTError as e:
        raise AuthenticationFailed(f'Invalid token: {e}')

    # Verify token_use claim
    token_use = claims.get('token_use')
    if token_use != 'id':
        raise AuthenticationFailed('Invalid token type: expected id token')

    return claims


def get_or_create_user(claims):
    """
    Get or create a Django user from Cognito token claims.

    Maps Cognito attributes to Django user fields:
    - sub -> username (Cognito unique ID)
    - email -> email
    - given_name -> first_name
    - family_name -> last_name
    """
    cognito_sub = claims.get('sub')
    email = claims.get('email', '')
    first_name = claims.get('given_name', '')
    last_name = claims.get('family_name', '')

    if not cognito_sub:
        raise AuthenticationFailed('Token missing subject claim')

    # Try to find user by Cognito sub (stored as username)
    try:
        user = User.objects.get(username=cognito_sub)
        # Update user info if changed in Cognito
        changed = False
        if email and user.email != email:
            user.email = email
            changed = True
        if first_name and user.first_name != first_name:
            user.first_name = first_name
            changed = True
        if last_name and user.last_name != last_name:
            user.last_name = last_name
            changed = True
        if changed:
            user.save(update_fields=['email', 'first_name', 'last_name'])
        return user
    except User.DoesNotExist:
        pass

    # Try by email (might have been created via Django admin)
    if email:
        try:
            user = User.objects.get(email=email)
            # Link existing user to Cognito sub
            user.username = cognito_sub
            user.save(update_fields=['username'])
            logger.info(f"Linked existing user {email} to Cognito sub {cognito_sub}")
            return user
        except User.DoesNotExist:
            pass

    # Create new user
    user = User.objects.create_user(
        username=cognito_sub,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )
    # Set unusable password - auth is via Cognito
    user.set_unusable_password()
    user.save()
    logger.info(f"Created new user for Cognito sub {cognito_sub} ({email})")
    return user


class CognitoAuthentication(BaseAuthentication):
    """
    DRF Authentication backend for AWS Cognito.

    Expects the Authorization header:
        Authorization: Bearer <cognito-id-token>

    Flow:
    1. Extract JWT from Authorization header
    2. Validate token signature against Cognito's public keys
    3. Verify claims (expiry, issuer, audience)
    4. Get or create a Django user from the token claims
    5. Return (user, claims) tuple for DRF
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Bearer '):
            return None  # Not a Bearer token - let other backends try

        token = auth_header[7:]  # Strip "Bearer "

        if not token:
            return None

        claims = decode_cognito_token(token)
        user = get_or_create_user(claims)

        return (user, claims)

    def authenticate_header(self, request):
        """
        Return a string to be used as the WWW-Authenticate header
        in a 401 response.
        """
        return 'Bearer realm="cognito"'
