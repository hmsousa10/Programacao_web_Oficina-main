package com.oficina.sgo.dao;

import com.oficina.sgo.model.Viatura;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Optional;

public class ViaturaDao {

    public List<Viatura> findAll(EntityManager em) {
        return em.createQuery("SELECT v FROM Viatura v", Viatura.class).getResultList();
    }

    public Optional<Viatura> findById(EntityManager em, Long id) {
        return Optional.ofNullable(em.find(Viatura.class, id));
    }

    public Optional<Viatura> findByMatricula(EntityManager em, String matricula) {
        List<Viatura> list = em.createQuery(
                "SELECT v FROM Viatura v WHERE v.matricula = :m", Viatura.class)
                .setParameter("m", matricula).getResultList();
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public boolean existsByMatricula(EntityManager em, String matricula) {
        Long count = em.createQuery(
                "SELECT COUNT(v) FROM Viatura v WHERE v.matricula = :m", Long.class)
                .setParameter("m", matricula).getSingleResult();
        return count > 0;
    }

    public List<Viatura> findByClienteId(EntityManager em, Long clienteId) {
        return em.createQuery(
                "SELECT v FROM Viatura v WHERE v.cliente.id = :cid", Viatura.class)
                .setParameter("cid", clienteId).getResultList();
    }

    public Viatura save(EntityManager em, Viatura v) {
        if (v.getId() == null) {
            em.persist(v);
            return v;
        }
        return em.merge(v);
    }

    public void delete(EntityManager em, Viatura v) {
        em.remove(em.contains(v) ? v : em.merge(v));
    }
}
