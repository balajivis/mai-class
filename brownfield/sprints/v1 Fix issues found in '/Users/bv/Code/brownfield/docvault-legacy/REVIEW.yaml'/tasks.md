# Sprint v1 Fix issues found in '/Users/bv/Code/brownfield/docvault-legacy/REVIEW.yaml' Tasks

## Block A: Security & API Hardening

- [ ] **T01: Remove paymentToken from checkout endpoint** (S)
  What: Delete raw credit card data parameter that violates PCI-DSS
  Files: controller/OrderController.java, service/OrderService.java, repository/ProductRepository.java
  Logic:
    Remove paymentToken from OrderController.checkout() @RequestBody Map (line 29)
    Remove paymentToken param from OrderService.processCheckout() signature (line 88)
    Remove paymentToken from processPayment() call (line 177)
    Update processPayment() stub to not reference it
  Test: POST /api/checkout with no paymentToken field — verify success. Grep for "paymentToken" — only references are in comments/history.

- [ ] **T02: Add OrderDTO and update Order endpoints** (M)
  What: Prevent User entity (with passwordHash) from being serialized in API responses
  Files: model/OrderDTO.java (new), controller/OrderController.java, service/OrderService.java
  Depends: none
  Logic:
    Create OrderDTO.java with fields: id, totalAmount, status, shippingAddress, paymentMethod, createdAt, userId (no User object)
    Update OrderController.getOrders() return type from List<Order> to List<OrderDTO> (line 44-46)
    Update OrderController.getOrder() return type from Order to OrderDTO (line 50-53)
    Add OrderService.mapOrderToDTO(Order) helper method
    Update searchOrders() to return List<OrderDTO>
  Test: GET /api/orders?userId=2 — response JSON includes totalAmount, status, but no user or passwordHash. Verify all fields present.

## Block B: Data Integrity

- [ ] **T03: Complete password reset with token storage and confirm endpoint** (M)
  What: Implement broken password reset feature — generate token, store, validate, confirm
  Files: model/User.java, repository/UserRepository.java, controller/UserController.java, service/UserService.java, resources/schema.sql
  Depends: none
  Logic:
    Add resetToken VARCHAR(255) and resetTokenExpiry TIMESTAMP to User model
    Add CREATE INDEX idx_users_reset_token ON users(reset_token) to schema.sql
    UserService.requestPasswordReset(email) generates UUID, saves to users.reset_token, sets expiry to now+24h
    Add POST /api/auth/reset-password-confirm endpoint: accepts token and newPassword
    Validate token exists, not expired, matches user, not blank; update password, clear token
    Audit log the reset success
  Test: POST /api/auth/reset-password with email=john@example.com → audit log shows token generated. POST /api/auth/reset-password-confirm?token=<uuid>&newPassword=newpass123 → password changes, token cleared. Reuse same token → 400 error (consumed).

- [ ] **T04: Add pessimistic lock to cart stock check** (S)
  What: Fix TOCTOU race condition where two concurrent requests both read stock before either decrements
  Files: repository/ProductRepository.java, service/OrderService.java
  Depends: none
  Logic:
    Add @Lock(LockModeType.PESSIMISTIC_WRITE) to new method ProductRepository.findByIdForUpdate(Long id)
    Update OrderService.addToCart() line 309 to use findByIdForUpdate() instead of findById() during stock check
    Lock acquired on stock quantity read, released at transaction end
  Test: Two concurrent POST /api/cart requests with userId=1, productId=1, quantity=5 when stock=6. Verify one succeeds (stock=1), one fails with "Insufficient stock". No duplicate cart items.

## Block C: Performance

- [ ] **T05: Replace in-memory product filter with SQL query** (M)
  What: ProductController.filterProducts() loads all active products into memory, filters in Java
  Files: repository/ProductRepository.java, service/ProductService.java, controller/ProductController.java
  Depends: none
  Logic:
    Add ProductRepository.findWithFilters(category, minPrice, maxPrice, searchTerm, sort) using JPA Criteria API or JPQL
    Query filters at database level: category LIKE, price BETWEEN, name/description/brand LIKE, sort by name/price
    Add ProductService.filterProducts() wrapper
    Update ProductController.filterProducts() line 60-70 to use service method instead of SearchUtil.filterProducts()
    Verify ORDER BY clause respects sort parameter (name, price_asc, price_desc)
  Test: GET /api/products/filter?category=DOCUMENTS&minPrice=0&maxPrice=100 — verify returns only docs in price range. Add 1000-product dataset, verify response time <100ms (not ~1s with in-memory).

- [ ] **T06: Replace in-memory order & inventory stats with SQL aggregates** (M)
  What: Admin endpoints load all orders/products into memory, aggregate in Java; should use SQL
  Files: service/OrderService.java, controller/AdminController.java, repository/OrderRepository.java, repository/ProductRepository.java
  Depends: none
  Logic:
    OrderService.getOrderStats() line 449-468:
      Replace orderRepository.findAll() with native query: SELECT COUNT(*), SUM(total_amount), status, COUNT(*) GROUP BY status
      Return aggregates directly (totalOrders, totalRevenue, statusBreakdown, averageOrderValue); don't include order list
    AdminController.getInventoryReport() line 81-119:
      Replace entityManager.createQuery("SELECT p FROM Product") with SQL query returning COUNT, SUM, status counts
      Return summary only: totalProducts, outOfStock, lowStock, healthyStock, totalInventoryValue
      Remove products array from response
    Add indexes: CREATE INDEX idx_products_stock_active ON products(stock_quantity, is_active) if not exists
  Test: GET /api/admin/orders/stats — response includes totalRevenue (SUM), statusBreakdown, but no orders array. GET /api/admin/inventory — response is <1KB JSON (not 100KB products list). Large dataset (10k orders/products) returns instantly.
