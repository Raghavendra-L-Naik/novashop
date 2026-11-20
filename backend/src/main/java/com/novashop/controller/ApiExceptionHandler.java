
package com.novashop.controller;

import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger logger =
        LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler({
        OptimisticLockingFailureException.class,
        ObjectOptimisticLockingFailureException.class
    })
    public ResponseEntity<Map<String, String>> stockConflict() {
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(Map.of(
                "message",
                "Stock changed. Refresh your cart and try again."
            ));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> requestFailure(
            ResponseStatusException exception) {
        String message = exception.getReason() == null
            ? exception.getStatusCode().toString()
            : exception.getReason();

        return ResponseEntity
            .status(exception.getStatusCode())
            .body(Map.of("message", message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> unexpectedFailure(
            Exception exception,
            jakarta.servlet.http.HttpServletRequest request) {
        String errorId = java.util.UUID.randomUUID().toString();
        logger.error(
            "Unhandled API error {} for {} {}",
            errorId,
            request.getMethod(),
            request.getRequestURI(),
            exception
        );

        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of(
                "message",
                "Unexpected server error. Check the backend terminal.",
                "errorId",
                errorId
            ));
    }
}
