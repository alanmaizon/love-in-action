# AWS EC2 + RDS Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Route 53                              │
│         lovethatgivesback.com → CloudFront                  │
│         api.lovethatgivesback.com → EC2                     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────┐                         ┌───────────────┐
│  CloudFront   │                         │     EC2       │
│  (Frontend)   │                         │   (Backend)   │
│               │                         │               │
│  S3 Bucket    │                         │ Docker:       │
│  React Build  │                         │ - Nginx       │
│               │                         │ - Gunicorn    │
│               │                         │ - Django      │
└───────────────┘                         └───────┬───────┘
                                                  │
                                                  ▼
                                          ┌───────────────┐
                                          │     RDS       │
                                          │  PostgreSQL   │
                                          └───────────────┘
```

---

## Step 1: Set Up RDS (PostgreSQL)

### 1.1 Create RDS Instance

1. Go to **AWS Console → RDS → Create Database**
2. Settings:
   - **Engine**: PostgreSQL 15
   - **Template**: Free tier (or Production for more resources)
   - **DB Instance Identifier**: `ltgb-database`
   - **Master Username**: `ltgb_user`
   - **Master Password**: Generate a secure password
   - **DB Instance Class**: `db.t3.micro` (free tier) or `db.t3.small`
   - **Storage**: 20 GB GP2
   - **VPC**: Default VPC
   - **Public Access**: No (for security)
   - **Database Name**: `ltgb_db`

3. Note the **Endpoint** (e.g., `ltgb-database.xxxxx.us-east-1.rds.amazonaws.com`)

### 1.2 Create Security Group for RDS

1. Go to **EC2 → Security Groups → Create Security Group**
2. Name: `ltgb-rds-sg`
3. Inbound Rules:
   - Type: PostgreSQL (5432)
   - Source: Your EC2 security group (create this first, or update later)

---

## Step 2: Set Up EC2 Instance

### 2.1 Launch EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Settings:
   - **Name**: `ltgb-backend`
   - **AMI**: Amazon Linux 2023 or Ubuntu 22.04
   - **Instance Type**: `t3.small` (2 vCPU, 2GB RAM) - minimum for Django
   - **Key Pair**: Create new or use existing
   - **Network**: Default VPC
   - **Security Group**: Create new with rules below
   - **Storage**: 20 GB

### 2.2 Security Group Rules (EC2)

Create security group `ltgb-ec2-sg`:

| Type  | Port | Source          | Description       |
|-------|------|-----------------|-------------------|
| SSH   | 22   | Your IP         | SSH access        |
| HTTP  | 80   | 0.0.0.0/0       | HTTP (redirects)  |
| HTTPS | 443  | 0.0.0.0/0       | HTTPS traffic     |

### 2.3 Allocate Elastic IP

1. Go to **EC2 → Elastic IPs → Allocate Elastic IP**
2. Associate with your EC2 instance
3. Note the IP address

---

## Step 3: Configure EC2 Instance

### 3.1 Connect via SSH

```bash
ssh -i your-key.pem ec2-user@your-elastic-ip
# or for Ubuntu:
ssh -i your-key.pem ubuntu@your-elastic-ip
```

### 3.2 Install Docker (Amazon Linux 2023)

```bash
# Update system
sudo dnf update -y

# Install Docker
sudo dnf install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes
exit
```

### 3.3 Install Docker (Ubuntu)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Log out and back in
exit
```

### 3.4 Clone and Deploy

```bash
# Reconnect
ssh -i your-key.pem ec2-user@your-elastic-ip

# Clone repository
git clone https://github.com/yourusername/lovethatgivesback.git
cd lovethatgivesback/love_backend

# Create production environment file
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# Build and start
docker-compose up -d --build

# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Seed charities
docker-compose exec web python manage.py seed_charities
```

---

## Step 4: Set Up SSL with Let's Encrypt

### 4.1 Install Certbot

```bash
# Amazon Linux
sudo dnf install certbot -y

# Ubuntu
sudo apt install certbot -y
```

### 4.2 Get SSL Certificate

