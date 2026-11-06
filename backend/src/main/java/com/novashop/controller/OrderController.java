
package com.novashop.controller;

import com.novashop.dto.CheckoutRequest;
import com.novashop.entity.CustomerOrder;
import com.novashop.service.OrderService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse placeOrder(
            @Valid @RequestBody CheckoutRequest request) {

        CustomerOrder order = orderService.placeOrder(request);

        return new OrderResponse(
            order.getId(),
            order.getStatus(),
            order.getTotalAmount()
        );
    }

    public record OrderResponse(
        Long orderId,
        String status,
        BigDecimal totalAmount
    ) {}
}
