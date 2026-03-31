package com.oficina.sgo.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RequisitarPecaRequest(
        @NotNull(message = "Peca ID is required") Long pecaId,
        @NotNull(message = "Quantidade is required") @Positive Integer quantidade,
        @NotNull(message = "Reparacao ID is required") Long reparacaoId,
        String observacoes
) {}
