package com.docvault.repository;

import com.docvault.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Order> findByStatus(String status);

    @Query(nativeQuery = true, value = """
        SELECT COUNT(*) AS cnt, COALESCE(SUM(total_amount), 0) AS total, status
        FROM orders
        GROUP BY status
    """)
    List<Object[]> getOrderStatsByStatus();

    @Query(nativeQuery = true, value = "SELECT COUNT(*) FROM orders")
    long countAllOrders();

    @Query(nativeQuery = true, value = "SELECT COALESCE(SUM(total_amount), 0) FROM orders")
    java.math.BigDecimal sumTotalRevenue();
}
