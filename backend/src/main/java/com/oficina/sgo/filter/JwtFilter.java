package com.oficina.sgo.filter;

import java.io.IOException;
import java.util.List;

import com.oficina.sgo.model.User;
import com.oficina.sgo.security.JwtTokenProvider;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebFilter(filterName = "JwtFilter", urlPatterns = "/api/*")
public class JwtFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        // 1. DEIXAR PASSAR OS PEDIDOS 'OPTIONS' DO BROWSER PARA O CORS
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        // 2. VERIFICAÇÃO DO CAMINHO (Usar getRequestURI em vez de getServletPath)
        String path = req.getRequestURI();
        if (path != null && path.contains("/auth/")) {
            chain.doFilter(request, response);
            return;
        }
        
        // 3. VERIFICAÇÃO DO TOKEN
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.setContentType("application/json;charset=UTF-8");
            resp.getWriter().write("{\"status\":401,\"message\":\"Authentication required\"}");
            return;
        }

        String token = header.substring(7);
        JwtTokenProvider jwtProvider = (JwtTokenProvider) req.getServletContext().getAttribute("jwtTokenProvider");

        if (jwtProvider == null || !jwtProvider.validateToken(token)) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.setContentType("application/json;charset=UTF-8");
            resp.getWriter().write("{\"status\":401,\"message\":\"Invalid or expired token\"}");
            return;
        }

        String username = jwtProvider.getUsernameFromToken(token);
        String role = jwtProvider.getRoleFromToken(token);

        EntityManagerFactory emf = (EntityManagerFactory) req.getServletContext().getAttribute("emf");
        if (emf != null) {
            try (EntityManager em = emf.createEntityManager()) {
                List<User> users = em.createQuery(
                        "SELECT u FROM User u WHERE u.username = :username AND u.active = true", User.class)
                        .setParameter("username", username).getResultList();
                if (!users.isEmpty()) {
                    req.setAttribute("currentUser", users.get(0));
                }
            }
        }

        req.setAttribute("currentUsername", username);
        req.setAttribute("currentRole", role);

        chain.doFilter(request, response);
    }
}