```bash
# Stop nginx temporarily
docker-compose stop nginx

# Get certificate
sudo certbot certonly --standalone -d api.lovethatgivesback.com

# Start nginx
docker-compose start nginx
```

### 4.3 Auto-Renewal

```bash
# Add to crontab
sudo crontab -e

# Add this line (renews at 2am daily)
0 2 * * * certbot renew --quiet && docker-compose restart nginx
```

---

## Step 5: Deploy Frontend to S3 + CloudFront

### 5.1 Create S3 Bucket

1. Go to **S3 → Create Bucket**
2. Name: `lovethatgivesback-frontend`
3. Region: Same as EC2
4. Uncheck "Block all public access"
5. Enable static website hosting:
   - Index document: `index.html`
   - Error document: `index.html` (for React Router)

### 5.2 Bucket Policy

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::lovethatgivesback-frontend/*"
        }
    ]
}
```

### 5.3 Build and Upload Frontend

```bash
# On your local machine
cd love_frontend

# Create production .env
echo "VITE_API_URL=https://api.lovethatgivesback.com" > .env.production
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx" >> .env.production

# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://lovethatgivesback-frontend --delete
```

### 5.4 Create CloudFront Distribution

1. Go to **CloudFront → Create Distribution**
2. Settings:
   - **Origin Domain**: `lovethatgivesback-frontend.s3.amazonaws.com`
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP Methods**: GET, HEAD
   - **Cache Policy**: CachingOptimized
   - **Alternate Domain Names**: `lovethatgivesback.com`, `www.lovethatgivesback.com`
   - **SSL Certificate**: Request or import in ACM
   - **Default Root Object**: `index.html`

3. Create custom error response for React Router:
   - HTTP Error Code: 403
   - Response Page Path: `/index.html`
   - HTTP Response Code: 200

---

## Step 6: Configure Route 53

### 6.1 Create Hosted Zone

1. Go to **Route 53 → Create Hosted Zone**
2. Domain: `lovethatgivesback.com`
3. Update nameservers with your domain registrar

### 6.2 Create DNS Records

| Name                          | Type  | Value                              |
|-------------------------------|-------|------------------------------------|
| lovethatgivesback.com         | A     | CloudFront distribution (Alias)   |
| www.lovethatgivesback.com     | A     | CloudFront distribution (Alias)   |
| api.lovethatgivesback.com     | A     | EC2 Elastic IP                    |

---

## Step 7: Configure Stripe Webhook

1. Go to **Stripe Dashboard → Webhooks**
2. Add endpoint: `https://api.lovethatgivesback.com/api/webhooks/stripe/`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `charge.refunded`
4. Copy the **Signing Secret** to your `.env.production`

---

## Step 8: Monitoring & Maintenance

### View Logs

```bash
# All logs
docker-compose logs -f

# Just Django
docker-compose logs -f web

# Just Nginx
docker-compose logs -f nginx
```

### Update Application

```bash
cd lovethatgivesback/love_backend
git pull origin main
docker-compose up -d --build
docker-compose exec web python manage.py migrate
```

### Backup Database

```bash
# Create RDS snapshot via AWS Console
# Or export manually:
docker-compose exec db pg_dump -U ltgb_user ltgb_db > backup_$(date +%Y%m%d).sql
```

---

## Estimated Monthly Costs

| Service      | Tier              | Cost/Month |
|--------------|-------------------|------------|
| EC2          | t3.small          | ~$15       |
| RDS          | db.t3.micro       | ~$15       |
| S3           | < 1GB             | ~$1        |
| CloudFront   | < 10GB transfer   | ~$1        |
| Route 53     | Hosted zone       | ~$0.50     |
| **Total**    |                   | **~$33**   |

*Free tier eligible for first 12 months reduces this significantly.*

---

## Quick Commands Reference

```bash
# SSH to server
ssh -i your-key.pem ec2-user@your-elastic-ip

# View running containers
docker ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Run Django command
docker-compose exec web python manage.py <command>

# Update and deploy
git pull && docker-compose up -d --build

# Check nginx config
docker-compose exec nginx nginx -t
```
