/**
 * Da Silva Doceria - Base de Dados Inicial
 * Contém o cardápio oficial completo com todos os 38 itens das fotos,
 * faixas de entrega por KM, contas financeiras e vendas de exemplo.
 */

const CATEGORIAS_PADRAO = [
    "Copos da Felicidade",
    "Cones & Cascões",
    "Fatias & Brownies",
    "Afogadinhos & Escondidinhos",
    "Copudim",
    "Bombons & Doces",
    "Fondue & Petisqueiras",
    "Brigadeiros Tradicionais"
];

const PRODUTOS_PADRAO = [
    {
        id: 1,
        nome: "Copinho da felicidade kinder 200ml.",
        categoria: "Copos da Felicidade",
        descricao: "Brigadeiro tradicional, brigadeiro de ninho, kinder, nutella e brownie.",
        preco: 23.00,
        custo: 7.50,
        icone: "fa-ice-cream"
    },
    {
        id: 2,
        nome: "Fatia brownie ninho com nutella.",
        categoria: "Fatias & Brownies",
        descricao: "Fatia generosa de brownie artesanal recheada de ninho com nutella cremosa.",
        preco: 25.00,
        custo: 8.00,
        icone: "fa-cake-candles"
    },
    {
        id: 3,
        nome: "Pudim Brownie Crunch. (Novidade)",
        categoria: "Fatias & Brownies",
        descricao: "Pudim lisinho, brownie, brigadeiro 50% cacau e Sucrilhos crocantes.",
        preco: 25.00,
        custo: 8.50,
        icone: "fa-cookie"
    },
    {
        id: 4,
        nome: "Cascão surpresa de uva 🍇",
        categoria: "Cones & Cascões",
        descricao: "Brigadeiro de ninho e uvas verdes selecionadas em cascão crocante.",
        preco: 21.00,
        custo: 6.50,
        icone: "fa-stroopwafel"
    },
    {
        id: 5,
        nome: "Coxinha de morango brigadeiro com morango.",
        categoria: "Bombons & Doces",
        descricao: "Massa de brigadeiro recheada com morango fresco, passada no granulado.",
        preco: 15.00,
        custo: 4.80,
        icone: "fa-strawberry"
    },
    {
        id: 6,
        nome: "Cone trufadinho com morango .",
        categoria: "Cones & Cascões",
        descricao: "Recheado de brigadeiro de ninho, nutella e morangos frescos.",
        preco: 13.00,
        custo: 4.20,
        icone: "fa-stroopwafel"
    },
    {
        id: 7,
        nome: "Cascão kinder",
        categoria: "Cones & Cascões",
        descricao: "Cascão crocante recheado de nutella, brigadeiro de ninho, brownie e kinder.",
        preco: 21.00,
        custo: 7.00,
        icone: "fa-stroopwafel"
    },
    {
        id: 8,
        nome: "Afogadinho de brownie ninho com Nutella 140ml.",
        categoria: "Afogadinhos & Escondidinhos",
        descricao: "Cubos de brownie fofinho afogados em ninho e Nutella pura.",
        preco: 14.00,
        custo: 4.50,
        icone: "fa-bowl-food"
    },
    {
        id: 9,
        nome: "Copinho oreo 200ml.",
        categoria: "Copos da Felicidade",
        descricao: "Creme oreo, brownie, brigadeiro de ninho e brigadeiro tradicional.",
        preco: 20.00,
        custo: 6.50,
        icone: "fa-ice-cream"
    },
    {
        id: 10,
        nome: "Fatia ninho com morangos e nutella.",
        categoria: "Fatias & Brownies",
        descricao: "Massa especial com recheio de brigadeiro de ninho, morangos e nutella.",
        preco: 25.00,
        custo: 8.50,
        icone: "fa-cake-candles"
    },
    {
        id: 11,
        nome: "Bombom supremo Da silva . Aprox 250g",
        categoria: "Bombons & Doces",
        descricao: "Massa de ninho macia, brownie, morango fresco e cobertura de chocolate nobre.",
        preco: 20.00,
        custo: 6.80,
        icone: "fa-candy-cane"
    },
    {
        id: 12,
        nome: "Escondidinho de brownie 220ML",
        categoria: "Afogadinhos & Escondidinhos",
        descricao: "Brigadeiro de ninho, brownie artesanal, nutella e morangos fatiados.",
        preco: 19.00,
        custo: 6.20,
        icone: "fa-bowl-food"
    },
    {
        id: 13,
        nome: "Bombom de morango",
        categoria: "Bombons & Doces",
        descricao: "Massa de ninho, morango inteiro selecionado e banho de chocolate.",
        preco: 15.00,
        custo: 4.80,
        icone: "fa-candy-cane"
    },
    {
        id: 14,
        nome: "Brigadeiro ninho com nutella . 30g",
        categoria: "Brigadeiros Tradicionais",
        descricao: "Brigadeiro de ninho de 30g finalizado com generosa pitanga de Nutella.",
        preco: 4.00,
        custo: 1.20,
        icone: "fa-cookie-bite"
    },
    {
        id: 15,
        nome: "Escondidinho chocolatudo com morangos 140ml",
        categoria: "Afogadinhos & Escondidinhos",
        descricao: "Brigadeiro chocolatudo 50% cacau com morangos frescos no pote.",
        preco: 13.00,
        custo: 4.20,
        icone: "fa-bowl-food"
    },
    {
        id: 16,
        nome: "Afogadinho de uva",
        categoria: "Afogadinhos & Escondidinhos",
        descricao: "Creme aveludado de ninho com uvas verdes sem semente afogadinhas.",
        preco: 13.00,
        custo: 4.00,
        icone: "fa-bowl-food"
    },
    {
        id: 17,
        nome: "Afogadinho de brownie brigadeirudo 140ml",
        categoria: "Afogadinhos & Escondidinhos",
        descricao: "Cubos de brownie mergulhados em brigadeiro artesanal cremoso.",
        preco: 13.00,
        custo: 4.20,
        icone: "fa-bowl-food"
    },
    {
        id: 18,
        nome: "Morango cravejado",
        categoria: "Bombons & Doces",
        descricao: "Morango graúdo envolto em ninho e cravejado com confeitos crocantes.",
        preco: 17.00,
        custo: 5.50,
        icone: "fa-gem"
    },
    {
        id: 19,
        nome: "Copo da felicidade ninho com morango 300ML.",
        categoria: "Copos da Felicidade",
        descricao: "Brigadeiro de ninho, morangos frescos picados e creme especial de ninho.",
        preco: 29.99,
        custo: 9.50,
        icone: "fa-ice-cream"
    },
    {
        id: 20,
        nome: "Fundue",
        categoria: "Fondue & Petisqueiras",
        descricao: "Morangos, uva e brownie acompanhado de potinho de brigadeiro cremoso.",
        preco: 20.00,
        custo: 6.50,
        icone: "fa-utensils"
    },
    {
        id: 21,
        nome: "Copo kinder 300 ml.",
        categoria: "Copos da Felicidade",
        descricao: "Brigadeiro tradicional, brigadeiro de ninho, nutella, brownie e Kinder Bueno.",
        preco: 33.00,
        custo: 11.00,
        icone: "fa-ice-cream"
    },
    {
        id: 22,
        nome: "Cascão ninho com nutella .",
        categoria: "Cones & Cascões",
        descricao: "Cascão crocante recheado de brigadeiro de ninho com nutella pura.",
        preco: 21.00,
        custo: 6.50,
        icone: "fa-stroopwafel"
    },
    {
        id: 23,
        nome: "Cone trufado prestígio",
        categoria: "Cones & Cascões",
        descricao: "Cone crocante banhado no chocolate com recheio de beijinho de coco úmido.",
        preco: 13.00,
        custo: 4.00,
        icone: "fa-stroopwafel"
    },
    {
        id: 24,
        nome: "Cascão morango cravejado.",
        categoria: "Cones & Cascões",
        descricao: "Cascão artesanal banhado em chocolate branco, morangos e ninho cravejado.",
        preco: 25.00,
        custo: 8.00,
        icone: "fa-stroopwafel"
    },
    {
        id: 25,
        nome: "Cone trufado oreo",
        categoria: "Cones & Cascões",
        descricao: "Recheado de brigadeiro de ninho com pedaços crocantes de biscoito Oreo.",
        preco: 13.00,
        custo: 4.20,
        icone: "fa-stroopwafel"
    },
    {
        id: 26,
        nome: "Copinho da felicidade 200ml. surpresa de uva",
        categoria: "Copos da Felicidade",
        descricao: "Creme de ninho, uvas verdes frescas, brigadeiro de ninho e nutella.",
        preco: 20.00,
        custo: 6.20,
        icone: "fa-ice-cream"
    },
    {
        id: 27,
        nome: "Brigadeiro de colher 220ml.",
        categoria: "Brigadeiros Tradicionais",
        descricao: "Pote duo 220ml de brigadeiro tradicional de cacau e brigadeiro de ninho de colher.",
        preco: 18.99,
        custo: 5.50,
        icone: "fa-spoon"
    },
    {
        id: 28,
        nome: "Mega espetão",
        categoria: "Bombons & Doces",
        descricao: "Equivalente a 3 bombomzões: morangos graúdos, ninho, brownie e cobertura de chocolate.",
        preco: 48.00,
        custo: 16.00,
        icone: "fa-wand-magic-sparkles"
    },
    {
        id: 29,
        nome: "Fundue individual brigadeiro.",
        categoria: "Fondue & Petisqueiras",
        descricao: "Uvas, morango, brownie e piscininha cremosa de brigadeiro para mergulhar.",
        preco: 20.00,
        custo: 6.50,
        icone: "fa-utensils"
    },
    {
        id: 30,
        nome: "Fundue ninho .",
        categoria: "Fondue & Petisqueiras",
        descricao: "Uvas, morangos, brownie e piscininha cremosa de ninho para mergulhar.",
        preco: 20.00,
        custo: 6.50,
        icone: "fa-utensils"
    },
    {
        id: 31,
        nome: "Copo ninhotella com morangos 🍓 300ml .",
        categoria: "Copos da Felicidade",
        descricao: "Brigadeiro de ninho, Nutella pura, brownie artesanal e morangos frescos.",
        preco: 33.00,
        custo: 10.50,
        icone: "fa-ice-cream"
    },
    {
        id: 32,
        nome: "Brigadeiro surpresa de uva 30g",
        categoria: "Brigadeiros Tradicionais",
        descricao: "Brigadeiro de ninho 30g recheado com uva verde suculenta sem semente.",
        preco: 4.00,
        custo: 1.10,
        icone: "fa-cookie-bite"
    },
    {
        id: 33,
        nome: "Petisqueira de frutas com brownie.",
        categoria: "Fondue & Petisqueiras",
        descricao: "Petisqueira completa com morango, uva, brownie e dois potes de doces.",
        preco: 35.00,
        custo: 11.50,
        icone: "fa-shapes"
    },
    {
        id: 34,
        nome: "Croassant chocotella com morango",
        categoria: "Fatias & Brownies",
        descricao: "Croissant folhado recheado de brigadeiro tradicional, nutella e morangos.",
        preco: 24.00,
        custo: 7.80,
        icone: "fa-bread-slice"
    },
    {
        id: 35,
        nome: "Cone trufado surpresa de morango.",
        categoria: "Cones & Cascões",
        descricao: "Cone recheado de brigadeiro de ninho e morango fresco selecionado.",
        preco: 13.00,
        custo: 4.20,
        icone: "fa-stroopwafel"
    },
    {
        id: 36,
        nome: "Copinho brownie 200ml .",
        categoria: "Copos da Felicidade",
        descricao: "Brigadeiro tradicional, brigadeiro de ninho cremoso e generosos pedaços de brownie.",
        preco: 20.00,
        custo: 6.00,
        icone: "fa-ice-cream"
    },
    {
        id: 37,
        nome: "Copudim com morango 150mL",
        categoria: "Copudim",
        descricao: "Creme de ninho, morangos frescos, brigadeiro de ninho e pudim lisinho no topo.",
        preco: 20.00,
        custo: 6.50,
        icone: "fa-cheese"
    },
    {
        id: 38,
        nome: "Copudim com brownie 150ml.",
        categoria: "Copudim",
        descricao: "Creme de ninho, brownie em pedaços, brigadeiro de ninho e pudim artesanal no topo.",
        preco: 20.00,
        custo: 6.50,
        icone: "fa-cheese"
    }
];

