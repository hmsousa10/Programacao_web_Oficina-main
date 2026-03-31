package com.oficina.sgo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "operacoes_reparacao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperacaoReparacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reparacao_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Reparacao reparacao;

    @Column(nullable = false)
    private String descricao;

    private Integer tempoEstimadoMinutos;
    private Integer tempoRealMinutos;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoOperacao estado = EstadoOperacao.PENDENTE;

    private LocalDateTime dataInicio;
    private LocalDateTime dataFim;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    public enum EstadoOperacao {
        PENDENTE, EM_EXECUCAO, CONCLUIDA
    }
}
