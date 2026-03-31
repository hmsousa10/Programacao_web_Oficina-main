package com.oficina.sgo.dto.response;

import java.math.BigDecimal;

public record PecaResponse(
        Long id,
        String referencia,
        String designacao,
        Integer quantidadeStock,
        Integer stockMinimo,
        BigDecimal precoUnitario,
        String categoria,
        String fornecedor,
        boolean stockBaixo
) {}
