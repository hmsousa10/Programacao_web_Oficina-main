package com.oficina.sgo.service;

import com.oficina.sgo.dao.ClienteDao;
import com.oficina.sgo.dao.UserDao;
import com.oficina.sgo.dto.request.LoginRequest;
import com.oficina.sgo.dto.response.AuthResponse;
import com.oficina.sgo.exception.BusinessException;
import com.oficina.sgo.exception.ResourceNotFoundException;
import com.oficina.sgo.model.User;
import com.oficina.sgo.security.JwtTokenProvider;
import com.oficina.sgo.util.PasswordUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;

public class AuthService {

    private final EntityManagerFactory emf;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDao userDao;

    public AuthService(EntityManagerFactory emf, JwtTokenProvider jwtTokenProvider) {
        this.emf = emf;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDao = new UserDao();
    }

    public AuthResponse login(LoginRequest request) {
        try (EntityManager em = emf.createEntityManager()) {
            User user = userDao.findByUsername(em, request.username())
                    .orElseThrow(() -> new ResourceNotFoundException("Invalid credentials"));
            if (!user.isActive()) {
                throw new BusinessException("User account is disabled");
            }
            if (!PasswordUtil.matches(request.password(), user.getPassword())) {
                throw new BusinessException("Invalid credentials");
            }
            String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().name());
            return new AuthResponse(token, "Bearer", user.getId(), user.getUsername(), user.getName(), user.getRole().name());
        }
    }
}
