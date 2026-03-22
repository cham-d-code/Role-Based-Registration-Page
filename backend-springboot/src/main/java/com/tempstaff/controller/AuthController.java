package com.tempstaff.controller;

import com.tempstaff.dto.request.*;
import com.tempstaff.dto.response.AuthResponse;
import com.tempstaff.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register
     * Register a new user with hashed password
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);

        if (response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        // Email already exists
        if (response.getMessage().contains("already registered")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * POST /api/auth/login
     * Authenticate user with email and password
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }

        // Account not approved
        if (response.getMessage().contains("Account is")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /**
     * POST /api/auth/forgot-password
     * Request password reset
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<AuthResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        AuthResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/reset-password
     * Reset password with token
     */
    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        AuthResponse response = authService.resetPassword(request);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.badRequest().body(response);
    }
}
