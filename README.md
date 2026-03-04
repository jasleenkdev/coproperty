# CoProperty

CoProperty is a **tokenized real estate investment platform** that
enables fractional ownership of properties using blockchain technology.

Users can purchase **ERC20 tokens representing shares of a property**,
receive **proportional rental income**, and participate in **governance
decisions**.

This project demonstrates a **full‑stack Web3 architecture**
integrating:

-   React frontend
-   Django REST backend
-   Solidity smart contracts
-   Hardhat local blockchain
-   Web3.py blockchain interaction

The platform simulates **fractional property ownership and rent
distribution using blockchain tokens.**

------------------------------------------------------------------------

# System Architecture

Frontend (React) ↓ Django REST API ↓ Web3.py Blockchain Service ↓
Hardhat Local Blockchain ↓ Solidity Smart Contract

------------------------------------------------------------------------

# Key Features

## Tokenized Real Estate

Properties are divided into **ERC20 tokens representing fractional
ownership**.

Example:

Property Value Example

Purchase Price: ₹500,000\
Monthly Rent: ₹8,000\
Maintenance: ₹2,000\
Net Rent: ₹6,000\
Total Tokens: 1000

If a user owns **100 tokens**, they own **10% of the property**.

------------------------------------------------------------------------

## Token Purchase Flow

User buys tokens → React frontend sends request → Django API → Web3.py →
Smart contract `mint()` → Tokens minted → Ownership stored in database.

------------------------------------------------------------------------

# Tech Stack

Frontend - React - JavaScript - Fetch API

Backend - Django - Django REST Framework - SimpleJWT authentication

Blockchain - Solidity - Hardhat - Web3.py

Database - SQLite (prototype)

------------------------------------------------------------------------

# Project Structure

coproperty/

backend/ core/ core/ settings.py urls.py

properties/ models.py views.py serializers.py urls.py admin.py

manage.py

blockchain/ contracts/ PropertyToken.sol

scripts/ deploy.ts

hardhat.config.ts

frontend/ src/ components/ api/ App.js

------------------------------------------------------------------------

# Requirements

Node.js

Recommended version:

Node 18 or Node 20

Hardhat does NOT support Node 22.

Check version:

node -v

------------------------------------------------------------------------

Python

Python 3.10+

------------------------------------------------------------------------

# Installation

Clone repository

git clone https://gitlab.com/jas46k/coproperty.git

cd coproperty

------------------------------------------------------------------------

# Blockchain Setup

cd backend/blockchain

npm install

Start Hardhat node

npx hardhat node

You should see test accounts like:

0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

------------------------------------------------------------------------

Deploy contract

In another terminal:

npx hardhat run scripts/deploy.ts --network localhost

Copy the deployed contract address.

Example:

0x5FbDB2315678afecb367f032d93F642f64180aa3

------------------------------------------------------------------------

# Backend Setup

cd backend/core

Create virtual environment

python -m venv env

Activate environment

Mac/Linux

source env/bin/activate

Windows

env`\Scripts`{=tex}`\activate`{=tex}

Install dependencies

pip install -r requirements.txt

------------------------------------------------------------------------

Create .env file

backend/core/.env

ALCHEMY_RPC=http://127.0.0.1:8545
DEPLOYER_PRIVATE_KEY=YOUR_HARDHAT_PRIVATE_KEY
CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT

Example Hardhat key

0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

------------------------------------------------------------------------

Run migrations

python manage.py makemigrations python manage.py migrate

------------------------------------------------------------------------

Create admin user

python manage.py createsuperuser

------------------------------------------------------------------------

Run backend server

python manage.py runserver

Backend runs at

http://127.0.0.1:8000

------------------------------------------------------------------------

# Frontend Setup

cd frontend

Install dependencies

npm install

Start frontend

npm start

Frontend runs at

http://localhost:3000

------------------------------------------------------------------------

# Running the Full System

Start services in this order

1 Start Hardhat

npx hardhat node

2 Deploy contract

npx hardhat run scripts/deploy.ts --network localhost

3 Start Django

python manage.py runserver

4 Start React

npm start

------------------------------------------------------------------------

# API Endpoints

Property list

GET /properties/

Property ROI

GET /properties/`<id>`{=html}/roi/

Property ownership

GET /properties/`<id>`{=html}/ownership/

Property payouts

GET /properties/`<id>`{=html}/payouts/

Buy tokens

POST /properties/`<id>`{=html}/buy/

Example request

{ "wallet_address": "0x123...", "amount": 100 }

Example response

{ "message": "Tokens minted successfully", "tx_hash": "0xabc...",
"tokens_owned": 100 }

------------------------------------------------------------------------

# Smart Contract Interaction

Example mint call from backend

contract.functions.mint(wallet_address, amount)

------------------------------------------------------------------------

# Current Implemented Features

Property listing\
ROI calculation\
Token purchase\
Blockchain minting\
Ownership storage\
Transaction confirmation UI\
Wallet nonce login

------------------------------------------------------------------------

# Planned Features

Ownership distribution dashboard

wallet address tokens owned ownership percentage

Rent payout distribution

Monthly proportional rent payments

Governance voting

Token weighted proposals

Ownership charts

Visualization of token distribution

------------------------------------------------------------------------

# Security Notes

This project is a **prototype demo**.

Do not use: - Hardhat private keys - SQLite database - Local blockchain

in production environments.

------------------------------------------------------------------------

# Author

https://github.com/jas46k/coproperty

------------------------------------------------------------------------

# License

MIT License
