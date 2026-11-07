
package com.novashop.controller;

import com.novashop.dto.CheckoutRequest;
import com.novashop.entity.CustomerOrder;
import com.novashop.entity.OrderItem;
import com.novashop.service.OrderService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    public record OrderItemResponse(
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
    ) {}

    public record OrderResponse(
        Long orderId,
        String status,
        BigDecimal totalAmount,
        LocalDateTime createdAt,
        List<OrderItemResponse> items
    ) {}

    private OrderResponse toResponse(CustomerOrder order) {
        List<OrderItemResponse> items = order.getItems()
            .stream()
            .map(item -> new OrderItemResponse(
                item.getProductName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getSubtotal()
            ))
            .toList();

        return new OrderResponse(
            order.getId(),
            order.getStatus(),
            order.getTotalAmount(),
            order.getCreatedAt(),
            items
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse placeOrder(
            @Valid @RequestBody CheckoutRequest request,
            JwtAuthenticationToken authentication) {

        Long userId = Long.valueOf(
            authentication.getToken().getSubject()
        );

        return toResponse(
            service.placeOrder(request, userId)
        );
    }

    @GetMapping("/my")
    public List<OrderResponse> myOrders(
            JwtAuthenticationToken authentication) {

        Long userId = Long.valueOf(
            authentication.getToken().getSubject()
        );

        return service.getMyOrders(userId)
            .stream()
            .map(this::toResponse)
            .toList();
    }
}
