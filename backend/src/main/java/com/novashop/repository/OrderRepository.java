
package com.novashop.repository;

import com.novashop.entity.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository
        extends JpaRepository<CustomerOrder, Long> {
}
