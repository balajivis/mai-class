package com.docvault.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CartControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getCart_existingUser_returnsCartItems() throws Exception {
        mockMvc.perform(get("/api/cart").param("userId", "2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(greaterThan(0))));
    }

    @Test
    void addToCart_validProduct_returnsCartItem() throws Exception {
        String json = """
            {"userId": 3, "productId": 2, "quantity": 1}
            """;

        mockMvc.perform(post("/api/cart/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.quantity").value(1));
    }

    @Test
    void addToCart_outOfStockProduct_returnsBadRequest() throws Exception {
        // Product 10 (Dog Bed Orthopedic Large) has 0 stock
        String json = """
            {"userId": 2, "productId": 10, "quantity": 1}
            """;

        mockMvc.perform(post("/api/cart/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Insufficient stock"));
    }

    @Test
    void getCartTotal_returnsCalculatedTotal() throws Exception {
        mockMvc.perform(get("/api/cart/total").param("userId", "2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.subtotal", notNullValue()))
            .andExpect(jsonPath("$.tax", notNullValue()))
            .andExpect(jsonPath("$.total", notNullValue()));
    }

    // NOTE: No test that cart total matches checkout total (they use different tax rates!)
}
