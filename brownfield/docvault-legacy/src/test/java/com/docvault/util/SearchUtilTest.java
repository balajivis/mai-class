package com.docvault.util;

import com.docvault.model.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SearchUtilTest {

    private List<Product> testProducts;

    @BeforeEach
    void setUp() {
        Product p1 = new Product();
        p1.setId(1L);
        p1.setName("Premium Dog Food");
        p1.setDescription("High quality food for dogs");
        p1.setPrice(new BigDecimal("54.99"));
        p1.setCategory("DOG_FOOD");
        p1.setBrand("PawsNatural");
        p1.setStockQuantity(100);
        p1.setIsActive(true);

        Product p2 = new Product();
        p2.setId(2L);
        p2.setName("Cat Scratching Post");
        p2.setDescription("Multi-level cat tree");
        p2.setPrice(new BigDecimal("89.99"));
        p2.setCategory("CAT_FURNITURE");
        p2.setBrand("FelineFun");
        p2.setStockQuantity(45);
        p2.setIsActive(true);

        Product p3 = new Product();
        p3.setId(3L);
        p3.setName("Dog Leash Retractable");
        p3.setDescription("Heavy duty leash");
        p3.setPrice(new BigDecimal("24.99"));
        p3.setCategory("DOG_ACCESSORIES");
        p3.setBrand("WalkRight");
        p3.setStockQuantity(200);
        p3.setIsActive(true);

        testProducts = Arrays.asList(p1, p2, p3);
    }

    @Test
    void filterProducts_bySearchTerm_matchesNameAndDescription() {
        List<Product> results = SearchUtil.filterProducts(testProducts, "dog", null, null, null, null);
        assertEquals(2, results.size()); // "Premium Dog Food" and "Dog Leash"
    }

    @Test
    void filterProducts_byCategory_returnsMatchingCategory() {
        // Note: uses contains() not equals(), so "DOG" matches DOG_FOOD and DOG_ACCESSORIES
        List<Product> results = SearchUtil.filterProducts(testProducts, null, "DOG", null, null, null);
        assertEquals(2, results.size());
    }

    @Test
    void filterProducts_byPriceRange_filtersCorrectly() {
        List<Product> results = SearchUtil.filterProducts(
            testProducts, null, null, new BigDecimal("30"), new BigDecimal("60"), null
        );
        assertEquals(1, results.size());
        assertEquals("Premium Dog Food", results.get(0).getName());
    }

    @Test
    void filterProducts_sortByPriceAsc_returnsSorted() {
        List<Product> results = SearchUtil.filterProducts(
            testProducts, null, null, null, null, "price_asc"
        );
        assertTrue(results.get(0).getPrice().compareTo(results.get(1).getPrice()) <= 0);
    }

    @Test
    void filterProducts_nullInputs_returnsAllProducts() {
        List<Product> results = SearchUtil.filterProducts(testProducts, null, null, null, null, null);
        assertEquals(3, results.size());
    }

    // NOTE: No test for calcular_descuento (the unused promo code method)
    // NOTE: No test proving that SearchUtil returns different results than ProductService.searchProducts()
}
