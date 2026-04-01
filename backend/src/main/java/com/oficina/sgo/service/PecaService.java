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
    private final MovimentoStockDao movimentoDao;
    private final ReparacaoDao reparacaoDao;

    public PecaService(EntityManagerFactory emf) {
        this.emf = emf;
        this.pecaDao = new PecaDao();
        this.movimentoDao = new MovimentoStockDao();
        this.reparacaoDao = new ReparacaoDao();
    }

    public List<PecaResponse> findAll() {
        try (EntityManager em = emf.createEntityManager()) {
            return pecaDao.findAll(em).stream().map(this::toResponse).collect(Collectors.toList());
        }
    }

    public List<PecaResponse> findAlertasStock() {
        try (EntityManager em = emf.createEntityManager()) {
            return pecaDao.findAll(em).stream()
                    .filter(p -> p.getQuantidadeStock() != null && p.getStockMinimo() != null && p.getQuantidadeStock() <= p.getStockMinimo())
                    .map(this::toResponse).collect(Collectors.toList());
        }
    }

    public PecaResponse findById(Long id) {
        try (EntityManager em = emf.createEntityManager()) {
            return toResponse(pecaDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Peca", id)));
        }
    }

    public PecaResponse create(CreatePecaRequest request) {
        return inTransaction(em -> {
            Peca peca = Peca.builder()
                    .referencia(request.referencia())
                    .designacao(request.designacao())
                    .quantidadeStock(request.quantidadeStock() != null ? request.quantidadeStock() : 0)
                    .stockMinimo(request.stockMinimo() != null ? request.stockMinimo() : 5)
                    .precoUnitario(request.precoUnitario())
                    .categoria(request.categoria()) // NOVO
                    .fornecedor(request.fornecedor()) // NOVO
                    .build();
            return toResponse(pecaDao.save(em, peca));
        });
    }

    public PecaResponse update(Long id, CreatePecaRequest request) {
        return inTransaction(em -> {
            Peca peca = pecaDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Peca", id));
            
            if (request.referencia() != null) peca.setReferencia(request.referencia());
            if (request.designacao() != null) peca.setDesignacao(request.designacao());
            if (request.stockMinimo() != null) peca.setStockMinimo(request.stockMinimo());
            if (request.precoUnitario() != null) peca.setPrecoUnitario(request.precoUnitario());
            if (request.categoria() != null) peca.setCategoria(request.categoria()); // NOVO
            if (request.fornecedor() != null) peca.setFornecedor(request.fornecedor()); // NOVO
            
            return toResponse(pecaDao.save(em, peca));
        });
    }

    public Void delete(Long id) {
        return inTransaction(em -> {
            Peca peca = pecaDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Peca", id));
            em.remove(peca);
            return null;
        });
    }

    public PecaResponse entradaStock(Long id, StockMovimentoRequest request) {
        return inTransaction(em -> {
            Peca peca = pecaDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Peca", id));
            
            peca.setQuantidadeStock(peca.getQuantidadeStock() + request.quantidade());
            
            MovimentoStock mov = MovimentoStock.builder()
                    .peca(peca)
                    .tipoMovimento(MovimentoStock.TipoMovimento.ENTRADA)
                    .quantidade(request.quantidade())
                    .dataMovimento(LocalDateTime.now())
                    .observacoes(request.observacoes())
                    .build();
            movimentoDao.save(em, mov);
            return toResponse(pecaDao.save(em, peca));
        });
    }

    public PecaResponse saidaStock(Long id, StockMovimentoRequest request) {
        return inTransaction(em -> {
            Peca peca = pecaDao.findById(em, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Peca", id));
            
            if (peca.getQuantidadeStock() < request.quantidade()) {
                throw new BusinessException("Stock insuficiente");
            }
            peca.setQuantidadeStock(peca.getQuantidadeStock() - request.quantidade());
            
            MovimentoStock mov = MovimentoStock.builder()
                    .peca(peca)
                    .tipoMovimento(MovimentoStock.TipoMovimento.SAIDA)
                    .quantidade(-request.quantidade())
                    .dataMovimento(LocalDateTime.now())
                    .observacoes(request.observacoes())
                    .build();
            movimentoDao.save(em, mov);
            return toResponse(pecaDao.save(em, peca));
        });
    }

    public PecaResponse requisitarPeca(RequisitarPecaRequest request) {
        return inTransaction(em -> {
            Peca peca = pecaDao.findById(em, request.pecaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Peca", request.pecaId()));

            if (peca.getQuantidadeStock() < request.quantidade()) {
                throw new BusinessException("Stock insuficiente para a peça " + peca.getDesignacao());
            }

            peca.setQuantidadeStock(peca.getQuantidadeStock() - request.quantidade());

            Reparacao reparacao = null;
            if (request.reparacaoId() != null) {
                reparacao = em.find(Reparacao.class, request.reparacaoId());
            }

            MovimentoStock movimento = MovimentoStock.builder()
                    .peca(peca)
                    .tipoMovimento(MovimentoStock.TipoMovimento.SAIDA)
                    .quantidade(-request.quantidade())
                    .dataMovimento(LocalDateTime.now())
                    .observacoes(request.observacoes())
                    .reparacao(reparacao)
                    .build();

            movimentoDao.save(em, movimento);
            return toResponse(pecaDao.save(em, peca));
        });
    }

    private PecaResponse toResponse(Peca p) {
        boolean isStockBaixo = p.getQuantidadeStock() != null && p.getStockMinimo() != null 
                               && p.getQuantidadeStock() <= p.getStockMinimo();

        // NOVO: Vai buscar o Histórico todo de movimentos e envia para o ecrã!
        List<PecaResponse.Movimento> movs = p.getMovimentos() != null ? 
            p.getMovimentos().stream()
            .map(m -> new PecaResponse.Movimento(
                m.getId(), 
                m.getTipoMovimento().name(), 
                m.getQuantidade(), 
                m.getDataMovimento(), 
                m.getObservacoes()
            )).collect(Collectors.toList()) : List.of();

        return new PecaResponse(
                p.getId(), p.getReferencia(), p.getDesignacao(),
                p.getQuantidadeStock(), p.getStockMinimo(), p.getPrecoUnitario(),
                p.getCategoria(), p.getFornecedor(), isStockBaixo, movs
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