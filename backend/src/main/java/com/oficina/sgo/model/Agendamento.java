package com.oficina.sgo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agendamentos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime dataHoraInicio;

    @Column(nullable = false)
    private LocalDateTime dataHoraFim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viatura_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Viatura viatura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mecanico_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User mecanico;

    private String tipoServico;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoAgendamento estado = EstadoAgendamento.PENDENTE;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    public enum EstadoAgendamento {
        PENDENTE, CONFIRMADO, CANCELADO, CONCLUIDO
    }
}
