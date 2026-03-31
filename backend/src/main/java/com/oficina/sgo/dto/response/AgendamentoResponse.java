package com.oficina.sgo.dto.response;

import java.time.LocalDateTime;

public record AgendamentoResponse(
        Long id,
        LocalDateTime dataHoraInicio,
        LocalDateTime dataHoraFim,
        Long clienteId,
        String clienteNome,
        Long viaturaId,
        String viaturaMatricula,
        Long mecanicoId,
        String mecanicoNome,
        String tipoServico,
        String estado,
        String observacoes
) {}
