// status.js - Portal do Cliente
const API_BASE = 'http://localhost:8080/sgo/api';

document.addEventListener('DOMContentLoaded', () => {
    // Tenta ler o ID da reparação pelo link (ex: status.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) {
        document.getElementById('app').innerHTML = `
            <div style="text-align:center; margin-top:50px;">
                <h1 style="color:#ef4444; font-size:40px; margin:0;">⚠️</h1>
                <h2 style="color:white;">Link Inválido</h2>
                <p style="color:#94a3b8;">Por favor, leia novamente o QR Code da sua folha de obra.</p>
            </div>
        `;
        return;
    }

    // Carrega os dados na hora
    fetchData(id);

    // Auto-atualiza os dados a cada 30 segundos para magia em tempo real!
    setInterval(() => fetchData(id), 30000);
});

async function fetchData(id) {
    try {
        const response = await fetch(`${API_BASE}/tracker/${id}`);
        
        if (!response.ok) {
            // Se o servidor devolver um erro (ex: 401 ou 404), capturamos aqui!
            const errorMsg = await response.text();
            throw new Error(`Erro ${response.status}: O servidor recusou o acesso ou não encontrou a reparação.`);
        }
        
        const data = await response.json();
        renderTracker(data);
    } catch (error) {
        console.error("ERRO DETALHADO:", error);
        document.getElementById('app').innerHTML = `
            <div style="text-align:center; margin-top:50px;">
                <h1 style="color:#ef4444; font-size:40px; margin:0;">🚫</h1>
                <h2 style="color:white;">Erro de Ligação</h2>
                <p style="color:#94a3b8;">${error.message}</p>
                <p style="color:#64748b; font-size:12px; margin-top:20px;">(Dica: Confirme se recompilou o Java e reiniciou o Tomcat)</p>
            </div>
        `;
    }
}

function renderTracker(r) {
    const app = document.getElementById('app');
    
    // Determinar Classes da Timeline
    const isPendente = r.estado === 'PENDENTE';
    const isPecas = r.estado === 'AGUARDA_PECAS';
    const isExecucao = r.estado === 'EM_EXECUCAO';
    const isPronto = r.estado === 'CONCLUIDA';

    // Formatar Moeda
    const valorStr = r.valorTotal ? r.valorTotal.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) : '0,00 €';

    // Gerar Lista de Operações
    let opsHtml = '';
    if (r.operacoes && r.operacoes.length > 0) {
        opsHtml = r.operacoes.map(op => {
            const isDone = op.estado === 'CONCLUIDA';
            return `
                <div class="op-item">
                    <span>${op.descricao}</span>
                    <span class="op-status ${isDone ? 'concluida' : 'pendente'}">
                        ${isDone ? '✓ Feito' : '⏳ Aguarda'}
                    </span>
                </div>
            `;
        }).join('');
    } else {
        opsHtml = '<p style="color:#64748b; font-size:13px; text-align:center;">Ainda não existem trabalhos detalhados.</p>';
    }

    // O HTML Final do Telemóvel
    app.innerHTML = `
        <div class="header">
            <h1>SGO 🔧 Tracker</h1>
            <p>Acompanhamento em Tempo Real</p>
        </div>

        <div class="vehicle-card">
            <div class="plate">${r.viaturaMatricula || 'S/ MATRICULA'}</div>
            <p class="model">${r.viaturaMarca || ''} ${r.viaturaModelo || ''}</p>
        </div>

        <div class="timeline">
            <div class="tl-item ${isPendente ? 'active' : 'done'}">
                <div class="tl-dot">${isPendente ? '⏳' : '✓'}</div>
                <div class="tl-content">
                    <h3 class="tl-title">Viatura na Fila</h3>
                    <p class="tl-desc">Recebemos a sua viatura e aguarda atribuição.</p>
                </div>
            </div>

            ${isPecas ? `
            <div class="tl-item warning">
                <div class="tl-dot">⚠️</div>
                <div class="tl-content">
                    <h3 class="tl-title">Aguardar Peças</h3>
                    <p class="tl-desc">Estamos à espera que o fornecedor entregue o material.</p>
                </div>
            </div>
            ` : ''}

            <div class="tl-item ${isExecucao ? 'active' : (isPronto ? 'done' : '')}">
                <div class="tl-dot">${(isExecucao || isPronto) ? (isPronto ? '✓' : '⚙️') : '2'}</div>
                <div class="tl-content">
                    <h3 class="tl-title">Em Reparação</h3>
                    <p class="tl-desc">O mecânico está neste momento a intervir no seu veículo.</p>
                </div>
            </div>

            <div class="tl-item ${isPronto ? 'done' : ''}" style="margin-bottom: 0;">
                <div class="tl-dot">${isPronto ? '🎉' : '3'}</div>
                <div class="tl-content">
                    <h3 class="tl-title">Pronto a Levantar</h3>
                    <p class="tl-desc">Trabalho concluído! Pode vir buscar as suas chaves.</p>
                </div>
            </div>
        </div>

        ${r.valorTotal > 0 ? `
        <div class="price-card">
            <h3>${valorStr}</h3>
            <p>Valor total orçamentado / faturado</p>
        </div>
        ` : ''}

        <div class="ops-box">
            <h3>Trabalhos na Viatura</h3>
            ${opsHtml}
        </div>
    `;
}