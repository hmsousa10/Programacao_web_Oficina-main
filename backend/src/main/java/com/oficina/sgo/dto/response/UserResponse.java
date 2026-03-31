package com.oficina.sgo.dto.response;

public record UserResponse(
        Long id,
        String username,
        String name,
        String email,
        String role,
        boolean active
) {}
