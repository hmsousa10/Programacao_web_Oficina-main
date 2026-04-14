package com.oficina.sgo.servlet;

import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.oficina.sgo.model.LogEntry;
import com.oficina.sgo.service.LogService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@WebServlet(name = "LogServlet", urlPatterns = "/api/logs/*")
public class LogServlet extends BaseApiServlet {

    private LogService logService;

    @Override
    public void init() {
        logService = (LogService) getServletContext().getAttribute("logService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION", "MECHANIC")) return;
        if (logService == null) {
            // Re-try to get from context (may not be initialized at servlet init time)
            logService = (LogService) getServletContext().getAttribute("logService");
        }
        if (logService == null) {
            sendError(resp, 503, "LogService n\u00e3o inicializado. Tente novamente.");
            return;
        }
        try {
            String severity = req.getParameter("severity");
            String source   = req.getParameter("source");
            String username = req.getParameter("username");
            String fromStr  = req.getParameter("from");
            String toStr    = req.getParameter("to");
            String limitStr = req.getParameter("limit");

            LocalDateTime from  = fromStr  != null ? LocalDateTime.parse(fromStr,  DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
            LocalDateTime to    = toStr    != null ? LocalDateTime.parse(toStr,    DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
            int limit = 200;
            if (limitStr != null && !limitStr.isBlank()) {
                try {
                    limit = Integer.parseInt(limitStr);
                } catch (NumberFormatException e) {
                    limit = 200; // default
                }
            }

            List<LogEntry> logs = logService.findAll(severity, source, username, from, to, limit);

            // Serializar manualmente para controlar o formato
            ArrayNode arr = objectMapper.createArrayNode();
            DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            for (LogEntry l : logs) {
                ObjectNode node = objectMapper.createObjectNode();
                node.put("id",         l.getId());
                node.put("timestamp",  l.getTimestamp() != null ? l.getTimestamp().format(fmt) : null);
                node.put("severity",   l.getSeverity());
                node.put("source",     l.getSource());
                node.put("message",    l.getMessage());
                node.put("username",   l.getUsername());
                node.put("ipAddress",  l.getIpAddress());
                if (l.getEntityId()   != null) node.put("entityId",   l.getEntityId());
                if (l.getEntityType() != null) node.put("entityType", l.getEntityType());
                arr.add(node);
            }

            // Adicionar resumo de contagens
            ObjectNode wrapper = objectMapper.createObjectNode();
            wrapper.put("total",   logs.size());
            wrapper.put("info",    logs.stream().filter(l -> "INFO".equals(l.getSeverity())).count());
            wrapper.put("success", logs.stream().filter(l -> "SUCCESS".equals(l.getSeverity())).count());
            wrapper.put("warning", logs.stream().filter(l -> "WARNING".equals(l.getSeverity())).count());
            wrapper.put("error",   logs.stream().filter(l -> "ERROR".equals(l.getSeverity())).count());
            wrapper.set("logs",    arr);

            sendJson(resp, HttpServletResponse.SC_OK, wrapper);
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER")) return;
        if (logService == null) logService = (LogService) getServletContext().getAttribute("logService");
        if (logService == null) { sendError(resp, 503, "LogService n\u00e3o inicializado."); return; }
        try {
            int deleted = logService.deleteAll();
            ObjectNode result = objectMapper.createObjectNode();
            result.put("deleted", deleted);
            result.put("message", "Logs limpos com sucesso.");
            LogService.info("SISTEMA", "Logs da base de dados limpos pelo gestor", getUsernameFromToken(req));
            sendJson(resp, HttpServletResponse.SC_OK, result);
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    private String getUsernameFromToken(HttpServletRequest req) {
        try {
            String auth = req.getHeader("Authorization");
            if (auth != null && auth.startsWith("Bearer ")) {
                com.oficina.sgo.security.JwtTokenProvider jwt =
                    (com.oficina.sgo.security.JwtTokenProvider) getServletContext().getAttribute("jwtTokenProvider");
                return jwt != null ? jwt.getUsernameFromToken(auth.substring(7)) : "Sistema";
            }
        } catch (Exception ignored) {}
        return "Sistema";
    }
}
