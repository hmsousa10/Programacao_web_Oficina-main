package com.oficina.sgo.dto.response;

public record ClienteResponse(
        Long id,
        String nome,
        String nif,
        String telefone,
        String email,
        String morada,
        String observacoes,
        int totalViaturas
) {}
