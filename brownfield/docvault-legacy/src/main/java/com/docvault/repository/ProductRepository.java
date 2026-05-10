package com.docvault.repository;

import com.docvault.model.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity - :quantity, p.updatedAt = CURRENT_TIMESTAMP WHERE p.id = :productId AND p.stockQuantity >= :quantity")
    int decrementStock(@Param("productId") Long productId, @Param("quantity") int quantity);
    List<Product> findByIsActiveTrue();
    List<Product> findByCategory(String category);
    List<Product> findByCategoryAndIsActiveTrue(String category);
    List<Product> findByBrand(String brand);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.stockQuantity > 0")
    List<Product> findAvailableProducts();

    @Query("SELECT p FROM Product p WHERE p.stockQuantity <= 5 AND p.isActive = true")
    List<Product> findLowStockProducts();

    @Query(nativeQuery = true, value = """
        SELECT p.* FROM products p
        WHERE p.is_active = true
        AND (:category IS NULL OR p.category LIKE CONCAT(:category, '%'))
        AND (:minPrice IS NULL OR p.price >= :minPrice)
        AND (:maxPrice IS NULL OR p.price <= :maxPrice)
        AND (:searchTerm IS NULL OR LOWER(p.name) LIKE CONCAT('%', LOWER(:searchTerm), '%')
            OR LOWER(p.description) LIKE CONCAT('%', LOWER(:searchTerm), '%')
            OR LOWER(p.brand) LIKE CONCAT('%', LOWER(:searchTerm), '%'))
        ORDER BY
        CASE WHEN :sort = 'price_asc' THEN p.price END ASC,
        CASE WHEN :sort = 'price_desc' THEN p.price END DESC,
        CASE WHEN :sort = 'name' OR :sort IS NULL THEN 1 ELSE 0 END,
        p.name ASC
    """)
    List<Product> findWithFilters(
        @Param("category") String category,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("searchTerm") String searchTerm,
        @Param("sort") String sort
    );

    @Query(nativeQuery = true, value = """
        SELECT
            COUNT(*) AS total_products,
            SUM(CASE WHEN stock_quantity IS NULL OR stock_quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock,
            SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= 5 THEN 1 ELSE 0 END) AS low_stock,
            SUM(CASE WHEN stock_quantity > 5 THEN 1 ELSE 0 END) AS healthy_stock,
            COALESCE(SUM(price * stock_quantity), 0) AS total_inventory_value
        FROM products
    """)
    List<Object[]> getInventoryStats();
}
