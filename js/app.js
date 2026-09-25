/**
 * Da Silva Doceria - Sistema de Gestão & PDV
 * Lógica Completa da Aplicação com Calculadora de Lucro, Nova Categoria e Ajustes de Layout
 */

// ==========================================
// ESTADO GLOBAL & PERSISTÊNCIA LOCALSTORAGE
// ==========================================

function carregarProdutosIniciais() {
    const salvos = localStorage.getItem('ds_produtos_v2');
    if (salvos) {
        try {
            return JSON.parse(salvos);
        } catch (e) {
            console.error('Erro ao ler produtos salvos:', e);
        }
    }
    const antigos = localStorage.getItem('ds_produtos');
    if (antigos) {
        try {
            const parsed = JSON.parse(antigos);
            if (parsed.length > 10) return parsed;
        } catch (e) {}
    }
    return [...PRODUTOS_PADRAO];
}

let produtos = carregarProdutosIniciais();
let categorias = JSON.parse(localStorage.getItem('ds_categorias')) || [...CATEGORIAS_PADRAO];
let faixasKM = JSON.parse(localStorage.getItem('ds_faixasKM')) || [...FAIXAS_KM_PADRAO];
let contas = JSON.parse(localStorage.getItem('ds_contas')) || [...CONTAS_PADRAO];
let vendas = JSON.parse(localStorage.getItem('ds_vendas')) || [...VENDAS_PADRAO];
let insumos = JSON.parse(localStorage.getItem('ds_insumos')) || [...INSUMOS_PADRAO];

// Itens atuais do carrinho no PDV
let pdvItens = [];

// Filtros do Catálogo Dedicado
let catalogoCategoriaAtual = 'Todos';
let catalogoBuscaTermo = '';

// Filtros do PDV
let pdvCategoriaAtual = 'Todos';
let pdvBuscaTermo = '';

// Filtros de Insumos
let insumosCategoriaAtual = 'Todos';
let insumosBuscaTermo = '';

// Venda selecionada para comprovante
let vendaSelecionada = null;

// ==========================================
// PERSISTÊNCIA & BACKUP
// ==========================================

function saveData() {
    localStorage.setItem('ds_produtos_v2', JSON.stringify(produtos));
    localStorage.setItem('ds_categorias', JSON.stringify(categorias));
    localStorage.setItem('ds_faixasKM', JSON.stringify(faixasKM));
    localStorage.setItem('ds_contas', JSON.stringify(contas));
    localStorage.setItem('ds_vendas', JSON.stringify(vendas));
    localStorage.setItem('ds_insumos', JSON.stringify(insumos));

    if (typeof CloudSync !== 'undefined' && CloudSync.pushToCloud) {
        CloudSync.pushToCloud('saveData');
    }
}

// ==========================================
// CONFIGURAÇÕES DA LOJA (Pede Aí)
// ==========================================

function getConfigLoja() {
    const def = {
        lojaAberta: true,
        whatsapp: '',
        endereco: '',
        pedidoMinimo: 20,
        tempoEntrega: '40-60 min',
        aviso: ''
    };
    try {
        return Object.assign(def, JSON.parse(localStorage.getItem('ds_config_loja') || '{}'));
    } catch (e) { return def; }
}

let _lojaAbertaTemp = true; // estado temporário do toggle no modal

function abrirModalConfigLoja() {
    const cfg = getConfigLoja();
    _lojaAbertaTemp = cfg.lojaAberta !== false;

    document.getElementById('cfg-whatsapp').value = cfg.whatsapp || '';
    document.getElementById('cfg-endereco').value = cfg.endereco || '';
    document.getElementById('cfg-pedido-minimo').value = cfg.pedidoMinimo || 20;
    document.getElementById('cfg-tempo-entrega').value = cfg.tempoEntrega || '40-60 min';
    document.getElementById('cfg-aviso').value = cfg.aviso || '';
    atualizarToggleLoja(_lojaAbertaTemp);

    document.getElementById('modal-config-loja').classList.remove('hidden');
}

function fecharModalConfigLoja() {
    document.getElementById('modal-config-loja').classList.add('hidden');
}

function toggleStatusLoja() {
    _lojaAbertaTemp = !_lojaAbertaTemp;
    atualizarToggleLoja(_lojaAbertaTemp);
}

function atualizarToggleLoja(aberta) {
    const btn = document.getElementById('btn-toggle-loja');
    const dot = document.getElementById('toggle-dot');
    const label = document.getElementById('loja-status-label');
    if (!btn) return;
    if (aberta) {
        btn.className = 'relative w-12 h-6 bg-emerald-500 rounded-full transition-colors cursor-pointer focus:outline-none';
        dot.className = 'absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform';
        label.textContent = 'Aberta';
        label.className = 'text-xs font-bold text-emerald-600';
    } else {
        btn.className = 'relative w-12 h-6 bg-slate-300 rounded-full transition-colors cursor-pointer focus:outline-none';
        dot.className = 'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform';
        label.textContent = 'Fechada';
        label.className = 'text-xs font-bold text-rose-500';
    }
}

function mascaraTelCfg(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length <= 10) v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else v = v.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    input.value = v;
}

function salvarConfigLoja(e) {
    if (e) e.preventDefault();
    const whats = document.getElementById('cfg-whatsapp').value.trim();
    const endereco = document.getElementById('cfg-endereco').value.trim();
    const minimo = parseFloat(document.getElementById('cfg-pedido-minimo').value) || 20;
    const tempo = document.getElementById('cfg-tempo-entrega').value.trim() || '40-60 min';
    const aviso = document.getElementById('cfg-aviso').value.trim();

    if (!whats) { showToast('Informe o WhatsApp da loja!', 'warning'); return; }
    if (!endereco) { showToast('Informe o endereço da loja!', 'warning'); return; }

    const cfg = {
        lojaAberta: _lojaAbertaTemp,
        whatsapp: '55' + whats.replace(/\D/g, ''),
        endereco,
        pedidoMinimo: minimo,
        tempoEntrega: tempo,
        aviso
    };
    localStorage.setItem('ds_config_loja', JSON.stringify(cfg));
    fecharModalConfigLoja();
    showToast(`✅ Configurações salvas! Loja ${cfg.lojaAberta ? 'Aberta 🟢' : 'Fechada 🔴'} no Pede Aí.`, 'success');

    // Sincronizar com nuvem
    if (typeof CloudSync !== 'undefined' && CloudSync.pushToCloud) {
        CloudSync.pushToCloud('config-loja');
    }
}

function restaurarCardapioPadrao() {
    if (confirm("Deseja recarregar o cardápio oficial completo da Da Silva Doceria (38 itens das fotos)?")) {
        produtos = JSON.parse(JSON.stringify(PRODUTOS_PADRAO));
        categorias = [...CATEGORIAS_PADRAO];
        saveData();
        renderCategorias();
        renderCatalogoDoces();
        renderPdvCatalogo();
        renderDashboard();
        showToast("Cardápio oficial com 38 itens restaurado com sucesso! 💖", "success");
    }
}

