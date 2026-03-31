package com.oficina.sgo.dao;

import com.oficina.sgo.model.Peca;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Optional;

public class PecaDao {

    public List<Peca> findAll(EntityManager em) {
        return em.createQuery("SELECT p FROM Peca p", Peca.class).getResultList();
    }

    public Optional<Peca> findById(EntityManager em, Long id) {
        return Optional.ofNullable(em.find(Peca.class, id));
    }

    public boolean existsByReferencia(EntityManager em, String referencia) {
        Long count = em.createQuery(
                "SELECT COUNT(p) FROM Peca p WHERE p.referencia = :ref", Long.class)
                .setParameter("ref", referencia).getSingleResult();
        return count > 0;
    }

    public List<Peca> findPecasComStockBaixo(EntityManager em) {
        return em.createQuery(
                "SELECT p FROM Peca p WHERE p.quantidadeStock <= p.stockMinimo", Peca.class)
                .getResultList();
    }

    public Peca save(EntityManager em, Peca p) {
        if (p.getId() == null) {
            em.persist(p);
            return p;
        }
        return em.merge(p);
    }

    public void delete(EntityManager em, Peca p) {
        em.remove(em.contains(p) ? p : em.merge(p));
    }
}
