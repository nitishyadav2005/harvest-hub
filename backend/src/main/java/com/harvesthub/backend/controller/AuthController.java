
package com.harvesthub.backend.controller;

import com.harvesthub.backend.dto.RegisterRequest;
import com.harvesthub.backend.dto.LoginRequest;
import com.harvesthub.backend.entity.User;
import com.harvesthub.backend.service.UserService;
import com.harvesthub.backend.service.JwtService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(
            UserService userService,
            JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @Valid @RequestBody RegisterRequest request) {

        Map<String, Object> response = new LinkedHashMap<>();

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            response.put("message", "Passwords do not match.");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            User user = userService.register(
                    request.getFullName(),
                    request.getFarmName(),
                    request.getEmail(),
                    request.getPassword()
            );

            Map<String, Object> userData = new LinkedHashMap<>();
            userData.put("id", user.getId());
            userData.put("fullName", user.getFullName());
            userData.put("farmName", user.getFarmName());
            userData.put("email", user.getEmail());
            userData.put("createdAt", user.getCreatedAt());

            response.put("message", "Account created successfully.");
            response.put("user", userData);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (IllegalArgumentException ex) {
            response.put("message", ex.getMessage());
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody LoginRequest request) {

        Map<String, Object> response = new LinkedHashMap<>();

        try {
            User user = userService.login(
                    request.getEmail(),
                    request.getPassword()
            );

            String token = jwtService.generateToken(user.getEmail());

            Map<String, Object> userData = new LinkedHashMap<>();
            userData.put("id", user.getId());
            userData.put("fullName", user.getFullName());
            userData.put("farmName", user.getFarmName());
            userData.put("email", user.getEmail());

            response.put("message", "Login successful.");
            response.put("token", token);
            response.put("user", userData);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException ex) {
            response.put("message", "Invalid email or password.");
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(response);
        }
    }
}