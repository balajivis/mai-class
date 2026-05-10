package com.docvault.service;

import com.docvault.model.Product;
import com.docvault.repository.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.criteria.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public List<Product> getAllActiveProducts() {
        return productRepository.findByIsActiveTrue();
    }

    public Optional<Product> getProduct(Long id) {
        return productRepository.findById(id);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategoryAndIsActiveTrue(category);
    }

    @SuppressWarnings("unchecked")
    public List<Product> searchProducts(String searchTerm) {
        String sql = "SELECT * FROM products WHERE is_active = true AND ("
            + "LOWER(name) LIKE :term OR "
            + "LOWER(description) LIKE :term OR "
            + "LOWER(brand) LIKE :term"
            + ") ORDER BY name";

        Query query = entityManager.createNativeQuery(sql, Product.class);
        query.setParameter("term", "%" + searchTerm.toLowerCase() + "%");
        return query.getResultList();
    }

    public Product updateProduct(Long id, String name, String description,
            BigDecimal price, Integer stockQuantity, Boolean isActive) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));

        if (name != null) product.setName(name);
        if (description != null) product.setDescription(description);
        if (price != null) product.setPrice(price);
        if (stockQuantity != null) product.setStockQuantity(stockQuantity);
        if (isActive != null) product.setIsActive(isActive);
        product.setUpdatedAt(LocalDateTime.now());

        return productRepository.save(product);
    }

    public List<Product> findAvailableProducts() {
        return productRepository.findAvailableProducts();
    }

    public List<Product> filterProducts(String searchTerm, String category,
            BigDecimal minPrice, BigDecimal maxPrice, String sortBy) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Product> cq = cb.createQuery(Product.class);
        Root<Product> root = cq.from(Product.class);

        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isTrue(root.get("isActive")));

        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String term = "%" + searchTerm.toLowerCase() + "%";
            predicates.add(cb.or(
                cb.like(cb.lower(root.get("name")), term),
                cb.like(cb.lower(root.get("description")), term)
            ));
        }

        if (category != null && !category.trim().isEmpty()) {
            predicates.add(cb.like(root.get("category"), "%" + category + "%"));
        }

        if (minPrice != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
        }

        if (maxPrice != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
        }

        cq.where(predicates.toArray(new Predicate[0]));

        if (sortBy != null) {
            switch (sortBy.toLowerCase()) {
                case "price_asc":
                    cq.orderBy(cb.asc(root.get("price")));
                    break;
                case "price_desc":
                    cq.orderBy(cb.desc(root.get("price")));
                    break;
                case "name":
                    cq.orderBy(cb.asc(root.get("name")));
                    break;
                default:
                    break;
            }
        }

        return entityManager.createQuery(cq).getResultList();
    }
}
