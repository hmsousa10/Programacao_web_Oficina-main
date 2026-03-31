package com.oficina.sgo.servlet;

import com.oficina.sgo.dto.request.CreatePecaRequest;
import com.oficina.sgo.dto.request.RequisitarPecaRequest;
import com.oficina.sgo.dto.request.StockMovimentoRequest;
import com.oficina.sgo.service.PecaService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet(name = "PecaServlet", urlPatterns = "/api/pecas/*")
public class PecaServlet extends BaseApiServlet {

    private PecaService pecaService;

    @Override
    public void init() {
        pecaService = (PecaService) getServletContext().getAttribute("pecaService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION", "MECHANIC")) return;
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                sendJson(resp, HttpServletResponse.SC_OK, pecaService.findAll());
            } else if ("/alertas-stock".equals(pathInfo)) {
                sendJson(resp, HttpServletResponse.SC_OK, pecaService.findAlertasStock());
            } else {
                Long id = parseId(pathInfo);
                if (id == null) { sendError(resp, 400, "Invalid ID"); return; }
                sendJson(resp, HttpServletResponse.SC_OK, pecaService.findById(id));
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
            if (pathInfo == null || pathInfo.equals("/")) {
                if (!requireRole(req, resp, "MANAGER", "RECEPTION")) return;
                CreatePecaRequest request = readBody(req, CreatePecaRequest.class);
                sendJson(resp, HttpServletResponse.SC_CREATED, pecaService.create(request));
            } else if (pathInfo.matches("/\\d+/entrada-stock")) {
                Long id = parseId(pathInfo);
                StockMovimentoRequest request = readBody(req, StockMovimentoRequest.class);
                sendJson(resp, HttpServletResponse.SC_OK, pecaService.entradaStock(id, request));
            } else if (pathInfo.matches("/\\d+/saida-stock")) {
                Long id = parseId(pathInfo);
                StockMovimentoRequest request = readBody(req, StockMovimentoRequest.class);
                sendJson(resp, HttpServletResponse.SC_OK, pecaService.saidaStock(id, request));
            } else if (pathInfo.matches("/\\d+/requisitar")) {
                RequisitarPecaRequest request = readBody(req, RequisitarPecaRequest.class);
                sendJson(resp, HttpServletResponse.SC_OK, pecaService.requisitarPeca(request));
            } else {
                sendError(resp, 404, "Endpoint not found");
            }
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
            CreatePecaRequest request = readBody(req, CreatePecaRequest.class);
            sendJson(resp, HttpServletResponse.SC_OK, pecaService.update(id, request));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER")) return;
        try {
            Long id = parseId(req.getPathInfo());
            if (id == null) { sendError(resp, 400, "Invalid ID"); return; }
            pecaService.delete(id);
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}
