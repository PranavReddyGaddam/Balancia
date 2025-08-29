# Balancia – Smart Bill Splitting

A modern, glassmorphic bill‑splitting app with OCR, item‑level assignment, and a polished Ramp‑style landing. Built with a React + Vite front‑end and a Python FastAPI back‑end.

## ✨ Features (current)
- Responsive landing with animated cards and typewriter processing overlay
- Upload receipt images and extract items with OCR
- Review/edit items (quantity, price, taxable)
- Add/remove people and allocate items per person, split items into parts, toggle “Everyone”
- Bill settings: tax %, tip % and optional cash tip, live summary/delta check
- Split results: per‑person breakdown, totals, export JSON, share helper
- Glassmorphism with dynamic contrast for readability on long pages

## 🗺️ Roadmap (next)
- Login & sessions
- Groups (roles, invites), stored bills
- Payment/settlement suggestions and links
- Multi‑currency, rounding, templates, activity log

## 🧱 Tech Stack
**Frontend**: React (Vite), TypeScript, TailwindCSS

**Backend**: FastAPI (Python), Tesseract OCR (optional AWS Textract)

## 🚀 Getting Started
### Prerequisites
- Node.js 18+
- Python 3.10+

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Vite dev server (default): http://localhost:5173

### Backend
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API server: http://localhost:8000

> If AWS credentials are set, Textract is used. Otherwise the OCR falls back to Tesseract and regex parsing.

## 📦 Build
```bash
cd frontend
npm run build
```
Output: `frontend/dist`

## 🧪 Tests (backend)
```bash
cd backend
pytest
```

## 🖼️ Project Structure
```
frontend/
  src/
    App.tsx
    components/
      ItemsTable.tsx
      PeopleManager.tsx
      ItemAllocationPage.tsx
      BillSettings.tsx
      ResultsPage.tsx
    store/useStore.ts
  public/fonts/

backend/
  app/
    main.py
    api/
    services/
    models/
    core/
  requirements.txt
  tests/
```

## 🔐 Environment
Create `backend/.env` (optional):
```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
TESSERACT_CMD=
```

## 🧭 API (high level)
- `POST /ocr/extract` – image → items
- `POST /allocation/calculate` – items + people + rules → allocations
- `GET /health` – service status

## 🧑‍🎨 Design Notes
- Cards use `bg-white/20` + `border-white/30` with an inset ring for consistent contrast
- Long pages include a subtle darker gradient overlay for readability

## 📄 License
MIT

## 🙌 Contributing
PRs welcome! Open an issue for ideas/bugs. After login/groups land, we can scaffold data models & migrations together.

---

## Backend Deployment on EC2 (Amazon Linux/CentOS – yum)

### 1) Provision EC2
- Instance: t3.micro (or larger), 64‑bit x86, Amazon Linux 2 or CentOS 7/8
- Storage: 16–30 GB gp3
- Security Group: inbound 22/tcp (your IP), 80/tcp (HTTP), 443/tcp (HTTPS)

### 2) Connect and prepare
```bash
# SSH in
ssh -i /path/to/key.pem ec2-user@YOUR_EC2_PUBLIC_IP   # Amazon Linux
# or
ssh -i /path/to/key.pem centos@YOUR_EC2_PUBLIC_IP     # CentOS

# System update
sudo yum -y update

# Basic tooling
sudo yum -y install git gcc gcc-c++ make

# Python 3 and venv
sudo yum -y install python3 python3-venv

# (Optional) Tesseract for local OCR fallback
# Amazon Linux Extra repository or EPEL may be required
sudo amazon-linux-extras enable epel 2>/dev/null || true
sudo yum -y install tesseract tesseract-langpack-eng || sudo yum -y install tesseract-ocr
```

### 3) Clone project and set up venv
```bash
cd ~
git clone https://github.com/your-user/your-repo.git
cd your-repo/backend

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 4) Environment variables
Create `backend/.env`:
```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
TESSERACT_CMD=
```

### 5) Gunicorn + Uvicorn workers
```bash
pip install gunicorn uvicorn

# test run
gunicorn app.main:app -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000 --workers 2
```

### 6) Systemd service
Create `/etc/systemd/system/balancia.service`:
```ini
[Unit]
Description=Balancia FastAPI Service
After=network.target

[Service]
User=ec2-user
Group=nginx
WorkingDirectory=/home/ec2-user/your-repo/backend
Environment="PATH=/home/ec2-user/your-repo/backend/venv/bin"
EnvironmentFile=/home/ec2-user/your-repo/backend/.env
ExecStart=/home/ec2-user/your-repo/backend/venv/bin/gunicorn app.main:app -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000 --workers 2 --timeout 60
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable balancia
sudo systemctl start balancia
sudo systemctl status balancia
```

### 7) Nginx reverse proxy (HTTPS‑ready)
```bash
sudo yum -y install nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```
Create `/etc/nginx/conf.d/balancia.conf`:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    client_max_body_size 25M; # allow receipt uploads

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120;
    }
}
```
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 8) HTTPS with Let’s Encrypt (optional)
```bash
sudo yum -y install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 9) Firewall (Amazon Linux/CentOS)
- If using firewalld:
```bash
sudo systemctl enable firewalld --now
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```
- If using security groups only, ensure 80/443 are open and you can skip firewalld.

### 10) Logs & monitoring
- Gunicorn: `journalctl -u balancia -f`
- Nginx: `/var/log/nginx/access.log` and `error.log`

### 11) Zero‑downtime updates
```bash
cd ~/your-repo
git pull
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart balancia
```

### 12) OCR choices
- With AWS credentials, Textract is used automatically.
- Without, Tesseract fallback works if the package is installed.
