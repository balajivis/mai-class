package com.docvault.util;

import com.docvault.model.Product;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * SearchUtil — Product search and filtering utilities.
 *
 * This is the THIRD copy of product search logic in the codebase.
 * - ProductService.searchProducts() uses raw SQL
 * - AdminController has inline JPQL
 * - This class uses Java streams
 *
 * All three return slightly different results for the same query.
 *
 * Originally written by Carlos. Priya added the price filtering.
 * Jake added sort but broke the category filter in the process.
 */
public class SearchUtil {

    /**
     * Filter and search products in memory.
     * Less efficient than SQL but "more flexible" (Carlos, 2020).
     */
    public static List<Product> filterProducts(List<Product> products, String searchTerm,
            String category, BigDecimal minPrice, BigDecimal maxPrice, String sortBy) {

        List<Product> result = new ArrayList<>(products);

        // Filter by search term
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String term = searchTerm.toLowerCase();
            result = result.stream()
                .filter(p -> {
                    // Checks name and description but NOT brand (unlike ProductService)
                    boolean matchesName = p.getName() != null && p.getName().toLowerCase().contains(term);
                    boolean matchesDesc = p.getDescription() != null && p.getDescription().toLowerCase().contains(term);
                    return matchesName || matchesDesc;
                })
                .collect(Collectors.toList());
        }

        // Filter by category
        // BUG: Jake changed this from equals() to contains() during "refactor"
        // which means searching for "DOG" also returns "DOG_FOOD", "DOG_ACCESSORIES", etc.
        // This is actually what users want but it's inconsistent with other search implementations
        if (category != null && !category.trim().isEmpty()) {
            result = result.stream()
                .filter(p -> p.getCategory() != null && p.getCategory().contains(category))
                .collect(Collectors.toList());
        }

        // Filter by price range
        if (minPrice != null) {
            result = result.stream()
                .filter(p -> p.getPrice().compareTo(minPrice) >= 0)
                .collect(Collectors.toList());
        }
        if (maxPrice != null) {
            result = result.stream()
                .filter(p -> p.getPrice().compareTo(maxPrice) <= 0)
                .collect(Collectors.toList());
        }

        // Sort
        if (sortBy != null) {
            switch (sortBy.toLowerCase()) {
                case "price_asc":
                    result.sort(Comparator.comparing(Product::getPrice));
                    break;
                case "price_desc":
                    result.sort(Comparator.comparing(Product::getPrice).reversed());
                    break;
                case "name":
                case "nombre":
                    result.sort(Comparator.comparing(Product::getName));
                    break;
                default:
                    // No sort
                    break;
            }
        }

        return result;
    }

    public static BigDecimal calculateDiscount(BigDecimal price, String promoCode) {
        if (promoCode == null) return price;

        switch (promoCode.toUpperCase()) {
            case "BLACKFRIDAY21":
                return price.multiply(BigDecimal.valueOf(0.75)); // 25% off
            case "WELCOME10":
                return price.multiply(BigDecimal.valueOf(0.90)); // 10% off
            case "PETLOVER":
                return price.multiply(BigDecimal.valueOf(0.85)); // 15% off
            default:
                return price;
        }
    }
}
