
package com.novashop.controller;

import com.novashop.dto.ProductRequest;
import com.novashop.entity.Product;
import com.novashop.repository.ProductRepository;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final ProductRepository repository;

    public AdminProductController(ProductRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Product> getAll() {
        return repository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(
            @Valid @RequestBody ProductRequest request) {

        Product product = new Product(
            request.name(),
            request.description(),
            request.price(),
            request.category(),
            request.imageUrl(),
            request.stock()
        );

        return repository.save(product);
    }

    @PutMapping("/{id}")
    @Transactional
    public Product update(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {

        Product product = repository.findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Product not found"
                )
            );

        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setCategory(request.category());
        product.setImageUrl(request.imageUrl());
        product.setStock(request.stock());

        return repository.saveAndFlush(product);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {

        if (!repository.existsById(id)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Product not found"
            );
        }

        repository.deleteById(id);
    }
}
