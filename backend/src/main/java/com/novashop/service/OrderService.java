
package com.novashop.service;

import com.novashop.dto.CheckoutRequest;
import com.novashop.dto.OrderItemRequest;
import com.novashop.entity.CustomerOrder;
import com.novashop.entity.OrderItem;
import com.novashop.entity.Product;
import com.novashop.repository.OrderRepository;
import com.novashop.repository.ProductRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public CustomerOrder placeOrder(CheckoutRequest request) {

        CustomerOrder order = new CustomerOrder(
            request.customerName(),
            request.email(),
            request.shippingAddress()
        );

        BigDecimal total = BigDecimal.ZERO;
        Set<Long> seenProducts = new HashSet<>();

        for (OrderItemRequest item : request.items()) {

            if (!seenProducts.add(item.productId())) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Duplicate product in cart"
                );
            }

            Product product = productRepository
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

        // Flush to detect database errors before returning.
        productRepository.flush();

        return orderRepository.saveAndFlush(order);
    }
}
