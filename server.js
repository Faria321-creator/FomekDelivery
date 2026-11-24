/**
 * Servidor Local Node.js Opcional (Zero Dependências)
 * Permite rodar o projeto localmente com backend do Asaas ativo:
 * Execute: node server.js
 * Acesse: http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const asaasHandler = require('./api/asaas.js');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json'
};

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = parsedUrl.pathname;

    // Rota da API Asaas
    if (pathname === '/api/asaas' || pathname.startsWith('/api/asaas')) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            if (body) {
                try { req.body = JSON.parse(body); } catch(e) { req.body = {}; }
            } else {
                req.body = {};
            }

            // Simular métodos helper de resposta Express/Vercel
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => {
                res.setHeader('Content-Type', 'application/json; charset=UTF-8');
                res.end(JSON.stringify(data));
                return res;
            };

            await asaasHandler(req, res);
        });
        return;
    }

    // Servir arquivos estáticos
    if (pathname === '/' || pathname === '') {
        pathname = '/index.html';
    }

    const filePath = path.join(__dirname, pathname);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            res.end('<h1>404 - Página não encontrada</h1>');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🍰 FOMEK DELIVERY & GESTOR RODANDO!`);
    console.log(`📱 Cardápio do Cliente: http://localhost:${PORT}`);
    console.log(`💼 Painel do Gestor:    http://localhost:${PORT}/gestor.html`);
    console.log(`💳 API Asaas Integrada: http://localhost:${PORT}/api/asaas`);
    console.log(`===============================================`);
});
