package com.oficina.sgo.dto.request;

import com.oficina.sgo.model.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateUserRequest(
        @NotBlank(message = "Username is required") String username,
        @NotBlank(message = "Password is required") String password,
        @NotBlank(message = "Name is required") String name,
        String email,
        @NotNull(message = "Role is required") User.Role role
) {}
