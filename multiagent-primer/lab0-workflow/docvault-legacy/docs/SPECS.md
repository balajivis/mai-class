# DocVault Legacy - Technical Specification

## 1. System Overview

DocVault Legacy is a Spring Boot 3.2.3 (Java 17) web application exposing a REST API for document/product management, shopping cart, checkout, and administration. It uses an H2 in-memory database with JPA/Hibernate and is built with Maven.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      HTTP Clients                       │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   Spring Boot 3.2.3                     │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │  Controllers │  │  Services   │  │  Repositories  │  │
│  │             │──▶│             │──▶│                │  │
│  │  User       │  │  User       │  │  UserRepo      │  │
│  │  Product    │  │  Product    │  │  ProductRepo   │  │
│  │  Cart       │  │  Order      │  │  OrderRepo     │  │
│  │  Order      │  │  Email*     │  │  OrderItemRepo │  │
│  │  Admin      │  │  Rewards*   │  │  CartItemRepo  │  │
│  │             │  │  Invoice*   │  │  AuditLogRepo  │  │
│  └─────────────┘  └─────────────┘  └───────┬────────┘  │
│                                             │           │
│  ┌──────────────┐  ┌────────────────┐       │           │
│  │  WebConfig   │  │  CacheConfig*  │       │           │
│  │  (CORS: *)   │  │  (dead code)   │       │           │
│  └──────────────┘  └────────────────┘       │           │
│                                             │           │
│  * = non-functional / dead code             │           │
└─────────────────────────────────────────────┼───────────┘
                                              │
                              ┌────────────────▼───────────┐
                              │   H2 In-Memory Database    │
                              │   (jdbc:h2:mem:docvault)   │
                              │                            │
                              │   Console: /h2-console     │
                              │   User: sa / password123   │
                              └────────────────────────────┘
```

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | Java 17 | |
| Framework | Spring Boot 3.2.3 | Upgraded from 2.7.x |
| Build | Maven | |
| Database | H2 (in-memory) | Migrated from PostgreSQL 14 on AWS RDS |
| ORM | Spring Data JPA / Hibernate | DDL auto-generated (`ddl-auto=create`) |
| Seed Data | `data.sql` | Loaded on every startup |
| Server | Embedded Tomcat | Port 8080 |

### Removed / Non-Functional Integrations

| Integration | Status |
|-------------|--------|
| PostgreSQL (AWS RDS) | Removed (Dec 2023); credentials still in comments |
| Redis cache | Removed; `CacheConfig.java` is dead code |
| Stripe payments | Removed; stub always returns success |
| SendGrid email | Non-functional; emails logged to console |
| Elasticsearch | Referenced in docs; never integrated in code |
| RabbitMQ | Referenced in docs; no code |
| PDF invoicing (iText) | Stub only (`InvoiceGenerator.java`) |

## 3. Data Model

### Entity-Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    USERS     │       │   PRODUCTS   │       │  AUDIT_LOG   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ username     │       │ name         │       │ user_id      │
│ email        │       │ description  │       │ action       │
│ password_hash│       │ price        │       │ entity_type  │
│ full_name    │       │ category     │       │ entity_id    │
│ role         │       │ stock_qty    │       │ details      │
│ phone        │       │ image_url    │       │ ip_address   │
│ address      │       │ weight_kg    │       │ created_at   │
│ is_active    │       │ brand        │       └──────────────┘
│ created_at   │       │ sku          │
│ updated_at   │       │ is_active    │
└──────┬───────┘       │ created_at   │
       │               │ updated_at   │
       │               └──────┬───────┘
       │                      │
       │    ┌─────────────┐   │
       ├───▶│ CART_ITEMS  │◀──┤
       │    ├─────────────┤   │
       │    │ id (PK)     │   │
       │    │ user_id(FK) │   │
       │    │ product_id  │   │
       │    │ quantity    │   │
       │    │ added_at    │   │
       │    └─────────────┘   │
       │                      │
       │    ┌─────────────┐   │    ┌───────────────┐
       └───▶│   ORDERS    │   └───▶│  ORDER_ITEMS  │
            ├─────────────┤        ├───────────────┤
            │ id (PK)     │◀───────│ order_id (FK) │
            │ user_id(FK) │        │ product_id(FK)│
            │ total_amount│        │ quantity      │
            │ status      │        │ unit_price    │
            │ ship_address│        └───────────────┘
            │ pay_method  │
            │ pay_ref     │
            │ notes       │
            │ created_at  │
            │ updated_at  │
            └─────────────┘
```

### Order Status Flow

```
PENDING ──▶ PROCESSING ──▶ SHIPPED ──▶ DELIVERED
```

### User Roles

| Role | Intended Access | Actual Enforcement |
|------|----------------|--------------------|
| `CUSTOMER` | Products, cart, own orders | None (role not checked) |
| `ADMIN` | All of the above + admin endpoints | None (admin endpoints have zero auth) |

## 4. API Reference

### Authentication (`/api/auth`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/login` | Login with username/password | No |
| POST | `/register` | Create account | No |
| POST | `/reset-password` | Request password reset | No (broken) |
| GET | `/profile?userId={id}` | Get user profile + order history | No |
| PUT | `/profile?userId={id}` | Update profile fields | No |

