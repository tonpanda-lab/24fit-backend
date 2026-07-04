# Deployment Guide — Ubuntu 24.04 LTS

This guide walks you through setting up **GitHub → Ubuntu Server** auto-deployment for the 24Fit Backend using **GitHub Actions**, **PM2**, and **Nginx**.

---

## Architecture Overview

```
GitHub Push (main)
       ↓
GitHub Actions (SSH)
       ↓
Ubuntu Server (PM2 + Nginx)
       ↓
MongoDB + Node.js App
```

---

## Part 1: Server Setup (One-Time)

### 1.1 Install Node.js (via NVM)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install and use Node.js LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node -v  # v20.x.x
npm -v   # 10.x.x
```

### 1.2 Install PM2 (Process Manager)

```bash
npm install -g pm2

# Set up PM2 to start on boot
pm2 startup systemd
# Run the command it outputs, e.g.:
# sudo env PATH=$PATH:/home/ubuntu/.nvm/versions/node/v20.x.x/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 1.3 Install & Configure MongoDB

```bash
# Import MongoDB GPG key
sudo apt-get install gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor

# Add MongoDB repo (Ubuntu 24.04 = noble)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh --eval "db.adminCommand('ping')"
```

> If you prefer MongoDB Atlas (cloud), skip this step and update `MONGODB_URI` in your `.env`.

### 1.4 Install Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx
sudo systemctl enable nginx
```

### 1.5 Create App Directory & Clone Repo

```bash
# Create directory
cd ~
git clone https://github.com/tonpanda-lab/24fit-backend.git
cd 24fit-backend

# Create logs directory for PM2
mkdir -p logs

# Install dependencies
npm ci --production
```

### 1.6 Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Fill in production secrets:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/nutrisimple
JWT_ACCESS_SECRET=change-me-to-64-random-chars-minimum!!!
JWT_REFRESH_SECRET=change-me-to-64-random-chars-minimum!!!
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

> **Critical:** Use strong random secrets in production. Generate with:  
> `openssl rand -base64 64`

### 1.7 Start App with PM2 (First Time)

```bash
pm2 start ecosystem.config.js --env production
pm2 save
```

Verify it's running:
```bash
pm2 status
pm2 logs 24fit-backend
```

### 1.8 Configure Nginx Reverse Proxy

```bash
# Copy config
sudo cp ~/24fit-backend/nginx/24fit-backend.conf /etc/nginx/sites-available/24fit-backend

# If you have a domain, edit the server_name:
sudo nano /etc/nginx/sites-available/24fit-backend

# Enable site
sudo ln -sf /etc/nginx/sites-available/24fit-backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

Your app is now accessible on port 80 (and 3000 directly).

### 1.9 Configure Firewall (UFW)

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## Part 2: GitHub Actions Setup (One-Time)

### 2.1 Generate SSH Key Pair for GitHub Actions

On your **local machine** (not the server), generate a dedicated deploy key:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/24fit-deploy -N ""
```

This creates:
- `~/.ssh/24fit-deploy` (private key)
- `~/.ssh/24fit-deploy.pub` (public key)

### 2.2 Add Public Key to Server

Copy the public key to your Ubuntu server's `~/.ssh/authorized_keys`:

```bash
# On your local machine
cat ~/.ssh/24fit-deploy.pub
```

```bash
# On the Ubuntu server
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3... github-actions-deploy" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 2.3 Add Private Key to GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `SERVER_HOST` | Your server's IP address (e.g., `192.168.1.100` or domain) |
| `SERVER_USER` | Your server username (e.g., `ubuntu`) |
| `SERVER_SSH_KEY` | Paste the **entire private key** from `~/.ssh/24fit-deploy` |
| `SERVER_PORT` | SSH port (optional, defaults to `22`) |

### 2.4 Test the Deploy Workflow

Push any change to the `main` branch:

```bash
git add .
git commit -m "ci: add deployment pipeline"
git push origin main
```

Go to **GitHub → Actions** tab and watch the deploy job run.

---

## Part 3: Verify Deployment

### Check GitHub Actions
- Go to **Actions** tab in your repo
- You should see a green ✅ `Deploy to Production` run

### Check Server
```bash
# SSH into your server
ssh ubuntu@YOUR_SERVER_IP

# Check PM2 status
pm2 status
pm2 logs 24fit-backend --lines 50

# Check Nginx
curl http://localhost/v1/auth/register -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## Part 4: Useful Commands (Reference)

| Command | Description |
|---------|-------------|
| `pm2 status` | View running processes |
| `pm2 logs 24fit-backend` | View app logs |
| `pm2 restart 24fit-backend` | Restart the app |
| `pm2 reload 24fit-backend` | Zero-downtime reload |
| `pm2 stop 24fit-backend` | Stop the app |
| `pm2 save` | Save current process list |
| `pm2 monit` | Real-time monitoring |
| `sudo tail -f /var/log/nginx/access.log` | View Nginx access logs |
| `sudo tail -f /var/log/nginx/error.log` | View Nginx error logs |

---

## Troubleshooting

### "Permission denied (publickey)" in GitHub Actions
- Double-check the private key is copied correctly to `SERVER_SSH_KEY` secret
- Ensure the public key is in `~/.ssh/authorized_keys` on the server
- Check SSH port matches `SERVER_PORT` secret

### "npm: command not found" on server
- Make sure Node.js is installed via NVM and available in the SSH session
- Add `source ~/.bashrc && nvm use 20` to the deploy script if needed

### MongoDB connection errors
- Verify MongoDB is running: `sudo systemctl status mongod`
- Check `MONGODB_URI` in `.env` matches your setup

### Nginx 502 Bad Gateway
- Check app is running on port 3000: `pm2 status`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify Nginx config syntax: `sudo nginx -t`

---

## Optional: HTTPS with Let's Encrypt

Once you have a domain pointing to your server:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot will automatically configure HTTPS and redirect HTTP → HTTPS.

---

## Files Added for Deployment

| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | GitHub Actions CI/CD pipeline |
| `ecosystem.config.js` | PM2 process configuration |
| `nginx/24fit-backend.conf` | Nginx reverse proxy template |
| `DEPLOY.md` | This guide |
