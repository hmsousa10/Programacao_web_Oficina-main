package com.oficina.sgo.dao;

import com.oficina.sgo.model.OperacaoReparacao;
import jakarta.persistence.EntityManager;

import java.util.Optional;

public class OperacaoReparacaoDao {

    public Optional<OperacaoReparacao> findById(EntityManager em, Long id) {
        return Optional.ofNullable(em.find(OperacaoReparacao.class, id));
    }

    public OperacaoReparacao save(EntityManager em, OperacaoReparacao o) {
        if (o.getId() == null) {
            em.persist(o);
            return o;
        }
        return em.merge(o);
    }
}
