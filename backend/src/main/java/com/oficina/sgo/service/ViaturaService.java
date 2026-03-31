package com.oficina.sgo.service;

import com.oficina.sgo.dao.ClienteDao;
import com.oficina.sgo.dao.ViaturaDao;
import com.oficina.sgo.dto.request.CreateViaturaRequest;
import com.oficina.sgo.dto.response.ViaturaResponse;
import com.oficina.sgo.exception.BusinessException;
import com.oficina.sgo.exception.ResourceNotFoundException;
import com.oficina.sgo.model.Cliente;
import com.oficina.sgo.model.Viatura;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

public class ViaturaService {

    private final EntityManagerFactory emf;
    private final ViaturaDao viaturaDao;
    private final ClienteDao clienteDao;

    public ViaturaService(EntityManagerFactory emf) {
        this.emf = emf;
        this.viaturaDao = new ViaturaDao();
        this.clienteDao = new ClienteDao();
    }

    public List<ViaturaResponse> findAll() {
        try (EntityManager em = emf.createEntityManager()) {
            return viaturaDao.findAll(em).stream().map(this::toResponse).collect(Collectors.toList());
        }
    }

    public ViaturaResponse findById(Long id) {
        try (EntityManager em = emf.createEntityManager()) {
            return toResponse(viaturaDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Viatura", id)));
        }
    }

    public ViaturaResponse findByMatricula(String matricula) {
        try (EntityManager em = emf.createEntityManager()) {
            return toResponse(viaturaDao.findByMatricula(em, matricula)
                    .orElseThrow(() -> new ResourceNotFoundException("Viatura not found with matricula: " + matricula)));
        }
    }

    public ViaturaResponse create(CreateViaturaRequest request) {
        return inTransaction(em -> {
            if (viaturaDao.existsByMatricula(em, request.matricula())) {
                throw new BusinessException("Matricula already exists: " + request.matricula());
            }
            Cliente cliente = clienteDao.findById(em, request.clienteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", request.clienteId()));
            Viatura viatura = Viatura.builder()
                    .matricula(request.matricula())
                    .marca(request.marca())
                    .modelo(request.modelo())
                    .ano(request.ano())
                    .numeroChassis(request.numeroChassis())
                    .combustivel(request.combustivel())
                    .cor(request.cor())
                    .quilometragem(request.quilometragem())
                    .observacoes(request.observacoes())
                    .cliente(cliente)
                    .build();
            return toResponse(viaturaDao.save(em, viatura));
        });
    }

    public ViaturaResponse update(Long id, CreateViaturaRequest request) {
        return inTransaction(em -> {
            Viatura viatura = viaturaDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Viatura", id));
            if (!viatura.getMatricula().equals(request.matricula()) && viaturaDao.existsByMatricula(em, request.matricula())) {
                throw new BusinessException("Matricula already exists: " + request.matricula());
            }
            Cliente cliente = clienteDao.findById(em, request.clienteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", request.clienteId()));
            viatura.setMatricula(request.matricula());
            viatura.setMarca(request.marca());
            viatura.setModelo(request.modelo());
            viatura.setAno(request.ano());
            viatura.setNumeroChassis(request.numeroChassis());
            viatura.setCombustivel(request.combustivel());
            viatura.setCor(request.cor());
            viatura.setQuilometragem(request.quilometragem());
            viatura.setObservacoes(request.observacoes());
            viatura.setCliente(cliente);
            return toResponse(viaturaDao.save(em, viatura));
        });
    }

    public void delete(Long id) {
        inTransaction(em -> {
            Viatura viatura = viaturaDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Viatura", id));
            viaturaDao.delete(em, viatura);
            return null;
        });
    }

    private ViaturaResponse toResponse(Viatura v) {
        return new ViaturaResponse(v.getId(), v.getMatricula(), v.getMarca(), v.getModelo(),
                v.getAno(), v.getNumeroChassis(), v.getCombustivel(), v.getCor(),
                v.getQuilometragem(), v.getObservacoes(), v.getCliente().getId(), v.getCliente().getNome()); 
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
