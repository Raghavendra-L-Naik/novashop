
package com.novashop.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ProductRequest(

    @NotBlank
    String name,

    String description,

    @NotNull
    @DecimalMin("0.01")
    BigDecimal price,

    @NotBlank
    String category,

    String imageUrl,

    @NotNull
    @Min(0)
    Integer stock

) {}
