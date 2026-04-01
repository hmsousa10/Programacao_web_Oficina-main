package com.oficina.sgo.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PecaResponse(
        Long id,
        String referencia,
        String designacao,
        Integer quantidadeStock,
        Integer stockMinimo,
        BigDecimal precoUnitario,
        String categoria,
        String fornecedor,
        boolean isStockBaixo,
        List<Movimento> movimentos // NOVO: Histórico completo da Peça!
) {
    public record Movimento(
            Long id,
            String tipoMovimento,
            Integer quantidade,
            LocalDateTime dataMovimento,
            String observacoes
    ) {}
}