function exportarBackup() {
    const dados = {
        versao: "2.2",
        dataBackup: new Date().toISOString(),
        produtos,
        categorias,
        insumos,
        faixasKM,
        contas,
        vendas
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_dasilva_doceria_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup baixado com sucesso!", "success");
}

function importarBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            if (dados.produtos) produtos = dados.produtos;
            if (dados.categorias) categorias = dados.categorias;
            if (dados.insumos) insumos = dados.insumos;
            if (dados.faixasKM) faixasKM = dados.faixasKM;
            if (dados.contas) contas = dados.contas;
            if (dados.vendas) vendas = dados.vendas;
            saveData();
            renderAll();
            showToast("Backup restaurado com sucesso!", "success");
        } catch (err) {
            alert("Erro ao ler o arquivo de backup: " + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function exportarVendasCSV() {
    if (vendas.length === 0) {
        showToast("Nenhuma venda registrada para exportar.", "info");
        return;
    }

    let csv = "ID;Data;Canal;Cliente;Itens;Subtotal;FreteOuTaxa;Total;Custo;Lucro\n";
    vendas.forEach(v => {
        const itensStr = (v.itens || []).map(i => `${i.qtd}x ${i.nome}`).join(' + ').replace(/;/g, ',');
        const clienteStr = (v.cliente || 'Balcão').replace(/;/g, ',');
        csv += `${v.id};"${v.data}";"${v.canal}";"${clienteStr}";"${itensStr}";${v.subtotal || v.totalBruto};${v.taxaOuFrete || 0};${v.totalBruto};${v.custoDoces || 0};${v.lucro || 0}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendas_dasilva_doceria_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Relatório de vendas CSV baixado!", "success");
}

// ==========================================
// UTILITÁRIOS & FORMATAÇÃO
// ==========================================

function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgMap = {
        success: 'bg-[#9c4857] text-white border border-[#c58a80]',
        error: 'bg-rose-700 text-white',
        info: 'bg-[#2e171e] text-white border border-[#c58a80]/30',
        warning: 'bg-amber-600 text-white'
    };
    const iconMap = {
        success: 'fa-heart',
        error: 'fa-circle-exclamation',
        info: 'fa-circle-info',
        warning: 'fa-triangle-exclamation'
    };

    toast.className = `toast px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold ${bgMap[type] || bgMap.info}`;
    toast.innerHTML = `
        <i class="fa-solid ${iconMap[type] || iconMap.info} text-lg text-rose-200"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ==========================================
// SUPORTE MOBILE & MODAIS (SEM CORTES)
// ==========================================

function toggleMenuMobile(open) {
    const sidebar = document.getElementById('sidebar-menu');
    const backdrop = document.getElementById('menu-mobile-backdrop');
    if (!sidebar || !backdrop) return;

    if (open) {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        backdrop.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    } else {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
}

function fecharModalAoClicarFora(event, modalId) {
    if (event.target && event.target.id === modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    }
}

function irParaCarrinhoPdv() {
    const el = document.getElementById('pdv-carrinho-bloco');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function irParaCatalogoPdv() {
    const el = document.getElementById('pdv-produtos-bloco');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Fechar modais e menu ao pressionar ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modais = [
            'modal-flutuante-doce',
            'modal-flutuante-insumo',
            'modal-flutuante-frete',
            'modal-flutuante-financeiro',
            'modal-flutuante-categoria',
            'modal-comprovante',
            'modal-flutuante-nuvem',
            'modal-config-loja',
            'modal-editar-taxas-frete'
        ];
        modais.forEach(id => {
            const m = document.getElementById(id);
            if (m && !m.classList.contains('hidden')) {
                m.classList.add('hidden');
            }
        });
        toggleMenuMobile(false);
    }
});

// ==========================================
// NAVEGAÇÃO ENTRE ABAS
// ==========================================

function switchTab(tabId) {
    // 1. Fechar menu móvel ao clicar em qualquer item
    toggleMenuMobile(false);

    // 2. Esconder todas as seções e remover destaque dos menus
    document.querySelectorAll('main section').forEach(sec => sec.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active-tab'));
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => btn.classList.remove('bottom-nav-active'));

    const currentSection = document.getElementById(`section-${tabId}`);
    const currentNav = document.getElementById(`nav-${tabId}`);
    const currentBottomNav = document.getElementById(`bottom-nav-${tabId}`);

    if (currentSection) currentSection.classList.remove('hidden');
    if (currentNav) currentNav.classList.add('active-tab');
    if (currentBottomNav) currentBottomNav.classList.add('bottom-nav-active');

    // 3. Atualizar barra flutuante do carrinho no mobile
    const floatBar = document.getElementById('pdv-mobile-cart-float');
    if (floatBar) {
        if (tabId === 'pdv' && pdvItens.length > 0) {
            floatBar.classList.remove('hidden');
        } else {
            floatBar.classList.add('hidden');
        }
    }

    const titles = {
        'dashboard': { title: 'Dashboard Geral', desc: 'Métricas, desempenho e faturamento da Da Silva Doceria', badge: 'Dashboard' },
        'catalogo': { title: 'Catálogo de Doces', desc: 'Cardápio completo de sobremesas com pesquisa rápida e edição', badge: 'Catálogo' },
        'pdv': { title: 'Novo Pedido / PDV', desc: 'Atenda clientes no balcão, WhatsApp Delivery ou lance vendas do iFood', badge: 'PDV & Vendas' },
        'insumos': { title: 'Insumos & Estoque', desc: 'Controle de matérias-primas, recheios, frutas e embalagens', badge: 'Estoque' },
        'frete': { title: 'Taxas de Frete (KM)', desc: 'Faixas de distância em KM e valores de entrega para WhatsApp', badge: 'Frete KM' },
        'financeiro': { title: 'Financeiro & Contas', desc: 'Controle de despesas, contas a pagar e receitas de encomendas', badge: 'Financeiro' },
        'historico': { title: 'Histórico de Vendas', desc: 'Consulte pedidos, emita comprovantes e envie pelo WhatsApp', badge: 'Histórico' }
    };

    const header = titles[tabId] || { title: 'Da Silva Doceria', desc: 'Sistema de Gestão & Confeitaria', badge: 'Doceria' };
    const hTitle = document.getElementById('header-title');
    const hDesc = document.getElementById('header-desc');
    const mSub = document.getElementById('mobile-header-subtitle');

    if (hTitle) hTitle.innerText = header.title;
    if (hDesc) hDesc.innerText = header.desc;
    if (mSub) mSub.innerText = header.badge;

    // 4. Rolar para o topo suavemente ao trocar de aba
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });

    if (tabId === 'dashboard') renderDashboard();
    if (tabId === 'catalogo') renderCatalogoDoces();
    if (tabId === 'pdv') { renderPdvCatalogo(); renderPdvItens(); }
    if (tabId === 'insumos') renderInsumos();
    if (tabId === 'frete') { renderFaixasKM(); renderTabelasFreteAdmin(); }
    if (tabId === 'financeiro') renderContas();
    if (tabId === 'historico') renderHistorico();
}

// ==========================================
// MÓDULO: GERENCIAMENTO DE CATEGORIAS
// ==========================================

function renderCategorias() {
    // 1. Atualizar abas do Catálogo
    const catBar = document.getElementById('catalogo-categorias-bar');
    if (catBar) {
        catBar.innerHTML = `
            <button type="button" data-cat="Todos" onclick="filtrarCatalogoCategoria('Todos')" class="cat-pill ${catalogoCategoriaAtual === 'Todos' ? 'active' : ''} px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0">Todos</button>
            ${categorias.map(c => `
                <button type="button" data-cat="${c}" onclick="filtrarCatalogoCategoria('${c}')" class="cat-pill ${catalogoCategoriaAtual === c ? 'active' : ''} px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0">${c}</button>
            `).join('')}
            <button type="button" onclick="abrirModalNovaCategoria()" class="px-3.5 py-2 rounded-2xl text-xs font-bold text-[#b17369] bg-[#fde8ed] hover:bg-[#fad8df] border border-[#f0c9d0] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs" title="Criar ou gerenciar categorias">
                <i class="fa-solid fa-plus text-[10px]"></i>
                <span>Categoria</span>
            </button>
        `;
    }

    // 2. Atualizar abas do PDV
    const pdvCatBar = document.getElementById('pdv-categorias-bar');
    if (pdvCatBar) {
        pdvCatBar.innerHTML = `
            <button type="button" data-cat="Todos" onclick="filtrarPdvCategoria('Todos')" class="cat-pill ${pdvCategoriaAtual === 'Todos' ? 'active' : ''} px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0">Todos</button>
            ${categorias.map(c => `
                <button type="button" data-cat="${c}" onclick="filtrarPdvCategoria('${c}')" class="cat-pill ${pdvCategoriaAtual === c ? 'active' : ''} px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0">${c}</button>
            `).join('')}
        `;
    }

    // 3. Atualizar <select id="modal-doce-categoria">
    const selectDoce = document.getElementById('modal-doce-categoria');
    if (selectDoce) {
        const valAtual = selectDoce.value;
        selectDoce.innerHTML = categorias.map(c => `
            <option value="${c}">${c}</option>
        `).join('');
        if (categorias.includes(valAtual)) {
            selectDoce.value = valAtual;
        }
    }

    // 4. Atualizar lista no modal de gerenciar categorias
    const listaCatModal = document.getElementById('lista-categorias-gerenciar');
    if (listaCatModal) {
        listaCatModal.innerHTML = categorias.map(c => {
            const count = produtos.filter(p => p.categoria === c).length;
            return `
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#fff8f9] border border-[#faedf0] text-xs">
                    <span class="font-bold text-[#4a2d36]">${c} <span class="text-[10px] text-slate-400 font-normal">(${count} ${count === 1 ? 'doce' : 'doces'})</span></span>
                    <button type="button" onclick="removerCategoria('${c}')" class="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors" title="Excluir categoria">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
            `;
        }).join('');
    }
}

function abrirModalNovaCategoria() {
    const input = document.getElementById('modal-cat-nome');
    if (input) input.value = '';
    renderCategorias();
    document.getElementById('modal-flutuante-categoria').classList.remove('hidden');
}

function fecharModalCategoria() {
    document.getElementById('modal-flutuante-categoria').classList.add('hidden');
}

function salvarNovaCategoria(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('modal-cat-nome');
    const nome = input ? input.value.trim() : '';

    if (!nome) {
        showToast("Digite o nome da categoria!", "warning");
        return;
    }

    if (categorias.map(c => c.toLowerCase()).includes(nome.toLowerCase())) {
        showToast("Esta categoria já existe!", "warning");
        return;
    }

    categorias.push(nome);
    saveData();
    renderCategorias();
    if (input) input.value = '';

    const selectDoce = document.getElementById('modal-doce-categoria');
    if (selectDoce) selectDoce.value = nome;

    showToast(`Categoria "${nome}" criada com sucesso! 💖`, "success");
}

function removerCategoria(nome) {
    if (categorias.length <= 1) {
        showToast("Você deve manter pelo menos uma categoria.", "warning");
        return;
    }

    const emUso = produtos.filter(p => p.categoria === nome).length;
    let aviso = `Deseja realmente excluir a categoria "${nome}"?`;
    if (emUso > 0) {
        aviso = `A categoria "${nome}" possui ${emUso} doces vinculados. Se excluir, eles ficarão na categoria "Geral". Confirmar exclusão?`;
    }

    if (confirm(aviso)) {
        if (emUso > 0) {
            produtos.forEach(p => {
                if (p.categoria === nome) p.categoria = 'Geral';
            });
            if (!categorias.includes('Geral')) {
                categorias.push('Geral');
            }
        }
        categorias = categorias.filter(c => c !== nome);
        saveData();
        renderCategorias();
        renderCatalogoDoces();
        renderPdvCatalogo();
        showToast(`Categoria "${nome}" excluída.`, "info");
    }
}

// ==========================================
// CALCULADORA DE LUCRO & PRECIFICAÇÃO NO MODAL
// ==========================================

function calcularPrecoPorMargem(origem) {
    const custoInput = document.getElementById('modal-doce-custo');
    const margemInput = document.getElementById('modal-doce-margem');
    const precoInput = document.getElementById('modal-doce-preco');
    const badgeLucro = document.getElementById('modal-doce-lucro-badge');

    if (!custoInput || !margemInput || !precoInput) return;

    const custo = parseFloat(custoInput.value) || 0;

    if (origem === 'custo' || origem === 'margem') {
        const margem = parseFloat(margemInput.value);
        if (!isNaN(margem) && custo > 0) {
            const preco = custo * (1 + (margem / 100));
            precoInput.value = preco.toFixed(2);
        }
    } else if (origem === 'preco') {
        const preco = parseFloat(precoInput.value) || 0;
        if (custo > 0 && preco > 0) {
            const margem = ((preco - custo) / custo) * 100;
            margemInput.value = Math.round(margem);
        }
    }

    const precoFinal = parseFloat(precoInput.value) || 0;
    const lucroBruto = precoFinal - custo;
    if (badgeLucro) {
        if (precoFinal > 0 && custo > 0) {
            const pct = Math.round(((precoFinal - custo) / custo) * 100);
            badgeLucro.innerText = `Lucro: +${formatMoney(lucroBruto)} (${pct}%)`;
            badgeLucro.className = lucroBruto >= 0 
                ? 'text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200'
                : 'text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200';
        } else {
            badgeLucro.innerText = 'Lucro: R$ 0,00';
            badgeLucro.className = 'text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full';
        }
    }
}

function aplicarMargemRapida(pct) {
    const margemInput = document.getElementById('modal-doce-margem');
    if (margemInput) margemInput.value = pct;
    calcularPrecoPorMargem('margem');
}

// ==========================================
// MÓDULO: TELA DEDICADA DO CATÁLOGO DE DOCES
// ==========================================

function filtrarCatalogoCategoria(categoria) {
    catalogoCategoriaAtual = categoria;
    document.querySelectorAll('#catalogo-categorias-bar .cat-pill').forEach(btn => {
        if (btn.getAttribute('data-cat') === categoria) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderCatalogoDoces();
}

function buscarProdutosCatalogo(termo) {
    catalogoBuscaTermo = termo.trim().toLowerCase();
    renderCatalogoDoces();
}

function renderCatalogoDoces() {
    const container = document.getElementById('catalogo-grid-cards');
    const badgeTotal = document.getElementById('catalogo-badge-total');
    if (!container) return;

    const filtrados = produtos.filter(p => {
        const bateCategoria = catalogoCategoriaAtual === 'Todos' || p.categoria === catalogoCategoriaAtual;
        const bateBusca = !catalogoBuscaTermo || 
            p.nome.toLowerCase().includes(catalogoBuscaTermo) || 
            (p.descricao && p.descricao.toLowerCase().includes(catalogoBuscaTermo));
        return bateCategoria && bateBusca;
    });

    if (badgeTotal) badgeTotal.innerText = `${produtos.length} sobremesas no cardápio`;

    if (filtrados.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center text-slate-400">
                <div class="w-16 h-16 rounded-full bg-[#fde8ed] text-[#b17369] flex items-center justify-center mx-auto mb-3 text-2xl">
                    <i class="fa-solid fa-cookie-bite"></i>
                </div>
                <h4 class="font-bold text-slate-700 text-sm">Nenhum doce encontrado</h4>
                <p class="text-xs text-slate-500 mt-1">Tente pesquisar outro termo ou selecione a categoria "Todos".</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtrados.map(p => {
        const margem = p.preco > 0 ? (((p.preco - p.custo) / p.preco) * 100).toFixed(0) : 0;
        return `
            <div class="catalogo-card group">
                <div>
                    <!-- Header do Card: Categoria e Preço -->
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <span class="badge-cat-card">
                            ${p.categoria || 'DOCE'}
                        </span>
                        <span class="badge-preco-card">
                            ${formatMoney(p.preco)}
                        </span>
                    </div>

                    <!-- Título do Doce -->
                    <h4 class="font-bold text-slate-900 text-sm leading-snug group-hover:text-[#9c4857] transition-colors">
                        ${p.nome}
                    </h4>

                    <!-- Descrição/Ingredientes -->
                    <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        ${p.descricao || 'Sobremesa artesanal especial Da Silva Doceria.'}
                    </p>
                </div>

                <!-- Rodapé do Card: Custo, Margem e Ações -->
                <div class="mt-4 pt-3 border-t border-[#f5dde1] flex items-center justify-between">
                    <div>
                        <span class="text-xs text-slate-400 font-medium">Custo: ${formatMoney(p.custo)}</span>
                        <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded ml-1">
                            ${margem}% mg
                        </span>
                    </div>

                    <!-- Botões de Ação -->
                    <div class="flex items-center gap-1.5">
                        <button type="button" onclick="abrirModalEdicaoDoce(${p.id})" class="btn-card-action btn-card-edit" title="Editar doce">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" onclick="duplicarDoce(${p.id})" class="btn-card-action btn-card-duplicate" title="Duplicar doce">
                            <i class="fa-solid fa-copy"></i>
                        </button>
                        <button type="button" onclick="removerDoce(${p.id})" class="btn-card-action btn-card-delete" title="Excluir doce">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                        <button type="button" onclick="adicionarAoPedidoPdv(${p.id})" class="btn-card-action btn-card-add" title="Adicionar ao Pedido / PDV">
                            <i class="fa-solid fa-plus font-bold"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function duplicarDoce(id) {
    const original = produtos.find(p => p.id === id);
    if (!original) return;

    const copia = {
        ...JSON.parse(JSON.stringify(original)),
        id: Date.now(),
        nome: `${original.nome} (Cópia)`
    };

    produtos.unshift(copia);
    saveData();
    renderCatalogoDoces();
    renderPdvCatalogo();
    showToast(`Doce "${copia.nome}" duplicado com sucesso!`, "success");
}

function removerDoce(id) {
    const doce = produtos.find(p => p.id === id);
    if (!doce) return;

    if (confirm(`Deseja realmente excluir o doce "${doce.nome}" do cardápio?`)) {
        produtos = produtos.filter(p => p.id !== id);
        saveData();
        renderCatalogoDoces();
        renderPdvCatalogo();
        showToast(`"${doce.nome}" removido do cardápio.`, "info");
    }
}

// Modal Flutuante para Cadastrar / Editar Doce
function abrirModalNovoDoce() {
    renderCategorias();
    document.getElementById('modal-doce-titulo').innerText = "Cadastrar Novo Doce";
    document.getElementById('modal-doce-id').value = "";
    document.getElementById('modal-doce-nome').value = "";
    document.getElementById('modal-doce-desc').value = "";
    document.getElementById('modal-doce-custo').value = "";
    document.getElementById('modal-doce-margem').value = "100";
    document.getElementById('modal-doce-preco').value = "";
    calcularPrecoPorMargem('custo');
    renderFotosModal([]);
    document.getElementById('modal-flutuante-doce').classList.remove('hidden');
}

function abrirModalEdicaoDoce(id) {
    const doce = produtos.find(p => p.id === id);
    if (!doce) return;

    renderCategorias();
    document.getElementById('modal-doce-titulo').innerText = "Editar Doce do Cardápio";
    document.getElementById('modal-doce-id').value = doce.id;
    document.getElementById('modal-doce-nome').value = doce.nome;
    document.getElementById('modal-doce-categoria').value = doce.categoria || (categorias[0] || "Copos da Felicidade");
    document.getElementById('modal-doce-desc').value = doce.descricao || "";
    document.getElementById('modal-doce-custo').value = doce.custo;
    document.getElementById('modal-doce-preco').value = doce.preco;

    if (doce.custo > 0 && doce.preco > 0) {
        const margem = ((doce.preco - doce.custo) / doce.custo) * 100;
        document.getElementById('modal-doce-margem').value = Math.round(margem);
    } else {
        document.getElementById('modal-doce-margem').value = "100";
    }
    calcularPrecoPorMargem('preco');
    renderFotosModal(doce.fotos || []);

    document.getElementById('modal-flutuante-doce').classList.remove('hidden');
}

function fecharModalDoce() {
    document.getElementById('modal-flutuante-doce').classList.add('hidden');
}

// ---- Gerenciamento de Fotos do Produto (até 4 fotos por doce) ----
let fotosTemp = [];

function renderFotosModal(fotos) {
    fotosTemp = fotos ? [...fotos] : [];
    const container = document.getElementById('fotos-preview-container');
    if (!container) return;

    container.innerHTML = '';
    fotosTemp.forEach((src, idx) => {
        const div = document.createElement('div');
        div.className = 'relative group shrink-0';
        div.innerHTML = `
            <img src="${src}" class="w-20 h-20 object-cover rounded-2xl border-2 border-[#f0c9d0] shadow-sm">
            <button type="button" onclick="removerFotoModal(${idx})" class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] shadow cursor-pointer" title="Remover foto">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        container.appendChild(div);
    });

    if (fotosTemp.length < 4) {
        const addBtn = document.createElement('label');
        addBtn.className = 'w-20 h-20 shrink-0 rounded-2xl border-2 border-dashed border-[#c58a80] flex flex-col items-center justify-center text-[#c58a80] cursor-pointer hover:bg-[#fde8ed] transition-colors gap-1';
        addBtn.innerHTML = `
            <i class="fa-solid fa-camera text-xl"></i>
            <span class="text-[10px] font-bold text-center leading-tight">${fotosTemp.length === 0 ? 'Adicionar<br>Foto' : '+ Foto'}</span>
            <input type="file" accept="image/*" multiple class="hidden" onchange="handleFotoUpload(event)">
        `;
        container.appendChild(addBtn);
    }
}

function removerFotoModal(idx) {
    fotosTemp.splice(idx, 1);
    renderFotosModal(fotosTemp);
}

function handleFotoUpload(event) {
    const files = Array.from(event.target.files);
    const paraProcessar = files.slice(0, 4 - fotosTemp.length);
    let done = 0;
    paraProcessar.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const maxD = 800;
                let w = img.width, h = img.height;
                if (w > maxD || h > maxD) {
                    if (w > h) { h = Math.round(h * maxD / w); w = maxD; }
                    else { w = Math.round(w * maxD / h); h = maxD; }
                }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                fotosTemp.push(canvas.toDataURL('image/jpeg', 0.75));
                done++;
                if (done === paraProcessar.length) {
                    renderFotosModal(fotosTemp);
                    showToast(`${done} foto(s) adicionada(s)! 📸`, 'success');
                }
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
    event.target.value = '';
}

function salvarDoceModal(e) {
    e.preventDefault();
    const idVal = document.getElementById('modal-doce-id').value;
    const nome = document.getElementById('modal-doce-nome').value.trim();
    const categoria = document.getElementById('modal-doce-categoria').value;
    const descricao = document.getElementById('modal-doce-desc').value.trim();
    const custo = parseFloat(document.getElementById('modal-doce-custo').value) || 0;
    const preco = parseFloat(document.getElementById('modal-doce-preco').value) || 0;

    if (!nome) {
        showToast("Informe o nome do doce!", "warning");
        return;
    }

    if (idVal) {
        // Editando
        const id = parseInt(idVal);
        const idx = produtos.findIndex(p => p.id === id);
        if (idx >= 0) {
            produtos[idx].nome = nome;
            produtos[idx].categoria = categoria;
            produtos[idx].descricao = descricao;
            produtos[idx].custo = custo;
            produtos[idx].preco = preco;
            produtos[idx].fotos = fotosTemp;
            showToast(`"${nome}" atualizado!`, "success");
        }
    } else {
        // Inserindo Novo
        const novo = {
            id: Date.now(),
            nome,
            categoria,
            descricao,
            custo,
            preco,
            icone: "fa-cookie-bite",
            fotos: fotosTemp
        };
        produtos.unshift(novo);
        showToast(`"${nome}" cadastrado com sucesso!`, "success");
    }

    saveData();
    fecharModalDoce();
    renderCatalogoDoces();
    renderPdvCatalogo();
    renderDashboard();
}

function adicionarAoPedidoPdv(id) {
    const doce = produtos.find(p => p.id === id);
    if (!doce) return;

    const idx = pdvItens.findIndex(i => i.id === id);
    if (idx >= 0) {
        pdvItens[idx].qtd += 1;
    } else {
        pdvItens.push({ ...doce, qtd: 1 });
    }

    renderPdvItens();
    showToast(`+1 "${doce.nome}" no pedido!`, "success");
}

// ==========================================
// MÓDULO: INSUMOS & ESTOQUE
// ==========================================

function filtrarInsumosCategoria(categoria) {
    insumosCategoriaAtual = categoria;
    document.querySelectorAll('#insumos-categorias-bar .cat-pill').forEach(btn => {
        if (btn.getAttribute('data-cat') === categoria) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderInsumos();
}

function buscarInsumos(termo) {
    insumosBuscaTermo = termo.trim().toLowerCase();
    renderInsumos();
}

function renderInsumos() {
    const tbody = document.getElementById('insumos-table-body');
    const badgeTotal = document.getElementById('insumos-badge-total');
    if (!tbody) return;

    const filtrados = insumos.filter(i => {
        const bateCategoria = insumosCategoriaAtual === 'Todos' || i.categoria === insumosCategoriaAtual;
        const bateBusca = !insumosBuscaTermo || 
            i.nome.toLowerCase().includes(insumosBuscaTermo) || 
            (i.fornecedor && i.fornecedor.toLowerCase().includes(insumosBuscaTermo));
        return bateCategoria && bateBusca;
    });

    if (badgeTotal) badgeTotal.innerText = `${insumos.length} itens cadastrados`;

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">Nenhum insumo encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtrados.map(i => `
        <tr class="hover:bg-[#fff9fa] transition-colors">
            <td class="p-3">
                <p class="font-bold text-slate-800 text-xs">${i.nome}</p>
                <p class="text-[10px] text-slate-400">Fornecedor: ${i.fornecedor || 'Geral'}</p>
            </td>
            <td class="p-3">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fdf0f2] text-[#ab4e5e] border border-[#fce2e6]">
                    ${i.categoria || 'Geral'}
                </span>
            </td>
            <td class="p-3 text-center">
                <span class="font-bold text-slate-800 text-xs">${i.qtd}</span>
                <span class="text-[10px] text-slate-500">${i.unidade || 'un'}</span>
            </td>
            <td class="p-3 text-right font-bold text-slate-800 text-xs">
                ${formatMoney(i.custo)}
            </td>
            <td class="p-3 text-right font-bold text-rose-700 text-xs">
                ${formatMoney(i.custo * i.qtd)}
            </td>
            <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button type="button" onclick="abrirModalEdicaoInsumo(${i.id})" class="btn-card-action btn-card-edit" title="Editar insumo">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button" onclick="duplicarInsumo(${i.id})" class="btn-card-action btn-card-duplicate" title="Duplicar insumo">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                    <button type="button" onclick="removerInsumo(${i.id})" class="btn-card-action btn-card-delete" title="Excluir insumo">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function duplicarInsumo(id) {
    const original = insumos.find(i => i.id === id);
    if (!original) return;

    const copia = {
        ...JSON.parse(JSON.stringify(original)),
        id: Date.now(),
        nome: `${original.nome} (Cópia)`
    };

    insumos.unshift(copia);
    saveData();
    renderInsumos();
    showToast(`Insumo "${copia.nome}" duplicado!`, "success");
}

function removerInsumo(id) {
    const item = insumos.find(i => i.id === id);
    if (!item) return;

    if (confirm(`Deseja realmente remover o insumo "${item.nome}"?`)) {
        insumos = insumos.filter(i => i.id !== id);
        saveData();
        renderInsumos();
        showToast("Insumo removido com sucesso.", "info");
    }
}

// Modal Flutuante de Insumos
function abrirModalNovoInsumo() {
    document.getElementById('modal-insumo-titulo').innerText = "Cadastrar Novo Insumo";
    document.getElementById('modal-insumo-id').value = "";
    document.getElementById('modal-insumo-nome').value = "";
    document.getElementById('modal-insumo-categoria').value = "Laticínios";
    document.getElementById('modal-insumo-qtd').value = "1";
    document.getElementById('modal-insumo-unidade').value = "un";
    document.getElementById('modal-insumo-custo').value = "";
    document.getElementById('modal-insumo-fornecedor').value = "";
    document.getElementById('modal-flutuante-insumo').classList.remove('hidden');
}

function abrirModalEdicaoInsumo(id) {
    const item = insumos.find(i => i.id === id);
    if (!item) return;

    document.getElementById('modal-insumo-titulo').innerText = "Editar Insumo / Matéria-Prima";
    document.getElementById('modal-insumo-id').value = item.id;
    document.getElementById('modal-insumo-nome').value = item.nome;
    document.getElementById('modal-insumo-categoria').value = item.categoria || "Laticínios";
    document.getElementById('modal-insumo-qtd').value = item.qtd;
    document.getElementById('modal-insumo-unidade').value = item.unidade || "un";
    document.getElementById('modal-insumo-custo').value = item.custo;
    document.getElementById('modal-insumo-fornecedor').value = item.fornecedor || "";
    document.getElementById('modal-flutuante-insumo').classList.remove('hidden');
}

function fecharModalInsumo() {
    document.getElementById('modal-flutuante-insumo').classList.add('hidden');
}

function salvarInsumoModal(e) {
    e.preventDefault();
    const idVal = document.getElementById('modal-insumo-id').value;
    const nome = document.getElementById('modal-insumo-nome').value.trim();
    const categoria = document.getElementById('modal-insumo-categoria').value;
    const qtd = parseFloat(document.getElementById('modal-insumo-qtd').value) || 0;
    const unidade = document.getElementById('modal-insumo-unidade').value;
    const custo = parseFloat(document.getElementById('modal-insumo-custo').value) || 0;
    const fornecedor = document.getElementById('modal-insumo-fornecedor').value.trim();

    if (!nome) {
        showToast("Informe o nome do insumo!", "warning");
        return;
    }

    if (idVal) {
        const id = parseInt(idVal);
        const idx = insumos.findIndex(i => i.id === id);
        if (idx >= 0) {
            insumos[idx].nome = nome;
            insumos[idx].categoria = categoria;
            insumos[idx].qtd = qtd;
            insumos[idx].unidade = unidade;
            insumos[idx].custo = custo;
            insumos[idx].fornecedor = fornecedor;
            showToast(`Insumo "${nome}" atualizado!`, "success");
        }
    } else {
        const novo = {
            id: Date.now(),
            nome,
            categoria,
            qtd,
            unidade,
            custo,
            fornecedor
        };
        insumos.unshift(novo);
        showToast(`Insumo "${nome}" cadastrado com sucesso!`, "success");
    }

    saveData();
    fecharModalInsumo();
    renderInsumos();
}

// ==========================================
// MÓDULO: PDV (PONTO DE VENDA)
// ==========================================

function togglePdvCanal() {
    const canal = document.querySelector('input[name="canal-venda"]:checked').value;
    const deliveryFields = document.getElementById('pdv-delivery-fields');
    const ifoodFields = document.getElementById('pdv-ifood-fields');
    const clienteLabel = document.getElementById('pdv-cliente-label');

    if (canal === 'whatsapp') {
        deliveryFields.classList.remove('hidden');
        ifoodFields.classList.add('hidden');
        if (clienteLabel) clienteLabel.innerText = "Nome do Cliente (WhatsApp / Delivery)";
    } else if (canal === 'ifood') {
        deliveryFields.classList.add('hidden');
        ifoodFields.classList.remove('hidden');
        if (clienteLabel) clienteLabel.innerText = "Identificação do Pedido iFood (#Código)";
    } else {
        deliveryFields.classList.add('hidden');
        ifoodFields.classList.add('hidden');
        if (clienteLabel) clienteLabel.innerText = "Nome do Cliente (Opcional)";
    }
    atualizarResumoPdv();
}

function filtrarPdvCategoria(categoria) {
    pdvCategoriaAtual = categoria;
    document.querySelectorAll('#pdv-categorias-bar .cat-pill').forEach(btn => {
        if (btn.getAttribute('data-cat') === categoria) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderPdvCatalogo();
}

// ==========================================
// BUSCA RÁPIDA DE PRODUTOS & ATALHOS NO PDV
// ==========================================

function onPdvBuscaRapidaInput(termo) {
    const dropdown = document.getElementById('pdv-dropdown-sugestoes');
    const btnClear = document.getElementById('pdv-btn-clear-search');
    if (!dropdown) return;

    const query = (termo || '').trim().toLowerCase();

    if (btnClear) {
        if (query) btnClear.classList.remove('hidden');
        else btnClear.classList.add('hidden');
    }

    if (!query) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
        return;
    }

    const matches = produtos.filter(p => 
        p.nome.toLowerCase().includes(query) || 
        (p.categoria && p.categoria.toLowerCase().includes(query)) ||
        (p.descricao && p.descricao.toLowerCase().includes(query))
    );

    if (matches.length === 0) {
        dropdown.innerHTML = `
            <div class="p-4 text-center text-slate-400 text-xs">
                <i class="fa-solid fa-cookie-bite text-xl mb-1 text-slate-300 block"></i>
                <span>Nenhum doce encontrado para "<strong>${termo}</strong>"</span>
            </div>
        `;
        dropdown.classList.remove('hidden');
        return;
    }

    dropdown.innerHTML = matches.slice(0, 8).map((p, idx) => `
        <div onclick="adicionarDoceBuscaRapida(${p.id})" 
             class="p-2.5 sm:p-3 hover:bg-[#fde8ed] transition-colors cursor-pointer flex items-center justify-between gap-3 group ${idx === 0 ? 'bg-[#fffafb]' : ''}">
            <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-xl bg-[#fcecee] text-[#ab4e5e] flex items-center justify-center shrink-0 border border-[#f5dde1] text-xs font-bold">
                    <i class="fa-solid fa-cookie-bite"></i>
                </div>
                <div class="min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="font-extrabold text-xs text-slate-800 group-hover:text-[#9c4857] truncate">${p.nome}</span>
                        <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-[#fde8ed] text-[#ab4e5e] border border-[#f0c9d0] shrink-0">${p.categoria || 'Doce'}</span>
                    </div>
                    ${p.descricao ? `<p class="text-[10px] text-slate-400 truncate mt-0.5">${p.descricao}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <span class="font-black text-xs text-[#2e171e]">${formatMoney(p.preco)}</span>
                <button type="button" class="px-2 py-1 rounded-lg bg-gradient-to-r from-[#d48491] to-[#b56b78] text-white flex items-center justify-center text-[10px] font-bold shadow-xs hover:scale-105 active:scale-95 transition-all gap-1">
                    <i class="fa-solid fa-plus"></i>
                    <span>Add</span>
                </button>
            </div>
        </div>
    `).join('');

    dropdown.classList.remove('hidden');
}

function adicionarDoceBuscaRapida(id) {
    adicionarAoPedidoPdv(id);
    limparBuscaRapidaPdv();
}

function onPdvBuscaRapidaKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = document.getElementById('pdv-busca-rapida');
        const query = (input?.value || '').trim().toLowerCase();
        if (!query) return;

        const match = produtos.find(p => 
            p.nome.toLowerCase().includes(query) || 
            (p.categoria && p.categoria.toLowerCase().includes(query))
        );

        if (match) {
            adicionarAoPedidoPdv(match.id);
            limparBuscaRapidaPdv();
        } else {
            showToast("Nenhum produto correspondente para adicionar!", "warning");
        }
    } else if (event.key === 'Escape') {
        limparBuscaRapidaPdv();
    }
}

function limparBuscaRapidaPdv() {
    const input = document.getElementById('pdv-busca-rapida');
    const dropdown = document.getElementById('pdv-dropdown-sugestoes');
    const btnClear = document.getElementById('pdv-btn-clear-search');
    if (input) input.value = '';
    if (dropdown) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
    }
    if (btnClear) btnClear.classList.add('hidden');
}

// Fechar dropdown de sugestões ao clicar fora
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('pdv-dropdown-sugestoes');
    const input = document.getElementById('pdv-busca-rapida');
    if (!dropdown || !input) return;
    if (!dropdown.contains(e.target) && e.target !== input) {
        dropdown.classList.add('hidden');
    }
});

function renderPdvFavoritos() {
    const container = document.getElementById('pdv-atalhos-favoritos');
    if (!container) return;

    // Priorizar os produtos com maior saída ou os primeiros itens padrão
    const favoritos = produtos.slice(0, 6);

    container.innerHTML = favoritos.map(p => `
        <button type="button" onclick="adicionarAoPedidoPdv(${p.id})" 
                class="shrink-0 px-2.5 py-1 bg-[#fffafb] hover:bg-[#fde8ed] active:scale-95 text-[#9c4857] border border-[#f5dde1] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
                title="Clique para adicionar 1x ${p.nome}">
            <span>${p.nome.length > 20 ? p.nome.slice(0, 20) + '...' : p.nome}</span>
            <span class="text-[10px] bg-white px-1.5 py-0.2 rounded-md font-extrabold text-[#ab4e5e] border border-[#f0c9d0]">${formatMoney(p.preco)}</span>
        </button>
    `).join('');
}

function buscarProdutosPdv(termo) {
    pdvBuscaTermo = termo.trim().toLowerCase();
    renderPdvCatalogo();
}

function renderPdvCatalogo() {
    const container = document.getElementById('pdv-grid-produtos');
    const select = document.getElementById('pdv-select-produto');
    if (!container) return;

    renderPdvFavoritos();

    const filtrados = produtos.filter(p => {
        const bateCategoria = pdvCategoriaAtual === 'Todos' || p.categoria === pdvCategoriaAtual;
        const bateBusca = !pdvBuscaTermo || p.nome.toLowerCase().includes(pdvBuscaTermo) || (p.descricao && p.descricao.toLowerCase().includes(pdvBuscaTermo));
        return bateCategoria && bateBusca;
    });

    if (select) {
        select.innerHTML = produtos.map(p => `
            <option value="${p.id}">${p.nome} — ${formatMoney(p.preco)}</option>
        `).join('');
    }

    if (filtrados.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-8 text-center text-slate-400">
                <i class="fa-solid fa-cookie-bite text-3xl mb-2 text-slate-300"></i>
                <p class="text-sm">Nenhum produto encontrado nesta categoria ou pesquisa.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtrados.map(p => `
        <div class="catalogo-card cursor-pointer group" onclick="adicionarAoPedidoPdv(${p.id})">
            <div>
                <div class="flex items-start justify-between gap-2 mb-1.5">
                    <span class="badge-cat-card">
                        ${p.categoria || 'Doce'}
                    </span>
                    <span class="badge-preco-card">
                        ${formatMoney(p.preco)}
                    </span>
                </div>
                <h4 class="font-bold text-slate-900 text-xs group-hover:text-[#9c4857] transition-colors line-clamp-2 leading-tight">
                    ${p.nome}
                </h4>
                ${p.descricao ? `<p class="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">${p.descricao}</p>` : ''}
            </div>
            <div class="mt-3 pt-2 border-t border-[#f5dde1] flex items-center justify-between">
                <span class="text-[10px] text-slate-400 font-medium">Custo: ${formatMoney(p.custo)}</span>
                <button type="button" class="btn-card-action btn-card-add" title="Adicionar ao pedido">
                    <i class="fa-solid fa-plus font-bold"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function adicionarItemPdv() {
    const select = document.getElementById('pdv-select-produto');
    const prodId = parseInt(select.value);
    const qtdInput = document.getElementById('pdv-qtd');
    const qtd = parseInt(qtdInput.value) || 1;

    const prod = produtos.find(p => p.id === prodId);
    if (!prod) return;

    const idx = pdvItens.findIndex(i => i.id === prodId);
    if (idx >= 0) {
        pdvItens[idx].qtd += qtd;
    } else {
        pdvItens.push({ ...prod, qtd });
    }

    qtdInput.value = 1;
    renderPdvItens();
    showToast(`${qtd}x ${prod.nome} adicionado!`, "success");
}

function alterarQtdItemPdv(id, delta) {
    const idx = pdvItens.findIndex(i => i.id === id);
    if (idx < 0) return;

    pdvItens[idx].qtd += delta;
    if (pdvItens[idx].qtd <= 0) {
        pdvItens.splice(idx, 1);
    }
    renderPdvItens();
}

function removerItemPdv(id) {
    pdvItens = pdvItens.filter(i => i.id !== id);
    renderPdvItens();
    showToast("Item removido do pedido", "info");
}

function limparPedidoPdv() {
    if (pdvItens.length === 0) return;
    if (confirm("Deseja limpar todos os itens deste pedido?")) {
        pdvItens = [];
        renderPdvItens();
        showToast("Pedido limpo!", "info");
    }
}

function renderPdvItens() {
    const tbody = document.getElementById('pdv-itens-body');
    const badgeCount = document.getElementById('pdv-itens-count');
    if (!tbody) return;

    const totalQtd = pdvItens.reduce((a, b) => a + b.qtd, 0);
    if (badgeCount) badgeCount.innerText = `${totalQtd} ${totalQtd === 1 ? 'item' : 'itens'}`;

    if (pdvItens.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="p-6 text-center text-slate-400">
                    <i class="fa-solid fa-basket-shopping text-2xl mb-1 text-slate-300"></i>
                    <p class="text-xs">Nenhum item adicionado ao pedido ainda.</p>
                    <p class="text-[11px] text-slate-400">Clique em qualquer doce do catálogo ao lado para adicionar!</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = pdvItens.map(i => `
            <tr class="hover:bg-slate-50/70 transition-colors">
                <td class="p-2.5">
                    <p class="font-bold text-slate-800 text-xs leading-snug">${i.nome}</p>
                    <span class="text-[10px] text-[#ab4e5e] font-semibold">${i.categoria || 'Doce'}</span>
                </td>
                <td class="p-2.5 text-center">
                    <div class="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <button type="button" onclick="alterarQtdItemPdv(${i.id}, -1)" class="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 text-xs">
                            <i class="fa-solid fa-minus"></i>
                        </button>
                        <span class="w-7 text-center font-bold text-xs text-slate-800">${i.qtd}</span>
                        <button type="button" onclick="alterarQtdItemPdv(${i.id}, 1)" class="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 text-xs">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </td>
                <td class="p-2.5 text-right text-xs text-slate-600 whitespace-nowrap">${formatMoney(i.preco)}</td>
                <td class="p-2.5 text-right text-xs font-bold text-slate-800 whitespace-nowrap">${formatMoney(i.preco * i.qtd)}</td>
                <td class="p-2.5 text-center">
                    <button type="button" onclick="removerItemPdv(${i.id})" class="text-rose-400 hover:text-rose-600 p-1" title="Excluir">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Atualizar badge da barra inferior no celular
    const bottomBadge = document.getElementById('bottom-nav-pdv-badge');
    if (bottomBadge) {
        if (totalQtd > 0) {
            bottomBadge.innerText = totalQtd;
            bottomBadge.classList.remove('hidden');
        } else {
            bottomBadge.classList.add('hidden');
        }
    }

    // Atualizar barra flutuante móvel do PDV
    const floatBar = document.getElementById('pdv-mobile-cart-float');
    const floatCount = document.getElementById('pdv-float-count');
    const floatTotal = document.getElementById('pdv-float-total');
    if (floatBar && floatCount && floatTotal) {
        const totalVenda = pdvItens.reduce((a, b) => a + (b.preco * b.qtd), 0);
        const sectionPdv = document.getElementById('section-pdv');
        if (totalQtd > 0 && sectionPdv && !sectionPdv.classList.contains('hidden')) {
            floatCount.innerText = totalQtd;
            floatTotal.innerText = formatMoney(totalVenda);
            floatBar.classList.remove('hidden');
        } else {
            floatBar.classList.add('hidden');
        }
    }

    atualizarResumoPdv();
}

function toggleFormaPagamento() {
    const rad = document.querySelector('input[name="pdv-pagamento"]:checked');
    const forma = rad ? rad.value : 'Pix';
    const blocoDinheiro = document.getElementById('pdv-bloco-dinheiro');
    if (!blocoDinheiro) return;

    if (forma === 'Dinheiro') {
        blocoDinheiro.classList.remove('hidden');
        calcularTrocoPdv();
    } else {
        blocoDinheiro.classList.add('hidden');
    }
}

function calcularTrocoPdv() {
    const inputRecebido = document.getElementById('pdv-valor-recebido');
    const elTroco = document.getElementById('pdv-valor-troco');
    if (!inputRecebido || !elTroco) return;

    const recebido = parseFloat(inputRecebido.value) || 0;
    
    // Obter total atual do PDV
    const subtotal = pdvItens.reduce((a, i) => a + (i.preco * i.qtd), 0);
    const canalRadio = document.querySelector('input[name="canal-venda"]:checked');
    const canal = canalRadio ? canalRadio.value : 'balcao';

    let taxaEntrega = 0;
    if (canal === 'whatsapp') {
        const selectKm = document.getElementById('pdv-select-km');
        taxaEntrega = selectKm ? (parseFloat(selectKm.value) || 0) : 0;
    }
    const desconto = parseFloat(document.getElementById('pdv-desconto')?.value) || 0;
    const totalCobrar = Math.max(0, subtotal + (canal === 'whatsapp' ? taxaEntrega : 0) - desconto);

    if (recebido > 0) {
        const diferenca = recebido - totalCobrar;
        if (diferenca >= 0) {
            elTroco.innerText = formatMoney(diferenca);
            elTroco.className = 'font-black text-emerald-400 text-sm';
        } else {
            elTroco.innerText = `Falta ${formatMoney(Math.abs(diferenca))}`;
            elTroco.className = 'font-black text-amber-400 text-sm';
        }
    } else {
        elTroco.innerText = formatMoney(0);
        elTroco.className = 'font-black text-slate-400 text-sm';
    }
}

function atualizarResumoPdv() {
    const subtotal = pdvItens.reduce((a, i) => a + (i.preco * i.qtd), 0);
    const custoDoces = pdvItens.reduce((a, i) => a + (i.custo * i.qtd), 0);

    const canalRadio = document.querySelector('input[name="canal-venda"]:checked');
    const canal = canalRadio ? canalRadio.value : 'balcao';

    let taxaEntregaOuApp = 0;
    if (canal === 'whatsapp') {
        const selectKm = document.getElementById('pdv-select-km');
        taxaEntregaOuApp = selectKm ? (parseFloat(selectKm.value) || 0) : 0;
    } else if (canal === 'ifood') {
        const rateInput = document.getElementById('pdv-ifood-rate');
        const rate = rateInput ? (parseFloat(rateInput.value) || 0) : 0;
        taxaEntregaOuApp = subtotal * (rate / 100);
    }

    const descontoInput = document.getElementById('pdv-desconto');
    const desconto = descontoInput ? (parseFloat(descontoInput.value) || 0) : 0;

    const totalCobrar = Math.max(0, subtotal + (canal === 'whatsapp' ? taxaEntregaOuApp : 0) - desconto);
    const custoTotal = custoDoces + (canal === 'ifood' ? taxaEntregaOuApp : 0);
    const lucro = totalCobrar - custoTotal;
    const margem = totalCobrar > 0 ? ((lucro / totalCobrar) * 100).toFixed(1) : 0;

    const elSubtotal = document.getElementById('pdv-res-subtotal');
    const elTaxaLabel = document.getElementById('pdv-res-taxa-label');
    const elTaxa = document.getElementById('pdv-res-taxa');
    const elCusto = document.getElementById('pdv-res-custo');
    const elTotal = document.getElementById('pdv-res-total');
    const elLucro = document.getElementById('pdv-res-lucro');
    const elMargem = document.getElementById('pdv-res-margem');

    if (elSubtotal) elSubtotal.innerText = formatMoney(subtotal);
    if (elTaxaLabel) elTaxaLabel.innerText = canal === 'ifood' ? 'Comissão iFood:' : 'Taxa de Entrega:';
    if (elTaxa) {
        if (canal === 'ifood') {
            elTaxa.innerText = `- ${formatMoney(taxaEntregaOuApp)}`;
            elTaxa.className = 'font-bold text-rose-400';
        } else if (canal === 'whatsapp') {
            elTaxa.innerText = `+ ${formatMoney(taxaEntregaOuApp)}`;
            elTaxa.className = 'font-bold text-emerald-400';
        } else {
            elTaxa.innerText = formatMoney(0);
            elTaxa.className = 'font-bold text-slate-400';
        }
    }
    if (elCusto) elCusto.innerText = formatMoney(custoTotal);
    if (elTotal) elTotal.innerText = formatMoney(totalCobrar);
    if (elLucro) elLucro.innerText = formatMoney(lucro);
    if (elMargem) elMargem.innerText = `${margem}%`;

    calcularTrocoPdv();
}

function finalizarVenda(e) {
    if (e) e.preventDefault();

    if (pdvItens.length === 0) {
        showToast("Adicione pelo menos um item ao pedido!", "warning");
        return;
    }

    const canalRadio = document.querySelector('input[name="canal-venda"]:checked');
    const canal = canalRadio ? canalRadio.value : 'balcao';
    
    const clienteInput = document.getElementById('pdv-cliente');
    const cliente = clienteInput && clienteInput.value.trim() ? clienteInput.value.trim() : (canal === 'balcao' ? 'Cliente Balcão' : (canal === 'ifood' ? 'Pedido iFood' : 'Cliente WhatsApp'));
    
    const telefoneInput = document.getElementById('pdv-cliente-telefone');
    const telefone = telefoneInput ? telefoneInput.value.trim() : '';

    const obsInput = document.getElementById('pdv-obs');
    const obs = obsInput ? obsInput.value.trim() : '';

    const pagamentoRadio = document.querySelector('input[name="pdv-pagamento"]:checked');
    const formaPagamento = pagamentoRadio ? pagamentoRadio.value : 'Pix';

    const recebidoInput = document.getElementById('pdv-valor-recebido');
    const valorRecebido = recebidoInput ? (parseFloat(recebidoInput.value) || 0) : 0;

    const subtotal = pdvItens.reduce((a, i) => a + (i.preco * i.qtd), 0);
    const custoDoces = pdvItens.reduce((a, i) => a + (i.custo * i.qtd), 0);

    let taxaEntregaOuApp = 0;
    if (canal === 'whatsapp') {
        const selectKm = document.getElementById('pdv-select-km');
        taxaEntregaOuApp = selectKm ? (parseFloat(selectKm.value) || 0) : 0;
    } else if (canal === 'ifood') {
        const rateInput = document.getElementById('pdv-ifood-rate');
        const rate = rateInput ? (parseFloat(rateInput.value) || 0) : 0;
        taxaEntregaOuApp = subtotal * (rate / 100);
    }

    const descontoInput = document.getElementById('pdv-desconto');
    const desconto = descontoInput ? (parseFloat(descontoInput.value) || 0) : 0;

    const totalBruto = Math.max(0, subtotal + (canal === 'whatsapp' ? taxaEntregaOuApp : 0) - desconto);
    const troco = formaPagamento === 'Dinheiro' && valorRecebido > totalBruto ? (valorRecebido - totalBruto) : 0;
    const lucro = totalBruto - (custoDoces + (canal === 'ifood' ? taxaEntregaOuApp : 0));

    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const novaVenda = {
        id: Date.now(),
        data: dataFormatada,
        canal,
        cliente,
        telefone,
        obs,
        formaPagamento,
        valorRecebido,
        troco,
        desconto,
        itens: JSON.parse(JSON.stringify(pdvItens)),
        subtotal,
        taxaOuFrete: taxaEntregaOuApp,
        totalBruto,
        custoDoces,
        lucro
    };

    vendas.unshift(novaVenda);
    saveData();

    vendaSelecionada = novaVenda;
    pdvItens = [];
    if (clienteInput) clienteInput.value = '';
    if (telefoneInput) telefoneInput.value = '';
    if (obsInput) obsInput.value = '';
    if (descontoInput) descontoInput.value = '';
    if (recebidoInput) recebidoInput.value = '';

    renderPdvItens();
    renderHistorico();
    renderDashboard();

    showToast(`Venda #${novaVenda.id.toString().slice(-4)} finalizada com sucesso! 💖`, "success");
    abrirModalComprovante(novaVenda.id);
}

// ==========================================
// MÓDULO: TAXAS DE FRETE
// ==========================================

function abrirModalNovaFaixaKM() {
    document.getElementById('modal-frete-id').value = "";
    document.getElementById('modal-km-min').value = "";
    document.getElementById('modal-km-max').value = "";
    document.getElementById('modal-km-valor').value = "";
    document.getElementById('modal-flutuante-frete').classList.remove('hidden');
}

function abrirModalEdicaoFaixaKM(id) {
    const f = faixasKM.find(item => item.id === id);
    if (!f) return;

    document.getElementById('modal-frete-id').value = f.id;
    document.getElementById('modal-km-min').value = f.min;
    document.getElementById('modal-km-max').value = f.max;
    document.getElementById('modal-km-valor').value = f.valor;
    document.getElementById('modal-flutuante-frete').classList.remove('hidden');
}

function fecharModalFaixaKM() {
    document.getElementById('modal-flutuante-frete').classList.add('hidden');
}

function salvarFaixaKMModal(e) {
    e.preventDefault();
    const idVal = document.getElementById('modal-frete-id').value;
    const min = parseFloat(document.getElementById('modal-km-min').value) || 0;
    const max = parseFloat(document.getElementById('modal-km-max').value) || 0;
    const valor = parseFloat(document.getElementById('modal-km-valor').value) || 0;

    if (idVal) {
        const id = parseInt(idVal);
        const idx = faixasKM.findIndex(f => f.id === id);
        if (idx >= 0) {
            faixasKM[idx].min = min;
            faixasKM[idx].max = max;
            faixasKM[idx].valor = valor;
            showToast("Faixa de frete atualizada!", "success");
        }
    } else {
        faixasKM.push({ id: Date.now(), min, max, valor });
        showToast(`Faixa ${min} a ${max} KM cadastrada!`, "success");
    }

    faixasKM.sort((a, b) => a.min - b.min);
    saveData();
    fecharModalFaixaKM();
    renderFaixasKM();
}

function duplicarFaixaKM(id) {
    const f = faixasKM.find(item => item.id === id);
    if (!f) return;

    const copia = {
        ...JSON.parse(JSON.stringify(f)),
        id: Date.now(),
        min: f.max,
        max: f.max + (f.max - f.min)
    };

    faixasKM.push(copia);
    faixasKM.sort((a, b) => a.min - b.min);
    saveData();
    renderFaixasKM();
    showToast("Faixa duplicada com sucesso!", "success");
}

function removerFaixaKM(id) {
    faixasKM = faixasKM.filter(f => f.id !== id);
    saveData();
    renderFaixasKM();
    showToast("Faixa de frete removida.", "info");
}

function renderFaixasKM() {
    const tbody = document.getElementById('km-table-body');
    const select = document.getElementById('pdv-select-km');
    if (!tbody) return;

    if (faixasKM.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Nenhuma faixa de frete cadastrada.</td></tr>`;
    } else {
        tbody.innerHTML = faixasKM.map(f => `
            <tr>
                <td class="p-3 font-semibold text-slate-800 text-xs">Raio de ${f.min} até ${f.max} KM</td>
                <td class="p-3 text-center text-slate-600 text-xs">${f.min} KM</td>
                <td class="p-3 text-center text-slate-600 text-xs">${f.max} KM</td>
                <td class="p-3 text-right font-bold text-rose-600 text-xs">${formatMoney(f.valor)}</td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button type="button" onclick="abrirModalEdicaoFaixaKM(${f.id})" class="btn-card-action btn-card-edit" title="Editar">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" onclick="duplicarFaixaKM(${f.id})" class="btn-card-action btn-card-duplicate" title="Duplicar">
                            <i class="fa-solid fa-copy"></i>
                        </button>
                        <button type="button" onclick="removerFaixaKM(${f.id})" class="btn-card-action btn-card-delete" title="Excluir">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    if (select) {
        select.innerHTML = faixasKM.map(f => `
            <option value="${f.valor}">Raio de ${f.min} até ${f.max} KM — Taxa: ${formatMoney(f.valor)}</option>
        `).join('');
        atualizarResumoPdv();
    }
}

// ==========================================
// MÓDULO: GERENCIAMENTO DE TAXAS DE FRETE & BAIRROS (LORENA - SP)
// ==========================================

function renderTabelasFreteAdmin() {
    if (typeof FreteDelivery === 'undefined') return;
    const { tabelaKm, taxaBaseLonga, adicionalPorKm, zonasBairros } = FreteDelivery.getConfiguracoes();

    // 1. Renderizar tabela de KM
    const tbodyKm = document.getElementById('tabela-regras-km-body');
    if (tbodyKm) {
        let htmlKm = tabelaKm.map(f => `
            <tr>
                <td class="p-2.5 font-medium text-slate-800">${f.rotulo}</td>
                <td class="p-2.5 text-right font-black text-[#ab4e5e]">R$ ${f.valor.toFixed(2).replace('.', ',')}</td>
            </tr>
        `).join('');

        htmlKm += `
            <tr class="bg-amber-50/50">
                <td class="p-2.5 font-bold text-amber-900">Acima de 8.0 km</td>
                <td class="p-2.5 text-right font-black text-amber-900">R$ ${taxaBaseLonga.toFixed(2).replace('.', ',')} + R$ ${adicionalPorKm.toFixed(2).replace('.', ',')} / km extra</td>
            </tr>
        `;
        tbodyKm.innerHTML = htmlKm;
    }

    // 2. Renderizar Zonas e Bairros
    const containerZonas = document.getElementById('container-zonas-bairros');
    if (containerZonas) {
        const coresZona = {
            1: { bg: 'bg-emerald-50', border: 'border-emerald-200', textTitle: 'text-emerald-900', badge: 'bg-emerald-200/80', desc: 'text-emerald-800' },
            2: { bg: 'bg-blue-50', border: 'border-blue-200', textTitle: 'text-blue-900', badge: 'bg-blue-200/80', desc: 'text-blue-800' },
            3: { bg: 'bg-amber-50', border: 'border-amber-200', textTitle: 'text-amber-900', badge: 'bg-amber-200/80', desc: 'text-amber-800' },
            4: { bg: 'bg-rose-50', border: 'border-rose-200', textTitle: 'text-rose-900', badge: 'bg-rose-200/80', desc: 'text-rose-800' }
        };

        containerZonas.innerHTML = zonasBairros.map(z => {
            const c = coresZona[z.zona] || coresZona[1];
            return `
                <div class="p-2.5 rounded-xl ${c.bg} border ${c.border}">
                    <div class="flex items-center justify-between font-bold ${c.textTitle} mb-1">
                        <span>${z.nome} (R$ ${z.valor.toFixed(2).replace('.', ',')})</span>
                        <span class="text-[10px] ${c.badge} px-2 py-0.5 rounded-full font-bold">Zona ${z.zona}</span>
                    </div>
                    <p class="text-[11px] ${c.desc} leading-relaxed">${z.bairros.join(', ')}</p>
                </div>
            `;
        }).join('');
    }
}

function abrirModalEditarTaxasFrete() {
    if (typeof FreteDelivery === 'undefined') return;
    const { tabelaKm, adicionalPorKm, zonasBairros } = FreteDelivery.getConfiguracoes();

    // Preencher faixas KM
    tabelaKm.forEach((f, idx) => {
        const input = document.getElementById(`cfg-frete-km-${idx + 1}`);
        if (input) input.value = f.valor.toFixed(2);
    });

    const inputExtra = document.getElementById('cfg-frete-km-extra');
    if (inputExtra) inputExtra.value = adicionalPorKm.toFixed(2);

    // Preencher Zonas e Bairros
    zonasBairros.forEach(z => {
        const inputVal = document.getElementById(`cfg-frete-zona-${z.zona}`);
        if (inputVal) inputVal.value = z.valor.toFixed(2);

        const inputBairros = document.getElementById(`cfg-frete-bairros-${z.zona}`);
        if (inputBairros) inputBairros.value = z.bairros.join(', ');
    });

    document.getElementById('modal-editar-taxas-frete').classList.remove('hidden');
}

function fecharModalEditarTaxasFrete() {
    const modal = document.getElementById('modal-editar-taxas-frete');
    if (modal) modal.classList.add('hidden');
}

function salvarModalTaxasFrete(e) {
    if (e) e.preventDefault();
    if (typeof FreteDelivery === 'undefined') return;

    const { tabelaKm, zonasBairros } = FreteDelivery.getConfiguracoes();

    // 1. Atualizar valores das faixas KM
    const novaTabelaKm = tabelaKm.map((f, idx) => {
        const val = parseFloat(document.getElementById(`cfg-frete-km-${idx + 1}`)?.value) || f.valor;
        return { ...f, valor: val };
    });

    const novoAdicionalPorKm = parseFloat(document.getElementById('cfg-frete-km-extra')?.value) || 2.00;
    const taxaBaseLonga = novaTabelaKm[novaTabelaKm.length - 1]?.valor || 15.00;

    // 2. Atualizar Zonas e Bairros adicionados/editados pelo lojista
    const novasZonasBairros = zonasBairros.map(z => {
        const val = parseFloat(document.getElementById(`cfg-frete-zona-${z.zona}`)?.value) || z.valor;
        const bairrosStr = document.getElementById(`cfg-frete-bairros-${z.zona}`)?.value || '';
        const bairrosArray = bairrosStr.split(',')
            .map(b => b.trim())
            .filter(b => b.length > 0);

        return {
            ...z,
            valor: val,
            bairros: bairrosArray.length > 0 ? bairrosArray : z.bairros
        };
    });

    FreteDelivery.salvarConfiguracoes({
        tabelaKm: novaTabelaKm,
        taxaBaseLonga,
        adicionalPorKm: novoAdicionalPorKm,
        zonasBairros: novasZonasBairros
    });

    renderTabelasFreteAdmin();
    fecharModalEditarTaxasFrete();
    showToast('✅ Taxas de entrega e bairros atualizados com sucesso!', 'success');
}

function restaurarTaxasFretePadrao() {
    if (!confirm('Deseja restaurar as taxas oficiais de entrega e bairros de Lorena para os valores padrão?')) return;
    localStorage.removeItem('ds_regras_frete_lorena');
    if (typeof CloudSync !== 'undefined' && CloudSync.pushToCloud) {
        CloudSync.pushToCloud('restaurar-frete');
    }
    abrirModalEditarTaxasFrete();
    renderTabelasFreteAdmin();
    showToast('Taxas restauradas para o padrão oficial.', 'info');
}

// ==========================================
// MÓDULO: FINANCEIRO
// ==========================================

function abrirModalNovaConta() {
    document.getElementById('modal-conta-id').value = "";
    document.getElementById('modal-conta-desc').value = "";
    document.getElementById('modal-conta-tipo').value = "pagar";
    document.getElementById('modal-conta-valor').value = "";
    document.getElementById('modal-conta-data').value = new Date().toISOString().slice(0, 10);
    document.getElementById('modal-flutuante-financeiro').classList.remove('hidden');
}

function abrirModalEdicaoConta(id) {
    const c = contas.find(item => item.id === id);
    if (!c) return;

    document.getElementById('modal-conta-id').value = c.id;
    document.getElementById('modal-conta-desc').value = c.desc;
    document.getElementById('modal-conta-tipo').value = c.tipo;
    document.getElementById('modal-conta-valor').value = c.valor;
    document.getElementById('modal-conta-data').value = c.data;
    document.getElementById('modal-flutuante-financeiro').classList.remove('hidden');
}

function fecharModalConta() {
    document.getElementById('modal-flutuante-financeiro').classList.add('hidden');
}

function salvarContaModal(e) {
    e.preventDefault();
    const idVal = document.getElementById('modal-conta-id').value;
    const desc = document.getElementById('modal-conta-desc').value.trim();
    const tipo = document.getElementById('modal-conta-tipo').value;
    const valor = parseFloat(document.getElementById('modal-conta-valor').value) || 0;
    const data = document.getElementById('modal-conta-data').value;

    if (!desc) {
        showToast("Informe a descrição da conta!", "warning");
        return;
    }

    if (idVal) {
        const id = parseInt(idVal);
        const idx = contas.findIndex(c => c.id === id);
        if (idx >= 0) {
            contas[idx].desc = desc;
            contas[idx].tipo = tipo;
            contas[idx].valor = valor;
            contas[idx].data = data;
            showToast("Lançamento financeiro atualizado!", "success");
        }
    } else {
        contas.unshift({ id: Date.now(), desc, tipo, valor, data, status: 'Pendente' });
        showToast("Lançamento financeiro adicionado!", "success");
    }

    saveData();
    fecharModalConta();
    renderContas();
}

function duplicarConta(id) {
    const original = contas.find(c => c.id === id);
    if (!original) return;

    const copia = {
        ...JSON.parse(JSON.stringify(original)),
        id: Date.now(),
        desc: `${original.desc} (Cópia)`
    };

    contas.unshift(copia);
    saveData();
    renderContas();
    showToast("Conta duplicada com sucesso!", "success");
}

function alternarStatusConta(id) {
    const conta = contas.find(c => c.id === id);
    if (conta) {
        conta.status = conta.status === 'Pago' ? 'Pendente' : 'Pago';
        saveData();
        renderContas();
        showToast(`Conta marcada como ${conta.status}!`, "info");
    }
}

function removerConta(id) {
    contas = contas.filter(c => c.id !== id);
    saveData();
    renderContas();
    showToast("Lançamento removido.", "info");
}

function renderContas() {
    const tbody = document.getElementById('finance-table-body');
    if (!tbody) return;

    if (contas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">Nenhuma conta cadastrada.</td></tr>`;
    } else {
        tbody.innerHTML = contas.map(c => `
            <tr>
                <td class="p-3 font-semibold text-slate-800 text-xs">${c.desc}</td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.tipo === 'pagar' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
                        ${c.tipo === 'pagar' ? 'A PAGAR' : 'A RECEBER'}
                    </span>
                </td>
                <td class="p-3 text-slate-600 text-xs">${c.data}</td>
                <td class="p-3 text-right font-bold text-slate-800 text-xs">${formatMoney(c.valor)}</td>
                <td class="p-3 text-center">
                    <button onclick="alternarStatusConta(${c.id})" class="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${c.status === 'Pago' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}">
                        ${c.status || 'Pendente'}
                    </button>
                </td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button type="button" onclick="abrirModalEdicaoConta(${c.id})" class="btn-card-action btn-card-edit" title="Editar">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" onclick="duplicarConta(${c.id})" class="btn-card-action btn-card-duplicate" title="Duplicar">
                            <i class="fa-solid fa-copy"></i>
                        </button>
                        <button type="button" onclick="removerConta(${c.id})" class="btn-card-action btn-card-delete" title="Excluir">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    const totalPagar = contas.filter(c => c.tipo === 'pagar' && c.status === 'Pendente').reduce((a, c) => a + c.valor, 0);
    const totalReceber = contas.filter(c => c.tipo === 'receber' && c.status === 'Pendente').reduce((a, c) => a + c.valor, 0);

    const elPagar = document.getElementById('summary-pagar');
    const elReceber = document.getElementById('summary-receber');
    if (elPagar) elPagar.innerText = formatMoney(totalPagar);
    if (elReceber) elReceber.innerText = formatMoney(totalReceber);
}

// ==========================================
// MÓDULO: HISTÓRICO DE VENDAS & COMPROVANTE
// ==========================================

function removerVenda(id) {
    if (confirm("Deseja realmente remover esta venda do histórico?")) {
        vendas = vendas.filter(v => v.id !== id);
        saveData();
        renderHistorico();
        renderDashboard();
        showToast("Venda removida do histórico.", "info");
    }
}

function renderHistorico() {
    const tbody = document.getElementById('history-table-body');
    const badgeTotal = document.getElementById('history-total-badge');
    if (!tbody) return;

    if (badgeTotal) badgeTotal.innerText = `${vendas.length} vendas registradas`;

    if (vendas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">Nenhuma venda registrada ainda.</td></tr>`;
        return;
    }

    tbody.innerHTML = vendas.map(v => {
        const badgeMap = {
            'balcao': '<span class="bg-[#fcecee] text-[#ab4e5e] border border-[#f0c9d0] px-2 py-0.5 rounded-full text-[10px] font-bold"><i class="fa-solid fa-shop mr-1"></i>Balcão</span>',
            'whatsapp': '<span class="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold"><i class="fa-brands fa-whatsapp mr-1"></i>WhatsApp</span>',
            'ifood': '<span class="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold"><i class="fa-solid fa-utensils mr-1"></i>iFood</span>'
        };
        const itensText = (v.itens || []).map(i => `${i.qtd}x ${i.nome}`).join(', ');

        return `
            <tr class="hover:bg-[#fff9fa] transition-colors">
                <td class="p-3 font-medium text-slate-600 text-xs">${v.data}</td>
                <td class="p-3">${badgeMap[v.canal] || v.canal}</td>
                <td class="p-3 text-xs">
                    <p class="font-bold text-slate-900">${v.cliente || 'Cliente'}</p>
                    <p class="text-slate-500 max-w-xs truncate" title="${itensText}">${itensText}</p>
                </td>
                <td class="p-3 text-right font-bold text-slate-900 text-xs">${formatMoney(v.totalBruto)}</td>
                <td class="p-3 text-right text-rose-600 text-xs">${formatMoney((v.custoDoces || 0) + (v.taxaOuFrete || 0))}</td>
                <td class="p-3 text-right font-bold text-xs ${v.lucro >= 0 ? 'text-emerald-600' : 'text-rose-600'}">${formatMoney(v.lucro)}</td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="abrirModalComprovante(${v.id})" class="btn-card-action btn-card-edit text-emerald-700" title="Ver Comprovante / WhatsApp">
                            <i class="fa-solid fa-receipt"></i>
                        </button>
                        <button onclick="removerVenda(${v.id})" class="btn-card-action btn-card-delete" title="Excluir Venda">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function abrirModalComprovante(id) {
    const venda = vendas.find(v => v.id === id);
    if (!venda) return;
    vendaSelecionada = venda;

    const modal = document.getElementById('modal-comprovante');
    const container = document.getElementById('comprovante-content');
    if (!modal || !container) return;

    const canalNome = {
        'balcao': 'Balcão da Loja',
        'whatsapp': 'WhatsApp Delivery',
        'ifood': 'iFood'
    }[venda.canal] || venda.canal;

    container.innerHTML = `
        <div class="text-center pb-3 border-b border-dashed border-[#eec2c8]">
            <img src="img/logo.png" alt="Da Silva Doceria" class="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-[#c58a80]">
            <h3 class="font-extrabold text-[#2e171e] text-base tracking-wide font-brand">Da Silva Doceria</h3>
            <p class="text-[11px] text-[#b17369] font-semibold tracking-wider">• D O C E R I A •</p>
            <p class="text-[10px] text-slate-400 mt-1">Pedido #${venda.id.toString().slice(-4)} • ${venda.data}</p>
        </div>

        <div class="py-2.5 border-b border-dashed border-[#eec2c8] text-xs space-y-1">
            <div class="flex justify-between">
                <span class="text-slate-500">Canal:</span>
                <span class="font-bold text-slate-800">${canalNome}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-slate-500">Cliente:</span>
                <span class="font-bold text-slate-800">${venda.cliente || 'Balcão'}</span>
            </div>
            ${venda.telefone ? `
                <div class="flex justify-between">
                    <span class="text-slate-500">WhatsApp:</span>
                    <span class="font-semibold text-slate-700">${venda.telefone}</span>
                </div>
            ` : ''}
            <div class="flex justify-between">
                <span class="text-slate-500">Pagamento:</span>
                <span class="font-bold text-[#ab4e5e]">${venda.formaPagamento || 'Pix'}</span>
            </div>
        </div>

        <div class="py-2.5 border-b border-dashed border-[#eec2c8] text-xs">
            <p class="font-bold text-[#b17369] mb-1.5 uppercase text-[10px] tracking-wider">Itens do Pedido:</p>
            <div class="space-y-1">
                ${venda.itens.map(i => `
                    <div class="flex justify-between items-start gap-2">
                        <span class="text-slate-700">${i.qtd}x ${i.nome}</span>
                        <span class="font-bold text-slate-900 whitespace-nowrap">${formatMoney(i.preco * i.qtd)}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="pt-2.5 text-xs space-y-1.5">
            <div class="flex justify-between">
                <span class="text-slate-500">Subtotal:</span>
                <span class="font-semibold text-slate-700">${formatMoney(venda.subtotal || venda.totalBruto)}</span>
            </div>
            ${venda.canal === 'whatsapp' && (venda.taxaOuFrete > 0) ? `
                <div class="flex justify-between">
                    <span class="text-slate-500">Taxa de Frete:</span>
                    <span class="font-semibold text-emerald-700">+ ${formatMoney(venda.taxaOuFrete)}</span>
                </div>
            ` : ''}
            ${venda.desconto > 0 ? `
                <div class="flex justify-between text-rose-600">
                    <span>Desconto Concedido:</span>
                    <span class="font-bold">- ${formatMoney(venda.desconto)}</span>
                </div>
            ` : ''}
            <div class="flex justify-between text-base font-extrabold text-[#2e171e] pt-1.5 border-t border-slate-200">
                <span>TOTAL:</span>
                <span class="text-[#ab4e5e]">${formatMoney(venda.totalBruto)}</span>
            </div>
            ${venda.formaPagamento === 'Dinheiro' && venda.valorRecebido > 0 ? `
                <div class="flex justify-between text-[11px] text-slate-600 pt-1">
                    <span>Valor Recebido:</span>
                    <span>${formatMoney(venda.valorRecebido)}</span>
                </div>
                <div class="flex justify-between text-[11px] font-bold text-emerald-700">
                    <span>Troco a Devolver:</span>
                    <span>${formatMoney(venda.troco || 0)}</span>
                </div>
            ` : ''}
            ${venda.obs ? `
                <div class="pt-2 text-[10px] text-slate-500 bg-[#fff8f9] p-2 rounded-xl border border-[#faedf0]">
                    <span class="font-bold text-[#ab4e5e] block uppercase">Obs do Pedido:</span>
                    <p class="italic">${venda.obs}</p>
                </div>
            ` : ''}
        </div>

        <div class="text-center pt-3 text-[11px] text-[#b17369]">
            <p>Obrigado por adoçar seu dia com a gente! 💖✨</p>
        </div>
    `;

    modal.classList.remove('hidden');
}

function fecharModalComprovante() {
    document.getElementById('modal-comprovante').classList.add('hidden');
}

function enviarWhatsAppComprovante() {
    if (!vendaSelecionada) return;
    const v = vendaSelecionada;

    const itensFormatados = v.itens.map(i => `• ${i.qtd}x ${i.nome} (${formatMoney(i.preco * i.qtd)})`).join('%0A');

    let msg = `🍰 *DA SILVA DOCERIA* 🍰%0A`;
    msg += `*Pedido #%20${v.id.toString().slice(-4)}*%0A`;
    msg += `Data: ${v.data}%0A`;
    msg += `Cliente: ${v.cliente || 'Balcão'}%0A`;
    msg += `Canal: ${v.canal.toUpperCase()}%0A`;
    msg += `Pagamento: ${v.formaPagamento || 'Pix'}%0A%0A`;
    msg += `📋 *ITENS DO PEDIDO:*%0A${itensFormatados}%0A%0A`;
    msg += `Subtotal: ${formatMoney(v.subtotal || v.totalBruto)}%0A`;
    if (v.canal === 'whatsapp' && v.taxaOuFrete > 0) {
        msg += `Taxa de Frete: ${formatMoney(v.taxaOuFrete)}%0A`;
    }
    if (v.desconto > 0) {
        msg += `Desconto: - ${formatMoney(v.desconto)}%0A`;
    }
    msg += `*TOTAL: ${formatMoney(v.totalBruto)}*%0A`;
    if (v.formaPagamento === 'Dinheiro' && v.valorRecebido > 0) {
        msg += `Valor Recebido: ${formatMoney(v.valorRecebido)}%0A`;
        msg += `Troco: ${formatMoney(v.troco || 0)}%0A`;
    }
    if (v.obs) {
        msg += `%0A📝 *Observações:* ${v.obs}%0A`;
    }
    msg += `%0AMuito obrigado por adoçar o seu dia com a Da Silva Doceria! 💖✨`;

    const phoneClean = (v.telefone || '').replace(/\D/g, '');
    let url = '';
    if (phoneClean && phoneClean.length >= 10) {
        const fullPhone = phoneClean.startsWith('55') ? phoneClean : `55${phoneClean}`;
        url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${msg}`;
    } else {
        url = `https://api.whatsapp.com/send?text=${msg}`;
    }
    window.open(url, '_blank');
}

function imprimirComprovante() {
    const conteudo = document.getElementById('comprovante-content');
    const printArea = document.getElementById('print-cupom-area');
    if (conteudo && printArea) {
        printArea.innerHTML = conteudo.innerHTML;
        printArea.classList.remove('hidden');
        window.print();
        setTimeout(() => {
            printArea.classList.add('hidden');
        }, 500);
    } else {
        window.print();
    }
}

// ==========================================
// MÓDULO: DASHBOARD & INDICADORES
// ==========================================

function renderDashboard() {
    const totalBruto = vendas.reduce((acc, v) => acc + (v.totalBruto || 0), 0);
    const totalCustos = vendas.reduce((acc, v) => acc + (v.custoDoces || 0) + (v.taxaOuFrete || 0), 0);
    const totalLucro = vendas.reduce((acc, v) => acc + (v.lucro || 0), 0);

    const elFaturamento = document.getElementById('dash-faturamento');
    const elCustos = document.getElementById('dash-custos');
    const elLucro = document.getElementById('dash-lucro');
    const elPedidos = document.getElementById('dash-pedidos');
    const elMargem = document.getElementById('dash-margem');

    if (elFaturamento) elFaturamento.innerText = formatMoney(totalBruto);
    if (elCustos) elCustos.innerText = formatMoney(totalCustos);
    if (elLucro) elLucro.innerText = formatMoney(totalLucro);
    if (elPedidos) elPedidos.innerText = vendas.length;

    const margem = totalBruto > 0 ? ((totalLucro / totalBruto) * 100).toFixed(1) : 0;
    if (elMargem) elMargem.innerText = `${margem}%`;

    const balcaoFat = vendas.filter(v => v.canal === 'balcao').reduce((acc, v) => acc + v.totalBruto, 0);
    const whatsFat = vendas.filter(v => v.canal === 'whatsapp').reduce((acc, v) => acc + v.totalBruto, 0);
    const ifoodFat = vendas.filter(v => v.canal === 'ifood').reduce((acc, v) => acc + v.totalBruto, 0);

    const elBalcao = document.getElementById('channel-balcao');
    const elWhats = document.getElementById('channel-whats');
    const elIfood = document.getElementById('channel-ifood');

    if (elBalcao) elBalcao.innerText = formatMoney(balcaoFat);
    if (elWhats) elWhats.innerText = formatMoney(whatsFat);
    if (elIfood) elIfood.innerText = formatMoney(ifoodFat);

    renderRankingDoces();
}

function renderRankingDoces() {
    const container = document.getElementById('dash-top-doces');
    if (!container) return;

    const contagem = {};
    vendas.forEach(v => {
        (v.itens || []).forEach(i => {
            if (!contagem[i.nome]) {
                contagem[i.nome] = { nome: i.nome, qtd: 0, total: 0 };
            }
            contagem[i.nome].qtd += i.qtd;
            contagem[i.nome].total += (i.preco * i.qtd);
        });
    });

    const ordenados = Object.values(contagem).sort((a, b) => b.qtd - a.qtd).slice(0, 5);

    if (ordenados.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 py-3 text-center">Nenhuma venda registrada ainda.</p>`;
        return;
    }

    const maxQtd = ordenados[0].qtd || 1;

    container.innerHTML = ordenados.map((item, index) => {
        const pct = Math.round((item.qtd / maxQtd) * 100);
        return `
            <div class="space-y-1.5">
                <div class="flex justify-between items-center text-xs">
                    <span class="font-medium text-slate-700 truncate max-w-[200px]">#${index + 1} ${item.nome}</span>
                    <span class="font-bold text-slate-900">${item.qtd} un. <span class="text-slate-400 font-normal">(${formatMoney(item.total)})</span></span>
                </div>
                <div class="w-full bg-[#fde8ed] rounded-full h-2 overflow-hidden">
                    <div class="bg-gradient-to-r from-[#d88190] to-[#b86070] h-2 rounded-full" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

function renderAll() {
    renderCategorias();
    renderCatalogoDoces();
    renderPdvCatalogo();
    renderPdvItens();
    renderInsumos();
    renderFaixasKM();
    renderTabelasFreteAdmin();
    renderContas();
    renderHistorico();
    renderDashboard();
}

window.addEventListener('DOMContentLoaded', () => {
    renderAll();
    if (typeof CloudSync !== 'undefined' && CloudSync.init) {
        CloudSync.init();
    }
});
