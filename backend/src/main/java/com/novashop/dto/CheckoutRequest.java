
package com.novashop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record CheckoutRequest(
    @NotBlank String customerName,
    @NotBlank @Email String email,
    @NotBlank String shippingAddress,
    @NotEmpty List<@Valid OrderItemRequest> items
) {}
