package com.novashop.service;

import com.novashop.dto.CheckoutRequest;
import com.novashop.dto.OrderItemRequest;
import com.novashop.entity.AppUser;
import com.novashop.entity.CustomerOrder;
import com.novashop.entity.OrderItem;
import com.novashop.entity.Product;
import com.novashop.repository.OrderRepository;
import com.novashop.repository.ProductRepository;
import com.novashop.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orders;
    private final ProductRepository products;
    private final UserRepository users;

    public OrderService(
            OrderRepository orders,
            ProductRepository products,
            UserRepository users) {
        this.orders = orders;
        this.products = products;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateCheckoutTotal(CheckoutRequest request) {
        Map<Long, Product> checkoutProducts = loadCheckoutProducts(request);
        return request.items().stream()
            .map(item -> checkoutProducts.get(item.productId()).getPrice()
                .multiply(BigDecimal.valueOf(item.quantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional
    public CustomerOrder createPendingPaymentOrder(
            CheckoutRequest request,
            Long userId,
            String razorpayOrderId,
            BigDecimal expectedTotal) {
        Map<Long, Product> checkoutProducts = loadCheckoutProductsForUpdate(request);
        BigDecimal total = request.items().stream()
            .map(item -> checkoutProducts.get(item.productId()).getPrice()
                .multiply(BigDecimal.valueOf(item.quantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (total.compareTo(expectedTotal) != 0) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Product prices changed. Please retry checkout."
            );
        }

        AppUser user = users.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "User not found"
            ));

        CustomerOrder order = new CustomerOrder(
            request.customerName().trim(),
            user.getEmail(),
            request.shippingAddress().trim()
        );
        order.setUser(user);
        order.setTotalAmount(total);
        order.setStatus("AWAITING_PAYMENT");
        order.setPaymentStatus("PENDING");
        order.setRazorpayOrderId(razorpayOrderId);

        for (OrderItemRequest item : request.items()) {
            Product product = checkoutProducts.get(item.productId());
            order.addItem(new OrderItem(
                product.getId(),
                product.getName(),
                item.quantity(),
                product.getPrice()
            ));
            product.setStock(product.getStock() - item.quantity());
        }

        products.flush();
        return orders.saveAndFlush(order);
    }

    @Transactional
    public CustomerOrder markPaymentPaid(
            String razorpayOrderId,
            String razorpayPaymentId,
            Long userId) {
        CustomerOrder order = findPaymentOrder(razorpayOrderId, userId);

        if ("PAID".equals(order.getPaymentStatus())) {
            if (razorpayPaymentId.equals(order.getRazorpayPaymentId())) {
                return order;
            }
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This order has already been paid with another payment."
            );
        }
        requirePendingPayment(order);

        order.setPaymentStatus("PAID");
        order.setRazorpayPaymentId(razorpayPaymentId);
        order.setPaymentFailureReason(null);
        order.setStatus("PLACED");
        return orders.saveAndFlush(order);
    }

    @Transactional(readOnly = true)
    public CustomerOrder getPaymentOrder(
            String razorpayOrderId,
            Long userId) {
        return orders.findByRazorpayOrderIdAndUserId(
                razorpayOrderId,
                userId
            )
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Payment order not found."
            ));
    }

    @Transactional
    public CustomerOrder markPaymentFailed(
            String razorpayOrderId,
            Long userId,
            String failureReason) {
        CustomerOrder order = findPaymentOrder(razorpayOrderId, userId);

        if ("FAILED".equals(order.getPaymentStatus())) {
            return order;
        }
        requirePendingPayment(order);

        for (OrderItem item : order.getItems()) {
            products.findByIdForUpdate(item.getProductId())
                .ifPresent(product ->
                    product.setStock(product.getStock() + item.getQuantity())
                );
        }

        String safeReason = failureReason == null || failureReason.isBlank()
            ? "Payment was not completed."
            : failureReason.trim();
        order.setPaymentFailureReason(
            safeReason.substring(0, Math.min(safeReason.length(), 255))
        );
        order.setPaymentStatus("FAILED");
        order.setStatus("CANCELLED");
        products.flush();
        return orders.saveAndFlush(order);
    }

    @Transactional(readOnly = true)
    public List<CustomerOrder> getMyOrders(Long userId) {
        return orders.findByUserIdOrderByCreatedAtDesc(userId);
    }

    private CustomerOrder findPaymentOrder(
            String razorpayOrderId,
            Long userId) {
        return orders.findPaymentOrderForUpdate(razorpayOrderId, userId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Pending payment order not found."
            ));
    }

    private void requirePendingPayment(CustomerOrder order) {
        if (!"PENDING".equals(order.getPaymentStatus())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This payment is no longer pending."
            );
        }
    }

    private Map<Long, Product> loadCheckoutProducts(
            CheckoutRequest request) {
        Set<Long> productIds = validateProductIds(request);
        Map<Long, Product> checkoutProducts = products.findAllById(productIds)
            .stream()
            .collect(Collectors.toMap(Product::getId, product -> product));
        validateStock(request, checkoutProducts);
        return checkoutProducts;
    }

    private Map<Long, Product> loadCheckoutProductsForUpdate(
            CheckoutRequest request) {
        Set<Long> productIds = validateProductIds(request);
        Map<Long, Product> checkoutProducts = productIds.stream()
            .map(id -> products.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Product not found."
                )))
            .collect(Collectors.toMap(Product::getId, product -> product));
        validateStock(request, checkoutProducts);
        return checkoutProducts;
    }

    private Set<Long> validateProductIds(CheckoutRequest request) {
        Set<Long> seenProducts = new HashSet<>();
        for (OrderItemRequest item : request.items()) {
            if (!seenProducts.add(item.productId())) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Duplicate product in cart."
                );
            }
        }
        return new TreeSet<>(seenProducts);
    }

    private void validateStock(
            CheckoutRequest request,
            Map<Long, Product> checkoutProducts) {
        for (OrderItemRequest item : request.items()) {
            Product product = checkoutProducts.get(item.productId());
            if (product == null) {
                throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Product not found."
                );
            }
            if (product.getStock() == null ||
                product.getStock() < item.quantity()) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Insufficient stock for " + product.getName() + "."
                );
            }
        }
    }
}
