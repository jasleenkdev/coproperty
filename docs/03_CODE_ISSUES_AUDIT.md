# CoProperty — Code Issues & Technical Debt

This document catalogs every bug, code smell, and technical debt item found during the codebase audit. Issues are ordered by **severity** (Critical → High → Medium → Low).

---

## 🔴 CRITICAL Issues

### 1. Duplicate `RentPayout` Model Definition
**File**: `backend/core/properties/models.py` (Lines 36–43 vs Lines 48–58)

The `RentPayout` model is defined **twice**. The second definition silently overrides the first. This means:
- The first definition (with `auto_now_add=True` on `month`) is completely dead code
- The second definition (with `default=now` and `unique_together`) is what actually runs
- This is confusing and error-prone

**Fix**: Remove lines 36–43 entirely.

---

### 2. Duplicate `distribute_rent` Function
**File**: `backend/core/properties/services.py` (Lines 5–17 vs Lines 25–40)

Two versions of `distribute_rent` exist in the same file:
- **v1 (Lines 5–17)**: Uses `RentPayout.objects.create()` — no duplicate protection
- **v2 (Lines 25–40)**: Uses `get_or_create()` with month-based idempotency — the correct version

Python will use the **second** definition, making the first dead code.

**Fix**: Remove lines 1–17 entirely and the duplicate `TOTAL_TOKENS` on line 3.

---

### 3. Duplicate `urlpatterns` in Root URLs
**File**: `backend/core/core/urls.py` (Lines 20–22 vs Lines 24–27)

`urlpatterns` is assigned twice. The second assignment **overwrites** the first entirely. First definition is dead code.

**Fix**: Remove lines 20–22.

---

### 4. No Authentication — Voting is Completely Insecure
**File**: `backend/core/properties/views.py` (Line 72)

```python
user = request.user or User.objects.first()
```

- No authentication middleware is enforced
- When no user is authenticated (which is always), it falls back to `User.objects.first()` — meaning **all votes go to whatever user happens to be first in the database**
- Anyone can cast unlimited votes without authentication
- There's no CSRF protection on the POST endpoint since CORS allows all origins

---

## 🟠 HIGH Issues

### 5. Unused `OwnershipPie` Component
**File**: `frontend/app/src/components/OwnershipPie.js`

This Recharts pie chart component is **imported nowhere and rendered nowhere**. It was clearly intended for `PropertyDetail.js` to visualize ownership distribution, but it was never integrated.

---

### 6. No Error Handling in Frontend API Layer
**File**: `frontend/app/src/api/api.js`

All 5 API functions follow this pattern:
```javascript
const response = await fetch(url);
return response.json();
```
- No `try/catch` blocks
- No HTTP status code checking
- No error state propagation to UI
- If the backend is down, the app silently fails with no user feedback

---

### 7. Hardcoded API Base URL
**File**: `frontend/app/src/api/api.js` (Line 1)

```javascript
const API_BASE = "http://127.0.0.1:8000";
```
This hardcoded URL means the frontend can never work in production without code changes.

---

### 8. Race Condition in Vote Buttons
**File**: `frontend/app/src/pages/PropertyDetail.js` (Lines 98–113)

```javascript
onClick={() => {
    voteOnProposal(p.id, true);
    getPropertyProposals(property.id).then(setProposals);
}}
```
The vote POST is fired, and then the proposals are **immediately re-fetched** without waiting for the vote to be recorded. The re-fetch will likely return stale data.

---

## 🟡 MEDIUM Issues

### 9. No Loading States
No loading indicators exist anywhere. When data is being fetched, the UI shows nothing (empty lists).

### 10. No Input Validation
- Frontend: No validation on vote submissions
- Backend: No field validation beyond what Django provides by default (e.g., no max purchase_price, no min tokens check)

### 11. Float Fields for Currency
**File**: `backend/core/properties/models.py`

`purchase_price`, `monthly_rent`, `maintenance_cost`, and `amount` all use `FloatField`. For financial data, `DecimalField` should be used to avoid floating-point precision errors.

### 12. No Pagination
The property list API returns **all properties at once**. This will become a problem at scale.

### 13. Insecure Secret Key
**File**: `backend/core/core/settings.py` (Line 23)

The Django `SECRET_KEY` is hardcoded and starts with `django-insecure-`. This is the auto-generated development key and should never be used in production.

---

## 🟢 LOW Issues

### 14. Default CRA CSS
`App.css` contains default Create React App styles (spinning logo) that are completely unused.

### 15. Inline Styles Throughout Frontend
All styling is done with inline `style={{}}` objects. No CSS classes, no design system, no consistency.

### 16. No Router
Navigation between property list and detail uses conditional rendering (`if (selectedProperty)`). This means:
- No URL-based routing
- Browser back button doesn't work
- No deep-linking to specific properties

### 17. Sample Data Not Connected
`data/properties.json` exists but has no import script or fixture mechanism to seed the database.

### 18. `manage.py` Contains Hardcoded Project Name
Standard Django boilerplate — not a real issue, but worth noting for when the project is renamed.
