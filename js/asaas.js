/**
 * Fomek Delivery - Módulo Oficial de Pagamentos Asaas & Pix Inteligente
 * Suporta:
 * 1. Integração Direta com Asaas (Cobrança Pix Dinâmica, QR Code Oficial, Copia e Cola e Polling de Confirmação)
 * 2. Fallback Automático com Chave Pix EMV Banco Central (Caso o sistema esteja no GitHub Pages sem backend ativo)
 * 3. Notificações Visuais e de Áudio
 */

const AsaasPagamento = {
    // Configurações salvas no Gestor
    getConfig() {
        let cfgLoja = {};
        try {
            cfgLoja = JSON.parse(localStorage.getItem('ds_config_loja') || '{}');
        } catch (e) {}

        return {
            token: localStorage.getItem('ds_asaas_token') || cfgLoja.asaasToken || '',
            ambiente: localStorage.getItem('ds_asaas_env') || cfgLoja.asaasEnv || 'producao', // 'producao' ou 'sandbox'
            apiUrl: localStorage.getItem('ds_asaas_api_url') || cfgLoja.asaasApiUrl || '/api/asaas',
            chavePix: localStorage.getItem('ds_chave_pix') || cfgLoja.chavePix || cfgLoja.whatsapp || 'doceria@fomek.com',
            nomeRecebedor: cfgLoja.nomeLoja || 'Da Silva Doceria',
            cidadeRecebedor: cfgLoja.cidade || 'Lorena'
        };
    },

    // Salvar configurações a partir do Gestor
    salvarConfig(token, ambiente, chavePix, apiUrl) {
        if (token !== undefined) localStorage.setItem('ds_asaas_token', token.trim());
        if (ambiente !== undefined) localStorage.setItem('ds_asaas_env', ambiente);
        if (chavePix !== undefined) localStorage.setItem('ds_chave_pix', chavePix.trim());
        if (apiUrl !== undefined) localStorage.setItem('ds_asaas_api_url', apiUrl.trim());
    },

    // 1. GERAR COBRANÇA PIX (ASAAS OU EMV FALLBACK)
    async gerarCobrancaPix({ pedidoId, cliente, valor, itens }) {
        const config = this.getConfig();
        const valorFormatado = parseFloat(valor);

        // Se houver token do Asaas configurado, tentar gerar cobrança dinâmica oficial
        if (config.token && config.token.length > 10) {
            try {
                const response = await fetch(`${config.apiUrl}?action=criar-cobranca`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'access_token': config.token,
                        'x-asaas-env': config.ambiente
                    },
                    body: JSON.stringify({
                        pedidoId,
                        cliente,
                        valor: valorFormatado,
                        descricao: `Pedido #${pedidoId} - Fomek Delivery`
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.success && data.pix) {
                        return {
                            tipo: 'asaas',
                            paymentId: data.paymentId,
                            status: data.status || 'PENDING',
                            qrCodeImg: data.pix.encodedImage ? `data:image/png;base64,${data.pix.encodedImage}` : this.gerarUrlQrCode(data.pix.payload),
                            copiaCola: data.pix.payload,
                            expiracao: data.pix.expirationDate,
                            valor: valorFormatado
                        };
                    }
                }
            } catch (err) {
                console.warn('[Asaas] Backend não alcançado ou erro na API. Usando chave Pix direta como fallback.', err);
            }
        }

        // 2. FALLBACK INTELIGENTE: Gerar Pix EMV Oficial do Banco Central direto no Frontend
        // Garante que o cliente SEMPRE consiga pagar via Pix mesmo no GitHub Pages sem backend!
        const payloadEmv = this.gerarPayloadPixEMV({
            chave: config.chavePix,
            beneficiario: config.nomeRecebedor.substring(0, 25),
            cidade: config.cidadeRecebedor.substring(0, 15),
            valor: valorFormatado,
            identificador: `PED${String(pedidoId).slice(-6)}`
        });

        return {
            tipo: 'emv_direto',
            paymentId: `PIX_${pedidoId}`,
            status: 'PENDING',
            qrCodeImg: this.gerarUrlQrCode(payloadEmv),
            copiaCola: payloadEmv,
            valor: valorFormatado
        };
    },

    // 2. CONSULTAR STATUS DA COBRANÇA NO ASAAS
    async consultarStatus(paymentId) {
        if (!paymentId || paymentId.startsWith('PIX_')) {
            return { pago: false, status: 'PENDING' };
        }

        const config = this.getConfig();
        if (!config.token) return { pago: false, status: 'PENDING' };

        try {
            const res = await fetch(`${config.apiUrl}?action=consultar-status&id=${paymentId}`, {
                headers: {
                    'access_token': config.token,
                    'x-asaas-env': config.ambiente
                }
            });

            if (res.ok) {
                const data = await res.json();
                return data; // { success: true, status: 'RECEIVED'|'CONFIRMED'|'PENDING', pago: boolean }
            }
        } catch (e) {
            console.warn('[Asaas] Erro ao consultar status:', e);
        }

        return { pago: false, status: 'PENDING' };
    },

    // 3. GERADOR DE PAYLOAD PIX EMV DO BANCO CENTRAL (BR CODE PADRÃO BACEN)
    gerarPayloadPixEMV({ chave, beneficiario, cidade, valor, identificador }) {
        // Formata chave limpa
        const chaveLimpa = chave.replace(/\s+/g, '');
        const nomeLimpo = beneficiario.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const cidadeLimpa = cidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const txid = (identificador || '***').replace(/[^a-zA-Z0-9]/g, '');

        function formatTLV(id, value) {
            const len = value.length.toString().padStart(2, '0');
            return `${id}${len}${value}`;
        }

        // ID 00: Payload Format Indicator
        let payload = formatTLV('00', '01');

        // ID 26: Merchant Account Information - Pix
        const gui = formatTLV('00', 'br.gov.bcb.pix');
        const key = formatTLV('01', chaveLimpa);
        payload += formatTLV('26', `${gui}${key}`);

        // ID 52: Merchant Category Code
        payload += formatTLV('52', '0000');

        // ID 53: Transaction Currency (986 = BRL)
        payload += formatTLV('53', '986');

        // ID 54: Transaction Amount
        if (valor && valor > 0) {
            payload += formatTLV('54', valor.toFixed(2));
        }

        // ID 58: Country Code
        payload += formatTLV('58', 'BR');

        // ID 59: Merchant Name
        payload += formatTLV('59', nomeLimpo.slice(0, 25));

        // ID 60: Merchant City
        payload += formatTLV('60', cidadeLimpa.slice(0, 15));

        // ID 62: Additional Data Field (TXID)
        const addTxId = formatTLV('05', txid || '***');
        payload += formatTLV('62', addTxId);

        // ID 63: CRC16
        payload += '6304';
        const crc = this.calcularCRC16(payload);
        return payload + crc;
    },

    // Algoritmo CRC16-CCITT (Polinômio 0x1021)
    calcularCRC16(payload) {
        let crc = 0xFFFF;
        for (let i = 0; i < payload.length; i++) {
            crc ^= (payload.charCodeAt(i) << 8);
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x8000) !== 0) {
                    crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
                } else {
                    crc = (crc << 1) & 0xFFFF;
                }
            }
        }
        return crc.toString(16).toUpperCase().padStart(4, '0');
    },

    // URL para renderizar o QR Code rapidamente
    gerarUrlQrCode(texto) {
        return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(texto)}`;
    },

    // Copiar código Copia e Cola para a área de transferência
    async copiarPix(texto) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(texto);
            } else {
                const ta = document.createElement('textarea');
                ta.value = texto;
                ta.style.position = 'fixed';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
            return true;
        } catch (e) {
            return false;
        }
    }
};

if (typeof window !== 'undefined') {
    window.AsaasPagamento = AsaasPagamento;
}
