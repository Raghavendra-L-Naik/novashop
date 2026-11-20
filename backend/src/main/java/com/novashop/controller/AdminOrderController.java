
package com.novashop.controller;

import com.novashop.entity.CustomerOrder;
import com.novashop.repository.OrderRepository;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderRepository repository;

    public AdminOrderController(OrderRepository repository) {
        this.repository = repository;
    }

    public record AdminOrderResponse(
        Long id,
        String customerName,
        String email,
        String shippingAddress,
        BigDecimal totalAmount,
        String status,
        String paymentStatus,
        String paymentFailureReason,
        LocalDateTime createdAt,
        List<AdminOrderItemResponse> items
    ) {}

    public record AdminOrderItemResponse(
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
    ) {}

    public enum OrderStatus {
        PLACED,
        PROCESSING,
        SHIPPED,
        DELIVERED,
        CANCELLED
    }

    public record StatusRequest(
        @NotNull OrderStatus status
    ) {}

    private AdminOrderResponse toResponse(CustomerOrder order) {
        return new AdminOrderResponse(
            order.getId(),
            order.getCustomerName(),
            order.getEmail(),
            order.getShippingAddress(),
            order.getTotalAmount(),
            order.getStatus(),
            order.getPaymentStatus(),
            order.getPaymentFailureReason(),
            order.getCreatedAt(),
            order.getItems().stream()
                .map(item -> new AdminOrderItemResponse(
                    item.getProductName(),
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.getSubtotal()
                ))
                .toList()
        );
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<AdminOrderResponse> getAllOrders() {
        return repository.findAll()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @PatchMapping("/{id}/status")
    @Transactional
    public AdminOrderResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusRequest request) {

        CustomerOrder order = repository.findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Order not found"
                )
            );

        if ("PENDING".equals(order.getPaymentStatus())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "A pending payment cannot be fulfilled."
            );
        }

        order.setStatus(request.status().name());

        return toResponse(repository.saveAndFlush(order));
    }
}
