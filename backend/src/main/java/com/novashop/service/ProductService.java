
package com.novashop.service;

import com.novashop.entity.Product;
import com.novashop.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    public List<Product> getAllProducts() {
        return repository.findAll();
    }

    public Product getProductById(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                    new org.springframework.web.server
                        .ResponseStatusException(
                            org.springframework.http.HttpStatus.NOT_FOUND,
                            "Product not found"
                        )
                );
    }
}
