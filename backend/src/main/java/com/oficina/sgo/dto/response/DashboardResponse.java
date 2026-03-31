package com.oficina.sgo.dto.response;

import java.math.BigDecimal;

public record DashboardResponse(
        BigDecimal faturacaoHoje,
        BigDecimal faturacaoSemana,
        BigDecimal faturacaoMes,
        long reparacoesEmCurso,
        long reparacoesConcluidasHoje,
        String ocupacaoAtual,
        long marcacoesFuturas,
        long pecasStockBaixo
) {}
