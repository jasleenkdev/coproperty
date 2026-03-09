# CoProperty — Architecture Deep Dive

## System Architecture Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend — React 19 (localhost:3000)"]
        App["App.js"]
        Props["Properties Page"]
        Detail["PropertyDetail Page"]
        Pie["OwnershipPie Component"]
        API["api.js — Fetch Client"]
        
        App --> Props
        Props --> Detail
        Detail -.->|NOT USED| Pie
        Props --> API
        Detail --> API
    end
    
    subgraph Backend["Backend — Django 5.2 + DRF (127.0.0.1:8000)"]
        CORS["CORS Middleware"]
        URLs["URL Router"]
        Views["Views — 7 endpoints"]
        Services["Services Layer"]
        Models["5 Django Models"]
        Admin["Django Admin Panel"]
        MgmtCmd["Management Commands"]
        
        CORS --> URLs
        URLs --> Views
        Views --> Services
        Views --> Models
        Services --> Models
        Admin --> Models
        MgmtCmd --> Services
    end
    
    subgraph DB["Database"]
        SQLite["SQLite3 — db.sqlite3"]
    end
    
    API -->|HTTP REST / JSON| CORS
    Models --> SQLite
```

---

## Data Model (Entity Relationship)

```mermaid
erDiagram
    Property {
        int id PK
        string name
        string location
        float purchase_price
        float monthly_rent
        float maintenance_cost
    }
    
    User {
        int id PK
        string username
        string email
    }
    
    Ownership {
        int id PK
        int user_id FK
        int property_id FK
        int tokens_owned
    }
    
    RentPayout {
        int id PK
        int user_id FK
        int property_id FK
        float amount
        date month
    }
    
    Proposal {
        int id PK
        int property_id FK
        string title
        string proposal_type
        text description
        datetime created_at
        bool is_executed
    }
    
    Vote {
        int id PK
        int proposal_id FK
        int user_id FK
        bool vote
        int tokens_used
    }
    
    User ||--o{ Ownership : "owns tokens of"
    Property ||--o{ Ownership : "divided into"
    User ||--o{ RentPayout : "receives"
    Property ||--o{ RentPayout : "generates"
    Property ||--o{ Proposal : "has"
    Proposal ||--o{ Vote : "receives"
    User ||--o{ Vote : "casts"
```

### Key Constraints
| Constraint | Description |
|-----------|-------------|
| `Ownership.unique_together` | `(user, property)` — One user can own tokens of a property only once |
| `RentPayout.unique_together` | `(user, property, month)` — One payout per user per property per month |
| `Vote.unique_together` | `(proposal, user)` — One vote per user per proposal |
| `TOTAL_TOKENS` | Fixed at 1,000 — hardcoded constant |

---

## API Endpoints

| Method | URL | View Function | Description |
|--------|-----|---------------|-------------|
| `GET` | `/properties/` | `property_list` | List all properties with ROI |
| `GET` | `/properties/<pk>/roi/` | `property_roi` | Get ROI for a specific property |
| `GET` | `/properties/<pk>/ownership/` | `property_ownership` | Get ownership distribution |
| `GET` | `/properties/<pk>/payouts/` | `property_payouts` | Get rent payout history |
| `GET` | `/users/<user_id>/payouts/` | `user_payouts` | Get payouts for a specific user |
| `GET` | `/properties/<pk>/proposals/` | `property_proposals` | Get governance proposals with vote tallies |
| `POST` | `/proposals/<proposal_id>/vote/` | `vote_on_proposal` | Cast a vote on a proposal |

---

## Business Logic Flow

### 1. Rent Distribution Pipeline

```mermaid
sequenceDiagram
    participant Admin as Admin / Cron
    participant Cmd as distribute_rent command
    participant Svc as services.distribute_rent()
    participant DB as SQLite

    Admin->>Cmd: python manage.py distribute_rent
    Cmd->>DB: Property.objects.all()
    DB-->>Cmd: [Property1, Property2, ...]
    
    loop For each property
        Cmd->>Svc: distribute_rent(property)
        Svc->>Svc: net_rent = monthly_rent - maintenance_cost
        Svc->>DB: Ownership.objects.filter(property=prop)
        DB-->>Svc: [Ownership records]
        
        loop For each ownership
            Svc->>Svc: share = tokens_owned / 1000
            Svc->>Svc: payout = share × net_rent
            Svc->>DB: RentPayout.get_or_create(user, property, month, amount)
        end
    end
    
    Cmd-->>Admin: "Monthly rent distributed successfully"
```

### 2. Governance Voting Flow

```mermaid
sequenceDiagram
    participant User as React Frontend
    participant API as Django API
    participant Svc as services.cast_vote()
    participant DB as SQLite

    User->>API: POST /proposals/{id}/vote/ {vote: true}
    API->>DB: Get user (fallback: User.objects.first())
    API->>DB: Get Proposal
    API->>Svc: cast_vote(proposal, user, vote_choice)
    Svc->>DB: Get Ownership (user → property)
    Svc->>DB: Vote.create(tokens_used = ownership.tokens_owned)
    API-->>User: {"status": "vote recorded"}
    
    Note over User,DB: On next GET /properties/{pk}/proposals/
    User->>API: GET /properties/{pk}/proposals/
    API->>Svc: proposal_result(proposal)
    Svc->>DB: sum tokens for FOR votes
    Svc->>DB: sum tokens for AGAINST votes
    Svc-->>API: {votes_for, votes_against, approved: for > against}
    API-->>User: Proposals with vote tallies
```

---

## Frontend Component Tree

```mermaid
graph TD
    index["index.js — React root mount"]
    App["App.js"]
    Properties["Properties — List view"]
    PropertyDetail["PropertyDetail — Detail view"]
    OwnershipPie["OwnershipPie — UNUSED"]
    
    index --> App
    App --> Properties
    Properties -->|onClick card| PropertyDetail
    PropertyDetail -.->|imported but unused| OwnershipPie
    
    style OwnershipPie fill:#ff9999,stroke:#cc0000
```

### State Management
- **No global state** — each page manages its own state via React `useState` / `useEffect`
- Navigation is implemented via **conditional rendering** (not a router) — `selectedProperty` state toggles between list and detail views

### API Communication
- **Fetch API** (no Axios) — simple wrapper functions in `api.js`
- Base URL: `http://127.0.0.1:8000` (hardcoded)
- No error handling, no loading states, no authentication headers
