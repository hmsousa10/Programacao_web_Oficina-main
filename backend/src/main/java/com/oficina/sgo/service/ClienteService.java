package com.oficina.sgo.service;

import com.oficina.sgo.dao.ClienteDao;
import com.oficina.sgo.dao.ViaturaDao;
import com.oficina.sgo.dto.request.CreateClienteRequest;
import com.oficina.sgo.dto.response.ClienteResponse;
import com.oficina.sgo.dto.response.ViaturaResponse;
import com.oficina.sgo.exception.BusinessException;
import com.oficina.sgo.exception.ResourceNotFoundException;
import com.oficina.sgo.model.Cliente;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

public class ClienteService {

    private final EntityManagerFactory emf;
    private final ClienteDao clienteDao;
    private final ViaturaDao viaturaDao;

    public ClienteService(EntityManagerFactory emf) {
        this.emf = emf;
        this.clienteDao = new ClienteDao();
        this.viaturaDao = new ViaturaDao();
    }

    public List<ClienteResponse> findAll() {
        try (EntityManager em = emf.createEntityManager()) {
            return clienteDao.findAll(em).stream().map(this::toResponse).collect(Collectors.toList());
        }
    }

    public ClienteResponse findById(Long id) {
        try (EntityManager em = emf.createEntityManager()) {
            return toResponse(clienteDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", id)));
        }
    }

    public List<ViaturaResponse> findViaturasByCliente(Long clienteId) {
        try (EntityManager em = emf.createEntityManager()) {
            clienteDao.findById(em, clienteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", clienteId));
            return viaturaDao.findByClienteId(em, clienteId).stream()
                    .map(v -> new ViaturaResponse(
                            v.getId(), 
                            v.getMatricula(), 
                            v.getMarca(), 
                            v.getModelo(),
                            v.getAno(), 
                            v.getNumeroChassis(), 
                            v.getCombustivel(), 
                            v.getCor(),
                            v.getQuilometragem(), 
                            v.getObservacoes(), // <-- AQUI ESTÁ A CORREÇÃO!
                            v.getCliente().getId(), 
                            v.getCliente().getNome()
                    ))
                    .collect(Collectors.toList());
        }
    }

    public ClienteResponse create(CreateClienteRequest request) {
        return inTransaction(em -> {
            if (request.nif() != null && !request.nif().isBlank() && clienteDao.existsByNif(em, request.nif())) {
                throw new BusinessException("NIF already exists: " + request.nif());
            }
            Cliente cliente = Cliente.builder()
                    .nome(request.nome())
                    .nif(request.nif())
                    .telefone(request.telefone())
                    .email(request.email())
                    .morada(request.morada())
                    .observacoes(request.observacoes())
                    .build();
            return toResponse(clienteDao.save(em, cliente));
        });
    }

    public ClienteResponse update(Long id, CreateClienteRequest request) {
        return inTransaction(em -> {
            Cliente cliente = clienteDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));
            if (request.nif() != null && !request.nif().equals(cliente.getNif()) && clienteDao.existsByNif(em, request.nif())) {
                throw new BusinessException("NIF already exists: " + request.nif());
            }
            cliente.setNome(request.nome());
            cliente.setNif(request.nif());
            cliente.setTelefone(request.telefone());
            cliente.setEmail(request.email());
            cliente.setMorada(request.morada());
            cliente.setObservacoes(request.observacoes());
            return toResponse(clienteDao.save(em, cliente));
        });
    }

    public void delete(Long id) {
        inTransaction(em -> {
            Cliente cliente = clienteDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));
            clienteDao.delete(em, cliente);
            return null;
        });
    }

    private ClienteResponse toResponse(Cliente c) {
        return new ClienteResponse(c.getId(), c.getNome(), c.getNif(), c.getTelefone(),
                c.getEmail(), c.getMorada(), c.getObservacoes(),
                c.getViaturas() != null ? c.getViaturas().size() : 0);
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