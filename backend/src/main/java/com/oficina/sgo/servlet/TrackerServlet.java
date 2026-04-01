package com.oficina.sgo.servlet;

import com.oficina.sgo.service.ReparacaoService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

// Rota dedicada e pública para os clientes
@WebServlet(name = "TrackerServlet", urlPatterns = "/api/tracker/*")
public class TrackerServlet extends BaseApiServlet {

    private ReparacaoService reparacaoService;

    @Override
    public void init() {
        reparacaoService = (ReparacaoService) getServletContext().getAttribute("reparacaoService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            String pathInfo = req.getPathInfo();
            Long id = parseId(pathInfo);
            
            if (id == null) {
                sendError(resp, 400, "Link inválido ou quebrado.");
                return;
            }
            
            // Vai buscar os dados e envia (sem exigir permissões de Manager ou Mecânico)
            sendJson(resp, HttpServletResponse.SC_OK, reparacaoService.findById(id));
            
        } catch (Exception e) {
            sendError(resp, 404, "Reparação não encontrada no sistema.");
        }
    }
}