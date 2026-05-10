package com.docvault.controller;

import com.docvault.model.AuditLog;
import com.docvault.model.User;
import com.docvault.repository.AuditLogRepository;
import com.docvault.service.EmailService;
import com.docvault.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

/**
 * UserController — handles authentication, user profile, password reset,
 * AND audit logging. Mixed responsibilities.
 */
@RestController
@RequestMapping("/api/auth")
public class UserController {

    private static final Logger logger = Logger.getLogger(UserController.class.getName());

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    // Controller directly uses repository — bypasses service layer
    @Autowired
    private AuditLogRepository auditLogRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials,
                                   HttpServletRequest request) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password required"));
        }

        User user = userService.authenticate(username, password);
        if (user != null) {
            // Audit log — done in controller instead of service
            logAuditEvent(user.getId(), "LOGIN", "USER", user.getId(),
                "Login from " + request.getRemoteAddr(), request.getRemoteAddr());

            return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "user", safeUserMap(user)
            ));
        }

        // Audit failed login — leaks whether username exists
        logAuditEvent(null, "LOGIN_FAILED", "USER", null,
            "Failed login attempt for: " + username, request.getRemoteAddr());

        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> userData,
                                      HttpServletRequest request) {
        try {
            String username = userData.get("username");
            String email = userData.get("email");
            String password = userData.get("password");
            String fullName = userData.get("fullName");

            // No input validation — no email format check, no password strength check
            User user = userService.register(username, email, password, fullName);

            // Audit
            logAuditEvent(user.getId(), "REGISTER", "USER", user.getId(),
                "New user registration", request.getRemoteAddr());

            // Send welcome email
            emailService.sendEmail(email, "Welcome to DocVault!",
                "Hi " + fullName + ",\n\nWelcome to DocVault! Start shopping for your pets today.\n\nBest,\nThe DocVault Team");

            return ResponseEntity.ok(Map.of(
                "message", "Registration successful",
                "user", safeUserMap(user)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestParam Long userId) {
        try {
            return ResponseEntity.ok(userService.getUserProfile(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestParam Long userId,
                                           @RequestBody Map<String, String> updates,
                                           HttpServletRequest request) {
        try {
            User user = userService.updateUser(userId,
                updates.get("fullName"),
                updates.get("phone"),
                updates.get("address"));

            logAuditEvent(userId, "UPDATE_PROFILE", "USER", userId,
                "Profile updated", request.getRemoteAddr());

            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Password reset — also handled by this controller (mixed responsibility).
     * Generates a reset token, "sends" an email, but doesn't actually store
     * the token anywhere. The reset can never be completed.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> request_body,
                                                   HttpServletRequest request) {
        String email = request_body.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email required"));
        }

        String resetToken = userService.requestPasswordReset(email);
        if (resetToken != null) {
            String resetLink = "https://docvault-legacy.com/reset?token=" + resetToken;

            emailService.sendEmail(email, "Password Reset Request",
                "Click here to reset your password: " + resetLink
                + "\n\nThis link expires in 24 hours.");

            var userOpt = userService.findByEmail(email);
            userOpt.ifPresent(user ->
                logAuditEvent(user.getId(), "PASSWORD_RESET_REQUEST", "USER",
                    user.getId(), "Reset token generated", request.getRemoteAddr()));
        }

        return ResponseEntity.ok(Map.of("message", "If that email exists, a reset link has been sent."));
    }

    @PostMapping("/reset-password-confirm")
    public ResponseEntity<?> confirmPasswordReset(@RequestBody Map<String, String> request_body,
                                                   HttpServletRequest request) {
        String token = request_body.get("token");
        String newPassword = request_body.get("newPassword");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token required"));
        }
        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password required"));
        }

        boolean success = userService.confirmPasswordReset(token, newPassword);
        if (success) {
            logAuditEvent(null, "PASSWORD_RESET_CONFIRM", "USER", null,
                "Password reset completed", request.getRemoteAddr());
            return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired reset token."));
        }
    }

    // ========================
    // AUDIT LOGGING (should be in its own service)
    // ========================

    private static Map<String, Object> safeUserMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("email", user.getEmail());
        map.put("role", user.getRole());
        map.put("fullName", user.getFullName());
        return map;
    }

    private void logAuditEvent(Long userId, String action, String entityType,
                               Long entityId, String details, String ipAddress) {
        try {
            AuditLog log = new AuditLog(userId, action, entityType, entityId, details);
            log.setIpAddress(ipAddress);
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Swallow audit errors — don't let logging break the request
            logger.warning("Failed to log audit event: " + e.getMessage());
        }
    }
}