### Products (`/api/products`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/` | List all active products | No |
| GET | `/{id}` | Get product by ID | No |
| GET | `/search?q={term}` | Search products (**SQL injection**) | No |
| GET | `/category/{cat}` | Products by category | No |
| GET | `/filter?q=&category=&minPrice=&maxPrice=&sort=` | Advanced filter | No |
| GET | `/available` | In-stock products only | No |

### Cart (`/api/cart`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/?userId={id}` | View cart | No |
| POST | `/add` | Add item to cart | No |
| DELETE | `/{itemId}` | Remove cart item | No |
| DELETE | `/clear?userId={id}` | Clear cart | No |
| GET | `/total?userId={id}` | Cart total (tax: 8.25%) | No |

### Orders (`/api`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/checkout` | Place order (accepts raw card data) | No |
| GET | `/orders?userId={id}` | Order history | No |
| GET | `/orders/{orderId}` | Order detail | No |
| GET | `/orders/search?q=&status=&userId=` | Search orders (**SQL injection**) | No |

### Admin (`/api/admin`) - **No authentication on any endpoint**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/products` | All products (incl. inactive) | **None** |
| PUT | `/products/{id}` | Update product | **None** |
| GET | `/inventory` | Stock report + low stock alerts | **None** |
| GET | `/products/search?q={term}` | Admin product search (JPQL) | **None** |
| GET | `/orders/stats` | Revenue, order counts, AOV | **None** |

## 5. Configuration

### Application Properties

| Property | Value | Notes |
|----------|-------|-------|
| `server.port` | 8080 | |
| `spring.datasource.url` | `jdbc:h2:mem:docvault` | In-memory; data lost on restart |
| `spring.datasource.username` | `sa` | |
| `spring.datasource.password` | `password123` | |
| `spring.jpa.hibernate.ddl-auto` | `create` | Schema rebuilt every startup |
| `spring.h2.console.enabled` | `true` | Accessible at `/h2-console` |
| `logging.level.com.docvault` | `INFO` | |

### Hardcoded Constants (in code)

| Constant | Value | Location |
|----------|-------|----------|
| `TAX_RATE` | `0.08` (8%) | `OrderService.java` |
| Cart tax rate | `0.0825` (8.25%) | `CartController.java` (inconsistent) |
| `SHIPPING_RATE` | `$5.99` | `OrderService.java` |
| `FREE_SHIPPING_THRESHOLD` | `$50.00` | `OrderService.java` |

## 6. Build & Run

```bash
# Build
./mvnw clean package

# Run
./mvnw spring-boot:run

# Access
# API:         http://localhost:8080/api/
# H2 Console:  http://localhost:8080/h2-console
```

## 7. Known Search Implementations

The codebase contains **four different search implementations** that return different results:

| Location | Mechanism | Used By |
|----------|-----------|---------|
| `ProductService.searchProducts()` | Native SQL with string concat (**SQL injection**) | `GET /api/products/search` |
| `SearchUtil.filterProducts()` | Java Streams in-memory filtering | `GET /api/products/filter` |
| `AdminController` inline JPQL | JPQL query in controller | `GET /api/admin/products/search` |
| `ProductService.getProductsByCategory()` | Repository method query | `GET /api/products/category` |

## 8. Security Vulnerabilities (Known)

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | **CRITICAL** | SQL injection via string concatenation | `ProductService`, `OrderService` |
| 2 | **CRITICAL** | No auth on admin endpoints | `AdminController` |
| 3 | **CRITICAL** | Plaintext password storage (new users) | `UserService.register()` |
| 4 | **CRITICAL** | Credit card data logged to console | `OrderService.processPayment()` |
| 5 | **HIGH** | `passwordHash` exposed in API responses | `UserController.getProfile()` |
| 6 | **HIGH** | CORS allows all origins (`*`) | `WebConfig.java` |
| 7 | **HIGH** | Credentials in source code comments | `application.properties` |
| 8 | **HIGH** | H2 console exposed with default creds | `application.properties` |
| 9 | **MEDIUM** | Race condition on last-item checkout | `OrderService.processCheckout()` |
| 10 | **MEDIUM** | Login reveals username existence | `UserService.login()` |

## 9. Dead Code Inventory

| Component | Purpose | Why Dead |
|-----------|---------|----------|
| `EmailService.java` | Send transactional emails | SMTP never configured; `OrderService` has its own inline email stub |
| `RewardsEngine.java` | Loyalty points program | Bean exists but never called from any endpoint |
| `InvoiceGenerator.java` | PDF invoice generation | Stub methods; not wired to any controller |
| `CacheConfig.java` | Redis caching | Redis removed Dec 2023; nothing annotated with `@Cacheable` |
| `AppConfig.java` | Application config | Empty class with only `@Configuration` |

## 10. Testing

| Test | What It Covers |
|------|---------------|
| `DocVaultApplicationTests` | Spring context loads |
| `UserControllerTest` | Basic login/register endpoint tests |
| `SearchUtilTest` | In-memory filter utility |

Test coverage is minimal. No integration tests, no database tests, no security tests.
