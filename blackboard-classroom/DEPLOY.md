# Blackboard Classroom · Deploy Runbook

## One-time setup on `kapi-prod` (the human steps)

These run once. After this, the GitHub Action `deploy-bb.yml` handles every deploy.

### 1. nginx vhost

SSH in and create the vhost:

```bash
ssh kapi-prod
sudo tee /etc/nginx/sites-available/bb.modernaipro.com >/dev/null <<'NGX'
server {
    server_name bb.modernaipro.com;
    listen 80;
    listen [::]:80;

    location / {
        proxy_pass http://127.0.0.1:3007;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE: do not buffer, do not close on idle
        proxy_buffering         off;
        proxy_cache             off;
        proxy_read_timeout      24h;
        proxy_send_timeout      24h;
        proxy_set_header Connection '';
        chunked_transfer_encoding off;
    }
}
NGX
sudo ln -sf /etc/nginx/sites-available/bb.modernaipro.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 2. SSL (Let's Encrypt)

The wildcard `*.modernaipro.com` cert already covers this hostname. If certbot
is configured for nginx + the wildcard, it picks up the new vhost
automatically. Otherwise, force a single-domain cert:

```bash
sudo certbot --nginx -d bb.modernaipro.com --non-interactive --agree-tos -m balaji@mitrarobot.com
```

### 3. PM2 entry

The canonical config lives in **this repo** at:
`Business Strategy/infra/configs/ecosystem.prod.js`

After merging the latest commit, sync it onto the server:

```bash
scp "Business Strategy/infra/configs/ecosystem.prod.js" kapi-prod:/home/azureuser/ecosystem.prod.config.js
ssh kapi-prod 'pm2 reload /home/azureuser/ecosystem.prod.config.js --only bb-modernaipro || pm2 start /home/azureuser/ecosystem.prod.config.js --only bb-modernaipro; pm2 save'
```

### 4. Instructor token (one-time secret)

Generate a strong instructor token and put it in a per-app env file:

```bash
ssh kapi-prod
cd ~/apps/blackboard-classroom
echo "BB_INSTRUCTOR_TOKEN=$(openssl rand -hex 24)" >> .env
echo ".env" >> .gitignore  # safety
pm2 restart bb-modernaipro --update-env
```

Save the token to your password manager — it gates `/api/instructor/*`.

### 5. DNS

Cloudflare already routes `*.modernaipro.com` to `13.72.77.111`. If
`bb.modernaipro.com` is not yet covered (it should be by wildcard), add an
A record manually pointing to that IP.

---

## Routine deploys (automated)

Trigger from GitHub Actions:

1. Push changes (under `blackboard-classroom/`) to `dev`.
2. Open a PR from `dev` → `main`. (Per MAI rule: never touch prod directly.)
3. After merge, run **Actions → "Deploy Blackboard Classroom"** with:
   - target: `production`
   - confirm: `deploy-bb`
4. Workflow rsyncs `blackboard-classroom/` to `~/apps/blackboard-classroom/` on
   kapi-prod, runs `npm install --omit=dev`, then `pm2 reload bb-modernaipro --update-env`.

Health check at `https://bb.modernaipro.com/healthz` should return
`{"ok":true,"ts":...}` within ~5 seconds of reload.

---

## Pre-workshop checklist

7 days out:
- [ ] Confirm staging URL is up
- [ ] Run `npm run tokens` on prod to generate fresh team tokens for the cohort
- [ ] Email tokens to enrolled instructors
- [ ] Verify all 35 enrollees have Anthropic Pro/Max sub or API key

24 hours out:
- [ ] One-team friendly dry-run with 3 volunteers + 6 agents
- [ ] Test rollback button on at least one team
- [ ] Open `/master?token=<instructor>` on the projector
- [ ] Have backup tokens / API keys ready for ~2 students

---

## Operational

```bash
# Logs
ssh kapi-prod 'pm2 logs bb-modernaipro --lines 100'

# Restart
ssh kapi-prod 'pm2 reload bb-modernaipro --update-env'

# Health
curl -s https://bb.modernaipro.com/healthz

# Nuke and reseed (use sparingly — wipes all team state)
ssh kapi-prod 'cd ~/apps/blackboard-classroom && rm db/blackboard.db && pm2 restart bb-modernaipro && npm run tokens'
```
