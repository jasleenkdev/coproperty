# CoProperty — Complete Project Overview

## What Is This Project?

**CoProperty** is a **tokenized real-estate co-ownership platform** — a web application that allows multiple users to collectively own properties through a **token-based fractional ownership** model with a built-in **governance/voting** system. Think of it as a simplified **DAO (Decentralized Autonomous Organization)** for real-estate, but implemented as a traditional web app (not blockchain-based).

> **Repository origin**: GitLab — `https://gitlab.com/jas46k/coproperty.git`

---

## Core Concept — The Business Logic

The platform operates on this mental model:

1. **Properties** are listed (apartments, residencies, etc.) with a purchase price, monthly rent, and maintenance cost.
2. Each property is divided into **1,000 tokens** (a fixed constant `TOTAL_TOKENS = 1000`).
3. **Users** can own some of these tokens, representing their **fractional ownership** of the property.
4. **Monthly rent** is collected from tenants, maintenance costs are deducted, and the **net rent is distributed** proportionally to each token-holder based on how many tokens they own.
5. Token-holders can **propose governance actions** (change rent, approve maintenance, sell property, buy new property) and **vote on proposals** — where each user's voting power is proportional to their token holdings (token-weighted voting).

### Example Flow
```
Property: GreenView Apartments (₹50,00,000 purchase price)
Monthly Rent: ₹60,000 | Maintenance: ₹8,000 | Net Rent: ₹52,000

User A owns 600 tokens (60%) → gets ₹31,200/month
User B owns 400 tokens (40%) → gets ₹20,800/month

User A proposes: "Increase rent to ₹70,000"
  → User A votes FOR with 600 tokens
  → User B votes AGAINST with 400 tokens
  → Result: 600 > 400 → Proposal APPROVED ✅
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend Framework** | Django | 5.2.10 |
| **REST API** | Django REST Framework (DRF) | — |
| **Database** | SQLite3 | (built-in) |
| **CORS** | django-cors-headers | — |
| **Frontend Framework** | React | 19.2.4 |
| **Build Tool** | Create React App | 5.0.1 |
| **Charts** | Recharts | 3.7.0 |
| **Python Environment** | venv | (backend/env/) |

---

## Directory Structure

```
coproperty/
├── backend/
│   ├── core/                          # Django project root
│   │   ├── core/                      # Django project settings
│   │   │   ├── settings.py            # Django 5.2, DRF, CORS, SQLite
│   │   │   ├── urls.py                # Root URL config → includes properties.urls
│   │   │   ├── wsgi.py / asgi.py      # Server entry points
│   │   │
│   │   ├── properties/                # Main Django app
│   │   │   ├── models.py              # 5 models: Property, Ownership, RentPayout, Proposal, Vote
│   │   │   ├── views.py               # 7 REST API view functions
│   │   │   ├── serializers.py         # DRF serializers for Property, Ownership, RentPayout
│   │   │   ├── services.py            # Business logic: rent distribution, voting
│   │   │   ├── urls.py                # API endpoint routing
│   │   │   ├── admin.py               # Django admin registrations for all 5 models
│   │   │   ├── management/commands/
│   │   │   │   └── distribute_rent.py # Management command: monthly rent distribution
│   │   │   └── migrations/            # 5 migration files
│   │   │
│   │   └── db.sqlite3                 # SQLite database file (196 KB)
│   │
│   └── env/                           # Python virtual environment
│
├── frontend/
│   └── app/                           # React application (Create React App)
│       ├── src/
│       │   ├── App.js                 # Root component → renders <Properties />
│       │   ├── api/
│       │   │   └── api.js             # 5 API functions (fetch-based)
│       │   ├── pages/
│       │   │   ├── properties.js      # Property list page
│       │   │   └── PropertyDetail.js  # Property detail page (ownership, payouts, governance)
│       │   └── components/
│       │       └── OwnershipPie.js    # Pie chart (Recharts) — NOT USED anywhere
│       └── package.json               # React 19 + Recharts dependencies
│
├── data/
│   └── properties.json                # Sample seed data (2 properties)
│
└── coproperty/
    └── README.md                      # Default GitLab README template (unmodified)
```

---

## How To Run

### Backend (Django)
```bash
cd coproperty/backend/core
# Activate virtual environment
../env/Scripts/activate     # Windows
# or: source ../env/bin/activate  # Linux/Mac

python manage.py migrate
python manage.py runserver   # → http://127.0.0.1:8000
```

### Frontend (React)
```bash
cd coproperty/frontend/app
npm install
npm start                    # → http://localhost:3000
```

### Monthly Rent Distribution (Manual)
```bash
python manage.py distribute_rent
```

---

## Current State of the Project

The project is in an **early prototype / MVP** stage. The core models and basic API are functional, but:
- No authentication system is implemented
- No user registration / login
- Frontend has minimal styling (inline CSS, no design system)
- The `OwnershipPie` chart component exists but is **never used** in any page
- The sample data in `data/properties.json` is not connected to any import mechanism
- Several **duplicate code definitions** exist in the backend (see Code Issues document)
- No tests beyond the default CRA test file
- The README is the default GitLab template — never customized
