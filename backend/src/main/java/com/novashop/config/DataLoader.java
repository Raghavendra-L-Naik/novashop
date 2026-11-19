
package com.novashop.config;

import com.novashop.entity.Product;
import com.novashop.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner loadProducts(ProductRepository repository) {
        return args -> {
            List<Product> catalog = List.of(
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
                    ),
                    product(
                        "Gaming Keyboard",
                        "RGB backlit mechanical gaming keyboard",
                        "3499.00",
                        "Electronics",
                        18
                    ),
                    product(
                        "Gaming Mouse",
                        "Adjustable-DPI gaming mouse with RGB lighting",
                        "1799.00",
                        "Electronics",
                        24
                    ),
                    product(
                        "Gaming Headset",
                        "Over-ear gaming headset with clear microphone",
                        "2799.00",
                        "Electronics",
                        16
                    ),
                    product(
                        "Gaming Monitor",
                        "27-inch full HD monitor for work and gaming",
                        "14999.00",
                        "Electronics",
                        8
                    ),
                    product(
                        "USB-C Hub",
                        "Multiport USB-C hub for laptops",
                        "1299.00",
                        "Electronics",
                        30
                    ),
                    product(
                        "Bluetooth Speaker",
                        "Portable wireless speaker with rich sound",
                        "2199.00",
                        "Electronics",
                        20
                    ),
                    product(
                        "Portable SSD",
                        "Fast 1 TB portable solid-state drive",
                        "6999.00",
                        "Electronics",
                        12
                    ),
                    product(
                        "Adjustable Laptop Stand",
                        "Foldable stand with adjustable viewing angle",
                        "999.00",
                        "Accessories",
                        25
                    ),
                    product(
                        "HD Webcam",
                        "1080p webcam for video calls and streaming",
                        "1899.00",
                        "Electronics",
                        15
                    ),
                    product(
                        "Power Bank",
                        "20000 mAh fast-charging power bank",
                        "1599.00",
                        "Electronics",
                        22
                    ),
                    product(
                        "Protective Phone Case",
                        "Shock-resistant protective phone case",
                        "499.00",
                        "Accessories",
                        40
                    ),
                    product(
                        "LED Desk Lamp",
                        "Dimmable desk lamp with adjustable neck",
                        "1199.00",
                        "Home",
                        18
                    ),
                    product(
                        "Insulated Water Bottle",
                        "750 ml stainless-steel insulated bottle",
                        "799.00",
                        "Accessories",
                        35
                    ),
                    product(
                        "Non-Slip Yoga Mat",
                        "Comfortable exercise mat for yoga and stretching",
                        "1099.00",
                        "Sports",
                        20
                    ),
                    product(
                        "Cotton T-Shirt",
                        "Soft everyday cotton crew-neck T-shirt",
                        "699.00",
                        "Fashion",
                        32
                    ),
                    product(
                        "Classic Denim Jeans",
                        "Straight-fit everyday denim jeans",
                        "1899.00",
                        "Fashion",
                        20
                    ),
                    product(
                        "Leather Wallet",
                        "Compact wallet with multiple card slots",
                        "1299.00",
                        "Fashion",
                        14
                    ),
                    product(
                        "Classic Sunglasses",
                        "Lightweight UV-protection sunglasses",
                        "999.00",
                        "Fashion",
                        17
                    ),
                    product(
                        "Drip Coffee Maker",
                        "Compact coffee maker for home brewing",
                        "2499.00",
                        "Home",
                        10
                    ),
                    product(
                        "Ceramic Coffee Mug",
                        "Durable 350 ml ceramic mug",
                        "349.00",
                        "Home",
                        40
                    ),
                    product(
                        "Fitness Tracker",
                        "Activity tracker with heart-rate monitoring",
                        "3299.00",
                        "Electronics",
                        13
                    )
            );

            Set<String> existingNames = repository.findAll().stream()
                .map(Product::getName)
                .collect(Collectors.toCollection(HashSet::new));

            List<Product> productsToAdd = catalog.stream()
                .filter(product -> existingNames.add(product.getName()))
                .toList();

            if (!productsToAdd.isEmpty()) {
                repository.saveAll(productsToAdd);
            }
        };
    }

    private static Product product(
            String name,
            String description,
            String price,
            String category,
            int stock) {
        return new Product(
            name,
            description,
            new BigDecimal(price),
            category,
            "https://placehold.co/400x300?text=" + name.replace(" ", "+"),
            stock
        );
    }
}
