package com.oficina.sgo.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true) // <-- ADICIONA ESTA LINHA
public record CreateReparacaoRequest(
    Long viaturaId,
    Long clienteId,
    Long mecanicoId,
    Long agendamentoId,
    String descricao
    // Se o teu record tiver campos diferentes destes, mantém os teus, 
    // o importante é a linha @JsonIgnoreProperties lá em cima.
) {}