
package com.novashop.controller;

import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

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
}