const FAIXAS_KM_PADRAO = [
    { id: 1, min: 0, max: 3, valor: 5.00 },
    { id: 2, min: 3, max: 6, valor: 8.00 },
    { id: 3, min: 6, max: 10, valor: 12.00 },
    { id: 4, min: 10, max: 15, valor: 18.00 }
];

const CONTAS_PADRAO = [
    { id: 1, desc: "Compra Leite Moça & Cacau 100%", tipo: "pagar", valor: 280.00, data: "2026-09-22", status: "Pago" },
    { id: 2, desc: "Caixa de Morangos Frescos Selecionados", tipo: "pagar", valor: 110.00, data: "2026-09-24", status: "Pendente" },
    { id: 3, desc: "Embalagens dos Copos e Cones", tipo: "pagar", valor: 145.00, data: "2026-09-25", status: "Pendente" },
    { id: 4, desc: "Encomenda Bolo Aniversário + 50 Brigadeiros", tipo: "receber", valor: 390.00, data: "2026-09-27", status: "Pendente" }
];

const VENDAS_PADRAO = [
    {
        id: 101,
        data: "23/09/2026 14:15",
        canal: "balcao",
        cliente: "Cliente Balcão",
        itens: [
            { id: 1, nome: "Copinho da felicidade kinder 200ml.", qtd: 1, preco: 23.00, custo: 7.50 },
            { id: 14, nome: "Brigadeiro ninho com nutella . 30g", qtd: 2, preco: 4.00, custo: 1.20 }
        ],
        subtotal: 31.00,
        taxaOuFrete: 0,
        totalBruto: 31.00,
        custoDoces: 9.90,
        lucro: 21.10
    },
    {
        id: 102,
        data: "23/09/2026 16:40",
        canal: "whatsapp",
        cliente: "Mariana Silva (Delivery)",
        itens: [
            { id: 31, nome: "Copo ninhotella com morangos 🍓 300ml .", qtd: 1, preco: 33.00, custo: 10.50 },
            { id: 6, nome: "Cone trufadinho com morango .", qtd: 1, preco: 13.00, custo: 4.20 }
        ],
        subtotal: 46.00,
        taxaOuFrete: 8.00,
        totalBruto: 54.00,
        custoDoces: 14.70,
        lucro: 31.30
    },
    {
        id: 103,
        data: "23/09/2026 19:20",
        canal: "ifood",
        cliente: "Pedido iFood #4491",
        itens: [
            { id: 2, nome: "Fatia brownie ninho com nutella.", qtd: 2, preco: 25.00, custo: 8.00 }
        ],
        subtotal: 50.00,
        taxaOuFrete: 6.00, // 12% taxa ifood
        totalBruto: 50.00,
        custoDoces: 16.00,
        lucro: 28.00
    }
];

