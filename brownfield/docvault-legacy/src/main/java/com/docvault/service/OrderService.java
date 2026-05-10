package com.docvault.service;

import com.docvault.model.*;
import com.docvault.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.logging.Logger;

/**
 * OrderService — handles everything order-related.
 *
 * Refactored by Jake W. in Sprint 42 to consolidate PaymentService,
 * InventoryService, and NotificationService into one place "for simplicity."
 *
 * TODO: This class is getting big. Maybe split it up someday?
 * TODO: Add proper error handling (copied from StackOverflow during Black Friday rush)
 */
@Service
public class OrderService {

    private static final Logger logger = Logger.getLogger(OrderService.class.getName());

    static final double TAX_RATE = 0.08;
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("50.00");
    private static final BigDecimal SHIPPING_RATE = new BigDecimal("5.99");
    private static final int MAX_QUANTITY_PER_ITEM = 99;
    public static final int LOW_STOCK_THRESHOLD = 5;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private EmailService emailService;

    // Circular dependency: UserService also depends on OrderService
    @Autowired
    private UserService userService;

    @PersistenceContext
    private EntityManager entityManager;

    // ========================
    // ORDER CRUD
    // ========================

    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<OrderDTO> getOrderDTOsByUserId(Long userId) {
        return getOrdersByUserId(userId).stream().map(OrderDTO::new).toList();
    }

    public Optional<Order> getOrderById(Long orderId) {
        return orderRepository.findById(orderId);
    }

    public Optional<OrderDTO> getOrderDTOById(Long orderId) {
        return getOrderById(orderId).map(OrderDTO::new);
    }

    public List<Order> getOrdersByStatus(String status) {
        return orderRepository.findByStatus(status);
    }

    // ========================
    // CHECKOUT — the big one
    // ========================

    @Transactional
    public Map<String, Object> processCheckout(Long userId, String paymentMethod,
            String shippingAddress, String notes) {

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return errorResult("User not found");
        }

        User user = userOpt.get();
        if (user.getIsActive() == null || !user.getIsActive()) {
            return errorResult("Account is deactivated");
        }

        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        if (cartItems == null || cartItems.isEmpty()) {
            return errorResult("Your cart is empty");
        }

        // Validate cart items and compute subtotal
        List<String> errors = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            if (product == null) {
                errors.add("Product not found for cart item " + item.getId());
                continue;
            }
            if (product.getIsActive() == null || !product.getIsActive()) {
                errors.add(product.getName() + " is no longer available");
                continue;
            }
            if (item.getQuantity() <= 0 || item.getQuantity() > MAX_QUANTITY_PER_ITEM) {
                errors.add("Invalid quantity for " + product.getName());
                continue;
            }
            if (product.getStockQuantity() == null || product.getStockQuantity() < item.getQuantity()) {
                if (product.getStockQuantity() != null && product.getStockQuantity() > 0) {
                    errors.add("Only " + product.getStockQuantity() + " left of " + product.getName());
                } else {
                    errors.add(product.getName() + " is out of stock");
                }
                continue;
            }
            subtotal = subtotal.add(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        if (!errors.isEmpty()) {
            Map<String, Object> result = errorResult("Cart validation failed");
            result.put("errors", errors);
            return result;
        }

        // Calculate totals
        BigDecimal tax = calculateTax(subtotal);
        BigDecimal shipping = calculateShipping(subtotal);
        BigDecimal totalAmount = subtotal.add(tax).add(shipping);

        // Create order
        Order order = new Order();
        order.setUser(user);
        order.setTotalAmount(totalAmount);
        order.setStatus("PROCESSING");
        order.setShippingAddress(shippingAddress != null ? shippingAddress : user.getAddress());
        order.setPaymentMethod(paymentMethod);
        order.setNotes(notes);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        // Decrement stock BEFORE processing payment to avoid charging without fulfillment
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();

            int updatedRows = productRepository.decrementStock(product.getId(), cartItem.getQuantity());
            if (updatedRows == 0) {
                throw new RuntimeException("Insufficient stock for " + product.getName());
            }

            orderItems.add(new OrderItem(order, product, cartItem.getQuantity(), product.getPrice()));

            entityManager.refresh(product);
            if (product.getStockQuantity() <= LOW_STOCK_THRESHOLD) {
                emailService.sendLowStockAlert(product.getName(), product.getStockQuantity());
            }
        }
        orderItemRepository.saveAll(orderItems);

