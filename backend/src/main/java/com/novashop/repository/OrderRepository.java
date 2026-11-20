
package com.novashop.repository;

import com.novashop.entity.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

public interface OrderRepository
        extends JpaRepository<CustomerOrder, Long> {

    @EntityGraph(attributePaths = "items")
    List<CustomerOrder> findByUserIdOrderByCreatedAtDesc(
        Long userId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select o from CustomerOrder o
        where o.razorpayOrderId = :razorpayOrderId
          and o.user.id = :userId
        """)
    Optional<CustomerOrder> findPaymentOrderForUpdate(
        @Param("razorpayOrderId") String razorpayOrderId,
        @Param("userId") Long userId
    );

    Optional<CustomerOrder> findByRazorpayOrderIdAndUserId(
        String razorpayOrderId,
        Long userId
    );
}
