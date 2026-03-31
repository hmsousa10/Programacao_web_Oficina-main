package com.oficina.sgo.service;

import com.oficina.sgo.dao.MovimentoStockDao;
import com.oficina.sgo.dao.PecaDao;
import com.oficina.sgo.dao.ReparacaoDao;
import com.oficina.sgo.dto.request.CreatePecaRequest;
import com.oficina.sgo.dto.request.RequisitarPecaRequest;
import com.oficina.sgo.dto.request.StockMovimentoRequest;
import com.oficina.sgo.dto.response.PecaResponse;
import com.oficina.sgo.exception.BusinessException;
import com.oficina.sgo.exception.ResourceNotFoundException;
import com.oficina.sgo.model.MovimentoStock;
import com.oficina.sgo.model.Peca;
import com.oficina.sgo.model.Reparacao;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;

import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

public class PecaService {

    private final EntityManagerFactory emf;
    private final PecaDao pecaDao;
    private final MovimentoStockDao movimentoStockDao;
    private final ReparacaoDao reparacaoDao;

    public PecaService(EntityManagerFactory emf) {
        this.emf = emf;
        this.pecaDao = new PecaDao();
        this.movimentoStockDao = new MovimentoStockDao();
        this.reparacaoDao = new ReparacaoDao();
    }

    public List<PecaResponse> findAll() {
        try (EntityManager em = emf.createEntityManager()) {
            return pecaDao.findAll(em).stream().map(this::toResponse).collect(Collectors.toList());
        }
    }

    public PecaResponse findById(Long id) {
        try (EntityManager em = emf.createEntityManager()) {
            return toResponse(pecaDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Peca", id)));
        }
    }

    public List<PecaResponse> findAlertasStock() {
        try (EntityManager em = emf.createEntityManager()) {
            return pecaDao.findPecasComStockBaixo(em).stream().map(this::toResponse).collect(Collectors.toList());
        }
    }

    public PecaResponse create(CreatePecaRequest request) {
        return inTransaction(em -> {
            if (pecaDao.existsByReferencia(em, request.referencia())) {
                throw new BusinessException("Referencia already exists: " + request.referencia());
            }
            Peca peca = Peca.builder()
                    .referencia(request.referencia())
                    .designacao(request.designacao())
                    .precoUnitario(request.precoUnitario())
                    .quantidadeStock(request.quantidadeStock() != null ? request.quantidadeStock() : 0)
                    .stockMinimo(request.stockMinimo() != null ? request.stockMinimo() : 0)
                    .categoria(request.categoria())
                    .fornecedor(request.fornecedor())
                    .build();
            return toResponse(pecaDao.save(em, peca));
        });
    }

    public PecaResponse update(Long id, CreatePecaRequest request) {
        return inTransaction(em -> {
            Peca peca = pecaDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Peca", id));
            if (!peca.getReferencia().equals(request.referencia()) && pecaDao.existsByReferencia(em, request.referencia())) {
                throw new BusinessException("Referencia already exists: " + request.referencia());
            }
            peca.setReferencia(request.referencia());
            peca.setDesignacao(request.designacao());
            peca.setPrecoUnitario(request.precoUnitario());
            if (request.stockMinimo() != null) peca.setStockMinimo(request.stockMinimo());
            if (request.categoria() != null) peca.setCategoria(request.categoria());
            if (request.fornecedor() != null) peca.setFornecedor(request.fornecedor());
            return toResponse(pecaDao.save(em, peca));
        });
    }

    public void delete(Long id) {
        inTransaction(em -> {
            Peca peca = pecaDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Peca", id));
            pecaDao.delete(em, peca);
            return null;
        });
    }

    public PecaResponse entradaStock(Long id, StockMovimentoRequest request) {
        return inTransaction(em -> {
            Peca peca = pecaDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Peca", id));
            peca.setQuantidadeStock(peca.getQuantidadeStock() + request.quantidade());
            MovimentoStock movimento = MovimentoStock.builder()
                    .peca(peca)
                    .tipoMovimento(MovimentoStock.TipoMovimento.ENTRADA)
                    .quantidade(request.quantidade())
                    .dataMovimento(LocalDateTime.now())
                    .observacoes(request.observacoes())
                    .build();
            movimentoStockDao.save(em, movimento);
            return toResponse(pecaDao.save(em, peca));
        });
    }

    public PecaResponse saidaStock(Long id, StockMovimentoRequest request) {
        return inTransaction(em -> {
            Peca peca = pecaDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Peca", id));
            if (peca.getQuantidadeStock() < request.quantidade()) {
                throw new BusinessException("Insufficient stock. Available: " + peca.getQuantidadeStock());
            }
            peca.setQuantidadeStock(peca.getQuantidadeStock() - request.quantidade());
            MovimentoStock movimento = MovimentoStock.builder()
                    .peca(peca)
                    .tipoMovimento(MovimentoStock.TipoMovimento.SAIDA)
                    .quantidade(request.quantidade())
                    .dataMovimento(LocalDateTime.now())
                    .observacoes(request.observacoes())
                    .build();
            movimentoStockDao.save(em, movimento);
            return toResponse(pecaDao.save(em, peca));
        });
    }

    public PecaResponse requisitarPeca(RequisitarPecaRequest request) {
        return inTransaction(em -> {
            Peca peca = pecaDao.findById(em, request.pecaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Peca", request.pecaId()));
            if (peca.getQuantidadeStock() < request.quantidade()) {
                throw new BusinessException("Insufficient stock. Available: " + peca.getQuantidadeStock());
            }
            Reparacao reparacao = reparacaoDao.findById(em, request.reparacaoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reparacao", request.reparacaoId()));
            peca.setQuantidadeStock(peca.getQuantidadeStock() - request.quantidade());
            MovimentoStock movimento = MovimentoStock.builder()
                    .peca(peca)
                    .tipoMovimento(MovimentoStock.TipoMovimento.REQUISICAO_REPARACAO)
                    .quantidade(request.quantidade())
                    .dataMovimento(LocalDateTime.now())
                    .reparacao(reparacao)
                    .observacoes(request.observacoes())
                    .build();
            movimentoStockDao.save(em, movimento);
            return toResponse(pecaDao.save(em, peca));
        });
    }

    private PecaResponse toResponse(Peca p) {
        return new PecaResponse(p.getId(), p.getReferencia(), p.getDesignacao(),
                p.getQuantidadeStock(), p.getStockMinimo(), p.getPrecoUnitario(),
                p.getCategoria(), p.getFornecedor(),
                p.getQuantidadeStock() <= p.getStockMinimo());
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
