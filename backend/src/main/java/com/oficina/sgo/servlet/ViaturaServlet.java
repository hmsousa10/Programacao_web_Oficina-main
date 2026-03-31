package com.oficina.sgo.servlet;

import com.oficina.sgo.dto.request.CreateViaturaRequest;
import com.oficina.sgo.service.ViaturaService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet(name = "ViaturaServlet", urlPatterns = "/api/viaturas/*")
public class ViaturaServlet extends BaseApiServlet {

    private ViaturaService viaturaService;

    @Override
    public void init() {
        viaturaService = (ViaturaService) getServletContext().getAttribute("viaturaService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION")) return;
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                sendJson(resp, HttpServletResponse.SC_OK, viaturaService.findAll());
            } else if (pathInfo.startsWith("/matricula/")) {
                String matricula = pathInfo.substring("/matricula/".length());
                sendJson(resp, HttpServletResponse.SC_OK, viaturaService.findByMatricula(matricula));
            } else {
                Long id = parseId(pathInfo);
                if (id == null) { sendError(resp, 400, "Invalid ID"); return; }
                sendJson(resp, HttpServletResponse.SC_OK, viaturaService.findById(id));
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION")) return;
        try {
            CreateViaturaRequest request = readBody(req, CreateViaturaRequest.class);
            sendJson(resp, HttpServletResponse.SC_CREATED, viaturaService.create(request));
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
            CreateViaturaRequest request = readBody(req, CreateViaturaRequest.class);
            sendJson(resp, HttpServletResponse.SC_OK, viaturaService.update(id, request));
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
            viaturaService.delete(id);
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}
