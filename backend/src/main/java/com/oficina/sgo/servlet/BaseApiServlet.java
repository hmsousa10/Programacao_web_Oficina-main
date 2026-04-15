package com.oficina.sgo.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.oficina.sgo.exception.BusinessException;
import com.oficina.sgo.exception.CapacidadeAgendaException;
import com.oficina.sgo.exception.CapacidadeOficinaException;
import com.oficina.sgo.exception.ResourceNotFoundException;
import com.oficina.sgo.model.User;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public abstract class BaseApiServlet extends HttpServlet {

    protected static final Logger log = LoggerFactory.getLogger(BaseApiServlet.class);

    protected static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    protected void sendJson(HttpServletResponse resp, int status, Object data) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        resp.setStatus(status);
        objectMapper.writeValue(resp.getWriter(), data);
    }

    protected void sendError(HttpServletResponse resp, int status, String message) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        resp.setStatus(status);
        Map<String, Object> error = new HashMap<>();
        error.put("status", status);
        error.put("message", message);
        error.put("timestamp", LocalDateTime.now().toString());
        objectMapper.writeValue(resp.getWriter(), error);
    }

    protected <T> T readBody(HttpServletRequest req, Class<T> type) throws IOException {
        return objectMapper.readValue(req.getInputStream(), type);
    }

    protected Long parseId(String pathInfo) {
        if (pathInfo == null || pathInfo.length() < 2) return null;
        String segment = pathInfo.substring(1);
        int slash = segment.indexOf('/');
        if (slash != -1) segment = segment.substring(0, slash);
        try {
            return Long.parseLong(segment);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    protected String getRole(HttpServletRequest req) {
        return (String) req.getAttribute("currentRole");
    }

    protected User getCurrentUser(HttpServletRequest req) {
        return (User) req.getAttribute("currentUser");
    }

    /** Retorna o username do utilizador autenticado, ou "Sistema" */
    protected String getUsername(HttpServletRequest req) {
        User u = getCurrentUser(req);
        return u != null ? u.getUsername() : "Sistema";
    }

    /** Retorna o IP real do cliente (suporta proxies) */
    protected String getClientIp(HttpServletRequest req) {
        String ip = req.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) return ip.split(",")[0].trim();
        return req.getRemoteAddr();
    }

    protected boolean hasRole(HttpServletRequest req, String... roles) {
        String role = getRole(req);
        if (role == null) return false;
        if ("ADMIN".equals(role)) return true;
        return Arrays.asList(roles).contains(role);
    }

    protected boolean requireRole(HttpServletRequest req, HttpServletResponse resp, String... roles)
            throws IOException {
        if (!hasRole(req, roles)) {
            sendError(resp, HttpServletResponse.SC_FORBIDDEN, "Access denied");
            return false;
        }
        return true;
    }

    protected void handleException(HttpServletResponse resp, Exception e) throws IOException {
        e.printStackTrace();
        if (e instanceof ResourceNotFoundException) {
            sendError(resp, HttpServletResponse.SC_NOT_FOUND, e.getMessage());
        } else if (e instanceof BusinessException) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } else if (e instanceof CapacidadeAgendaException || e instanceof CapacidadeOficinaException) {
            sendError(resp, HttpServletResponse.SC_CONFLICT, e.getMessage());
        } else {
            log.error("Unexpected error", e);
            sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        }
    }
}
