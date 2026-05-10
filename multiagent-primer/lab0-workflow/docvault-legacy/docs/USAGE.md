# DocVault Legacy - API Usage Guide

This is a headless REST API with no web frontend. All interaction is via HTTP requests (curl, Postman, HTTPie, etc.). The only browser-accessible page is the H2 database console.

## Quick Start

```bash
# Build and run
./mvnw spring-boot:run

# Verify it's up
curl http://localhost:8080/api/products
```

The app starts on **port 8080** and loads seed data automatically on every boot.

---

## Seed Data (Pre-loaded)

### Users

| ID | Username | Role | Password | Can Login? |
|----|----------|------|----------|------------|
| 1 | `admin` | ADMIN | `password123` (bcrypt) | No* |
| 2 | `johndoe` | CUSTOMER | `password123` (bcrypt) | No* |
| 3 | `janedoe` | CUSTOMER | `password123` (bcrypt) | No* |

> *Seed users have bcrypt-hashed passwords, but the login endpoint compares plaintext. These accounts **cannot log in**. You must register a new user to get a working account.

### Documents (stored as "Products")

| ID | Name | Category | Stock |
|----|------|----------|-------|
| 1 | Annual Report 2023.pdf | REPORTS | 1 |
| 2 | Employee Handbook v3.docx | POLICIES | 1 |
| 3 | Q4 Revenue Analysis.xlsx | SPREADSHEETS | 1 |
| 4 | NDA Template - Standard.pdf | CONTRACTS | 1 |
| 5 | Product Roadmap 2024.pptx | PRESENTATIONS | 1 |
| 6 | Server Architecture Diagram.png | TECHNICAL | 1 |
| 7 | Vendor Onboarding Checklist.pdf | PROCEDURES | 1 |
| 8 | GDPR Compliance Audit.pdf | COMPLIANCE | 1 |
| 9 | Marketing Campaign Brief.docx | MARKETING | 1 |
| 10 | Board Meeting Minutes Dec.pdf | GOVERNANCE | 0 (out of stock) |

### Existing Orders

5 orders across users `johndoe` (ID 2) and `janedoe` (ID 3), in various statuses (PENDING, PROCESSING, SHIPPED, DELIVERED).

### Existing Cart Items

- `johndoe` (ID 2): Vendor Onboarding Checklist x2, GDPR Compliance Audit x1
- `janedoe` (ID 3): Annual Report 2023 x1

---

## H2 Database Console

The only browser page. Useful for inspecting data directly.

```
URL:      http://localhost:8080/h2-console
JDBC URL: jdbc:h2:mem:docvault
Username: sa
Password: password123
```

---

## Authentication

### Register a New User

Seed users can't log in (see above), so register a new one first.

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "mypassword",
    "fullName": "Test User"
  }'
```

Response includes the full user object (note: your user ID will be `4`).

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "mypassword"
  }'
```

> There are no sessions or tokens. Login just verifies credentials and returns the user object. All other endpoints use `userId` as a query parameter - there is no auth enforcement.

### View Profile

```bash
curl "http://localhost:8080/api/auth/profile?userId=4"
```

Returns user details plus order history.

### Update Profile

```bash
curl -X PUT "http://localhost:8080/api/auth/profile?userId=4" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Name",
    "phone": "555-9999",
    "address": "100 New Street"
  }'
```

### Password Reset (Broken)

```bash
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Always returns success, but the reset token is generated and immediately discarded. The reset cannot be completed.

---

## Browsing Documents/Products

### List All Active Documents

```bash
curl http://localhost:8080/api/products
```

### Get a Single Document

```bash
curl http://localhost:8080/api/products/1
```

### Search by Keyword

```bash
curl "http://localhost:8080/api/products/search?q=annual"
```

Searches name, description, and brand via SQL. (Note: this endpoint is vulnerable to SQL injection.)

### Browse by Category

```bash
curl http://localhost:8080/api/products/category/REPORTS
```

Categories in seed data: `REPORTS`, `POLICIES`, `SPREADSHEETS`, `CONTRACTS`, `PRESENTATIONS`, `TECHNICAL`, `PROCEDURES`, `COMPLIANCE`, `MARKETING`, `GOVERNANCE`.

### Advanced Filter

```bash
# Filter by category
curl "http://localhost:8080/api/products/filter?category=COMPLIANCE"

