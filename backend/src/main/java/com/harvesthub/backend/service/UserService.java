
package com.harvesthub.backend.service;

import com.harvesthub.backend.entity.User;
import com.harvesthub.backend.entity.Farm;
import com.harvesthub.backend.repository.UserRepository;
import com.harvesthub.backend.repository.FarmRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final FarmRepository farmRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            FarmRepository farmRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.farmRepository = farmRepository;
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

        // Save user first to generate user ID
        User savedUser = userRepository.save(user);

        // Automatically create farm for the registered user
        Farm farm = new Farm();
        farm.setUserId(savedUser.getId());
        farm.setName(farmName.trim());
        farm.setLocation("Not specified");
        farm.setTotalArea(0.0);
        farm.setAreaUnit("acres");

        farmRepository.save(farm);

        return savedUser;
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
