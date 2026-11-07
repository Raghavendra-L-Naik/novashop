
package com.novashop.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.security.oauth2.jose.*;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.web.SecurityFilterChain;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.List;

import org.springframework.web.cors.*;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecretKey jwtSecretKey(
            @Value("${app.jwt.secret}") String encodedSecret) {

        byte[] key = Base64.getDecoder().decode(encodedSecret);

        if (key.length < 32) {
            throw new IllegalArgumentException(
                "JWT secret must contain at least 32 bytes"
            );
        }

        return new SecretKeySpec(key, "HmacSHA256");
    }

@Bean
JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtAuthenticationConverter converter =
        new JwtAuthenticationConverter();

    converter.setJwtGrantedAuthoritiesConverter(jwt -> {
        String role = jwt.getClaimAsString("role");

        if (role == null) {
            return List.of();
        }

        return List.of(
            new SimpleGrantedAuthority("ROLE_" + role)
        );
    });

    return converter;
}


    @Bean
    JwtEncoder jwtEncoder(SecretKey secretKey) {
        return new NimbusJwtEncoder(
            new ImmutableSecret<>(secretKey)
        );
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey secretKey) {
        return NimbusJwtDecoder
            .withSecretKey(secretKey)
            .macAlgorithm(MacAlgorithm.HS256)
            .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cors = new CorsConfiguration();

        cors.setAllowedOrigins(List.of(
            "http://localhost:5173"
        ));
        cors.setAllowedMethods(List.of(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));
        cors.setAllowedHeaders(List.of(
            "Authorization", "Content-Type"
        ));

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", cors);
        return source;
    }

    
@Bean
SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        JwtAuthenticationConverter jwtAuthenticationConverter
) throws Exception {

    return http
        .csrf(csrf -> csrf.disable())
        .cors(Customizer.withDefaults())
        .sessionManagement(session ->
            session.sessionCreationPolicy(
                SessionCreationPolicy.STATELESS
            )
        )
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers(
                HttpMethod.GET, "/api/products/**"
            ).permitAll()
            .requestMatchers(
                HttpMethod.GET, "/api/hello"
            ).permitAll()
            .anyRequest().authenticated()
        )
        .oauth2ResourceServer(oauth -> oauth.jwt(jwt ->
            jwt.jwtAuthenticationConverter(
                jwtAuthenticationConverter
            )
        ))
        .build();
}

}
