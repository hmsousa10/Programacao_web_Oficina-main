package com.oficina.sgo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "log_entries", indexes = {
    @Index(name = "idx_log_timestamp", columnList = "timestamp"),
    @Index(name = "idx_log_severity",  columnList = "severity"),
    @Index(name = "idx_log_source",    columnList = "source")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /** INFO | SUCCESS | WARNING | ERROR | DEBUG */
    @Column(nullable = false, length = 20)
    private String severity;

    /** AUTH | REPARACOES | PECAS | AGENDA | CLIENTES | VIATURAS | SISTEMA */
    @Column(nullable = false, length = 30)
    private String source;

    /** Descrição da ação ocorrida */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    /** Username do utilizador que gerou o evento */
    @Column(length = 100)
    private String username;

    /** IP do utilizador (obtido do request) */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /** ID do recurso afetado (ex: id da reparação) */
    @Column(name = "entity_id")
    private Long entityId;

    /** Tipo do recurso afetado (ex: "Reparacao", "Peca") */
    @Column(name = "entity_type", length = 50)
    private String entityType;
}
