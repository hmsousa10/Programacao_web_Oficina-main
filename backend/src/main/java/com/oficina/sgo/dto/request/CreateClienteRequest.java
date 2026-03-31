package com.oficina.sgo.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateClienteRequest(
        @NotBlank(message = "Nome is required") String nome,
        String nif,
        String telefone,
        String email,
        String morada,
        String observacoes
) {}
