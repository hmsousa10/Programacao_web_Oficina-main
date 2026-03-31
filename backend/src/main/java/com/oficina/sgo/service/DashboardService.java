package com.oficina.sgo.service;

import com.oficina.sgo.dao.AgendamentoDao;
import com.oficina.sgo.dao.PecaDao;
import com.oficina.sgo.dao.ReparacaoDao;
import com.oficina.sgo.dto.response.DashboardResponse;
import com.oficina.sgo.model.Reparacao;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.List;

public class DashboardService {

    private static final int CAPACIDADE_OFICINA = 8;

    private final EntityManagerFactory emf;
    private final ReparacaoDao reparacaoDao;
    private final AgendamentoDao agendamentoDao;
    private final PecaDao pecaDao;

    public DashboardService(EntityManagerFactory emf) {
        this.emf = emf;
        this.reparacaoDao = new ReparacaoDao();
        this.agendamentoDao = new AgendamentoDao();
        this.pecaDao = new PecaDao();
    }

    public DashboardResponse getKpis() {
        try (EntityManager em = emf.createEntityManager()) {
            LocalDate today = LocalDate.now();
            LocalDateTime inicioHoje = today.atStartOfDay();
            LocalDateTime fimHoje = today.plusDays(1).atStartOfDay();

            LocalDate inicioSemanaDate = today.with(WeekFields.ISO.dayOfWeek(), 1);
            LocalDateTime inicioSemana = inicioSemanaDate.atStartOfDay();
            LocalDateTime fimSemana = inicioSemanaDate.plusDays(7).atStartOfDay();

            LocalDateTime inicioMes = today.withDayOfMonth(1).atStartOfDay();
            LocalDateTime fimMes = today.withDayOfMonth(1).plusMonths(1).atStartOfDay();

            List<Reparacao> concluidasHoje = reparacaoDao.findConcluidasNoPeriodo(em, inicioHoje, fimHoje);
            List<Reparacao> concluidasSemana = reparacaoDao.findConcluidasNoPeriodo(em, inicioSemana, fimSemana);
            List<Reparacao> concluidasMes = reparacaoDao.findConcluidasNoPeriodo(em, inicioMes, fimMes);

            BigDecimal faturacaoHoje = concluidasHoje.stream()
                    .map(r -> r.getValorTotal() != null ? r.getValorTotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal faturacaoSemana = concluidasSemana.stream()
                    .map(r -> r.getValorTotal() != null ? r.getValorTotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal faturacaoMes = concluidasMes.stream()
                    .map(r -> r.getValorTotal() != null ? r.getValorTotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long reparacoesEmCurso = reparacaoDao.countAtivas(em);
            long concluidasHojeCount = concluidasHoje.size();
            long marcacoesFuturas = agendamentoDao.countMarcacoesFuturas(em, LocalDateTime.now());
            long pecasStockBaixo = pecaDao.findPecasComStockBaixo(em).size();

            String ocupacaoAtual = reparacoesEmCurso + "/" + CAPACIDADE_OFICINA;

            return new DashboardResponse(faturacaoHoje, faturacaoSemana, faturacaoMes,
                    reparacoesEmCurso, concluidasHojeCount, ocupacaoAtual,
                    marcacoesFuturas, pecasStockBaixo);
        }
    }
}
