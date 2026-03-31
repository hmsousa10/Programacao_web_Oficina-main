package com.oficina.sgo.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateOperacaoRequest(
        @NotBlank(message = "Descricao is required") String descricao,
        Integer tempoEstimadoMinutos,
        Integer tempoRealMinutos,
        String estado,
        String observacoes
) {}