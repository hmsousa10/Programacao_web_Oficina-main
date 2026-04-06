package com.oficina.sgo.servlet;

import com.oficina.sgo.dto.request.CreateUserRequest;
import com.oficina.sgo.service.UserService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet(name = "UserServlet", urlPatterns = "/api/users/*")
public class UserServlet extends BaseApiServlet {

    private UserService userService;

    @Override
    public void init() {
        userService = (UserService) getServletContext().getAttribute("userService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER", "RECEPTION")) return;
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                // LER O PARÂMETRO DA URL
                String roleParam = req.getParameter("role");
                sendJson(resp, HttpServletResponse.SC_OK, userService.findAll(roleParam));
            } else {
                Long id = parseId(pathInfo);
                if (id == null) { sendError(resp, 400, "Invalid ID"); return; }
                sendJson(resp, HttpServletResponse.SC_OK, userService.findById(id));
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER")) return;
        try {
            CreateUserRequest request = readBody(req, CreateUserRequest.class);
            sendJson(resp, HttpServletResponse.SC_CREATED, userService.create(request));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER")) return;
        try {
            Long id = parseId(req.getPathInfo());
            if (id == null) { sendError(resp, 400, "Invalid ID"); return; }
            CreateUserRequest request = readBody(req, CreateUserRequest.class);
            sendJson(resp, HttpServletResponse.SC_OK, userService.update(id, request));
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
            userService.delete(id);
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}
