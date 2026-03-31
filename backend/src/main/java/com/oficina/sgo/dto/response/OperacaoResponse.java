package com.oficina.sgo.dto.response;

import java.time.LocalDateTime;

public record OperacaoResponse(
        Long id,
        Long reparacaoId,
        String descricao,
        Integer tempoEstimadoMinutos,
        Integer tempoRealMinutos,
        String estado,
        LocalDateTime dataInicio,
        LocalDateTime dataFim,
        String observacoes
) {}
