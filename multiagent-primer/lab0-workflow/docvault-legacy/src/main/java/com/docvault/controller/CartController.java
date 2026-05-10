package com.docvault.controller;

import com.docvault.model.CartItem;
import com.docvault.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * CartController — delegates to OrderService because Jake put cart logic there.
 * Should probably have its own CartService.
 */
@RestController
@RequestMapping("/api/cart")
public class CartController {

    // Cart operations are in OrderService (not a CartService)
    @Autowired
    private OrderService orderService;

    @GetMapping
    public ResponseEntity<List<CartItem>> getCart(@RequestParam Long userId) {
        return ResponseEntity.ok(orderService.getCartItems(userId));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            Long productId = Long.valueOf(request.get("productId").toString());
            int quantity = request.containsKey("quantity")
                ? Integer.parseInt(request.get("quantity").toString()) : 1;

            CartItem item = orderService.addToCart(userId, productId, quantity);
            return ResponseEntity.ok(item);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<?> removeFromCart(@PathVariable Long itemId) {
        orderService.removeFromCart(itemId);
        return ResponseEntity.ok(Map.of("message", "Item removed"));
    }

    @GetMapping("/total")
    public ResponseEntity<Map<String, Object>> getCartTotal(@RequestParam Long userId) {
        return ResponseEntity.ok(orderService.calculateTotal(userId));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(@RequestParam Long userId) {
        orderService.clearCart(userId);
        return ResponseEntity.ok(Map.of("message", "Cart cleared"));
    }
}
