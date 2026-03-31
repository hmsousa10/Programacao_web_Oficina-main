package com.oficina.sgo.dao;

import com.oficina.sgo.model.MovimentoStock;
import jakarta.persistence.EntityManager;

import java.util.List;

public class MovimentoStockDao {

    public MovimentoStock save(EntityManager em, MovimentoStock m) {
        if (m.getId() == null) {
            em.persist(m);
            return m;
        }
        return em.merge(m);
    }

    public List<MovimentoStock> findByPecaId(EntityManager em, Long pecaId) {
        return em.createQuery(
                "SELECT m FROM MovimentoStock m WHERE m.peca.id = :pid", MovimentoStock.class)
                .setParameter("pid", pecaId).getResultList();
    }
}
