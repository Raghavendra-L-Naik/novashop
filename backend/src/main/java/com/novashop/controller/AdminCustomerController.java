package com.novashop.controller;

import com.novashop.entity.AppUser;
import com.novashop.repository.UserRepository;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/customers")
public class AdminCustomerController {

    private final UserRepository repository;

    public AdminCustomerController(UserRepository repository) {
        this.repository = repository;
    }

    public record AdminCustomerResponse(
        Long id,
        String name,
        String email,
        String role
    ) {}

    @GetMapping
    public List<AdminCustomerResponse> getAllCustomers() {
        return repository.findAll().stream()
            .filter(user -> "CUSTOMER".equals(user.getRole()))
            .map(this::toResponse)
            .toList();
    }

    private AdminCustomerResponse toResponse(AppUser user) {
        return new AdminCustomerResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole()
        );
    }
}
