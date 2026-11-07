
package com.novashop.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;


@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    private String category;

    private String imageUrl;

    private Integer stock;




    public Product() {}

    public Product(String name, String description,
                   BigDecimal price, String category,
                   String imageUrl, Integer stock) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
        this.imageUrl = imageUrl;
        this.stock = stock;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getCategory() {
        return category;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public Integer getStock() {
        return stock;
    }


public void setName(String name) {
    this.name = name;
}

public void setDescription(String description) {
    this.description = description;
}

public void setPrice(BigDecimal price) {
    this.price = price;
}

public void setCategory(String category) {
    this.category = category;
}

public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
}

public void setStock(Integer stock) {
    this.stock = stock;
}


}
