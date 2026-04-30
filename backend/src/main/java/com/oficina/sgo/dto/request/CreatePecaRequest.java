package com.oficina.sgo.dto.request;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public class CreatePecaRequest {

    private final String referencia;
    private final String designacao;
    private final BigDecimal precoUnitario;
    private final Integer quantidadeStock;
    private final Integer stockMinimo;
    private final String categoria;
    private final String fornecedor;

    @JsonCreator
    public CreatePecaRequest(
            @JsonProperty("referencia")      String referencia,
            @JsonProperty("designacao")      String designacao,
            @JsonProperty("precoUnitario")   BigDecimal precoUnitario,
            @JsonProperty("quantidadeStock") Integer quantidadeStock,
            @JsonProperty("stockMinimo")     Integer stockMinimo,
            @JsonProperty("categoria")       String categoria,
            @JsonProperty("fornecedor")      String fornecedor) {
        this.referencia      = referencia;
        this.designacao      = designacao;
        this.precoUnitario   = precoUnitario;
        this.quantidadeStock = quantidadeStock;
        this.stockMinimo     = stockMinimo;
        this.categoria       = categoria;
        this.fornecedor      = fornecedor;
    }

    public String     referencia()      { return referencia; }
    public String     designacao()      { return designacao; }
    public BigDecimal precoUnitario()   { return precoUnitario; }
    public Integer    quantidadeStock() { return quantidadeStock; }
    public Integer    stockMinimo()     { return stockMinimo; }
    public String     categoria()       { return categoria; }
    public String     fornecedor()      { return fornecedor; }
}
