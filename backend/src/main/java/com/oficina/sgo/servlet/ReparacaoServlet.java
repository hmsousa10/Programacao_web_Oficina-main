package com.oficina.sgo.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.oficina.sgo.dto.request.CreateOperacaoRequest;
import com.oficina.sgo.dto.request.CreateReparacaoRequest;
import com.oficina.sgo.service.ReparacaoService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet(name = "ReparacaoServlet", urlPatterns = "/api/reparacoes/*")
public class ReparacaoServlet extends BaseApiServlet {

    private ReparacaoService reparacaoService;

    @Override
    public void init() {
        reparacaoService = (ReparacaoService) getServletContext().getAttribute("reparacaoService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION", "MECHANIC")) return;
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                sendJson(resp, HttpServletResponse.SC_OK, reparacaoService.findAll());
            } else if (pathInfo.startsWith("/mecanico/")) {
                Long mecId = Long.parseLong(pathInfo.substring("/mecanico/".length()));
                sendJson(resp, HttpServletResponse.SC_OK, reparacaoService.findByMecanico(mecId));
            } else {
                Long id = parseId(pathInfo);
                if (id == null) { sendError(resp, 400, "Invalid ID"); return; }
                sendJson(resp, HttpServletResponse.SC_OK, reparacaoService.findById(id));
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION", "MECHANIC")) return;
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo != null && pathInfo.matches("/\\d+/operacoes")) {
                Long reparacaoId = parseId(pathInfo);
                CreateOperacaoRequest request = readBody(req, CreateOperacaoRequest.class);
                sendJson(resp, HttpServletResponse.SC_CREATED, reparacaoService.addOperacao(reparacaoId, request));
            } else {
                CreateReparacaoRequest request = readBody(req, CreateReparacaoRequest.class);
                sendJson(resp, HttpServletResponse.SC_CREATED, reparacaoService.create(request));
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION", "MECHANIC")) return;
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo != null && pathInfo.matches("/\\d+/estado")) {
                Long id = parseId(pathInfo);
                JsonNode body = objectMapper.readTree(req.getInputStream());
                String estado = body.get("estado").asText();
                sendJson(resp, HttpServletResponse.SC_OK, reparacaoService.updateEstado(id, estado));
            } else if (pathInfo != null && pathInfo.matches("/\\d+/operacoes/\\d+")) {
                String[] parts = pathInfo.replaceFirst("^/", "").split("/");
                Long reparacaoId = Long.parseLong(parts[0]);
                Long opId = Long.parseLong(parts[2]);
                CreateOperacaoRequest request = readBody(req, CreateOperacaoRequest.class);
                sendJson(resp, HttpServletResponse.SC_OK, reparacaoService.updateOperacao(reparacaoId, opId, request));
            } else if (pathInfo != null && pathInfo.matches("/\\d+")) {
                // ROTA ADICIONADA: Atualizar (Editar) Reparação Geral
                Long id = parseId(pathInfo);
                CreateReparacaoRequest request = readBody(req, CreateReparacaoRequest.class);
                sendJson(resp, HttpServletResponse.SC_OK, reparacaoService.update(id, request));
            } else {
                sendError(resp, 404, "Endpoint not found");
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // ROTA ADICIONADA: Apenas Manager e Recepção devem poder apagar reparações inteiras
        if (!requireRole(req, resp, "MANAGER", "RECEPTION")) return;
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo != null && pathInfo.matches("/\\d+")) {
                Long id = parseId(pathInfo);
                reparacaoService.delete(id);
                resp.setStatus(HttpServletResponse.SC_NO_CONTENT); // 204 Sucesso sem conteúdo
            } else {
                sendError(resp, 404, "Endpoint not found");
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}