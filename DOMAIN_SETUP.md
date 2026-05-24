# Domain & SSL Setup Guide

Point `api.nutrisimple.site` → your Ubuntu server with HTTPS via Let's Encrypt.

---

## Prerequisites

- Your domain DNS A record points to `152.42.206.217` ✅
- Nginx is installed on your server
- Your Node.js app is running on port 3000

---

## Step 1: Update Nginx Config for Your Domain

SSH into your server and replace the default nginx config:

```bash
# Backup old config
sudo cp /etc/nginx/sites-available/24fit-backend /etc/nginx/sites-available/24fit-backend.bak 2>/dev/null || true

# Copy the new domain-enabled config from your repo
sudo cp ~/24fit-backend/nginx/24fit-backend.conf /etc/nginx/sites-available/24fit-backend

# Enable the site (if not already)
sudo ln -sf /etc/nginx/sites-available/24fit-backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Create directory for Let's Encrypt webroot
sudo mkdir -p /var/www/certbot

# Test nginx config
sudo nginx -t
```

If `nginx -t` passes, reload:

```bash
sudo systemctl reload nginx
```

---

## Step 2: Obtain SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate (nginx plugin handles everything)
sudo certbot --nginx -d api.nutrisimple.site
```

Follow the prompts:
- Enter your email (for renewal notifications)
- Agree to terms
- Choose whether to redirect HTTP → HTTPS (**choose Yes/2**)

Certbot will automatically:
- Verify domain ownership via HTTP challenge
- Generate SSL certificates
- Update your nginx config with SSL settings
- Set up auto-renewal

---

## Step 3: Verify SSL Auto-Renewal

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run
```

Certbot installs a systemd timer that auto-renews certificates. Check it:

```bash
sudo systemctl status certbot.timer
```

---

## Step 4: Test Everything

```bash
# Test HTTP redirect
curl -I http://api.nutrisimple.site/health
# Expected: HTTP/1.1 301 Moved Permanently → https://...

# Test HTTPS
curl -I https://api.nutrisimple.site/health
# Expected: HTTP/2 200

# Test API endpoint
curl https://api.nutrisimple.site/v1/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@nutrisimple.site","password":"password123"}'
```

---

## Step 5: Update Your App/Clients

Update any client apps (Flutter, Postman, etc.) to use the new domain:

```
https://api.nutrisimple.site
```

Instead of:

```
http://152.42.206.217:3000
```

---

## Troubleshooting

### "Could not resolve host" when curling
- DNS hasn't propagated yet. Wait 5-60 minutes.
- Verify: `dig api.nutrisimple.site +short` should return `152.42.206.217`

### Certbot fails with "connection refused"
- Make sure port 80 is open in your firewall: `sudo ufw allow 80/tcp`
- Make sure nginx is running: `sudo systemctl status nginx`

### "SSL_ERROR_BAD_CERT_DOMAIN"
- You requested a cert for the wrong domain
- Re-run: `sudo certbot --nginx -d api.nutrisimple.site`

### Nginx config test fails
- Check syntax: `sudo nginx -t`
- Common issue: missing `}` or semicolon
- Restore backup: `sudo cp /etc/nginx/sites-available/24fit-backend.bak /etc/nginx/sites-available/24fit-backend`

---

## Useful Commands Reference

| Command | Purpose |
|---------|---------|
| `sudo nginx -t` | Test nginx config syntax |
| `sudo systemctl reload nginx` | Reload nginx without downtime |
| `sudo certbot renew --dry-run` | Test SSL renewal |
| `sudo certbot certificates` | List all SSL certs |
| `sudo certbot delete --cert-name api.nutrisimple.site` | Remove a certificate |
| `sudo tail -f /var/log/nginx/access.log` | View nginx access logs |
| `sudo tail -f /var/log/nginx/error.log` | View nginx error logs |
