
package com.novashop.service;

import com.novashop.dto.CheckoutRequest;
import com.novashop.dto.OrderItemRequest;
import com.novashop.entity.*;
import com.novashop.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

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

    @Transactional
    public CustomerOrder placeOrder(
            CheckoutRequest request, Long userId) {

        AppUser user = users.findById(userId)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User not found"
                )
            );

        CustomerOrder order = new CustomerOrder(
            request.customerName(),
            user.getEmail(),
            request.shippingAddress()
        );

        order.setUser(user);

        BigDecimal total = BigDecimal.ZERO;
        Set<Long> seenProducts = new HashSet<>();

        for (OrderItemRequest item : request.items()) {

            if (!seenProducts.add(item.productId())) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Duplicate product in cart"
                );
            }

            Product product = products
                .findById(item.productId())
                .orElseThrow(() ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found"
                    )
                );

            if (product.getStock() == null ||
                product.getStock() < item.quantity()) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Insufficient stock for " + product.getName()
                );
            }

            OrderItem orderItem = new OrderItem(
                product.getId(),
                product.getName(),
                item.quantity(),
                product.getPrice()
            );

            order.addItem(orderItem);
            total = total.add(orderItem.getSubtotal());

            product.setStock(
                product.getStock() - item.quantity()
            );
        }

        order.setTotalAmount(total);
        products.flush();

        return orders.saveAndFlush(order);
    }

    @Transactional(readOnly = true)
    public List<CustomerOrder> getMyOrders(Long userId) {
        return orders.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
