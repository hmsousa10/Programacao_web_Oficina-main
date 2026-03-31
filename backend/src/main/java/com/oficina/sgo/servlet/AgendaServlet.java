package com.oficina.sgo.servlet;

import com.oficina.sgo.dto.request.CreateAgendamentoRequest;
import com.oficina.sgo.service.AgendaService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;

@WebServlet(name = "AgendaServlet", urlPatterns = "/api/agenda/*")
public class AgendaServlet extends BaseApiServlet {

    private AgendaService agendaService;

    @Override
    public void init() {
        agendaService = (AgendaService) getServletContext().getAttribute("agendaService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION")) return;
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                String inicioStr = req.getParameter("inicio");
                String fimStr = req.getParameter("fim");
                LocalDateTime inicio = inicioStr != null ? LocalDateTime.parse(inicioStr) : null;
                LocalDateTime fim = fimStr != null ? LocalDateTime.parse(fimStr) : null;
                sendJson(resp, HttpServletResponse.SC_OK, agendaService.findAll(inicio, fim));
            } else if (pathInfo.startsWith("/semana/")) {
                String dataStr = pathInfo.substring("/semana/".length());
                LocalDate data = LocalDate.parse(dataStr);
                sendJson(resp, HttpServletResponse.SC_OK, agendaService.findBySemana(data));
            } else {
                Long id = parseId(pathInfo);
                if (id == null) { sendError(resp, 400, "Invalid ID"); return; }
                sendJson(resp, HttpServletResponse.SC_OK, agendaService.findById(id));
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION")) return;
        try {
            CreateAgendamentoRequest request = readBody(req, CreateAgendamentoRequest.class);
            sendJson(resp, HttpServletResponse.SC_CREATED, agendaService.create(request));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION")) return;
        try {
            Long id = parseId(req.getPathInfo());
            if (id == null) { sendError(resp, 400, "Invalid ID"); return; }
            CreateAgendamentoRequest request = readBody(req, CreateAgendamentoRequest.class);
            sendJson(resp, HttpServletResponse.SC_OK, agendaService.update(id, request));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION")) return;
        try {
            Long id = parseId(req.getPathInfo());
            if (id == null) { sendError(resp, 400, "Invalid ID"); return; }
            agendaService.delete(id);
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}
