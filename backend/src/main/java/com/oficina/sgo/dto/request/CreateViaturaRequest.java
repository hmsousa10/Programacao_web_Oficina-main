package com.oficina.sgo.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// ESTA É A LINHA MÁGICA QUE RESOLVE TUDO:
@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateViaturaRequest(
        @NotBlank(message = "Matricula is required") 
        @JsonProperty("matricula") String matricula,

        @NotBlank(message = "Marca is required") 
        @JsonProperty("marca") String marca,

        @NotBlank(message = "Modelo is required") 
        @JsonProperty("modelo") String modelo,

        @JsonProperty("ano") Integer ano,

        @JsonProperty("numeroChassis") String numeroChassis,

        @JsonProperty("combustivel") String combustivel,

        @JsonProperty("cor") String cor,

        @JsonProperty("quilometragem") Integer quilometragem,

        @JsonProperty("observacoes") String observacoes,

        @NotNull(message = "Cliente ID is required") 
        @JsonProperty("clienteId") Long clienteId
) {}