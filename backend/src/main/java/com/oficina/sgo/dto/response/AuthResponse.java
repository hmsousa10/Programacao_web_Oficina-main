package com.oficina.sgo.dto.response;

public record AuthResponse(
        String token,
        String tokenType,
        Long userId,
        String username,
        String name,
        String role
) {}
