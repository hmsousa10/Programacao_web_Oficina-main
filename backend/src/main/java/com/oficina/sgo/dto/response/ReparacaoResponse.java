package com.oficina.sgo.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ReparacaoResponse(
        Long id,
        Long agendamentoId,
        Long viaturaId,
        String viaturaMatricula,
        String viaturaMarca,   
        String viaturaModelo,  
        Long clienteId,
        String clienteNome,
        Long mecanicoId,
        String mecanicoNome,
        LocalDateTime dataInicio,
        LocalDateTime dataFim,
        String estado,
        String descricao,
        Integer tempoTotalMinutos,
        BigDecimal valorTotal,
        List<OperacaoResponse> operacoes,
        List<PecaUtilizada> pecas // <--- NOVO: Transportar as peças para a Fatura!
) {
    // Mini-registo para levar apenas os dados que a Fatura precisa
    public record PecaUtilizada(String designacao, Integer quantidade, BigDecimal precoUnitario) {}
}