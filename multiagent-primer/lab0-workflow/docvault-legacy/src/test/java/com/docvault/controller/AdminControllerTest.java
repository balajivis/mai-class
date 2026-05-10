package com.docvault.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getAllProducts_returnsAllIncludingInactive() throws Exception {
        mockMvc.perform(get("/api/admin/products"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(10)));
    }

    @Test
    void getInventoryReport_returnsReport() throws Exception {
        mockMvc.perform(get("/api/admin/inventory"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalProducts").value(10))
            .andExpect(jsonPath("$.outOfStock", greaterThanOrEqualTo(0)))
            .andExpect(jsonPath("$.totalInventoryValue", notNullValue()));
    }

    @Test
    @Transactional
    void updateProduct_validUpdate_returnsUpdatedProduct() throws Exception {
        String json = """
            {"name": "Updated Dog Food", "stockQuantity": 200}
            """;

        mockMvc.perform(put("/api/admin/products/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Updated Dog Food"))
            .andExpect(jsonPath("$.stockQuantity").value(200));
    }

    @Test
    void getOrderStats_returnsStats() throws Exception {
        mockMvc.perform(get("/api/admin/orders/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalOrders", greaterThan(0)))
            .andExpect(jsonPath("$.totalRevenue", notNullValue()));
    }

    // NOTE: No test for admin auth (because there IS no admin auth)
    // NOTE: No test for admin search consistency with other search endpoints
}
