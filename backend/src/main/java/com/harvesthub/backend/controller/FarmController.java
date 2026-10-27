
package com.harvesthub.backend.controller;

import com.harvesthub.backend.entity.Farm;
import com.harvesthub.backend.entity.User;
import com.harvesthub.backend.repository.FarmRepository;
import com.harvesthub.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/farms")
public class FarmController {

    private final FarmRepository farmRepository;
    private final UserRepository userRepository;

    public FarmController(
            FarmRepository farmRepository,
            UserRepository userRepository) {
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public Farm createFarm(
            @RequestBody Farm farm,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        farm.setUserId(user.getId());

        return farmRepository.save(farm);
    }

    @GetMapping
    public List<Farm> getMyFarms(Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        return farmRepository.findByUserId(user.getId());
    }
}