const INSUMOS_PADRAO = [
    { id: 1, nome: "Leite Condensado Moça (Lata 395g)", categoria: "Laticínios", qtd: 24, unidade: "un", custo: 7.50, fornecedor: "Atacadão" },
    { id: 2, nome: "Creme de Leite Nestlé (200g)", categoria: "Laticínios", qtd: 30, unidade: "un", custo: 3.80, fornecedor: "Atacadão" },
    { id: 3, nome: "Nutella Balde Oficial 3kg", categoria: "Recheios", qtd: 2, unidade: "balde", custo: 180.00, fornecedor: "Distribuidora Doces" },
    { id: 4, nome: "Leite em Pó Ninho Integral (400g)", categoria: "Laticínios", qtd: 8, unidade: "un", custo: 18.50, fornecedor: "Supermercado" },
    { id: 5, nome: "Morangos Frescos Selecionados", categoria: "Frutas", qtd: 6, unidade: "cx", custo: 26.00, fornecedor: "Ceasa / Produtor" },
    { id: 6, nome: "Uva Thompson Verde s/ Semente", categoria: "Frutas", qtd: 8, unidade: "bdj", custo: 11.50, fornecedor: "Hortifruti" },
    { id: 7, nome: "Chocolate Nobre Blend Sicao (1kg)", categoria: "Chocolates", qtd: 6, unidade: "barra", custo: 38.00, fornecedor: "Casa do Padeiro" },
    { id: 8, nome: "Cacau em Pó 100% Alcalino (1kg)", categoria: "Chocolates", qtd: 4, unidade: "pct", custo: 34.00, fornecedor: "Distribuidora" },
    { id: 9, nome: "Kinder Bueno Tradicional", categoria: "Confeitos", qtd: 28, unidade: "un", custo: 5.20, fornecedor: "Atacadão" },
    { id: 10, nome: "Biscoito Oreo Recheado (144g)", categoria: "Confeitos", qtd: 15, unidade: "pct", custo: 5.40, fornecedor: "Atacadão" },
    { id: 11, nome: "Copo Bolha da Felicidade 200ml", categoria: "Embalagens", qtd: 200, unidade: "un", custo: 0.70, fornecedor: "Embalagens Cia" },
    { id: 12, nome: "Copo Bolha Cristal 300ml", categoria: "Embalagens", qtd: 150, unidade: "un", custo: 0.85, fornecedor: "Embalagens Cia" },
    { id: 13, nome: "Cascão Crocante Doce (Cx 60 un)", categoria: "Casquinhas", qtd: 3, unidade: "cx", custo: 36.00, fornecedor: "Distribuidora" },
    { id: 14, nome: "Cone Wafer Trufado (Cx 80 un)", categoria: "Casquinhas", qtd: 2, unidade: "cx", custo: 42.00, fornecedor: "Distribuidora" },
    { id: 15, nome: "Pote Afogadinho 140ml", categoria: "Embalagens", qtd: 100, unidade: "un", custo: 0.50, fornecedor: "Embalagens Cia" }
];

