package com.oficina.sgo.service;

import com.oficina.sgo.dao.AgendamentoDao;
import com.oficina.sgo.dao.ClienteDao;
import com.oficina.sgo.dao.UserDao;
import com.oficina.sgo.dao.ViaturaDao;
import com.oficina.sgo.dto.request.CreateAgendamentoRequest;
import com.oficina.sgo.dto.response.AgendamentoResponse;
import com.oficina.sgo.exception.CapacidadeAgendaException;
import com.oficina.sgo.exception.ResourceNotFoundException;
import com.oficina.sgo.model.Agendamento;
import com.oficina.sgo.model.Cliente;
import com.oficina.sgo.model.User;
import com.oficina.sgo.model.Viatura;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

public class AgendaService {

    private static final int MAX_AGENDAMENTOS_POR_SLOT = 3;

    private final EntityManagerFactory emf;
    private final AgendamentoDao agendamentoDao;
    private final ClienteDao clienteDao;
    private final ViaturaDao viaturaDao;
    private final UserDao userDao;

    public AgendaService(EntityManagerFactory emf) {
        this.emf = emf;
        this.agendamentoDao = new AgendamentoDao();
        this.clienteDao = new ClienteDao();
        this.viaturaDao = new ViaturaDao();
        this.userDao = new UserDao();
    }

    public List<AgendamentoResponse> findAll(LocalDateTime inicio, LocalDateTime fim) {
        try (EntityManager em = emf.createEntityManager()) {
            List<Agendamento> agendamentos;
            if (inicio != null && fim != null) {
                agendamentos = agendamentoDao.findByPeriod(em, inicio, fim);
            } else {
                agendamentos = agendamentoDao.findAll(em);
            }
            return agendamentos.stream().map(this::toResponse).collect(Collectors.toList());
        }
    }

    public AgendamentoResponse findById(Long id) {
        try (EntityManager em = emf.createEntityManager()) {
            return toResponse(agendamentoDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Agendamento", id)));
        }
    }

    public List<AgendamentoResponse> findBySemana(LocalDate data) {
        try (EntityManager em = emf.createEntityManager()) {
            LocalDateTime inicio = data.atStartOfDay();
            LocalDateTime fim = data.plusDays(7).atStartOfDay();
            return agendamentoDao.findBySemana(em, inicio, fim).stream()
                    .map(this::toResponse).collect(Collectors.toList());
        }
    }

    public AgendamentoResponse create(CreateAgendamentoRequest request) {
        return inTransaction(em -> {
            long count = agendamentoDao.countBySlot(em, request.dataHoraInicio(), request.dataHoraFim());
            if (count >= MAX_AGENDAMENTOS_POR_SLOT) {
                throw new CapacidadeAgendaException(
                        "Slot already has " + count + " agendamentos. Maximum is " + MAX_AGENDAMENTOS_POR_SLOT);
            }
            Cliente cliente = clienteDao.findById(em, request.clienteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", request.clienteId()));
            Viatura viatura = viaturaDao.findById(em, request.viaturaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Viatura", request.viaturaId()));
            User mecanico = null;
            if (request.mecanicoId() != null) {
                mecanico = userDao.findById(em, request.mecanicoId())
                        .orElseThrow(() -> new ResourceNotFoundException("User", request.mecanicoId()));
            }
            Agendamento agendamento = Agendamento.builder()
                    .dataHoraInicio(request.dataHoraInicio())
                    .dataHoraFim(request.dataHoraFim())
                    .cliente(cliente)
                    .viatura(viatura)
                    .mecanico(mecanico)
                    .tipoServico(request.tipoServico())
                    .observacoes(request.observacoes())
                    .estado(Agendamento.EstadoAgendamento.PENDENTE)
                    .build();
            AgendamentoResponse res = toResponse(agendamentoDao.save(em, agendamento));
            LogService.success("AGENDA",
                "Novo agendamento criado: " + cliente.getNome() + 
                " | " + request.dataHoraInicio(), null);
            return res;
        });
    }

    public AgendamentoResponse update(Long id, CreateAgendamentoRequest request) {
        return inTransaction(em -> {
            Agendamento agendamento = agendamentoDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Agendamento", id));
            boolean slotChanged = !agendamento.getDataHoraInicio().equals(request.dataHoraInicio())
                    || !agendamento.getDataHoraFim().equals(request.dataHoraFim());
            if (slotChanged) {
                long count = agendamentoDao.countBySlotExcluding(em, request.dataHoraInicio(), request.dataHoraFim(), id);
                if (count >= MAX_AGENDAMENTOS_POR_SLOT) {
                    throw new CapacidadeAgendaException(
                            "Slot already has " + count + " agendamentos. Maximum is " + MAX_AGENDAMENTOS_POR_SLOT);
                }
            }
            Cliente cliente = clienteDao.findById(em, request.clienteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", request.clienteId()));
            Viatura viatura = viaturaDao.findById(em, request.viaturaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Viatura", request.viaturaId()));
            User mecanico = null;
            if (request.mecanicoId() != null) {
                mecanico = userDao.findById(em, request.mecanicoId())
                        .orElseThrow(() -> new ResourceNotFoundException("User", request.mecanicoId()));
            }
            agendamento.setDataHoraInicio(request.dataHoraInicio());
            agendamento.setDataHoraFim(request.dataHoraFim());
            agendamento.setCliente(cliente);
            agendamento.setViatura(viatura);
            agendamento.setMecanico(mecanico);
            agendamento.setTipoServico(request.tipoServico());
            agendamento.setObservacoes(request.observacoes());
            return toResponse(agendamentoDao.save(em, agendamento));
        });
    }

    public void delete(Long id) {
        inTransaction(em -> {
            Agendamento agendamento = agendamentoDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Agendamento", id));
            agendamento.setEstado(Agendamento.EstadoAgendamento.CANCELADO);
            agendamentoDao.save(em, agendamento);
            LogService.warning("AGENDA",
                "Agendamento #" + id + " cancelado", null);
            return null;
        });
    }

    private AgendamentoResponse toResponse(Agendamento a) {
        return new AgendamentoResponse(
                a.getId(), a.getDataHoraInicio(), a.getDataHoraFim(),
                a.getCliente().getId(), a.getCliente().getNome(),
                a.getViatura().getId(), a.getViatura().getMatricula(),
                a.getMecanico() != null ? a.getMecanico().getId() : null,
                a.getMecanico() != null ? a.getMecanico().getName() : null,
                a.getTipoServico(), a.getEstado().name(), a.getObservacoes()
        );
    }

    private <T> T inTransaction(Function<EntityManager, T> action) {
        EntityManager em = emf.createEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            T result = action.apply(em);
            tx.commit();
            return result;
        } catch (RuntimeException e) {
            if (tx.isActive()) tx.rollback();
            throw e;
        } finally {
            em.close();
        }
    }
}
