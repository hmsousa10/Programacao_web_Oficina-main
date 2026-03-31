package com.oficina.sgo.servlet;

import com.oficina.sgo.dto.request.LoginRequest;
import com.oficina.sgo.service.AuthService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet(name = "AuthServlet", urlPatterns = "/api/auth/*")
public class AuthServlet extends BaseApiServlet {

    private AuthService authService;

    @Override
    public void init() {
        authService = (AuthService) getServletContext().getAttribute("authService");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        if ("/login".equals(path)) {
            try {
                LoginRequest request = readBody(req, LoginRequest.class);
                sendJson(resp, HttpServletResponse.SC_OK, authService.login(request));
            } catch (Exception e) {
                handleException(resp, e);
            }
        } else {
            sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
        }
    }
}