// ==========================================
// MARKETPLACE FOMEK DELIVERY: LOJAS PARCEIRAS
// ==========================================

const CATEGORIAS_MARKETPLACE = [
    { id: "todos", nome: "Todas", emoji: "🏬" },
    { id: "doces", nome: "Doces & Bolos", emoji: "🍰" },
    { id: "burgers", nome: "Hambúrgueres", emoji: "🍔" },
    { id: "pizzas", nome: "Pizzas", emoji: "🍕" },
    { id: "acai", nome: "Açaí & Sorvetes", emoji: "🍦" },
    { id: "pasteis", nome: "Pastel & Salgados", emoji: "🥐" },
    { id: "bebidas", nome: "Bebidas", emoji: "🥤" }
];

const LOJAS_PADRAO = [
    {
        id: "dasilva-doceria",
        nome: "Da Silva Doceria",
        emoji: "🍰",
        categoriaPrincipal: "Doces & Sobremesas",
        categoriaSlug: "doces",
        logo: "img/logo.png",
        capa: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700&auto=format&fit=crop&q=80",
        avaliacao: 5.0,
        totalAvaliacoes: 148,
        tempoEntrega: "30-50 min",
        distanciaKm: "1.2 km",
        taxaEntrega: 6.50,
        taxaEntregaTexto: "R$ 6,50",
        pedidoMinimo: 20.00,
        status: "Aberta",
        whatsapp: "5512999999999",
        endereco: "Avenida José Moreira Miguel, 733 - Jd. Primavera, Lorena-SP",
        destaque: "🍓 Copinhos da felicidade, cascões trufados e fatias de brownie artesanais feitos com amor!",
        destaqueTag: "Mais Pedido da Cidade",
        destaqueTagCor: "bg-rose-500",
        categorias: CATEGORIAS_PADRAO,
        produtos: PRODUTOS_PADRAO
    },
    {
        id: "fomek-burger",
        nome: "Fomek Burger & Grill",
        emoji: "🍔",
        categoriaPrincipal: "Hambúrgueres",
        categoriaSlug: "burgers",
        logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80",
        capa: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=700&auto=format&fit=crop&q=80",
        avaliacao: 4.9,
        totalAvaliacoes: 96,
        tempoEntrega: "35-50 min",
        distanciaKm: "2.1 km",
        taxaEntrega: 7.00,
        taxaEntregaTexto: "R$ 7,00",
        pedidoMinimo: 25.00,
        status: "Aberta",
        whatsapp: "5512999999999",
        endereco: "Rua Principal, 250 - Centro, Lorena-SP",
        destaque: "🍔 Smash burgers suculentos na brasa, queijo cheddar derretido e batatas rústicas com bacon!",
        destaqueTag: "Super Restaurante",
        destaqueTagCor: "bg-amber-500",
        categorias: ["Smash Burgers", "Burgers Especiais", "Combos c/ Batata", "Bebidas"],
        produtos: [
            { id: 101, nome: "Smash Fomek Duplo Bacon", categoria: "Smash Burgers", descricao: "2 carnes smash de 90g, cheddar duplo cremoso, fatias crocantes de bacon e maionese defumada da casa.", preco: 32.90, custo: 11.50, icone: "fa-burger" },
            { id: 102, nome: "Combo Burger Supremo + Fritas + Refri", categoria: "Combos c/ Batata", descricao: "Burger artesanal 160g recheado de queijo, porção generosa de batata frita crocante e refrigerante lata gelado.", preco: 44.90, custo: 16.00, icone: "fa-burger" },
            { id: 103, nome: "Batata Frita Suprema Cheddar & Bacon", categoria: "Combos c/ Batata", descricao: "Batatas rústicas cobertas com generoso creme de cheddar artesanal e cubinhos crocantes de bacon.", preco: 26.00, custo: 8.50, icone: "fa-box" },
            { id: 104, nome: "Coca-Cola Lata 350ml Gelada", categoria: "Bebidas", descricao: "Refrigerante Coca-Cola original trincando de gelada.", preco: 6.50, custo: 3.20, icone: "fa-wine-bottle" }
        ]
    },
    {
        id: "bella-lorena-pizzas",
        nome: "Pizzaria Bella Lorena",
        emoji: "🍕",
        categoriaPrincipal: "Pizzas",
        categoriaSlug: "pizzas",
        logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80",
        capa: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=700&auto=format&fit=crop&q=80",
        avaliacao: 4.8,
        totalAvaliacoes: 215,
        tempoEntrega: "40-60 min",
        distanciaKm: "1.8 km",
        taxaEntrega: 8.00,
        taxaEntregaTexto: "R$ 8,00",
        pedidoMinimo: 35.00,
        status: "Aberta",
        whatsapp: "5512999999999",
        endereco: "Praça Central, 45 - Centro, Lorena-SP",
        destaque: "🍕 Massas artesanais de fermentação natural, forno a lenha e bordas recheadas de catupiry original!",
        destaqueTag: "Tradição Italiana",
        destaqueTagCor: "bg-red-500",
        categorias: ["Pizzas Tradicionais", "Pizzas Especiais", "Pizzas Doces", "Bebidas"],
        produtos: [
            { id: 201, nome: "Pizza Grande Calabresa Especial", categoria: "Pizzas Tradicionais", descricao: "Molho de tomate pelado italiano, mussarela derretida, fatias finas de calabresa artesanal, cebola e azeitonas.", preco: 52.00, custo: 18.00, icone: "fa-pizza-slice" },
            { id: 202, nome: "Pizza Grande Quatro Queijos Nobres", categoria: "Pizzas Especiais", descricao: "Mussarela, provolone defumado, queijo gorgonzola suave e Catupiry legítimo com orégano fresco.", preco: 64.00, custo: 23.00, icone: "fa-pizza-slice" },
            { id: 203, nome: "Pizza Média Chocolate c/ Morango", categoria: "Pizzas Doces", descricao: "Generosa camada de chocolate ao leite cremoso com morangos frescos fatiados.", preco: 45.00, custo: 15.00, icone: "fa-pizza-slice" }
        ]
    },
    {
        id: "acai-tropical",
        nome: "Açaí Tropical Mania",
        emoji: "🍇",
        categoriaPrincipal: "Açaí & Sorvetes",
        categoriaSlug: "acai",
        logo: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=200&auto=format&fit=crop&q=80",
        capa: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=700&auto=format&fit=crop&q=80",
        avaliacao: 4.9,
        totalAvaliacoes: 82,
        tempoEntrega: "20-35 min",
        distanciaKm: "0.9 km",
        taxaEntrega: 5.50,
        taxaEntregaTexto: "R$ 5,50",
        pedidoMinimo: 18.00,
        status: "Aberta",
        whatsapp: "5512999999999",
        endereco: "Av. Peixoto de Castro, 180 - Lorena-SP",
        destaque: "🍦 Açaí super cremoso batido na hora com banana, morangos, leite ninho e calda de nutella!",
        destaqueTag: "Entrega Rápida ⚡",
        destaqueTagCor: "bg-purple-600",
        categorias: ["Copos de Açaí", "Açaí na Tigela", "Picolés & Sorvetes"],
        produtos: [
            { id: 301, nome: "Copo Açaí Turbinado 500ml", categoria: "Copos de Açaí", descricao: "Açaí batido premium com 3 acompanhamentos à escolha: leite em pó, morango, granola ou leite condensado.", preco: 24.00, custo: 8.00, icone: "fa-ice-cream" },
            { id: 302, nome: "Tigela Supremo Açaí 700ml c/ Nutella", categoria: "Açaí na Tigela", descricao: "Generosa tigela com açaí artesanal, morangos frescos, rodelas de banana e borda de Nutella pura.", preco: 34.00, custo: 11.50, icone: "fa-bowl-food" }
        ]
    },
    {
        id: "pastelaria-imperial",
        nome: "Pastelaria Imperial & Salgados",
        emoji: "🥟",
        categoriaPrincipal: "Pastel & Salgados",
        categoriaSlug: "pasteis",
        logo: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200&auto=format&fit=crop&q=80",
        capa: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=700&auto=format&fit=crop&q=80",
        avaliacao: 4.8,
        totalAvaliacoes: 110,
        tempoEntrega: "25-40 min",
        distanciaKm: "1.5 km",
        taxaEntrega: 0.00,
        taxaEntregaTexto: "Grátis",
        pedidoMinimo: 20.00,
        status: "Aberta",
        whatsapp: "5512999999999",
        endereco: "Rua Dom Bosco, 88 - Lorena-SP",
        destaque: "🥐 Pastéis gigantes sequinhos e crocantes de 25cm com recheio de ponta a ponta!",
        destaqueTag: "Frete Grátis",
        destaqueTagCor: "bg-emerald-600",
        categorias: ["Pastéis Gigantes 25cm", "Pastéis Doces", "Coxinhas & Fritos", "Caldos de Cana & Sucos"],
        produtos: [
            { id: 401, nome: "Pastel Especial Carne c/ Queijo e Azeitona 25cm", categoria: "Pastéis Gigantes 25cm", descricao: "Massa crocante estaladiça, carne moída bem temperada, mussarela derretida e azeitonas picadas.", preco: 18.00, custo: 5.50, icone: "fa-stroopwafel" },
            { id: 402, nome: "Pastel Pizza Especial c/ Catupiry 25cm", categoria: "Pastéis Gigantes 25cm", descricao: "Mussarela, presunto, tomate picadinho, orégano e Catupiry cremoso.", preco: 19.00, custo: 6.00, icone: "fa-stroopwafel" },
            { id: 403, nome: "Caldo de Cana Geladinho 500ml", categoria: "Caldos de Cana & Sucos", descricao: "Moído na hora gelado com limão ou abacaxi.", preco: 9.00, custo: 2.80, icone: "fa-glass-water" }
        ]
    }
];