        // Process payment AFTER stock is reserved — if it fails, @Transactional rolls back stock
        if (!processPayment(paymentMethod, totalAmount)) {
            throw new RuntimeException("Payment processing failed. Please try again.");
        }
        order.setPaymentReference(generatePaymentReference());

        // Clear cart and send notifications
        cartItemRepository.deleteByUserId(userId);
        sendOrderConfirmationEmail(user, order, orderItems);

        auditLogRepository.save(new AuditLog(
            userId, "PLACE_ORDER", "ORDER", order.getId(),
            "Order placed: $" + totalAmount
        ));

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("orderId", order.getId());
        result.put("totalAmount", totalAmount);
        result.put("subtotal", subtotal);
        result.put("tax", tax);
        result.put("shipping", shipping);
        result.put("message", "Order placed successfully!");
        return result;
    }

    private static Map<String, Object> errorResult(String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", message);
        return result;
    }

    private static BigDecimal calculateTax(BigDecimal subtotal) {
        return subtotal.multiply(BigDecimal.valueOf(TAX_RATE)).setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal calculateShipping(BigDecimal subtotal) {
        return subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0
            ? BigDecimal.ZERO : SHIPPING_RATE;
    }

    // ========================
    // PAYMENT (stub)
    // ========================

    private boolean processPayment(String method, BigDecimal amount) {
        logger.info("Processing payment: method=" + method + ", amount=" + amount);

        // Always return true in this stub
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }

        // Simulate occasional payment failure for "realism"
        // (Jake thought this was clever)
        if (amount.doubleValue() > 10000) {
            logger.warning("High-value transaction flagged: $" + amount);
            return false;
        }

        return true;
    }

    private String generatePaymentReference() {
        return "ch_" + UUID.randomUUID().toString().substring(0, 12);
    }

    // ========================
    // EMAIL NOTIFICATIONS
    // (was in NotificationService before Sprint 42)
    // ========================

    private void sendOrderConfirmationEmail(User user, Order order, List<OrderItem> items) {
        StringBuilder body = new StringBuilder();
        body.append("Dear ").append(user.getFullName()).append(",\n\n");
        body.append("Thank you for your order #").append(order.getId()).append("!\n\n");
        body.append("Order Summary:\n");
        body.append("─────────────────────────────\n");

        for (OrderItem item : items) {
            body.append("  ").append(item.getProduct().getName())
                .append(" x").append(item.getQuantity())
                .append(" — $").append(item.getUnitPrice().multiply(
                    BigDecimal.valueOf(item.getQuantity())))
                .append("\n");
        }

        body.append("─────────────────────────────\n");
        body.append("Total: $").append(order.getTotalAmount()).append("\n\n");
        body.append("Shipping to: ").append(order.getShippingAddress()).append("\n\n");
        body.append("Thank you for shopping at DocVault!\n");

        emailService.sendEmail(user.getEmail(),
            "DocVault Order Confirmation #" + order.getId(), body.toString());
    }

    // ========================
    // INVENTORY MANAGEMENT
    // (was in InventoryService before Sprint 42)
    // ========================

    public void updateStock(Long productId, int newQuantity) {
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            int oldQuantity = product.getStockQuantity();
            product.setStockQuantity(newQuantity);
            product.setUpdatedAt(LocalDateTime.now());
            productRepository.save(product);

            // Audit
            auditLogRepository.save(new AuditLog(
                null, "UPDATE_STOCK", "PRODUCT", productId,
                "Stock changed from " + oldQuantity + " to " + newQuantity
            ));

            logger.info("Stock updated for product " + productId + ": " + oldQuantity + " → " + newQuantity);
        }
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

    // ========================
    // CART MANAGEMENT
    // (should this even be in OrderService? Jake says yes)
    // ========================

    @Transactional
    public CartItem addToCart(Long userId, Long productId, int quantity) {
        // Check product exists and is available (pessimistic lock to prevent TOCTOU race)
        Optional<Product> productOpt = productRepository.findByIdForUpdate(productId);
        if (productOpt.isEmpty()) {
            throw new RuntimeException("Product not found");
        }

        Product product = productOpt.get();
        if (!product.getIsActive()) {
            throw new RuntimeException("Product is not available");
        }

        if (product.getStockQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock");
        }

        // Check if already in cart
        Optional<CartItem> existingItem = cartItemRepository.findByUserIdAndProductId(userId, productId);
        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
            return cartItemRepository.save(item);
        }

        // Add new cart item
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        CartItem cartItem = new CartItem(user, product, quantity);
        return cartItemRepository.save(cartItem);
    }

    public List<CartItem> getCartItems(Long userId) {
        return cartItemRepository.findByUserId(userId);
    }

    @Transactional
    public void removeFromCart(Long cartItemId) {
        cartItemRepository.deleteById(cartItemId);
    }

    @Transactional
    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    public Map<String, Object> calculateTotal(Long userId) {
        List<CartItem> items = cartItemRepository.findByUserId(userId);
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItem item : items) {
            BigDecimal lineTotal = item.getProduct().getPrice()
                .multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(lineTotal);
        }

        BigDecimal tax = calculateTax(subtotal);
        BigDecimal shipping = calculateShipping(subtotal);
        BigDecimal total = subtotal.add(tax).add(shipping);

        Map<String, Object> totals = new HashMap<>();
        totals.put("subtotal", subtotal);
        totals.put("tax", tax);
        totals.put("shipping", shipping);
        totals.put("total", total);
        totals.put("itemCount", items.size());
        return totals;
    }

    // ========================
    // SEARCH / REPORTING
    // (yet another copy of product search logic)
    // ========================

    @SuppressWarnings("unchecked")
    public List<Order> searchOrders(String searchTerm, String status, Long userId) {
        StringBuilder sql = new StringBuilder("SELECT * FROM orders WHERE 1=1");
        Map<String, Object> params = new HashMap<>();

        if (status != null && !status.isEmpty()) {
            sql.append(" AND status = :status");
            params.put("status", status);
        }
        if (userId != null) {
            sql.append(" AND user_id = :userId");
            params.put("userId", userId);
        }
        if (searchTerm != null && !searchTerm.isEmpty()) {
            sql.append(" AND (shipping_address LIKE :term OR notes LIKE :term)");
            params.put("term", "%" + searchTerm + "%");
        }

        sql.append(" ORDER BY created_at DESC");

        Query query = entityManager.createNativeQuery(sql.toString(), Order.class);
        params.forEach(query::setParameter);
        return query.getResultList();
    }

    public List<OrderDTO> searchOrderDTOs(String searchTerm, String status, Long userId) {
        return searchOrders(searchTerm, status, userId).stream().map(OrderDTO::new).toList();
    }

    // ========================
    // ORDER STATUS MANAGEMENT
    // ========================

    @Transactional
    public Order updateOrderStatus(Long orderId, String newStatus) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            throw new RuntimeException("Order not found");
        }

        Order order = orderOpt.get();
        String oldStatus = order.getStatus();
        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());

        // Send status update email
        sendStatusUpdateEmail(order, oldStatus, newStatus);

        // Audit
        auditLogRepository.save(new AuditLog(
            null, "UPDATE_ORDER_STATUS", "ORDER", orderId,
            "Status changed from " + oldStatus + " to " + newStatus
        ));

        return orderRepository.save(order);
    }

    private void sendStatusUpdateEmail(Order order, String oldStatus, String newStatus) {
        User user = order.getUser();
        String subject = "DocVault Order #" + order.getId() + " — Status Update";
        String body = "Dear " + user.getFullName() + ",\n\n"
            + "Your order #" + order.getId() + " status has been updated from "
            + oldStatus + " to " + newStatus + ".\n\n"
            + "Thank you for shopping at DocVault!";

        emailService.sendEmail(user.getEmail(), subject, body);
    }

    // ========================
    // REPORTING
    // ========================

    public Map<String, Object> getOrderStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalOrders = orderRepository.countAllOrders();
        BigDecimal totalRevenue = orderRepository.sumTotalRevenue();

        Map<String, Integer> statusCounts = new HashMap<>();
        for (Object[] row : orderRepository.getOrderStatsByStatus()) {
            String status = (String) row[2];
            int count = ((Number) row[0]).intValue();
            statusCounts.put(status, count);
        }

        stats.put("totalOrders", totalOrders);
        stats.put("totalRevenue", totalRevenue);
        stats.put("statusBreakdown", statusCounts);
        stats.put("averageOrderValue", totalOrders == 0 ? BigDecimal.ZERO :
            totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP));

        return stats;
    }

}
