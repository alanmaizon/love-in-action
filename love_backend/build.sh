#!/usr/bin/env bash
# Render build script for Django
set -o errexit  # Exit on error

pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate

# Seed charities if needed (idempotent - won't duplicate)
python manage.py seed_charities
