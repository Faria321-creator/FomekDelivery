/**
 * Asaas Integration API Handler (Vercel Serverless Function & Node.js Compatible)
 * Endpoints suportados:
 * - POST /api/asaas?action=criar-cobranca
 * - GET  /api/asaas?action=consultar-status&id=PAYMENT_ID
 * - POST /api/asaas?action=webhook
 */

const https = require('https');

function requestAsaas(method, path, apiKey, isSandbox, data = null) {
    return new Promise((resolve, reject) => {
        const host = isSandbox ? 'sandbox.asaas.com' : 'api.asaas.com';
        const payload = data ? JSON.stringify(data) : null;

        const options = {
            hostname: host,
            port: 443,
            path: `/v3${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'access_token': apiKey,
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body || '{}');
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: { raw: body } });
                }
            });
        });

        req.on('error', (err) => reject(err));
        if (payload) req.write(payload);
        req.end();
    });
}

module.exports = async (req, res) => {
    // Habilitar CORS para permitir requisições do frontend (GitHub Pages, localhost, etc.)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token, x-asaas-env');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const action = url.searchParams.get('action') || (req.body && req.body.action);

        // Obter chave Asaas dos headers ou variáveis de ambiente
        const apiKey = req.headers['access_token'] || process.env.ASAAS_API_KEY || (req.body && req.body.apiKey);
        const isSandbox = req.headers['x-asaas-env'] === 'sandbox' || process.env.ASAAS_ENV === 'sandbox' || (req.body && req.body.isSandbox);

        // 1. CRIAR COBRANÇA PIX
        if (action === 'criar-cobranca' && req.method === 'POST') {
            if (!apiKey) {
                return res.status(400).json({ error: 'Chave de API do Asaas não configurada.' });
            }

            const { pedidoId, cliente, valor, descricao } = req.body || {};
            if (!valor || valor <= 0) {
                return res.status(400).json({ error: 'Valor da cobrança inválido.' });
            }

            // A. Criar ou buscar cliente no Asaas
            const nomeCliente = (cliente && cliente.nome) ? cliente.nome.trim() : 'Cliente Fomek Delivery';
            const telCliente = (cliente && cliente.telefone) ? cliente.telefone.replace(/\D/g, '') : '';
            const cpfCliente = (cliente && cliente.cpf) ? cliente.cpf.replace(/\D/g, '') : null;

            let customerId = null;
            try {
                const customerRes = await requestAsaas('POST', '/customers', apiKey, isSandbox, {
                    name: nomeCliente,
                    mobilePhone: telCliente || undefined,
                    cpfCnpj: cpfCliente || undefined
                });

                if (customerRes.data && customerRes.data.id) {
                    customerId = customerRes.data.id;
                }
            } catch (err) {
                console.warn('Aviso ao criar cliente no Asaas:', err);
            }

            if (!customerId) {
                // Tenta buscar o primeiro cliente ou usa padrão
                const listCust = await requestAsaas('GET', '/customers?limit=1', apiKey, isSandbox);
                if (listCust.data && listCust.data.data && listCust.data.data.length > 0) {
                    customerId = listCust.data.data[0].id;
                }
            }

            if (!customerId) {
                return res.status(500).json({ error: 'Não foi possível vincular cliente no Asaas.' });
            }

            // B. Criar a cobrança PIX no Asaas
            const hoje = new Date();
            const vencimento = hoje.toISOString().split('T')[0];

            const paymentPayload = {
                customer: customerId,
                billingType: 'PIX',
                value: parseFloat(valor.toFixed ? valor.toFixed(2) : valor),
                dueDate: vencimento,
                description: descricao || `Pedido #${pedidoId || Date.now()} - Fomek Delivery`,
                externalReference: String(pedidoId || Date.now()),
                postalService: false
            };

            const paymentRes = await requestAsaas('POST', '/payments', apiKey, isSandbox, paymentPayload);

            if (!paymentRes.data || !paymentRes.data.id) {
                return res.status(paymentRes.status || 400).json({
                    error: 'Erro ao gerar cobrança no Asaas',
                    detalhes: paymentRes.data
                });
            }

            const paymentId = paymentRes.data.id;

            // C. Obter o QR Code e código Copia e Cola do PIX
            const qrRes = await requestAsaas('GET', `/payments/${paymentId}/pixQrCode`, apiKey, isSandbox);

            return res.status(200).json({
                success: true,
                paymentId: paymentId,
                pedidoId: pedidoId,
                status: paymentRes.data.status, // PENDING
                valor: paymentRes.data.value,
                invoiceUrl: paymentRes.data.invoiceUrl,
                pix: {
                    encodedImage: qrRes.data ? qrRes.data.encodedImage : null,
                    payload: qrRes.data ? qrRes.data.payload : null,
                    expirationDate: qrRes.data ? qrRes.data.expirationDate : null
                }
            });
        }

        // 2. CONSULTAR STATUS DA COBRANÇA
        if (action === 'consultar-status') {
            const paymentId = url.searchParams.get('id') || (req.body && req.body.paymentId);
            if (!paymentId) {
                return res.status(400).json({ error: 'paymentId não informado' });
            }
            if (!apiKey) {
                return res.status(400).json({ error: 'Chave de API do Asaas não configurada' });
            }

            const checkRes = await requestAsaas('GET', `/payments/${paymentId}`, apiKey, isSandbox);
            if (!checkRes.data || !checkRes.data.id) {
                return res.status(checkRes.status || 400).json({ error: 'Cobrança não encontrada', detalhes: checkRes.data });
            }

            const st = checkRes.data.status;
            const pago = (st === 'RECEIVED' || st === 'CONFIRMED' || st === 'RECEIVED_IN_CASH');

            return res.status(200).json({
                success: true,
                paymentId: checkRes.data.id,
                status: st,
                pago: pago,
                valor: checkRes.data.value,
                confirmedDate: checkRes.data.confirmedDate || checkRes.data.paymentDate
            });
        }

        // 3. WEBHOOK RECEBIDO DO ASAAS
        if (action === 'webhook' && req.method === 'POST') {
            const evento = req.body;
            console.log('[Asaas Webhook] Evento recebido:', evento ? evento.event : null);

            // Retorna 200 OK imediatamente para o Asaas confirmar recebimento
            return res.status(200).json({
                received: true,
                event: evento ? evento.event : null,
                paymentId: evento && evento.payment ? evento.payment.id : null,
                status: evento && evento.payment ? evento.payment.status : null
            });
        }

        return res.status(400).json({
            error: 'Ação não reconhecida. Use action=criar-cobranca ou action=consultar-status'
        });

    } catch (err) {
        console.error('Erro na API Asaas:', err);
        return res.status(500).json({ error: 'Erro interno no servidor', message: err.message });
    }
};
