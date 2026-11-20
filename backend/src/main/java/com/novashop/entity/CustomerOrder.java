
package com.novashop.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customer_orders")
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String shippingAddress;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private String paymentStatus;

    @Column(unique = true)
    private String razorpayOrderId;

    @Column
    private String razorpayPaymentId;

    @Column(length = 255)
    private String paymentFailureReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @OneToMany(
        mappedBy = "order",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<OrderItem> items = new ArrayList<>();

    public AppUser getUser() {
        return user;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

public void setStatus(String status) {
    this.status = status;
}

    public String getPaymentStatus() {
        return paymentStatus == null ? "NOT_TRACKED" : paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }

    public String getRazorpayPaymentId() {
        return razorpayPaymentId;
    }

    public void setRazorpayPaymentId(String razorpayPaymentId) {
        this.razorpayPaymentId = razorpayPaymentId;
    }

    public String getPaymentFailureReason() {
        return paymentFailureReason;
    }

    public void setPaymentFailureReason(String paymentFailureReason) {
        this.paymentFailureReason = paymentFailureReason;
    }



    protected CustomerOrder() {}

    public CustomerOrder(
            String customerName,
            String email,
            String shippingAddress) {
        this.customerName = customerName;
        this.email = email;
        this.shippingAddress = shippingAddress;
        this.totalAmount = BigDecimal.ZERO;
        this.status = "PLACED";
        this.createdAt = LocalDateTime.now();
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public Long getId() { return id; }
    public String getCustomerName() { return customerName; }
    public String getEmail() { return email; }
    public String getShippingAddress() { return shippingAddress; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<OrderItem> getItems() { return items; }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
}
