
package com.novashop.controller;

import com.novashop.entity.AppUser;
import com.novashop.service.AuthService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public record RegisterRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72) String password
    ) {}

    public record RegisterResponse(
        Long id, String name, String email
    ) {}

    public record LoginRequest(
        @NotBlank String email,
        @NotBlank String password
    ) {}

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(
            @Valid @RequestBody RegisterRequest request) {

        AppUser user = authService.register(
            request.name(),
            request.email(),
            request.password()
        );

        return new RegisterResponse(
            user.getId(),
            user.getName(),
            user.getEmail()
        );
    }

    @PostMapping("/login")
    public AuthService.LoginResult login(
            @Valid @RequestBody LoginRequest request) {

        return authService.login(
            request.email(),
            request.password()
        );
    }
}
