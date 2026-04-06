package com.oficina.sgo.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List; // Necessário para a lista de movimentos

@Entity
@Table(name = "pecas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Peca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String referencia;

    @Column(nullable = false)
    private String designacao;

   @Column(name = "quantidade_stock", nullable = false)
    @Builder.Default
    private Integer quantidadeStock = 0;

    @Column(name = "stock_minimo", nullable = false)
    @Builder.Default
    private Integer stockMinimo = 0;

    @Column(name = "preco_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoUnitario;

    private String categoria;
    private String fornecedor;

    // --- ADICIONAR ESTE BLOCO ---
    // cascade = CascadeType.ALL: Garante que ao apagar a peça, apaga os movimentos associados.
    // orphanRemoval = true: Remove da base de dados movimentos que fiquem sem peça associada.
    @OneToMany(mappedBy = "peca", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MovimentoStock> movimentos;
}