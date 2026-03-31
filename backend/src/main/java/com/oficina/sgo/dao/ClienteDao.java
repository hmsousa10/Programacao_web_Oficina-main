package com.oficina.sgo.dao;

import com.oficina.sgo.model.Cliente;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Optional;

public class ClienteDao {

    public List<Cliente> findAll(EntityManager em) {
        return em.createQuery("SELECT c FROM Cliente c", Cliente.class).getResultList();
    }

    public Optional<Cliente> findById(EntityManager em, Long id) {
        return Optional.ofNullable(em.find(Cliente.class, id));
    }

    public boolean existsByNif(EntityManager em, String nif) {
        if (nif == null || nif.isBlank()) return false;
        Long count = em.createQuery(
                "SELECT COUNT(c) FROM Cliente c WHERE c.nif = :nif", Long.class)
                .setParameter("nif", nif).getSingleResult();
        return count > 0;
    }

    public Cliente save(EntityManager em, Cliente c) {
        if (c.getId() == null) {
            em.persist(c);
            return c;
        }
        return em.merge(c);
    }

    public void delete(EntityManager em, Cliente c) {
        em.remove(em.contains(c) ? c : em.merge(c));
    }
}
