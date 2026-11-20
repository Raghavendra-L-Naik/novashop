package com.novashop.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Service
public class RazorpayGateway {

    private final RestClient client;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String keyId;
    private final String keySecret;

    public RazorpayGateway(
            @Value("${razorpay.key-id:}") String keyId,
            @Value("${razorpay.key-secret:}") String keySecret) {
        this.client = RestClient.create("https://api.razorpay.com/v1");
        this.keyId = keyId;
        this.keySecret = keySecret;
    }

    public record GatewayOrder(String id, long amount, String currency) {}

    public GatewayOrder createOrder(BigDecimal total) {
        requireConfiguration();
        long amount = toPaise(total);

        try {
            JsonNode response = client.post()
                .uri("/orders")
                .headers(headers -> headers.setBasicAuth(keyId, keySecret))
                .body(Map.of(
                    "amount", amount,
                    "currency", "INR",
                    "receipt", "ns-" + UUID.randomUUID().toString().replace("-", "")
                ))
                .retrieve()
                .body(JsonNode.class);

            if (response == null ||
                !response.path("id").isTextual() ||
                response.path("amount").asLong(-1) != amount ||
                !"INR".equals(response.path("currency").asText())) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Razorpay returned an invalid order response."
                );
            }

            return new GatewayOrder(
                response.path("id").asText(),
                amount,
                "INR"
            );
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                gatewayError("create the payment order", exception)
            );
        }
    }

    public void verifyCapturedPayment(
            String orderId,
            String paymentId,
            String signature,
            BigDecimal expectedAmount) {
        requireConfiguration();
        verifySignature(orderId, paymentId, signature);

        try {
            JsonNode payment = client.get()
                .uri("/payments/{paymentId}", paymentId)
                .headers(headers -> headers.setBasicAuth(keyId, keySecret))
                .retrieve()
                .body(JsonNode.class);

            if (payment == null ||
                !orderId.equals(payment.path("order_id").asText()) ||
                payment.path("amount").asLong(-1) != toPaise(expectedAmount) ||
                !"INR".equals(payment.path("currency").asText()) ||
                !"captured".equals(payment.path("status").asText())) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Razorpay payment is not captured or does not match this order."
                );
            }
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                gatewayError("verify the payment", exception)
            );
        }
    }

    public void ensureNoCapturedPayment(String orderId) {
        requireConfiguration();

        try {
            JsonNode response = client.get()
                .uri("/orders/{orderId}/payments", orderId)
                .headers(headers -> headers.setBasicAuth(keyId, keySecret))
                .retrieve()
                .body(JsonNode.class);

            if (response == null || !response.path("items").isArray()) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Razorpay returned an invalid payment status response."
                );
            }

            for (JsonNode payment : response.path("items")) {
                if ("captured".equals(payment.path("status").asText())) {
                    throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "A captured payment cannot be marked as failed."
                    );
                }
            }
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                gatewayError("check the payment status", exception)
            );
        }
    }

    private String gatewayError(
            String operation,
            RestClientResponseException exception) {
        String upstreamDetail = "";
        String upstreamCode = "";

        try {
            JsonNode error = objectMapper
                .readTree(exception.getResponseBodyAsString())
                .path("error");
            upstreamDetail = error.path("description").asText();
            upstreamCode = error.path("code").asText();
        } catch (JacksonException ignored) {
            // Some upstream failures do not return a JSON error body.
        }

        String message = "Razorpay could not " + operation +
            " (upstream HTTP " + exception.getStatusCode().value() + ")";
        if (!upstreamCode.isBlank()) {
            message += " [" + upstreamCode + "]";
        }
        if (!upstreamDetail.isBlank()) {
            message += ": " + upstreamDetail;
        }
        return message + ".";
    }

    public String getKeyId() {
        requireConfiguration();
        return keyId;
    }

    private void verifySignature(
            String orderId,
            String paymentId,
            String signature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                keySecret.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
            ));
            byte[] expected = HexFormat.of().formatHex(
                mac.doFinal((orderId + "|" + paymentId)
                    .getBytes(StandardCharsets.UTF_8))
            ).getBytes(StandardCharsets.US_ASCII);
            byte[] received = signature.getBytes(StandardCharsets.US_ASCII);

            if (!MessageDigest.isEqual(expected, received)) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Razorpay payment signature is invalid."
                );
            }
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException(
                "Unable to verify Razorpay payment signature.",
                exception
            );
        }
    }

    private long toPaise(BigDecimal amount) {
        try {
            return amount.movePointRight(2).longValueExact();
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Order total must be a valid INR amount."
            );
        }
    }

    private void requireConfiguration() {
        if (keyId.isBlank() ||
            keySecret.isBlank() ||
            !keyId.startsWith("rzp_test_")) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Valid Razorpay test-mode credentials are not configured."
            );
        }
    }
}
