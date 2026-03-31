package com.oficina.sgo.service;

import com.oficina.sgo.dao.UserDao;
import com.oficina.sgo.dto.request.CreateUserRequest;
import com.oficina.sgo.dto.response.UserResponse;
import com.oficina.sgo.exception.BusinessException;
import com.oficina.sgo.exception.ResourceNotFoundException;
import com.oficina.sgo.model.User;
import com.oficina.sgo.util.PasswordUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

public class UserService {

    private final EntityManagerFactory emf;
    private final UserDao userDao;

    public UserService(EntityManagerFactory emf) {
        this.emf = emf;
        this.userDao = new UserDao();
    }

    public List<UserResponse> findAll() {
        try (EntityManager em = emf.createEntityManager()) {
            return userDao.findAll(em).stream().map(this::toResponse).collect(Collectors.toList());
        }
    }

    public UserResponse findById(Long id) {
        try (EntityManager em = emf.createEntityManager()) {
            return toResponse(userDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("User", id)));
        }
    }

    public UserResponse create(CreateUserRequest request) {
        return inTransaction(em -> {
            if (userDao.existsByUsername(em, request.username())) {
                throw new BusinessException("Username already exists: " + request.username());
            }
            User user = User.builder()
                    .username(request.username())
                    .password(PasswordUtil.encode(request.password()))
                    .name(request.name())
                    .email(request.email())
                    .role(request.role())
                    .active(true)
                    .build();
            return toResponse(userDao.save(em, user));
        });
    }

    public UserResponse update(Long id, CreateUserRequest request) {
        return inTransaction(em -> {
            User user = userDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("User", id));
            if (!user.getUsername().equals(request.username()) && userDao.existsByUsername(em, request.username())) {
                throw new BusinessException("Username already exists: " + request.username());
            }
            user.setUsername(request.username());
            user.setName(request.name());
            user.setEmail(request.email());
            user.setRole(request.role());
            if (request.password() != null && !request.password().isBlank()) {
                user.setPassword(PasswordUtil.encode(request.password()));
            }
            return toResponse(userDao.save(em, user));
        });
    }

    public void delete(Long id) {
        inTransaction(em -> {
            User user = userDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("User", id));
            user.setActive(false);
            userDao.save(em, user);
            return null;
        });
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getName(), user.getEmail(),
                user.getRole().name(), user.isActive());
    }

    private <T> T inTransaction(Function<EntityManager, T> action) {
        EntityManager em = emf.createEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            T result = action.apply(em);
            tx.commit();
            return result;
        } catch (RuntimeException e) {
            if (tx.isActive()) tx.rollback();
            throw e;
        } finally {
            em.close();
        }
    }
}
