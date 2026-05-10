# DocVault Legacy - Presentation Deck

> Render these slides with any Markdown presentation tool (Marp, Slidev, reveal.js, Deckset).
> Each `---` is a slide break.

---

## DocVault Legacy

### A Reverse-Engineered Overview

*What it is, how it works, and what we're dealing with*

---

## What is DocVault?

- Originally a **pet supplies e-commerce app** (PawsFirst Inc.)
- **Acquired in 2019**, repurposed as an internal document vault
- The "Products" table now holds **company documents** (annual reports, compliance audits, handbooks)
- The cart/checkout flow doubles as a document request mechanism
- **No dedicated team** - maintained by whoever draws the short straw

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 17 |
| Framework | Spring Boot 3.2.3 |
| Database | H2 in-memory (was PostgreSQL) |
| ORM | Spring Data JPA / Hibernate |
| Build | Maven |
| Server | Embedded Tomcat (port 8080) |

---

## What Was Removed

| Component | Status |
|-----------|--------|
| PostgreSQL (AWS RDS) | Replaced with H2 in-memory |
| Redis cache | Removed; dead config remains |
| Stripe payments | Replaced with stub (always succeeds) |
| SendGrid email | Non-functional; logs to console |
| Elasticsearch | Referenced in docs, never integrated |

---

## Architecture

```
HTTP Clients
     |
Spring Boot 3.2.3
  |-- Controllers (5) --> Services (7*) --> Repositories (6)
  |-- WebConfig (CORS: *)
  |-- CacheConfig (dead)                      |
                                    H2 In-Memory DB
                                   (data lost on restart)

* 3 services are dead code
```

---

## Data Model

```
USERS ---< ORDERS ---< ORDER_ITEMS >--- PRODUCTS
  |                                        |
  +--------< CART_ITEMS >-----------------+

  AUDIT_LOG (tracks all actions)
```

**6 tables, 10 seed "products" (actually documents)**

---

## Key Features

### Working
- Product/document catalog browsing
- Shopping cart management
- Checkout (stub payment)
- Order history
- User registration & login
- Admin product/inventory management
- Audit logging

### Broken
- Password reset (token not stored)
- Email notifications (console only)
- Caching (Redis removed)

---

## API Surface

| Area | Endpoints | Auth Required |
|------|-----------|--------------|
| Auth | 5 | None |
| Products | 6 | None |
| Cart | 5 | None |
| Orders | 4 | None |
| Admin | 5 | **None** |

**25 total REST endpoints, zero authentication enforcement**

---

## The Security Slide

### Critical

- **3 SQL injection points** (string concatenation in native queries)
- **Admin endpoints wide open** (no auth whatsoever)
- **Plaintext passwords** stored for new users
- **Credit card data logged** to console

### High

- Password hashes exposed in API responses
- CORS allows all origins
- Credentials committed in source comments
- H2 console exposed with default credentials

---

## Technical Debt Highlights

- **4 different search implementations** returning different results
- **2 different tax rates** (8% in checkout, 8.25% in cart)
- **Circular dependency** between UserService and OrderService
- **Mixed languages in code** (Spanish method names: `obtenerProducto`, `calcularTotal`)
- **OrderService is 600+ lines** handling orders, payments, inventory, notifications, cart, and reporting
- **Controllers access repositories directly**, bypassing service layer

---

## Dead Code

| Component | What It Was |
|-----------|------------|
| `EmailService.java` | Transactional emails |
| `RewardsEngine.java` | Loyalty points program |
| `InvoiceGenerator.java` | PDF invoice generation |
| `CacheConfig.java` | Redis caching layer |
| `AppConfig.java` | Empty config class |

All wired as Spring beans. None actually used.

---

## Data Persistence Problem

```
Current: H2 In-Memory
         |
    App starts --> data.sql loads seed data
         |
    App stops  --> ALL DATA LOST
```

- Migrated from PostgreSQL in Dec 2023
- Every restart resets to seed data
- No migration tool (Flyway planned, never added)
- Schema rebuilt from scratch on every boot (`ddl-auto=create`)

---

## The Original Team

| Person | Role | Status |
|--------|------|--------|
| Carlos M. | Tech Lead | Left the company |
| Priya S. | Backend Developer | Left the company |
| Jake W. | Intern | Left the company |

> *"I'll update this after my refactor"* - Jake (never updated)

> *"This is load-bearing"* - Carlos (on a currency rounding hack)

---

## What Needs to Happen

### Immediate (P0)
1. Fix SQL injection vulnerabilities
2. Add authentication to admin endpoints
3. Fix password hashing
4. Remove hardcoded credentials from source

### Short-term (P1)
5. Replace H2 with persistent database
6. Consolidate search implementations
7. Fix inconsistent tax rates
8. Add input validation

### Medium-term (P2)
9. Decompose OrderService monolith
10. Implement proper DTOs (stop exposing entities)
11. Add meaningful test coverage
12. Update documentation to match reality

---

## Summary

DocVault Legacy is **load-bearing infrastructure** running on:
- An in-memory database that loses data on restart
- Zero authentication on admin endpoints
- Multiple SQL injection vulnerabilities
- Plaintext password storage

It works. Barely. The goal is to **stabilize, secure, and simplify** -
not rewrite.

---

## Questions?

Detailed docs available:
- `docs/VISION.md` - Product vision and strategic goals
- `docs/SPECS.md` - Full technical specification
- `TODO.md` - Original backlog (Sprint 38, 2021)
