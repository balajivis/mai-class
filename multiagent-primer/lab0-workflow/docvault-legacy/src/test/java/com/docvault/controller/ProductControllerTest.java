package com.docvault.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getAllProducts_returnsProducts() throws Exception {
        mockMvc.perform(get("/api/products"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(greaterThan(0))))
            .andExpect(jsonPath("$[0].name", notNullValue()));
    }

    @Test
    void getProductById_existingProduct_returnsProduct() throws Exception {
        mockMvc.perform(get("/api/products/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Annual Report 2023.pdf"))
            .andExpect(jsonPath("$.price").value(0.00));
    }

    @Test
    void getProductById_nonExistentProduct_returns404() throws Exception {
        mockMvc.perform(get("/api/products/999"))
            .andExpect(status().isNotFound());
    }

    @Test
    void searchProducts_withQuery_returnsMatchingProducts() throws Exception {
        mockMvc.perform(get("/api/products/search").param("q", "report"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(greaterThan(0))));
    }

    @Test
    void getProductsByCategory_returnsFilteredProducts() throws Exception {
        mockMvc.perform(get("/api/products/category/REPORTS"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].category").value("REPORTS"));
    }

    @Test
    void filterProducts_byPriceRange_returnsFilteredProducts() throws Exception {
        mockMvc.perform(get("/api/products/filter")
                .param("minPrice", "0")
                .param("maxPrice", "100"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(greaterThan(0))));
    }

    // NOTE: No test for SQL injection vulnerability in search
    // NOTE: No test that /search and /filter return consistent results
}
