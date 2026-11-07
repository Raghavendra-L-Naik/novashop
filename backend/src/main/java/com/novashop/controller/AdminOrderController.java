
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
        BigDecimal totalAmount,
        String status,
        LocalDateTime createdAt
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
            order.getTotalAmount(),
            order.getStatus(),
            order.getCreatedAt()
        );
    }

    @GetMapping
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

        order.setStatus(request.status().name());

        return toResponse(repository.saveAndFlush(order));
    }
}
