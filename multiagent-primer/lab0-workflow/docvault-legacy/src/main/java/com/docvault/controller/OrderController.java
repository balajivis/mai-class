package com.docvault.controller;

import com.docvault.model.OrderDTO;
import com.docvault.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class OrderController {

    @Autowired
    private OrderService orderService;

    /**
     * Place an order (checkout).
     * Accepts raw Map because there are no DTOs.
     * No input validation whatsoever.
     */
    @PostMapping("/checkout")
    public ResponseEntity<Map<String, Object>> checkout(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        String paymentMethod = (String) request.getOrDefault("paymentMethod", "CREDIT_CARD");
        String shippingAddress = (String) request.get("shippingAddress");
        String notes = (String) request.get("notes");

        Map<String, Object> result = orderService.processCheckout(
            userId, paymentMethod, shippingAddress, notes
        );

        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderDTO>> getOrders(@RequestParam Long userId) {
        return ResponseEntity.ok(orderService.getOrderDTOsByUserId(userId));
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<OrderDTO> getOrder(@PathVariable Long orderId) {
        return orderService.getOrderDTOById(orderId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/orders/search")
    public ResponseEntity<List<OrderDTO>> searchOrders(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(orderService.searchOrderDTOs(q, status, userId));
    }
}
