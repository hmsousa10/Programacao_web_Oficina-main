package com.oficina.sgo.service;

import com.oficina.sgo.model.LogEntry;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;
import jakarta.persistence.TypedQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;

public class LogService {

    private static final Logger log = LoggerFactory.getLogger(LogService.class);
    private static final int MAX_LOGS = 2000;

    private final EntityManagerFactory emf;

    // ── Instância partilhada para chamadas estáticas de outros services ──
    private static LogService instance;

    public LogService(EntityManagerFactory emf) {
        this.emf = emf;
        instance = this;
    }

    public static LogService get() {
        return instance;
    }

    // ── Métodos de conveniência estáticos ──
    public static void info(String source, String message, String username) {
        if (instance != null) instance.add("INFO", source, message, username, null, null, null);
    }
    public static void success(String source, String message, String username) {
        if (instance != null) instance.add("SUCCESS", source, message, username, null, null, null);
    }
    public static void warning(String source, String message, String username) {
        if (instance != null) instance.add("WARNING", source, message, username, null, null, null);
    }
    public static void error(String source, String message, String username) {
        if (instance != null) instance.add("ERROR", source, message, username, null, null, null);
    }

    /** Adicionar log completo com entity reference */
    public static void logAction(String severity, String source, String message,
                                  String username, String ip, Long entityId, String entityType) {
        if (instance != null) instance.add(severity, source, message, username, ip, entityId, entityType);
    }

    // ── Persistência ──
    public void add(String severity, String source, String message,
                    String username, String ip, Long entityId, String entityType) {
        EntityManager em = emf.createEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            LogEntry entry = LogEntry.builder()
                    .timestamp(LocalDateTime.now())
                    .severity(severity.toUpperCase())
                    .source(source.toUpperCase())
                    .message(message)
                    .username(username != null ? username : "Sistema")
                    .ipAddress(ip)
                    .entityId(entityId)
                    .entityType(entityType)
                    .build();
            em.persist(entry);
            tx.commit();
        } catch (Exception e) {
            if (tx.isActive()) tx.rollback();
            log.warn("Failed to persist log entry: {}", e.getMessage());
        } finally {
            em.close();
        }
    }

    /** Listar logs com filtros opcionais */
    public List<LogEntry> findAll(String severity, String source, String username,
                                   LocalDateTime from, LocalDateTime to, int limit) {
        try (EntityManager em = emf.createEntityManager()) {
            StringBuilder jpql = new StringBuilder(
                    "SELECT l FROM LogEntry l WHERE 1=1");
            if (severity != null && !severity.isBlank())
                jpql.append(" AND l.severity = :severity");
            if (source != null && !source.isBlank())
                jpql.append(" AND l.source = :source");
            if (username != null && !username.isBlank())
                jpql.append(" AND LOWER(l.username) LIKE :username");
            if (from != null)
                jpql.append(" AND l.timestamp >= :from");
            if (to != null)
                jpql.append(" AND l.timestamp <= :to");
            jpql.append(" ORDER BY l.timestamp DESC");

            TypedQuery<LogEntry> q = em.createQuery(jpql.toString(), LogEntry.class);
            if (severity != null && !severity.isBlank())
                q.setParameter("severity", severity.toUpperCase());
            if (source != null && !source.isBlank())
                q.setParameter("source", source.toUpperCase());
            if (username != null && !username.isBlank())
                q.setParameter("username", "%" + username.toLowerCase() + "%");
            if (from != null)
                q.setParameter("from", from);
            if (to != null)
                q.setParameter("to", to);

            int maxResults = (limit > 0 && limit <= MAX_LOGS) ? limit : 200;
            q.setMaxResults(maxResults);
            return q.getResultList();
        }
    }

    /** Limpar todos os logs (só MANAGER) */
    public int deleteAll() {
        EntityManager em = emf.createEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            int deleted = em.createQuery("DELETE FROM LogEntry").executeUpdate();
            tx.commit();
            return deleted;
        } catch (Exception e) {
            if (tx.isActive()) tx.rollback();
            throw new RuntimeException("Failed to clear logs", e);
        } finally {
            em.close();
        }
    }

    /** Contar logs por severidade */
    public long count(String severity) {
        try (EntityManager em = emf.createEntityManager()) {
            if (severity != null && !severity.isBlank()) {
                return em.createQuery(
                        "SELECT COUNT(l) FROM LogEntry l WHERE l.severity = :s", Long.class)
                        .setParameter("s", severity.toUpperCase())
                        .getSingleResult();
            }
            return em.createQuery("SELECT COUNT(l) FROM LogEntry l", Long.class)
                     .getSingleResult();
        }
    }
}
