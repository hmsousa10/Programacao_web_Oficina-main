package com.oficina.sgo.dao;

import com.oficina.sgo.model.Agendamento;
import jakarta.persistence.EntityManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public class AgendamentoDao {

    public List<Agendamento> findAll(EntityManager em) {
        return em.createQuery("SELECT a FROM Agendamento a", Agendamento.class).getResultList();
    }

    public Optional<Agendamento> findById(EntityManager em, Long id) {
        return Optional.ofNullable(em.find(Agendamento.class, id));
    }

    public List<Agendamento> findByPeriod(EntityManager em, LocalDateTime inicio, LocalDateTime fim) {
        return em.createQuery(
                "SELECT a FROM Agendamento a WHERE a.dataHoraInicio >= :inicio AND a.dataHoraFim <= :fim",
                Agendamento.class)
                .setParameter("inicio", inicio).setParameter("fim", fim).getResultList();
    }

    public List<Agendamento> findBySemana(EntityManager em, LocalDateTime inicio, LocalDateTime fim) {
        return em.createQuery(
                "SELECT a FROM Agendamento a WHERE a.dataHoraInicio >= :inicio AND a.dataHoraInicio < :fim ORDER BY a.dataHoraInicio",
                Agendamento.class)
                .setParameter("inicio", inicio).setParameter("fim", fim).getResultList();
    }

    public long countBySlot(EntityManager em, LocalDateTime inicio, LocalDateTime fim) {
        return em.createQuery(
                "SELECT COUNT(a) FROM Agendamento a WHERE a.dataHoraInicio = :inicio AND a.dataHoraFim = :fim AND a.estado != 'CANCELADO'",
                Long.class)
                .setParameter("inicio", inicio).setParameter("fim", fim).getSingleResult();
    }

    public long countBySlotExcluding(EntityManager em, LocalDateTime inicio, LocalDateTime fim, Long excludeId) {
        return em.createQuery(
                "SELECT COUNT(a) FROM Agendamento a WHERE a.dataHoraInicio = :inicio AND a.dataHoraFim = :fim AND a.estado != 'CANCELADO' AND a.id != :excludeId",
                Long.class)
                .setParameter("inicio", inicio).setParameter("fim", fim)
                .setParameter("excludeId", excludeId).getSingleResult();
    }

    public long countMarcacoesFuturas(EntityManager em, LocalDateTime now) {
        return em.createQuery(
                "SELECT COUNT(a) FROM Agendamento a WHERE a.estado IN ('PENDENTE', 'CONFIRMADO') AND a.dataHoraInicio > :now",
                Long.class)
                .setParameter("now", now).getSingleResult();
    }

    public Agendamento save(EntityManager em, Agendamento a) {
        if (a.getId() == null) {
            em.persist(a);
            return a;
        }
        return em.merge(a);
    }
}
