/**
 * Da Silva Doceria - Módulo Oficial de Cálculo de Frete & Rota para Motoboy
 * Ponto de Origem: Avenida José Moreira Miguel, 733 - Condomínio Morada Lorena, Jardim Primavera, Lorena - SP
 * Coordenadas de Origem (KM 0): lat -22.7598663, lon -45.1360812
 */

const FreteDelivery = {
    // 1. DADOS DA LOJA / ORIGEM (KM 0)
    origem: {
        nome: "Da Silva Doceria",
        enderecoCompleto: "Avenida José Moreira Miguel, 733 - Condomínio Morada Lorena, Jardim Primavera, Lorena - SP",
        logradouro: "Avenida José Moreira Miguel, 733",
        bairro: "Jardim Primavera",
        cidade: "Lorena",
        uf: "SP",
        cep: "12610-520",
        lat: -22.7598663,
        lon: -45.1360812
    },

    // 2. REGRAS DE PREÇO POR DISTÂNCIA REAL (MENOR ROTA DE TRÁFEGO OSRM)
    tabelaKmPadrao: [
        { id: 1, min: 0.0, max: 2.0, valor: 6.50, rotulo: "Até 2.0 km" },
        { id: 2, min: 2.1, max: 3.0, valor: 7.50, rotulo: "2.1 a 3.0 km" },
        { id: 3, min: 3.1, max: 4.0, valor: 9.00, rotulo: "3.1 a 4.0 km" },
        { id: 4, min: 4.1, max: 5.0, valor: 10.50, rotulo: "4.1 a 5.0 km" },
        { id: 5, min: 5.1, max: 6.0, valor: 12.00, rotulo: "5.1 a 6.0 km" },
        { id: 6, min: 6.1, max: 8.0, valor: 15.00, rotulo: "6.1 a 8.0 km" }
    ],
    taxaBaseLongaPadrao: 15.00,
    kmBaseLongaPadrao: 8.0,
    adicionalPorKmPadrao: 2.00,

    // 3. TABELA FALLBACK: MAPEAMENTO DE BAIRROS DE LORENA-SP
    zonasBairrosPadrao: [
        {
            zona: 1,
            nome: "Zona 1 (Próximo à Loja)",
            valor: 6.50,
            bairros: [
                "Jardim Primavera",
                "Loteamento Lorena Village",
                "Loteamento Campos dos Ipês",
                "Vila Brito",
                "Vila Nunes"
            ]
        },
        {
            zona: 2,
            nome: "Zona 2 (Intermediária / Central)",
            valor: 8.50,
            bairros: [
                "Centro",
                "Cruz",
                "CECAP",
                "Cabelinha",
                "Olaria",
                "Aterrado",
                "Campinho",
                "Madre Mazzarello",
                "Vila Passos",
                "Vila Cristina"
            ]
        },
        {
            zona: 3,
            nome: "Zona 3 (Afastada / Periferia)",
            valor: 11.00,
            bairros: [
                "Parque Mondesir",
                "Cidade Industrial",
                "Parque das Rodovias",
                "Vila Geny",
                "Chácaras Reunidas Portugal",
                "Colinas de Lorena",
                "Matadouro Velho"
            ]
        },
        {
            zona: 4,
            nome: "Zona 4 (Perímetro / Rural)",
            valor: 15.00,
            bairros: [
                "Ponte Nova",
                "Santa Lucrécia",
                "Sapé",
                "Zona Rural"
            ]
        }
    ],

    // Carregar configurações editadas pelo lojista (se houver)
    getConfiguracoes() {
        try {
            const salvas = localStorage.getItem('ds_regras_frete_lorena');
            if (salvas) {
                const parsed = JSON.parse(salvas);
                return {
                    tabelaKm: parsed.tabelaKm || this.tabelaKmPadrao,
                    taxaBaseLonga: parsed.taxaBaseLonga !== undefined ? parsed.taxaBaseLonga : this.taxaBaseLongaPadrao,
                    adicionalPorKm: parsed.adicionalPorKm !== undefined ? parsed.adicionalPorKm : this.adicionalPorKmPadrao,
                    zonasBairros: parsed.zonasBairros || this.zonasBairrosPadrao
                };
            }
        } catch (e) {
            console.warn('Erro ao ler configurações de frete:', e);
        }
        return {
            tabelaKm: this.tabelaKmPadrao,
            taxaBaseLonga: this.taxaBaseLongaPadrao,
            adicionalPorKm: this.adicionalPorKmPadrao,
            zonasBairros: this.zonasBairrosPadrao
        };
    },

    salvarConfiguracoes(novasRegras) {
        localStorage.setItem('ds_regras_frete_lorena', JSON.stringify(novasRegras));
        // Sincronizar na nuvem se disponível
        if (typeof CloudSync !== 'undefined' && CloudSync.pushToCloud) {
            CloudSync.pushToCloud('regras-frete');
        }
    },

    // Normalizador de texto para busca sem acentos e minúsculo
    normalizarTexto(str) {
        if (!str) return "";
        return str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    },

    // Buscar taxa por nome do bairro de Lorena (Fallback Instantâneo)
    calcularPorBairro(bairroInformado) {
        if (!bairroInformado) return null;
        const norm = this.normalizarTexto(bairroInformado);
        const { zonasBairros } = this.getConfiguracoes();

        for (const zona of zonasBairros) {
            for (const b of zona.bairros) {
                const bNorm = this.normalizarTexto(b);
                if (norm === bNorm || norm.includes(bNorm) || bNorm.includes(norm)) {
                    return {
                        zona: zona.zona,
                        nomeZona: zona.nome,
                        bairroOficial: b,
                        valor: zona.valor
                    };
                }
            }
        }
        return null;
    },

    // Calcular taxa a partir da quilometragem (Regra oficial)
    calcularPorDistanciaKm(km) {
        const distancia = Math.max(0, parseFloat(km) || 0);
        const { tabelaKm, taxaBaseLonga, adicionalPorKm } = this.getConfiguracoes();

        // Faixas de 0 a 8.0 km
        for (const faixa of tabelaKm) {
            if (distancia >= faixa.min && distancia <= faixa.max) {
                return {
                    taxa: faixa.valor,
                    faixa: faixa.rotulo,
                    distanciaKm: distancia
                };
            }
        }

        // Acima de 8.0 km: Base + adicional a cada km extra
        const kmExtra = distancia - this.kmBaseLongaPadrao;
        const adicionais = Math.ceil(kmExtra);
        const taxaCalculada = taxaBaseLonga + (adicionais * adicionalPorKm);

        return {
            taxa: taxaCalculada,
            faixa: `Acima de 8 km (+${adicionais} km extras)`,
            distanciaKm: distancia
        };
    },

    // Geocodificar endereço do cliente usando OpenStreetMap Nominatim
    async geocodificar(enderecoTexto) {
        const query = `${enderecoTexto}, Lorena, SP, Brasil`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}&countrycodes=br`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const res = await fetch(url, {
                headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'DaSilvaDoceria/2.0' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) return null;
            const data = await res.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon),
                    display: data[0].display_name
                };
            }
        } catch (e) {
            // Falha de rede ou timeout
        }
        return null;
    },

    // Calcular menor rota de tráfego usando OSRM Routing Engine (Distance Matrix real para motos)
    async calcularRotaOSRM(latDest, lonDest) {
        const lonOrig = this.origem.lon;
        const latOrig = this.origem.lat;
        const url = `https://router.project-osrm.org/route/v1/driving/${lonOrig},${latOrig};${lonDest},${latDest}?overview=false`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) return null;
            const data = await res.json();
            if (data && data.code === "Ok" && data.routes && data.routes.length > 0) {
                const metros = data.routes[0].distance;
                const km = Math.round((metros / 1000) * 10) / 10;
                const segundos = data.routes[0].duration;
                const tempoMin = Math.ceil(segundos / 60);
                return { km, tempoMin };
            }
        } catch (e) {
            // OSRM indisponível ou timeout
        }
        return null;
    },

    // Distância Haversine (linha reta com fator de correção urbano 1.28x)
    calcularDistanciaHaversine(lat2, lon2) {
        const lat1 = this.origem.lat;
        const lon1 = this.origem.lon;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        const linhaReta = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const rotaEstimada = Math.round((linhaReta * 1.28) * 10) / 10;
        return Math.max(0.5, rotaEstimada);
    },

    // FUNÇÃO PRINCIPAL: CALCULAR TAXA AUTOMÁTICA
    async calcularTaxaEntrega(dadosEndereco) {
        const { rua = "", numero = "", bairro = "", cidade = "Lorena" } = dadosEndereco || {};
        const enderecoLinha = `${rua} ${numero}, ${bairro}, ${cidade}`.trim();

        // 1. Tentar mapeamento por bairro como resposta prioritária rápida
        const matchBairro = this.calcularPorBairro(bairro);

        // 2. Tentar rota dinâmica por GPS / Distance Matrix se houver rua informada
        if (rua && rua.trim().length >= 3) {
            try {
                const coords = await this.geocodificar(enderecoLinha);
                if (coords) {
                    let rota = await this.calcularRotaOSRM(coords.lat, coords.lon);
                    let distKm = rota ? rota.km : this.calcularDistanciaHaversine(coords.lat, coords.lon);

                    const calculoKm = this.calcularPorDistanciaKm(distKm);

                    return {
                        sucesso: true,
                        taxa: calculoKm.taxa,
                        distanciaKm: distKm,
                        tempoEstimadoMin: rota ? rota.tempoMin : Math.ceil(distKm * 3.5 + 5),
                        metodo: rota ? "gps-rota-real" : "gps-estimado",
                        faixaDescricao: calculoKm.faixa,
                        detalhe: `Distância calculada: ~${distKm.toFixed(1)} km`,
                        linkMapsMotoboy: this.gerarLinkGoogleMaps(coords.lat, coords.lon, enderecoLinha)
                    };
                }
            } catch (err) {
                // Se falhar o GPS, segue para o fallback por bairro
            }
        }

        // 3. Fallback: Bairro de Lorena (Mapeamento Oficial da Loja)
        if (matchBairro) {
            return {
                sucesso: true,
                taxa: matchBairro.valor,
                distanciaKm: null,
                tempoEstimadoMin: matchBairro.zona * 8 + 10,
                metodo: "bairro-tabela",
                faixaDescricao: `${matchBairro.nomeZona} - Bairro ${matchBairro.bairroOficial}`,
                detalhe: `Taxa da ${matchBairro.nomeZona} (${matchBairro.bairroOficial})`,
                linkMapsMotoboy: this.gerarLinkGoogleMapsPorTexto(enderecoLinha)
            };
        }

        // 4. Se o cliente digitou um bairro que NÃO está na tabela (e GPS não achou):
        // Solicita contato com a loja para combinar a taxa
        if (bairro && bairro.trim().length >= 2) {
            return {
                sucesso: false,
                bairroNaoCadastrado: true,
                bairroDigitado: bairro.trim(),
                taxa: 0,
                distanciaKm: null,
                tempoEstimadoMin: 45,
                metodo: "a-combinar",
                faixaDescricao: "Bairro não cadastrado (Taxa a combinar)",
                detalhe: "Bairro ainda não cadastrado. Combine a taxa conosco no WhatsApp!",
                linkMapsMotoboy: this.gerarLinkGoogleMapsPorTexto(enderecoLinha)
            };
        }

        // 5. Se ainda não digitou bairro nem rua:
        return {
            sucesso: true,
            taxa: 0,
            distanciaKm: null,
            tempoEstimadoMin: 30,
            metodo: "aguardando-bairro",
            faixaDescricao: "Digite seu endereço",
            detalhe: "Preencha a rua e o bairro para calcular a taxa.",
            linkMapsMotoboy: this.gerarLinkGoogleMapsPorTexto(enderecoLinha)
        };
    },

    // Gerar link de rota para o Motoboy abrir diretamente no Google Maps (Navegação GPS)
    gerarLinkGoogleMaps(latDest, lonDest, textoDestino) {
        const orig = `${this.origem.lat},${this.origem.lon}`;
        const dest = `${latDest},${lonDest}`;
        return `https://www.google.com/maps/dir/?api=1&origin=${orig}&destination=${dest}&travelmode=driving`;
    },

    gerarLinkGoogleMapsPorTexto(textoDestino) {
        const orig = encodeURIComponent(this.origem.enderecoCompleto);
        const dest = encodeURIComponent((textoDestino || "Lorena, SP") + ", Lorena - SP");
        return `https://www.google.com/maps/dir/?api=1&origin=${orig}&destination=${dest}&travelmode=driving`;
    },

    // Retorna todos os bairros de Lorena para exibição/sugestão
    getListaTodosBairros() {
        const { zonasBairros } = this.getConfiguracoes();
        const lista = [];
        zonasBairros.forEach(z => {
            z.bairros.forEach(b => {
                lista.push({ bairro: b, zona: z.zona, valor: z.valor });
            });
        });
        return lista.sort((a, b) => a.bairro.localeCompare(b.bairro));
    }
};

// Exportar globalmente
if (typeof window !== "undefined") {
    window.FreteDelivery = FreteDelivery;
}
