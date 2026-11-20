package com.novashop.service;

import com.novashop.dto.CheckoutRequest;
import com.novashop.entity.CustomerOrder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class PaymentService {

    private final OrderService orders;
    private final RazorpayGateway gateway;

    public PaymentService(OrderService orders, RazorpayGateway gateway) {
        this.orders = orders;
        this.gateway = gateway;
    }

    public PaymentOrder createPaymentOrder(
            CheckoutRequest request,
            Long userId) {
        BigDecimal total = orders.calculateCheckoutTotal(request);
        RazorpayGateway.GatewayOrder gatewayOrder =
            gateway.createOrder(total);
        CustomerOrder order = orders.createPendingPaymentOrder(
            request,
            userId,
            gatewayOrder.id(),
            total
        );

        return new PaymentOrder(
            order.getId(),
            gatewayOrder.id(),
            gatewayOrder.amount(),
            gatewayOrder.currency(),
            gateway.getKeyId()
        );
    }

    public CustomerOrder verifyPayment(
            String razorpayOrderId,
            String razorpayPaymentId,
            String razorpaySignature,
            Long userId) {
        CustomerOrder order = orders.getPaymentOrder(
            razorpayOrderId,
            userId
        );
        gateway.verifyCapturedPayment(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            order.getTotalAmount()
        );
        return orders.markPaymentPaid(
            razorpayOrderId,
            razorpayPaymentId,
            userId
        );
    }

    @Transactional(readOnly = true)
    public CustomerOrder getPaymentOrder(String razorpayOrderId, Long userId) {
        return orders.getPaymentOrder(razorpayOrderId, userId);
    }

    public CustomerOrder markPaymentFailed(
            String razorpayOrderId,
            Long userId,
            String reason) {
        CustomerOrder order = orders.getPaymentOrder(
            razorpayOrderId,
            userId
        );
        if ("PENDING".equals(order.getPaymentStatus())) {
            gateway.ensureNoCapturedPayment(razorpayOrderId);
        }
        return orders.markPaymentFailed(
            razorpayOrderId,
            userId,
            reason
        );
    }

    public record PaymentOrder(
        Long orderId,
        String razorpayOrderId,
        long amount,
        String currency,
        String keyId
    ) {}
}
