package com.oficina.sgo.servlet;

import com.oficina.sgo.service.DashboardService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet(name = "DashboardServlet", urlPatterns = "/api/dashboard/*")
public class DashboardServlet extends BaseApiServlet {

    private DashboardService dashboardService;

    @Override
    public void init() {
        dashboardService = (DashboardService) getServletContext().getAttribute("dashboardService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireRole(req, resp, "MANAGER")) return;
        try {
            String pathInfo = req.getPathInfo();
            if ("/kpis".equals(pathInfo)) {
                sendJson(resp, HttpServletResponse.SC_OK, dashboardService.getKpis());
            } else {
                sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}
