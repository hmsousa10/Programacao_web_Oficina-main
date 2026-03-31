package com.oficina.sgo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CreatePecaRequest(
        @NotBlank(message = "Referencia is required") String referencia,
        @NotBlank(message = "Designacao is required") String designacao,
        @NotNull(message = "Preco unitario is required") @Positive BigDecimal precoUnitario,
        Integer quantidadeStock,
        Integer stockMinimo,
        String categoria,
        String fornecedor
) {}
