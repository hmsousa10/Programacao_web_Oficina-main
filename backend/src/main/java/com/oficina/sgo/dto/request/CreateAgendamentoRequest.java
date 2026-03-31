package com.oficina.sgo.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CreateAgendamentoRequest(
        @NotNull(message = "Data hora inicio is required") LocalDateTime dataHoraInicio,
        @NotNull(message = "Data hora fim is required") LocalDateTime dataHoraFim,
        @NotNull(message = "Cliente ID is required") Long clienteId,
        @NotNull(message = "Viatura ID is required") Long viaturaId,
        Long mecanicoId,
        String tipoServico,
        String observacoes
) {}
