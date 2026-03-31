package com.oficina.sgo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimentos_stock")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovimentoStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "peca_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Peca peca;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoMovimento tipoMovimento;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime dataMovimento = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reparacao_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Reparacao reparacao;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilizador_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User utilizador;

    public enum TipoMovimento {
        ENTRADA, SAIDA, REQUISICAO_REPARACAO
    }
}
