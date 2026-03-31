package com.oficina.sgo.servlet;

import com.oficina.sgo.dto.request.CreateClienteRequest;
import com.oficina.sgo.service.ClienteService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet(name = "ClienteServlet", urlPatterns = "/api/clientes/*")
public class ClienteServlet extends BaseApiServlet {

    private ClienteService clienteService;

    @Override
    public void init() {
        clienteService = (ClienteService) getServletContext().getAttribute("clienteService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION")) return;
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                sendJson(resp, HttpServletResponse.SC_OK, clienteService.findAll());
            } else if (pathInfo.matches("/\\d+/viaturas")) {
                Long id = parseId(pathInfo);
                sendJson(resp, HttpServletResponse.SC_OK, clienteService.findViaturasByCliente(id));
            } else {
                Long id = parseId(pathInfo);
                if (id == null) { sendError(resp, 400, "Invalid ID"); return; }
                sendJson(resp, HttpServletResponse.SC_OK, clienteService.findById(id));
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION")) return;
        try {
            CreateClienteRequest request = readBody(req, CreateClienteRequest.class);
            sendJson(resp, HttpServletResponse.SC_CREATED, clienteService.create(request));
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
            CreateClienteRequest request = readBody(req, CreateClienteRequest.class);
            sendJson(resp, HttpServletResponse.SC_OK, clienteService.update(id, request));
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
            clienteService.delete(id);
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}
