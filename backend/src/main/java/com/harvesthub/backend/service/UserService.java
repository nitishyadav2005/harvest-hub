
package com.harvesthub.backend.service;

import com.harvesthub.backend.entity.User;
import com.harvesthub.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User register(
            String fullName,
            String farmName,
            String email,
            String rawPassword) {

        if (fullName == null || fullName.isBlank()
                || farmName == null || farmName.isBlank()
                || email == null || email.isBlank()
                || rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException(
                    "All fields are required."
            );
        }

        if (rawPassword.length() < 8) {
            throw new IllegalArgumentException(
                    "Password must contain at least 8 characters."
            );
        }

        String normalizedEmail =
                email.trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException(
                    "Email is already registered."
            );
        }

        User user = new User();
        user.setFullName(fullName.trim());
        user.setFarmName(farmName.trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(
                passwordEncoder.encode(rawPassword)
        );

        return userRepository.save(user);
    }

    public User login(String email, String rawPassword) {

        String normalizedEmail =
                email.trim().toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Invalid email or password."
                        )
                );

        if (!passwordEncoder.matches(
                rawPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException(
                    "Invalid email or password."
            );
        }

        return user;
    }
}
