
package com.novashop.config;

import com.novashop.entity.Product;
import com.novashop.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner loadProducts(ProductRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.saveAll(List.of(
                    new Product(
                        "Wireless Headphones",
                        "Premium wireless audio",
                        new BigDecimal("2999.00"),
                        "Electronics",
                        "https://placehold.co/400x300?text=Headphones",
                        20
                    ),
                    new Product(
                        "Smart Watch",
                        "Fitness and activity tracking",
                        new BigDecimal("4999.00"),
                        "Electronics",
                        "https://placehold.co/400x300?text=Smart+Watch",
                        15
                    ),
                    new Product(
                        "Running Shoes",
                        "Lightweight everyday running shoes",
                        new BigDecimal("2499.00"),
                        "Fashion",
                        "https://placehold.co/400x300?text=Running+Shoes",
                        30
                    ),
                    new Product(
                        "Travel Backpack",
                        "Durable everyday backpack",
                        new BigDecimal("1499.00"),
                        "Accessories",
                        "https://placehold.co/400x300?text=Backpack",
                        25
                    )
                ));
            }
        };
    }
}
