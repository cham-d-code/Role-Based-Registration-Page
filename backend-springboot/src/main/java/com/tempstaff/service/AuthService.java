package com.tempstaff.service;

import com.tempstaff.dto.request.*;
import com.tempstaff.dto.response.AuthResponse;
import com.tempstaff.entity.*;
import com.tempstaff.entity.Module;
import com.tempstaff.repository.*;
import com.tempstaff.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ModuleRepository moduleRepository;
    private final UserSubjectRepository userSubjectRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${spring.profiles.active:development}")
    private String activeProfile;

    /**
     * Register a new user
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Email already registered")
                    .build();
        }

        // Parse role
        UserRole role;
        try {
            role = UserRole.valueOf(request.getRole().toLowerCase());
        } catch (IllegalArgumentException e) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid role specified")
                    .build();
        }

        // Create user
        UserStatus status = UserStatus.pending;
        if (role == UserRole.hod || role == UserRole.coordinator) {
            // Check if one already exists
            if (userRepository.existsByRole(role)) {
                return AuthResponse.builder()
                        .success(false)
                        .message("An account with the role of " + role.name() + " already exists. Only one "
                                + role.name() + " is allowed.")
                        .build();
            }
            // Auto-approve HOD and Coordinator
            status = UserStatus.approved;
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .mobile(request.getMobile())
                .role(role)
                .status(status)
                .contractStartDate(request.getContractStartDate())
                .contractEndDate(request.getContractEndDate())
                .build();

        user = userRepository.save(user);

        // If staff with preferred subjects, add them
        if (role == UserRole.staff && request.getPreferredSubjects() != null) {
            for (String subjectName : request.getPreferredSubjects()) {
                List<Module> modules = moduleRepository.findByNameContainingIgnoreCase(subjectName);
                if (!modules.isEmpty()) {
                    UserSubject userSubject = UserSubject.builder()
                            .userId(user.getId())
                            .moduleId(modules.get(0).getId())
                            .isPreferred(true)
                            .build();
                    userSubjectRepository.save(userSubject);
                }
            }
        }

        String successMessage = (user.getStatus() == UserStatus.approved)
                ? "Registration successful and auto-approved."
                : "Registration successful. Awaiting approval.";

        return AuthResponse.builder()
                .success(true)
                .message(successMessage)
                .userId(user.getId().toString())
                .build();
    }

    /**
     * Authenticate user with email and password
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Find user by email
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid email or password")
                    .build();
        }

        User user = userOpt.get();

        // Check if role matches (if provided)
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            try {
                UserRole requestedRole = UserRole.valueOf(request.getRole().toLowerCase());

                // Business rule: HOD and Coordinator can sign in as Mentor
                boolean isManagementRole = (user.getRole() == UserRole.hod || user.getRole() == UserRole.coordinator);
                boolean isValidRoleLogin = (user.getRole() == requestedRole)
                        || (requestedRole == UserRole.mentor && isManagementRole);

                if (!isValidRoleLogin) {
                    return AuthResponse.builder()
                            .success(false)
                            .message("Invalid role for this account")
                            .build();
                }
            } catch (IllegalArgumentException e) {
                return AuthResponse.builder()
                        .success(false)
                        .message("Invalid role specified")
                        .build();
            }
        }

        // Check if user is approved
        if (user.getStatus() != UserStatus.approved) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Account is " + user.getStatus() + ". Please contact administrator.")
                    .build();
        }

        // Verify password
        // DEBUG: Bypass password check
        /*
         * if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash()))
         * {
         * return AuthResponse.builder()
         * .success(false)
         * .message("Invalid email or password")
         * .build();
         * }
         */

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(
                user.getEmail(),
                user.getId().toString(),
                user.getRole().name());

        return AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .token(token)
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId().toString())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .role(user.getRole().name())

                        .build())
                .build();
    }

    /**
     * Request password reset
     */
    @Transactional
    public AuthResponse forgotPassword(ForgotPasswordRequest request) {
        String genericMessage = "If email exists, reset instructions will be sent.";

        // Find user
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            return AuthResponse.builder()
                    .success(true)
                    .message(genericMessage)
                    .build();
        }

        User user = userOpt.get();

        // Check role if provided
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            try {
                UserRole requestedRole = UserRole.valueOf(request.getRole().toLowerCase());
                if (user.getRole() != requestedRole) {
                    return AuthResponse.builder()
                            .success(true)
                            .message(genericMessage)
                            .build();
                }
            } catch (IllegalArgumentException e) {
                return AuthResponse.builder()
                        .success(true)
                        .message(genericMessage)
                        .build();
            }
        }

        // Generate reset token
        String resetToken = generateResetToken();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(30);

        PasswordResetToken tokenEntity = PasswordResetToken.builder()
                .userId(user.getId())
                .token(resetToken)
                .expiresAt(expiresAt)
                .build();

        passwordResetTokenRepository.save(tokenEntity);

        // In development, include the token in response
        System.out.println("Password reset token for " + request.getEmail() + ": " + resetToken);

        AuthResponse.AuthResponseBuilder responseBuilder = AuthResponse.builder()
                .success(true)
                .message(genericMessage);

        // Only include reset token in development mode
        if ("development".equals(activeProfile) || activeProfile == null) {
            responseBuilder.resetToken(resetToken);
        }

        return responseBuilder.build();
    }

    /**
     * Reset password with token
     */
    @Transactional
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        // Find valid token
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository
                .findValidToken(request.getToken(), LocalDateTime.now());

        if (tokenOpt.isEmpty()) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid or expired reset token")
                    .build();
        }

        PasswordResetToken resetToken = tokenOpt.get();

        // Update password
        String newPasswordHash = passwordEncoder.encode(request.getNewPassword());
        userRepository.updatePassword(resetToken.getUserId(), newPasswordHash);

        // Mark token as used
        passwordResetTokenRepository.markAsUsed(resetToken.getId(), LocalDateTime.now());

        return AuthResponse.builder()
                .success(true)
                .message("Password reset successful")
                .build();
    }

    private String generateResetToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
