package com.oficina.sgo.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal; // <--- Não esquecer este import para o dinheiro!

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateReparacaoRequest(
    Long viaturaId,
    Long clienteId,
    Long mecanicoId,
    Long agendamentoId,
    String descricao,
    BigDecimal valorTotal // <--- O CAMPO MAGICO QUE FALTAVA!
) {}