# 🏠 Community-Owned Property Platform

A full-stack Web2 + Web3 real estate platform where multiple users can collectively invest in properties using blockchain-backed tokenization.

---

# 🚀 Tech Stack

## Backend (Web2)
- Django
- Django REST Framework
- SQLite (Development)

## Blockchain (Web3)
- Solidity
- Hardhat
- Alchemy RPC
- Ethers.js

## Frontend
- React
- Web3 Wallet Integration

---

# 📦 Project Structure

```
community/
│
├── backend/
│   ├── core/               # Django backend
│   ├── blockchain/         # Smart contracts + Hardhat
│   └── .env.example
│
├── frontend/
│   └── app/                # React frontend
│
└── README.md
```

---

# 🛠️ Full Setup Guide

Follow these steps after cloning the repository.

---

# 1️⃣ Clone Repository

```bash
git clone <your-repo-url>
cd community
```

---

# 2️⃣ Backend Setup (Django)

## Step 1: Create Virtual Environment

```bash
cd backend/core
python -m venv env
```

Mac/Linux:
```bash
source env/bin/activate
```

Windows:
```bash
env\Scripts\activate
```

---

## Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Step 3: Configure Environment Variables

Copy the example file:

```bash
cp ../.env.example .env
```

Update `.env` with your values:

```
SECRET_KEY=your-django-secret-key
DEBUG=True
ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=deployed_contract_address
```

⚠️ Never commit `.env`.

---

## Step 4: Run Migrations

```bash
python manage.py migrate
```

Optional:

```bash
python manage.py createsuperuser
```

---

## Step 5: Start Backend Server

```bash
python manage.py runserver
```

Backend runs at:

```
http://127.0.0.1:8000
```

---

# 3️⃣ Blockchain Setup (Hardhat)

Open a new terminal:

```bash
cd backend/blockchain
```

Install dependencies:

```bash
npm install
```

Compile contracts:

```bash
npx hardhat compile
```

Deploy (if needed):

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

After deployment, update `CONTRACT_ADDRESS` in `.env`.

---

# 4️⃣ Frontend Setup (React)

Open new terminal:

```bash
cd frontend/app
npm install
npm start
```

Frontend runs at:

```
http://localhost:3000
```

---

# 🔐 Environment Variables Required

| Variable | Description |
|----------|-------------|
| SECRET_KEY | Django secret key |
| ALCHEMY_RPC_URL | Alchemy RPC endpoint |
| PRIVATE_KEY | Wallet private key (never share) |
| CONTRACT_ADDRESS | Deployed smart contract address |

---

# 🌐 Web2 + Web3 Architecture

- Django handles:
  - Property listings
  - Business logic
  - REST APIs
  - Database management

- Smart contracts handle:
  - Property tokenization
  - Ownership tracking
  - On-chain transactions

- React frontend:
  - Connects wallet
  - Calls backend APIs
  - Interacts with smart contracts

---

# ⚠️ Security Notes

- `.env` is ignored by git
- Private keys should never be committed
- Use testnet for development
- Rotate keys if accidentally exposed

---

# 🧪 Running From Scratch Checklist

After cloning:

- Create virtual environment
- Install backend dependencies
- Install blockchain dependencies
- Install frontend dependencies
- Configure `.env`
- Run migrations
- Start backend
- Start frontend

If everything works, setup is correct.

---

# 📌 Development Notes

- SQLite is used for development only
- For production, use PostgreSQL
- Smart contracts are deployed on Sepolia testnet

---

# 🏁 Done

Your full stack application should now be running locally.

