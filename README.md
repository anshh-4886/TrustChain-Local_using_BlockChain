# TrustChain-Local_using_BlockChain
TrustChain Local is a digital trust infrastructure for MSMEs that transforms transaction data into a lender-ready financial identity. It combines FastAPI backend architecture, JWT authentication, dynamic trust scoring algorithms, and a custom blockchain audit layer to create secure, verifiable, and tamper-resistant business credit profiles.
# 🚀 TrustChain Local  
### Digital Trust Infrastructure for MSMEs  

> Transforming informal business records into verifiable digital financial identity.

---

## 📌 Problem

Millions of small businesses:

- Maintain informal credit records
- Lack digital financial history
- Cannot access structured loans
- Have scattered sales data (cash + UPI)
- Are invisible to formal lenders

This creates a massive financial inclusion gap.

---

## 💡 Solution

**TrustChain Local** is a full-stack fintech platform that:

- Tracks digital + offline sales
- Manages customer credit
- Generates a dynamic Trust Score
- Creates a tamper-proof blockchain audit trail
- Enables loan readiness for MSMEs

---

## 🏗️ Architecture

Frontend → FastAPI Backend → SQLite Database → Blockchain Layer

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** FastAPI
- **Database:** SQLite (SQLAlchemy ORM)
- **Authentication:** JWT
- **Password Security:** Bcrypt
- **Blockchain:** Custom SHA-256 chained ledger
- **API Docs:** Swagger UI

---

## 🔐 Authentication (JWT Based)

Secure token-based authentication.

```bash
POST /auth/signup
POST /auth/login
GET  /auth/me
```

JWT token structure:

```json
{
  "sub": "vendor_id",
  "exp": "expiration_time"
}
```

---

## 🧾 Core Modules

### 👤 Vendor Module
- Signup & Login
- Profile photo upload
- Business type-based policy

### 👥 Customer Module
```bash
POST   /customers
GET    /customers
DELETE /customers/{id}
```

### 💳 Credit Module
```bash
POST   /credits
GET    /credits
POST   /credits/{id}/paid
```

### 💰 Sales Module
```bash
POST /sales
GET  /sales
```

### 📊 KPI Module
```bash
GET /kpis
```

---

## ⭐ Trust Score Engine

The Trust Score is dynamically calculated:

### Formula

```
Score = (RepaymentRate × W1) +
        (RevenueStability × W2) +
        ((100 - DebtRatio) × W3)
```

### Components

- **Repayment Rate**
  ```
  (Paid Credits / Total Credits) × 100
  ```

- **Revenue Stability**
  Based on last 10 sales activity

- **Debt Ratio**
  ```
  Pending Amount / 100
  ```

### Business-Type Based Policies

Different businesses have different weight distributions:

| Business Type | Min | Max |
|--------------|-----|-----|
| Grocery      | 35  | 95  |
| Pharmacy     | 40  | 95  |
| Freelancer   | 25  | 90  |

---

## ⛓ Blockchain Layer (Tamper-Proof Audit System)

Every critical action is recorded as a block:

- SIGNUP
- LOGIN
- ADD_CUSTOMER
- ADD_CREDIT
- PAY_CREDIT
- ADD_SALE
- UPLOAD_PHOTO

Each block stores:

- vendor_id
- action
- payload_hash
- prev_hash
- hash
- timestamp

### Block Hash Creation

```python
raw = f"{vendor_id}|{action}|{payload_hash}|{prev_hash}|{timestamp}"
block_hash = sha256(raw)
```

### Chain Verification

```bash
GET /chain/verify
GET /chain/verify/{vendor_id}
```

If any record is modified → chain breaks → tamper detected.

---

## 🧪 Tamper Detection Demo

1. Open SQLite database
2. Modify `prev_hash` manually
3. Run:

```bash
GET /chain/verify
```

Result:

```json
{
  "is_valid": false,
  "broken_at_id": 7
}
```

This proves blockchain integrity enforcement.

---

## 🗂 Database Tables

- vendors
- customers
- credits
- sales
- trust_policies
- chain_entries

---

## 📂 Project Structure

```
backend/
│
├── main.py
├── routes.py
├── models.py
├── schemas.py
├── crud.py
├── auth.py
├── blockchain.py
├── tamper.py
├── trustscore.py
├── config.py
└── database.py
```

---

## ⚙️ Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/anshh-4886/TrustChain-Local_using_BlockChain.git
cd TrustChain-Local_using_BlockChain/backend
```

### 2️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

### 3️⃣ Run Server

```bash
uvicorn main:app --reload
```

### 4️⃣ Open Swagger UI

```
http://127.0.0.1:8000/docs
```

---

## 🔎 Proof of Work

✔ JWT authentication  
✔ Hashed passwords  
✔ Role-based vendor data isolation  
✔ Real-time trust score calculation  
✔ Business-type dynamic policy  
✔ Blockchain ledger  
✔ Tamper detection API  
✔ Swagger API documentation  
✔ File upload support  

---

## 🏆 USP (Unique Selling Proposition)

> We do not just digitize business data.  
> We make it verifiable, trustworthy, and lender-ready.

TrustChain converts informal economic activity into:

- Structured digital identity
- Risk-scored credit profile
- Immutable audit record
- Financial inclusion pathway

---

## 🌍 Impact

- Enables micro-loans
- Reduces lending risk
- Empowers small businesses
- Bridges informal → formal economy

---

## 👨‍💻 Developed By

Deepanshu Gupta  
B.Tech CSE | FinTech & Blockchain Enthusiast  

---

## 📜 License

MIT License

---

# 🚀 Final Note

TrustChain Local is not just a hackathon project.  
It is a scalable digital trust infrastructure for MSMEs.