# Filter by keyword + price range + sorting
curl "http://localhost:8080/api/products/filter?q=report&minPrice=0&maxPrice=100&sort=name"
```

Sort options: `name`, `price`, `price_desc`, `newest`.

### In-Stock Only

```bash
curl http://localhost:8080/api/products/available
```

---

## Shopping Cart

All cart operations use `userId` - there is no session-based cart.

### View Cart

```bash
curl "http://localhost:8080/api/cart?userId=4"
```

### Add Item to Cart

```bash
curl -X POST http://localhost:8080/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 4,
    "productId": 1,
    "quantity": 1
  }'
```

`quantity` defaults to 1 if omitted.

### Get Cart Total

```bash
curl "http://localhost:8080/api/cart/total?userId=4"
```

Returns subtotal, tax (8.25%), shipping, and total. (Note: checkout uses 8% tax - these are inconsistent.)

### Remove a Cart Item

```bash
# Use the cart item ID (not product ID)
curl -X DELETE http://localhost:8080/api/cart/3
```

### Clear Entire Cart

```bash
curl -X DELETE "http://localhost:8080/api/cart/clear?userId=4"
```

---

## Checkout & Orders

### Place an Order

Checks out all items currently in the user's cart.

```bash
curl -X POST http://localhost:8080/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 4,
    "shippingAddress": "123 Main St, Anytown USA",
    "paymentMethod": "CREDIT_CARD",
    "cardNumber": "4111111111111111",
    "cardExpiry": "12/25",
    "cardCvv": "123",
    "notes": "Optional delivery notes"
  }'
```

> Payment is a stub - it always succeeds regardless of card details. Card data is accepted but only logged to console.

The response includes the order ID, total, and item breakdown.

### View Order History

```bash
curl "http://localhost:8080/api/orders?userId=4"
```

### View a Specific Order

```bash
curl http://localhost:8080/api/orders/1
```

### Search Orders

```bash
# By keyword (searches notes and shipping address)
curl "http://localhost:8080/api/orders/search?q=birthday"

# By status
curl "http://localhost:8080/api/orders/search?status=DELIVERED"

# By user
curl "http://localhost:8080/api/orders/search?userId=2"

# Combined
curl "http://localhost:8080/api/orders/search?status=PENDING&userId=2"
```

Order statuses: `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`.

---

## Admin Endpoints

These require no authentication. Anyone can call them.

### List All Products (Including Inactive)

```bash
curl http://localhost:8080/api/admin/products
```

### Update a Product

```bash
curl -X PUT http://localhost:8080/api/admin/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Annual Report 2023 - REVISED.pdf",
    "description": "Updated description",
    "price": 0.00,
    "stockQuantity": 5,
    "isActive": true
  }'
```

All fields are optional - only include what you want to change. If stock drops to 5 or below, a low-stock alert email is triggered (logged to console).

### Inventory Report

```bash
curl http://localhost:8080/api/admin/inventory
```

Returns a breakdown of total products, out-of-stock count, low-stock count, healthy-stock count, total inventory value, and the full product list sorted by stock quantity.

### Admin Product Search

```bash
curl "http://localhost:8080/api/admin/products/search?q=compliance"
```

Searches name and category only (different from the customer search which also checks description and brand).

### Order Statistics

```bash
curl http://localhost:8080/api/admin/orders/stats
```

Returns total orders, total revenue, average order value, and order counts by status.

### Update Order Status

```bash
curl -X PUT http://localhost:8080/api/admin/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "SHIPPED"}'
```

Valid statuses: `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`.

---

## Typical Workflow

```
1. Register    POST /api/auth/register       → get your userId
2. Browse      GET  /api/products             → see available documents
3. Search      GET  /api/products/search?q=   → find specific documents
4. Add to cart POST /api/cart/add             → add items
5. Review cart GET  /api/cart?userId=          → check cart contents
6. Checkout    POST /api/checkout             → place order
7. Track       GET  /api/orders?userId=       → view order history
```

---

## Gotchas & Quirks

| Issue | Details |
|-------|---------|
| Seed users can't log in | bcrypt hashes in DB, but login compares plaintext |
| Data resets on restart | H2 in-memory DB; all data lost when app stops |
| No auth enforcement | Every endpoint works without logging in; just pass `userId` |
| Tax rate mismatch | Cart total uses 8.25%; checkout uses 8% |
| Search results vary | `/search`, `/filter`, and `/admin/products/search` return different results for the same query |
| Card data ignored | Checkout accepts card fields but payment always succeeds |
| Emails go nowhere | All email notifications are logged to console only |
| Password in responses | User objects in API responses include the `passwordHash` field |
