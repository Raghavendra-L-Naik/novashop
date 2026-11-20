package com.novashop.controller;

import com.novashop.dto.CheckoutRequest;
import com.novashop.entity.CustomerOrder;
import com.novashop.entity.OrderItem;
import com.novashop.service.PaymentService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService payments;

    public PaymentController(PaymentService payments) {
        this.payments = payments;
    }

    public record CreatePaymentRequest(
        @NotNull @Valid CheckoutRequest checkout
    ) {}

    public record VerifyPaymentRequest(
        @NotBlank String razorpayOrderId,
        @NotBlank String razorpayPaymentId,
        @NotBlank String razorpaySignature
    ) {}

    public record FailedPaymentRequest(
        @NotBlank String razorpayOrderId,
        @Size(max = 500) String reason
    ) {}

    public record PaymentResponse(
        Long orderId,
        String status,
        String paymentStatus,
        BigDecimal totalAmount,
        LocalDateTime createdAt,
        List<OrderItemResponse> items
    ) {}

    public record OrderItemResponse(
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
    ) {}

    @PostMapping("/create")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentService.PaymentOrder create(
            @Valid @RequestBody CreatePaymentRequest request,
            JwtAuthenticationToken authentication) {
        return payments.createPaymentOrder(
            request.checkout(),
            userId(authentication)
        );
    }

    @PostMapping("/verify")
    public PaymentResponse verify(
            @Valid @RequestBody VerifyPaymentRequest request,
            JwtAuthenticationToken authentication) {
        return toResponse(payments.verifyPayment(
            request.razorpayOrderId(),
            request.razorpayPaymentId(),
            request.razorpaySignature(),
            userId(authentication)
        ));
    }

    @PostMapping("/failed")
    public PaymentResponse failed(
            @Valid @RequestBody FailedPaymentRequest request,
            JwtAuthenticationToken authentication) {
        return toResponse(payments.markPaymentFailed(
            request.razorpayOrderId(),
            userId(authentication),
            request.reason()
        ));
    }

    private Long userId(JwtAuthenticationToken authentication) {
        return Long.valueOf(authentication.getToken().getSubject());
    }

    private PaymentResponse toResponse(CustomerOrder order) {
        List<OrderItemResponse> items = order.getItems().stream()
            .map(this::toResponse)
            .toList();
        return new PaymentResponse(
            order.getId(),
            order.getStatus(),
            order.getPaymentStatus(),
            order.getTotalAmount(),
            order.getCreatedAt(),
            items
        );
    }

    private OrderItemResponse toResponse(OrderItem item) {
        return new OrderItemResponse(
            item.getProductName(),
            item.getQuantity(),
            item.getUnitPrice(),
            item.getSubtotal()
        );
    }
}
