package com.oficina.sgo.dao;

import com.oficina.sgo.model.User;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Optional;

public class UserDao {

    public List<User> findAll(EntityManager em) {
        return em.createQuery("SELECT u FROM User u", User.class).getResultList();
    }

    public Optional<User> findById(EntityManager em, Long id) {
        return Optional.ofNullable(em.find(User.class, id));
    }

    public Optional<User> findByUsername(EntityManager em, String username) {
        List<User> list = em.createQuery(
                "SELECT u FROM User u WHERE u.username = :username", User.class)
                .setParameter("username", username).getResultList();
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public boolean existsByUsername(EntityManager em, String username) {
        Long count = em.createQuery(
                "SELECT COUNT(u) FROM User u WHERE u.username = :username", Long.class)
                .setParameter("username", username).getSingleResult();
        return count > 0;
    }

    public long count(EntityManager em) {
        return em.createQuery("SELECT COUNT(u) FROM User u", Long.class).getSingleResult();
    }

    public User save(EntityManager em, User u) {
        if (u.getId() == null) {
            em.persist(u);
            return u;
        }
        return em.merge(u);
    }
}
