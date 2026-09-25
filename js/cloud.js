/**
 * Da Silva Doceria - Módulo de Sincronização em Nuvem & Backup Multi-Dispositivo
 * Gerencia a sincronização bidirecional entre Computador e Celular,
 * armazenamento em nuvem em tempo real, snapshots automáticos e prevenção de perda de dados.
 */

const CloudSync = {
    // Estado interno
    syncKey: localStorage.getItem('ds_cloud_sync_key') || 'dasilva-doceria-oficial',
    cloudObjectId: localStorage.getItem('ds_cloud_object_id') || 'ff808181a09d98f701a0d1c6e4d30409',
    firebaseConfig: JSON.parse(localStorage.getItem('ds_firebase_config') || 'null'),
    deviceId: null,
    deviceName: null,
    isSyncing: false,
    lastSyncTime: localStorage.getItem('ds_last_sync_time') || null,
    syncInterval: null,
    firebaseApp: null,
    firebaseDb: null,
    onlineStatus: navigator.onLine,

    // Inicialização do módulo
    init() {
        this.initDevice();
        this.initFirebase();
        this.initNetworkListeners();
        this.updateUiStatus();

        // 1. Puxar dados da nuvem logo no carregamento
        setTimeout(() => {
            this.pullFromCloud(true);
        }, 1200);

        // 2. Sincronização periódica a cada 20 segundos
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = setInterval(() => {
            if (document.visibilityState === 'visible' && !this.isSyncing) {
                this.pullFromCloud(true);
            }
        }, 20000);

        // 3. Sincronizar imediatamente quando a tela do celular for desbloqueada ou a aba do PC receber foco
        window.addEventListener('focus', () => {
            if (!this.isSyncing) this.pullFromCloud(true);
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !this.isSyncing) {
                this.pullFromCloud(true);
            }
        });
    },

    // Identificação do dispositivo atual (PC ou Celular)
    initDevice() {
        let id = localStorage.getItem('ds_device_id');
        if (!id) {
            id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
            localStorage.setItem('ds_device_id', id);
        }
        this.deviceId = id;

        // Detectar se é celular ou computador
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.deviceName = isMobile ? 'Celular' : 'Computador';
    },

    // Inicializar Firebase se configurado
    initFirebase() {
        if (!this.firebaseConfig) return;
        try {
            if (typeof firebase !== 'undefined') {
                if (!firebase.apps.length) {
                    this.firebaseApp = firebase.initializeApp(this.firebaseConfig);
                } else {
                    this.firebaseApp = firebase.app();
                }

                // Usar Realtime Database para sincronia em tempo real
                if (typeof firebase.database === 'function') {
                    this.firebaseDb = firebase.database();
                    const ref = this.firebaseDb.ref(`lojas/${this.syncKey}`);

                    // Escuta alterações em tempo real (qualquer mudança no celular reflete no PC na hora)
                    ref.on('value', (snapshot) => {
                        const cloudData = snapshot.val();
                        if (cloudData && cloudData.deviceId !== this.deviceId) {
                            console.log('Recebida atualização em tempo real do Firebase:', cloudData);
                            this.mergeCloudData(cloudData, 'tempo-real');
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('Erro ao inicializar Firebase:', e);
        }
    },

    // Monitorar conexão de rede
    initNetworkListeners() {
        window.addEventListener('online', () => {
            this.onlineStatus = true;
            this.updateUiStatus();
            showToast('Conexão restabelecida! Sincronizando com a nuvem...', 'info');
            this.pushToCloud('reconectado');
        });

        window.addEventListener('offline', () => {
            this.onlineStatus = false;
            this.updateUiStatus('offline', 'Modo Offline (Salvo localmente)');
            showToast('Sem conexão. Dados seguros salvos no aparelho!', 'warning');
        });
    },

    // Snapshot local automático (prevenção máxima de perda de dados)
    createLocalSnapshot() {
        try {
            const snapshots = JSON.parse(localStorage.getItem('ds_snapshots') || '[]');
            const snapshot = {
                timestamp: new Date().toISOString(),
                dataHora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                totalProdutos: (produtos || []).length,
                totalVendas: (vendas || []).length,
                totalInsumos: (insumos || []).length,
                payload: {
                    produtos: produtos,
                    categorias: categorias,
                    insumos: insumos,
                    faixasKM: faixasKM,
                    contas: contas,
                    vendas: vendas
                }
            };

            // Manter os últimos 6 snapshots
            snapshots.unshift(snapshot);
            if (snapshots.length > 6) snapshots.pop();
            localStorage.setItem('ds_snapshots', JSON.stringify(snapshots));
        } catch (e) {
            console.warn('Erro ao gerar snapshot local:', e);
        }
    },

    // Montar pacote de dados atual da loja
    getStorePayload() {
        return {
            versao: "2.3",
            syncKey: this.syncKey,
            deviceId: this.deviceId,
            deviceName: this.deviceName,
            updatedAt: new Date().toISOString(),
            produtos: produtos || [],
            categorias: categorias || [],
            insumos: insumos || [],
            faixasKM: faixasKM || [],
            contas: contas || [],
            vendas: vendas || []
        };
    },

    // ENVIAR DADOS PARA A NUVEM (Push)
    async pushToCloud(motivo = 'alteracao') {
        if (!navigator.onLine) {
            this.updateUiStatus('offline', 'Salvo no aparelho (Offline)');
            return;
        }

        this.isSyncing = true;
        this.updateUiStatus('syncing', 'Enviando para nuvem...');
        this.createLocalSnapshot();

        const payload = this.getStorePayload();

        try {
            // 1. Enviar para Firebase se configurado
            if (this.firebaseDb) {
                await this.firebaseDb.ref(`lojas/${this.syncKey}`).set(payload);
            }

            // 2. Enviar para o Cloud Storage API REST (Redundância garantida)
            if (this.cloudObjectId) {
                const response = await fetch(`https://api.restful-api.dev/objects/${this.cloudObjectId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: `Da Silva Doceria - ${this.syncKey}`,
                        data: payload
                    })
                });

                if (!response.ok && response.status === 404) {
                    // Se o objeto não existir mais, criar um novo automaticamente
                    const createRes = await fetch('https://api.restful-api.dev/objects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: `Da Silva Doceria - ${this.syncKey}`,
                            data: payload
                        })
                    });
                    const created = await createRes.json();
                    if (created && created.id) {
                        this.cloudObjectId = created.id;
                        localStorage.setItem('ds_cloud_object_id', created.id);
                    }
                }
            }

            this.lastSyncTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            localStorage.setItem('ds_last_sync_time', this.lastSyncTime);
            localStorage.setItem('ds_last_cloud_updated', payload.updatedAt);
            this.updateUiStatus('synced', `Salvo na Nuvem • ${this.lastSyncTime}`);
        } catch (err) {
            console.error('Erro ao enviar dados para nuvem:', err);
            this.updateUiStatus('offline', 'Salvo no dispositivo (Erro na nuvem)');
        } finally {
            this.isSyncing = false;
        }
    },

    // PUXAR DADOS DA NUVEM (Pull)
    async pullFromCloud(isBackground = false) {
        if (!navigator.onLine) {
            this.updateUiStatus('offline', 'Modo Offline (Salvo local)');
            return;
        }

        if (!isBackground) {
            this.updateUiStatus('syncing', 'Buscando da nuvem...');
        }

        try {
            let cloudData = null;

            // 1. Tentar ler do Firebase se ativo
            if (this.firebaseDb) {
                const snapshot = await this.firebaseDb.ref(`lojas/${this.syncKey}`).once('value');
                cloudData = snapshot.val();
            }

            // 2. Tentar ler do Cloud Storage REST
            if (!cloudData && this.cloudObjectId) {
                try {
                    const res = await fetch(`https://api.restful-api.dev/objects/${this.cloudObjectId}`);
                    if (res.ok) {
                        const json = await res.json();
                        if (json && json.data && json.data.syncKey === this.syncKey) {
                            cloudData = json.data;
                        }
                    } else if (res.status === 404 || res.status === 405) {
                        this.cloudObjectId = null;
                        localStorage.removeItem('ds_cloud_object_id');
                    }
                } catch(e) {
                    // Ignorar oscilações de rede
                }
            }

            if (cloudData) {
                const merged = this.mergeCloudData(cloudData, isBackground ? 'background' : 'manual');
                this.lastSyncTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                localStorage.setItem('ds_last_sync_time', this.lastSyncTime);
                this.updateUiStatus('synced', `Sincronizado • ${this.lastSyncTime}`);
                if (!isBackground) {
                    showToast('Dados sincronizados com a nuvem com sucesso! ☁️✨', 'success');
                }
            } else if (!isBackground) {
                // Primeira vez: subir dados locais
                await this.pushToCloud('primeira-carga');
                showToast('Banco de dados da loja criado e salvo na nuvem!', 'success');
            }
        } catch (err) {
            console.error('Erro ao puxar dados da nuvem:', err);
            if (!isBackground) {
                showToast('Não foi possível conectar à nuvem no momento. Seus dados estão seguros no aparelho!', 'warning');
            }
            this.updateUiStatus('offline', 'Salvo no dispositivo');
        }
    },

    // MERGE INTELIGENTE DE DADOS (Evita qualquer perda de vendas ou produtos)
    mergeCloudData(cloudData, origem = 'sync') {
        if (!cloudData) return false;

        let houveMudanca = false;
        const localUpdated = localStorage.getItem('ds_last_cloud_updated') || '';
        const cloudUpdated = cloudData.updatedAt || '';

        // Se os dados da nuvem vieram de outro aparelho ou forem mais recentes:
        // 1. Mesclar Vendas (União de IDs únicos - nenhuma venda é perdida)
        if (Array.isArray(cloudData.vendas)) {
            const vendasMap = new Map();
            (vendas || []).forEach(v => vendasMap.set(v.id, v));
            
            let novasVendas = 0;
            cloudData.vendas.forEach(v => {
                if (!vendasMap.has(v.id)) {
                    vendasMap.set(v.id, v);
                    novasVendas++;
                    houveMudanca = true;
                }
            });

            if (novasVendas > 0) {
                vendas = Array.from(vendasMap.values()).sort((a, b) => (b.id || 0) - (a.id || 0));
                localStorage.setItem('ds_vendas', JSON.stringify(vendas));
            }
        }

        // 2. Mesclar Produtos do Cardápio
        if (Array.isArray(cloudData.produtos) && cloudData.produtos.length > 0) {
            const prodMap = new Map();
            (produtos || []).forEach(p => prodMap.set(p.id, p));

            // Se a nuvem tem versão mais recente, adotar produtos da nuvem
            if (cloudUpdated > localUpdated || produtos.length < cloudData.produtos.length) {
                cloudData.produtos.forEach(p => prodMap.set(p.id, p));
                produtos = Array.from(prodMap.values());
                localStorage.setItem('ds_produtos_v2', JSON.stringify(produtos));
                houveMudanca = true;
            }
        }

        // 3. Mesclar Insumos
        if (Array.isArray(cloudData.insumos)) {
            const insumoMap = new Map();
            (insumos || []).forEach(i => insumoMap.set(i.id, i));
            if (cloudUpdated > localUpdated || insumos.length < cloudData.insumos.length) {
                cloudData.insumos.forEach(i => insumoMap.set(i.id, i));
                insumos = Array.from(insumoMap.values());
                localStorage.setItem('ds_insumos', JSON.stringify(insumos));
                houveMudanca = true;
            }
        }

        // 4. Mesclar Contas Financeiras
        if (Array.isArray(cloudData.contas)) {
            const contasMap = new Map();
            (contas || []).forEach(c => contasMap.set(c.id, c));
            cloudData.contas.forEach(c => {
                if (!contasMap.has(c.id)) {
                    contasMap.set(c.id, c);
                    houveMudanca = true;
                }
            });
            if (houveMudanca) {
                contas = Array.from(contasMap.values()).sort((a, b) => (b.id || 0) - (a.id || 0));
                localStorage.setItem('ds_contas', JSON.stringify(contas));
            }
        }

        // 5. Mesclar Categorias
        if (Array.isArray(cloudData.categorias)) {
            const conjunto = new Set([...categorias, ...cloudData.categorias]);
            if (conjunto.size !== categorias.length) {
                categorias = Array.from(conjunto);
                localStorage.setItem('ds_categorias', JSON.stringify(categorias));
                houveMudanca = true;
            }
        }

        // 6. Mesclar Faixas de Frete
        if (Array.isArray(cloudData.faixasKM) && cloudData.faixasKM.length > 0) {
            if (cloudUpdated > localUpdated) {
                faixasKM = cloudData.faixasKM;
                localStorage.setItem('ds_faixasKM', JSON.stringify(faixasKM));
                houveMudanca = true;
            }
        }

        if (houveMudanca) {
            localStorage.setItem('ds_last_cloud_updated', cloudUpdated);
            renderAll();
            if (origem !== 'background') {
                showToast(`Dados atualizados do outro aparelho (${cloudData.deviceName || 'Nuvem'})! ☁️`, 'info');
            }
        }

        return houveMudanca;
    },

    // Atualizar indicadores visuais no cabeçalho e na barra lateral
    updateUiStatus(status = 'synced', label = null) {
        const textDesktop = document.getElementById('cloud-status-text-desktop');
        const dotDesktop = document.getElementById('cloud-status-dot-desktop');
        const dotMobile = document.getElementById('cloud-status-dot-mobile');
        const sidebarStatus = document.getElementById('cloud-status-sidebar');

        const isOnline = navigator.onLine && status !== 'offline';
        const displayLabel = label || (isOnline ? `Nuvem Conectada • ${this.lastSyncTime || 'Agora'}` : 'Salvo no Aparelho (Offline)');

        if (textDesktop) textDesktop.innerText = displayLabel;

        const dotClasses = {
            synced: 'bg-emerald-500',
            syncing: 'bg-amber-400 animate-spin',
            offline: 'bg-rose-500'
        };

        const activeClass = dotClasses[status] || dotClasses.synced;

        if (dotDesktop) {
            dotDesktop.className = `w-2.5 h-2.5 rounded-full ${activeClass} ${status === 'synced' ? 'animate-pulse' : ''}`;
        }
        if (dotMobile) {
            dotMobile.className = `absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${activeClass} border-2 border-white`;
        }
        if (sidebarStatus) {
            sidebarStatus.innerHTML = `
                <span class="w-2.5 h-2.5 rounded-full ${activeClass}"></span>
                <span class="font-medium text-[#4a2d36] text-[11px]">${displayLabel}</span>
            `;
        }
    },

    // Salvar configuração de chave da nuvem (Código da Loja)
    salvarChaveNuvem(novaChave) {
        if (!novaChave || !novaChave.trim()) return;
        this.syncKey = novaChave.trim().toLowerCase().replace(/\s+/g, '-');
        localStorage.setItem('ds_cloud_sync_key', this.syncKey);
        showToast(`Chave da loja alterada para: ${this.syncKey}`, 'info');
        this.pushToCloud('troca-chave');
    },

    // Salvar credenciais do Firebase
    salvarFirebaseConfig(configStr) {
        try {
            const cfg = JSON.parse(configStr);
            if (!cfg.apiKey || !cfg.projectId) {
                alert('A configuração do Firebase precisa conter ao menos apiKey e projectId.');
                return;
            }
            this.firebaseConfig = cfg;
            localStorage.setItem('ds_firebase_config', JSON.stringify(cfg));
            this.initFirebase();
            showToast('Firebase conectado com sucesso à Da Silva Doceria!', 'success');
            this.pushToCloud('firebase-setup');
        } catch (e) {
            alert('JSON de configuração do Firebase inválido. Verifique o formato copiado.');
        }
    },

    // Restaurar um snapshot automático local
    restaurarSnapshot(index) {
        const snapshots = JSON.parse(localStorage.getItem('ds_snapshots') || '[]');
        const snap = snapshots[index];
        if (!snap || !snap.payload) return;

        if (confirm(`Deseja restaurar a cópia de segurança salva em ${snap.dataHora}?`)) {
            const d = snap.payload;
            if (d.produtos) produtos = d.produtos;
            if (d.categorias) categorias = d.categorias;
            if (d.insumos) insumos = d.insumos;
            if (d.faixasKM) faixasKM = d.faixasKM;
            if (d.contas) contas = d.contas;
            if (d.vendas) vendas = d.vendas;

            saveData();
            renderAll();
            showToast(`Cópia das ${snap.dataHora} restaurada com sucesso!`, 'success');
            fecharModalNuvem();
        }
    }
};

// Funções de Interface do Modal de Nuvem
function abrirModalNuvem() {
    const modal = document.getElementById('modal-flutuante-nuvem');
    if (!modal) return;

    // Atualizar campos do modal
    const inputKey = document.getElementById('modal-nuvem-chave');
    const inputFb = document.getElementById('modal-nuvem-firebase');
    const spanDevice = document.getElementById('modal-nuvem-device');
    const spanLast = document.getElementById('modal-nuvem-last-sync');
    const spanTotals = document.getElementById('modal-nuvem-totals');
    const listaSnapshots = document.getElementById('modal-nuvem-lista-snapshots');

    if (inputKey) inputKey.value = CloudSync.syncKey;
    if (inputFb) inputFb.value = CloudSync.firebaseConfig ? JSON.stringify(CloudSync.firebaseConfig, null, 2) : '';
    if (spanDevice) spanDevice.innerText = `${CloudSync.deviceName} (${CloudSync.deviceId.slice(0, 10)}...)`;
    if (spanLast) spanLast.innerText = CloudSync.lastSyncTime ? `Última sincronia: ${CloudSync.lastSyncTime}` : 'Ainda não sincronizado hoje';
    if (spanTotals) {
        spanTotals.innerText = `${produtos.length} doces, ${vendas.length} vendas, ${insumos.length} insumos e ${contas.length} lançamentos.`;
    }

    // Renderizar histórico de snapshots
    if (listaSnapshots) {
        const snapshots = JSON.parse(localStorage.getItem('ds_snapshots') || '[]');
        if (snapshots.length === 0) {
            listaSnapshots.innerHTML = `<p class="text-xs text-slate-400 italic">Nenhum snapshot automático recente.</p>`;
        } else {
            listaSnapshots.innerHTML = snapshots.map((s, idx) => `
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#fff8f9] border border-[#faedf0] text-xs">
                    <div>
                        <span class="font-bold text-[#4a2d36]">${s.dataHora}</span>
                        <span class="text-[11px] text-slate-500 block">${s.totalProdutos} doces • ${s.totalVendas} vendas</span>
                    </div>
                    <button type="button" onclick="CloudSync.restaurarSnapshot(${idx})" class="px-2.5 py-1 bg-white hover:bg-[#fde8ed] text-[#ab4e5e] border border-[#f0c9d0] rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs">
                        Restaurar
                    </button>
                </div>
            `).join('');
        }
    }

    modal.classList.remove('hidden');
}

function fecharModalNuvem() {
    const modal = document.getElementById('modal-flutuante-nuvem');
    if (modal) modal.classList.add('hidden');
}

function salvarConfigNuvemModal(e) {
    if (e) e.preventDefault();
    const inputKey = document.getElementById('modal-nuvem-chave');
    const inputFb = document.getElementById('modal-nuvem-firebase');

    if (inputKey && inputKey.value) {
        CloudSync.salvarChaveNuvem(inputKey.value);
    }
    if (inputFb && inputFb.value.trim()) {
        CloudSync.salvarFirebaseConfig(inputFb.value.trim());
    }

    showToast('Configurações salvas e nuvem sincronizada! ☁️', 'success');
    fecharModalNuvem();
}

function sincronizarAgoraManual() {
    showToast('Sincronizando celular e computador...', 'info');
    CloudSync.pushToCloud('manual-btn').then(() => {
        CloudSync.pullFromCloud(false);
    });
}
