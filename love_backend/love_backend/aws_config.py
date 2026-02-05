"""
AWS Systems Manager Parameter Store Configuration Loader.

Loads secrets (Stripe keys, DB password, Django secret key) from
AWS SSM Parameter Store instead of .env files.

AWS Services practiced:
- SSM Parameter Store (free, up to 10,000 parameters)
- Alternative: AWS Secrets Manager (paid, but auto-rotates secrets)

Exam concepts:
- Parameter Store is part of AWS Systems Manager
- Supports encryption via AWS KMS (Key Management Service)
- SecureString parameters are encrypted at rest
- This follows the security best practice of NOT storing secrets
  in code, environment files, or version control
- Parameter Store is FREE for standard parameters
- Secrets Manager costs $0.40/secret/month but can auto-rotate

How it works:
1. Store secrets in Parameter Store: /ltgb/production/STRIPE_SECRET_KEY
2. At Django startup, fetch parameters by path prefix
3. Inject them into os.environ so settings.py reads them normally
4. Falls back to .env file for local development
"""

import os
import logging

logger = logging.getLogger(__name__)


def load_parameters_from_ssm(prefix='/ltgb/production'):
    """
    Load all parameters under a prefix from AWS SSM Parameter Store
    and inject them into os.environ.

    Parameters are stored as:
        /ltgb/production/SECRET_KEY -> env var SECRET_KEY
        /ltgb/production/STRIPE_SECRET_KEY -> env var STRIPE_SECRET_KEY
        /ltgb/production/DATABASE_URL -> env var DATABASE_URL

    Only runs when USE_AWS_PARAMETER_STORE=true is set.
    Falls back gracefully if SSM is unavailable.
    """
    if os.environ.get('USE_AWS_PARAMETER_STORE', '').lower() != 'true':
        logger.debug("AWS Parameter Store not enabled, using .env")
        return

    try:
        import boto3
    except ImportError:
        logger.warning("boto3 not installed, skipping Parameter Store")
        return

    region = os.environ.get('AWS_REGION', 'eu-west-1')

    try:
        ssm = boto3.client('ssm', region_name=region)

        # Get all parameters under the prefix (with decryption)
        parameters = []
        next_token = None

        while True:
            kwargs = {
                'Path': prefix,
                'WithDecryption': True,
                'MaxResults': 10,
            }
            if next_token:
                kwargs['NextToken'] = next_token

            response = ssm.get_parameters_by_path(**kwargs)
            parameters.extend(response.get('Parameters', []))

            next_token = response.get('NextToken')
            if not next_token:
                break

        # Inject into environment
        loaded = 0
        for param in parameters:
            # Convert /ltgb/production/SECRET_KEY -> SECRET_KEY
            name = param['Name'].split('/')[-1]
            value = param['Value']

            # Only set if not already in environment (env vars take precedence)
            if name not in os.environ:
                os.environ[name] = value
                loaded += 1
                logger.debug(f"Loaded parameter: {name}")

        logger.info(f"Loaded {loaded} parameters from SSM ({prefix})")

    except Exception as e:
        logger.error(f"Failed to load parameters from SSM: {e}")
        logger.info("Falling back to environment variables / .env file")
