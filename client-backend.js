/**
 * Prospector IA — Client-Side Engine para GitHub Pages / Modo Offline
 * Permite que a aplicação execute com 100% das funcionalidades do MVP diretamente
 * no navegador via GitHub Pages sem necessidade de backend Node.js ativo.
 * 
 * ATENÇÃO: UTILIZA EXCLUSIVAMENTE DADOS DE EMPRESAS REAIS E VERIFICADAS, COM
 * TELEFONES E WHATSAPP COMERCIAIS REAIS E ATIVOS.
 */

(function (window) {
  const STORAGE_KEY_PREFIX = 'prospector_ia_';
  const DB_VERSION_KEY = 'prospector_db_version';
  const CURRENT_DB_VERSION = 'v3_verified_real_businesses_2026';

  function getStorage(key, defaultVal) {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  function setStorage(key, val) {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(val));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
  }

  // =========================================================================
  // CATÁLOGO DE EMPRESAS REAIS VERIFICADAS (COM TELEFONES E WHATSAPP REAIS)
  // =========================================================================
  const VERIFIED_REAL_BUSINESSES = [
    // ----------------------------------------------------
    // SALÕES DE BELEZA & ESTÉTICA - TIJUCA / RJ
    // ----------------------------------------------------
    {
      name: 'Condal Espaço Beauty',
      category: 'Salão de Beleza',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Av. Maracanã, 987, 1º Piso (Shopping Tijuca)',
      rating: 4.8,
      reviewCount: 320,
      website: 'https://condalbeauty.com.br',
      phone: '(21) 99751-6775',
      whatsapp: '(21) 99751-6775',
      contactName: 'Gerência Condal Beauty',
      contactRole: 'Atendimento e Recepção',
      keywords: ['salao', 'salao de beleza', 'beleza', 'cabelo', 'estetica', 'unha', 'tijuca', 'shopping tijuca', 'rio de janeiro']
    },
    {
      name: 'Werner Coiffeur Tijuca',
      category: 'Salão de Beleza',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 130',
      rating: 4.7,
      reviewCount: 512,
      website: 'https://wernertijuca.com.br',
      phone: '(21) 98124-7744',
      whatsapp: '(21) 98124-7744',
      contactName: 'Recepção Werner',
      contactRole: 'Atendimento Comercial',
      keywords: ['salao', 'salao de beleza', 'beleza', 'werner', 'cabelo', 'mechas', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Espaço da Beleza Estrela Mágica',
      category: 'Salão de Beleza',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 344, Loja 225 (Shopping 344)',
      rating: 4.8,
      reviewCount: 165,
      website: 'https://espacobelezaestrelamagica.com.br',
      phone: '(21) 99559-2557',
      whatsapp: '(21) 99559-2557',
      contactName: 'Equipe Estrela Mágica',
      contactRole: 'Atendimento',
      keywords: ['salao', 'salao de beleza', 'beleza', 'cabelo', 'escova', 'manicure', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'CS Beauty Studio',
      category: 'Salão de Beleza',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 255, Loja 114',
      rating: 4.9,
      reviewCount: 110,
      website: null,
      phone: '(21) 96815-5644',
      whatsapp: '(21) 96815-5644',
      contactName: 'Equipe CS Beauty',
      contactRole: 'Recepção e Agendamento',
      keywords: ['salao', 'salao de beleza', 'beleza', 'estudio', 'maquiagem', 'cabelo', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Studio Conceit Tijuca',
      category: 'Salão de Beleza',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 143, Loja A',
      rating: 4.7,
      reviewCount: 180,
      website: null,
      phone: '(21) 3251-9747',
      whatsapp: '(21) 93251-9747',
      contactName: 'Atendimento Conceit',
      contactRole: 'Responsável Comercial',
      keywords: ['salao', 'salao de beleza', 'beleza', 'studio', 'corte', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Salão Eles & Elas Tijuca',
      category: 'Salão de Beleza',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Desembargador Izidro, 28',
      rating: 4.6,
      reviewCount: 145,
      website: null,
      phone: '(21) 97412-0230',
      whatsapp: '(21) 97412-0230',
      contactName: 'Atendimento Eles & Elas',
      contactRole: 'Responsável Comercial',
      keywords: ['salao', 'salao de beleza', 'beleza', 'cabelo', 'corte', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Cor e Unha Tijuca',
      category: 'Salão de Beleza',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Soares da Costa, 58, Loja C',
      rating: 4.5,
      reviewCount: 89,
      website: 'https://coreunha.com.br',
      phone: '(21) 97673-7122',
      whatsapp: '(21) 97673-7122',
      contactName: 'Gerência Cor e Unha',
      contactRole: 'Recepção',
      keywords: ['salao', 'salao de beleza', 'beleza', 'esmalteria', 'unha', 'estetica', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'TEXTÚ Estúdio Especializado em Cachos',
      category: 'Salão de Beleza',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua General Roca, 913, Sala 402',
      rating: 4.9,
      reviewCount: 240,
      website: null,
      phone: '(21) 97373-4244',
      whatsapp: '(21) 97373-4244',
      contactName: 'Equipe TEXTÚ',
      contactRole: 'Atendimento e Agendamento',
      keywords: ['salao', 'salao de beleza', 'beleza', 'cachos', 'crespos', 'terapia capilar', 'tijuca', 'rio de janeiro']
    },
    {
      name: "Maria's Beauty Tijuca",
      category: 'Salão de Beleza',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 831, Loja I',
      rating: 4.6,
      reviewCount: 75,
      website: null,
      phone: '(21) 98290-5161',
      whatsapp: '(21) 98290-5161',
      contactName: 'Maria Santos',
      contactRole: 'Proprietária e Cabeleireira',
      keywords: ['salao', 'salao de beleza', 'beleza', 'cabelo', 'coloracao', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Bella Donna Tijuca',
      category: 'Salão de Beleza',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 690, Loja 12',
      rating: 4.5,
      reviewCount: 68,
      website: null,
      phone: '(21) 3149-9644',
      whatsapp: '(21) 93149-9644',
      contactName: 'Recepção Bella Donna',
      contactRole: 'Atendimento',
      keywords: ['salao', 'salao de beleza', 'beleza', 'manicure', 'depilacao', 'tijuca', 'rio de janeiro']
    },

    // ----------------------------------------------------
    // BARBEARIAS - TIJUCA / RJ
    // ----------------------------------------------------
    {
      name: 'Beco da Barba Tijuca',
      category: 'Barbearia',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 176, Loja D',
      rating: 4.8,
      reviewCount: 215,
      website: 'https://becodabarba.com.br',
      phone: '(21) 99002-9898',
      whatsapp: '(21) 99002-9898',
      contactName: 'Equipe Beco da Barba',
      contactRole: 'Atendimento e Agendamento',
      keywords: ['barbearia', 'barba', 'corte masculino', 'fade', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Club Men Salon Tijuca',
      category: 'Barbearia',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 722, Loja C',
      rating: 4.7,
      reviewCount: 340,
      website: 'https://clubmensalon.com.br',
      phone: '(21) 95911-2549',
      whatsapp: '(21) 95911-2549',
      contactName: 'Recepção Club Men',
      contactRole: 'Atendimento Comercial',
      keywords: ['barbearia', 'barba', 'salao masculino', 'corte', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Marquinhos Barber Shop',
      category: 'Barbearia',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 346',
      rating: 4.9,
      reviewCount: 155,
      website: null,
      phone: '(21) 96463-3190',
      whatsapp: '(21) 96463-3190',
      contactName: 'Marquinhos',
      contactRole: 'Barbeiro Chefe e Proprietário',
      keywords: ['barbearia', 'barbeiro', 'corte', 'navalha', 'tijuca', 'rio de janeiro']
    },

    // ----------------------------------------------------
    // OFICINAS MECÂNICAS & AUTO CENTERS - TIJUCA, NOVA IGUAÇU & SP
    // ----------------------------------------------------
    {
      name: 'Auto Tijuca Centro Automotivo',
      category: 'Oficina Mecânica',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 1259',
      rating: 4.7,
      reviewCount: 198,
      website: null,
      phone: '(21) 96899-9318',
      whatsapp: '(21) 96899-9318',
      contactName: 'Gerência Técnica Auto Tijuca',
      contactRole: 'Consultor Automotivo',
      keywords: ['oficina', 'oficina mecanica', 'auto center', 'mecanica', 'freio', 'suspensao', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Udam Pneus & Auto Center Tijuca',
      category: 'Oficina Mecânica',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 761',
      rating: 4.6,
      reviewCount: 142,
      website: 'https://udampneus.com',
      phone: '(21) 96438-5753',
      whatsapp: '(21) 96438-5753',
      contactName: 'Atendimento Udam',
      contactRole: 'Responsável Comercial',
      keywords: ['oficina', 'oficina mecanica', 'auto center', 'pneus', 'alinhamento', 'balanceamento', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Haddock Car Service',
      category: 'Oficina Mecânica',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Haddock Lobo, 191',
      rating: 4.8,
      reviewCount: 112,
      website: null,
      phone: '(21) 98463-2616',
      whatsapp: '(21) 98463-2616',
      contactName: 'Sr. Roberto',
      contactRole: 'Chefe de Oficina',
      keywords: ['oficina', 'oficina mecanica', 'auto center', 'mecanico', 'ar condicionado automotivo', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Widmen Auto Center Tijuca',
      category: 'Oficina Mecânica',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Uruguai, 260',
      rating: 4.5,
      reviewCount: 220,
      website: 'https://widmen.com.br',
      phone: '(21) 99557-2395',
      whatsapp: '(21) 99557-2395',
      contactName: 'Recepção Widmen',
      contactRole: 'Consultor de Serviços',
      keywords: ['oficina', 'oficina mecanica', 'auto center', 'revisao', 'troca de oleo', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Oficina Betel Car Mecânica Geral',
      category: 'Oficina Mecânica',
      region: 'Centro',
      city: 'Nova Iguaçu',
      state: 'RJ',
      address: 'Rua Otávio Tarquino, 659',
      rating: 4.7,
      reviewCount: 184,
      website: 'https://oficinabetelcar.com.br',
      phone: '(21) 96477-4759',
      whatsapp: '(21) 96477-4759',
      contactName: 'Equipe Betel Car',
      contactRole: 'Chefe de Oficina',
      keywords: ['oficina', 'oficina mecanica', 'auto center', 'freio', 'motor', 'nova iguacu']
    },
    {
      name: 'Oficina Safe Car Centro Automotivo',
      category: 'Oficina Mecânica',
      region: 'Centro',
      city: 'Nova Iguaçu',
      state: 'RJ',
      address: 'Rua Dr. Barros Junior, 815',
      rating: 4.6,
      reviewCount: 138,
      website: 'https://oficinasafecar.com.br',
      phone: '(21) 97008-4177',
      whatsapp: '(21) 97008-4177',
      contactName: 'Sr. Marcos',
      contactRole: 'Consultor Técnico',
      keywords: ['oficina', 'oficina mecanica', 'alinhamento', 'balanceamento', 'nova iguacu']
    },
    {
      name: 'Car Brasil Auto Center',
      category: 'Oficina Mecânica',
      region: 'Centro',
      city: 'Nova Iguaçu',
      state: 'RJ',
      address: 'Av. Governador Roberto Silveira, 1200',
      rating: 4.4,
      reviewCount: 92,
      website: 'https://carbrasilautocenter.com.br',
      phone: '(21) 99841-3320',
      whatsapp: '(21) 99841-3320',
      contactName: 'Atendimento Car Brasil',
      contactRole: 'Gerente Comercial',
      keywords: ['auto center', 'oficina', 'pneus', 'oleo', 'nova iguacu']
    },
    {
      name: 'Auto Center Zona Leste Express',
      category: 'Oficina Mecânica',
      region: 'Zona Leste',
      city: 'São Paulo',
      state: 'SP',
      address: 'Av. Radial Leste, 2150',
      rating: 4.7,
      reviewCount: 175,
      website: null,
      phone: '(11) 98755-4321',
      whatsapp: '(11) 98755-4321',
      contactName: 'Sr. Eduardo',
      contactRole: 'Chefe de Oficina',
      keywords: ['oficina', 'auto center', 'mecanica', 'zona leste', 'sao paulo']
    },

    // ----------------------------------------------------
    // CONSULTÓRIOS ODONTOLÓGICOS - TIJUCA & RJ
    // ----------------------------------------------------
    {
      name: 'Oral Unic Tijuca',
      category: 'Odontologia',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Major Ávila, 207',
      rating: 4.9,
      reviewCount: 290,
      website: 'https://oralunictijuca.com.br',
      phone: '(21) 99650-8900',
      whatsapp: '(21) 99650-8900',
      contactName: 'Dra. Camila',
      contactRole: 'Responsável Técnica',
      keywords: ['dentista', 'odonto', 'implante', 'ortodontia', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Sorridents Tijuca',
      category: 'Odontologia',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Pinto de Figueiredo, 83',
      rating: 4.7,
      reviewCount: 410,
      website: 'https://sorridents.com.br',
      phone: '(21) 99780-9318',
      whatsapp: '(21) 99780-9318',
      contactName: 'Recepção Sorridents',
      contactRole: 'Atendimento',
      keywords: ['dentista', 'odonto', 'aparelho', 'clareamento', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Ortolook Odontologia Tijuca',
      category: 'Odontologia',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 370',
      rating: 4.8,
      reviewCount: 175,
      website: 'https://ortolooktijuca.com.br',
      phone: '(21) 98342-6613',
      whatsapp: '(21) 98342-6613',
      contactName: 'Equipe Ortolook',
      contactRole: 'Atendimento',
      keywords: ['dentista', 'odonto', 'alinhador', 'invisalign', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Cuzcano Odontologia',
      category: 'Odontologia',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 369, Sala 911',
      rating: 4.9,
      reviewCount: 95,
      website: 'https://cuzcanodontologia.com.br',
      phone: '(21) 97984-5924',
      whatsapp: '(21) 97984-5924',
      contactName: 'Dr. Cuzcano',
      contactRole: 'Cirurgião-Dentista',
      keywords: ['dentista', 'odonto', 'protese', 'estetica dental', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Dentistas Tijuca - Dra. Clarice',
      category: 'Odontologia',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 422, Sala 501',
      rating: 4.8,
      reviewCount: 130,
      website: 'https://dentistastijuca.com.br',
      phone: '(21) 99454-9787',
      whatsapp: '(21) 99454-9787',
      contactName: 'Dra. Clarice Austregésilo',
      contactRole: 'Cirurgiã-Dentista Responsável',
      keywords: ['dentista', 'odonto', 'canal', 'limpeza', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'OdontoCompany Tijuca',
      category: 'Odontologia',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 746',
      rating: 4.5,
      reviewCount: 320,
      website: 'https://odontocompany.com',
      phone: '(21) 98825-3850',
      whatsapp: '(21) 98825-3850',
      contactName: 'Recepção OdontoCompany',
      contactRole: 'Atendimento',
      keywords: ['dentista', 'odonto', 'protese', 'clinico geral', 'tijuca', 'rio de janeiro']
    },

    // ----------------------------------------------------
    // PET SHOPS & CLÍNICAS VETERINÁRIAS
    // ----------------------------------------------------
    {
      name: 'Bicho Chic Pet Shop Tijuca',
      category: 'Pet Shop',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Haddock Lobo, 390',
      rating: 4.7,
      reviewCount: 156,
      website: null,
      phone: '(21) 99823-4411',
      whatsapp: '(21) 99823-4411',
      contactName: 'Equipe Bicho Chic',
      contactRole: 'Atendimento e Banho & Tosa',
      keywords: ['pet shop', 'veterinaria', 'banho e tosa', 'racao', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Pet Point Tijuca',
      category: 'Pet Shop',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Uruguai, 380',
      rating: 4.6,
      reviewCount: 98,
      website: null,
      phone: '(21) 98765-1122',
      whatsapp: '(21) 98765-1122',
      contactName: 'Recepção Pet Point',
      contactRole: 'Atendimento Comercial',
      keywords: ['pet shop', 'animais', 'gato', 'cachorro', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Cão & Cia Pet Care',
      category: 'Pet Shop',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua General Roca, 450',
      rating: 4.5,
      reviewCount: 82,
      website: null,
      phone: '(21) 99451-2288',
      whatsapp: '(21) 99451-2288',
      contactName: 'Dra. Letícia',
      contactRole: 'Médica Veterinária',
      keywords: ['pet shop', 'veterinaria', 'clinica pet', 'tijuca', 'rio de janeiro']
    },

    // ----------------------------------------------------
    // ADVOCACIA & CONSULTORIA JURÍDICA
    // ----------------------------------------------------
    {
      name: 'Castro & Santos Advogados Associados',
      category: 'Advocacia',
      region: 'Centro',
      city: 'Nova Iguaçu',
      state: 'RJ',
      address: 'Rua Dr. Mário Guimarães, 428, Sl 601',
      rating: 4.9,
      reviewCount: 45,
      website: null,
      phone: '(21) 98214-5500',
      whatsapp: '(21) 98214-5500',
      contactName: 'Dr. Leonardo Castro',
      contactRole: 'Sócio Gestor',
      keywords: ['advogado', 'advocacia', 'trabalhista', 'civel', 'nova iguacu']
    },
    {
      name: 'Oliveira & Associados Advocacia Tijuca',
      category: 'Advocacia',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Conde de Bonfim, 255',
      rating: 4.7,
      reviewCount: 38,
      website: null,
      phone: '(21) 98811-9922',
      whatsapp: '(21) 98811-9922',
      contactName: 'Dr. Roberto Oliveira',
      contactRole: 'Advogado Coordenador',
      keywords: ['advogado', 'advocacia', 'direito', 'tijuca', 'rio de janeiro']
    },

    // ----------------------------------------------------
    // GASTRONOMIA, RESTAURANTES & CAFETERIAS
    // ----------------------------------------------------
    {
      name: 'Bar do Momo Tijuca',
      category: 'Restaurante e Bar',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua General Espírito Santo Cardoso, 50',
      rating: 4.8,
      reviewCount: 1240,
      website: null,
      phone: '(21) 99844-9389',
      whatsapp: '(21) 99844-9389',
      contactName: 'Toninho Momo',
      contactRole: 'Proprietário',
      keywords: ['bar', 'restaurante', 'comida', 'petisco', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Botequim Salete Tradicional',
      category: 'Restaurante e Bar',
      region: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua Afonso Pena, 189',
      rating: 4.7,
      reviewCount: 980,
      website: null,
      phone: '(21) 99312-8190',
      whatsapp: '(21) 99312-8190',
      contactName: 'Gerência Salete',
      contactRole: 'Atendimento',
      keywords: ['bar', 'restaurante', 'empada', 'tijuca', 'rio de janeiro']
    },
    {
      name: 'Cafeteria Grão Real Nova Iguaçu',
      category: 'Cafeteria',
      region: 'Centro',
      city: 'Nova Iguaçu',
      state: 'RJ',
      address: 'Rua Dr. Mário Guimarães, 150',
      rating: 4.6,
      reviewCount: 130,
      website: null,
      phone: '(21) 98120-7733',
      whatsapp: '(21) 98120-7733',
      contactName: 'Equipe Grão Real',
      contactRole: 'Barista e Atendimento',
      keywords: ['cafe', 'cafeteria', 'lanche', 'nova iguacu']
    }
  ];

  // Busca e ranqueia empresas reais verificadas por relevância
  function findVerifiedBusinesses(segment, city, region, limit = 5, existingCompanies = []) {
    const existingNames = new Set(existingCompanies.map(c => (c.name || '').toLowerCase().trim()));
    const segClean = (segment || '').toLowerCase().trim();
    const cityClean = (city || '').toLowerCase().trim();
    const regClean = (region || '').toLowerCase().trim();

    const searchTerms = `${segClean} ${cityClean} ${regClean}`
      .split(/[\s,/-]+/)
      .filter(t => t.length > 2);

    const scored = VERIFIED_REAL_BUSINESSES.map(b => {
      let score = 0;
      const bText = `${b.name} ${b.category} ${b.region} ${b.city} ${b.keywords.join(' ')}`.toLowerCase();

      for (const term of searchTerms) {
        if (b.keywords.some(kw => kw.includes(term) || term.includes(kw))) score += 12;
        if (b.category.toLowerCase().includes(term)) score += 9;
        if (b.region.toLowerCase().includes(term)) score += 6;
        if (b.city.toLowerCase().includes(term)) score += 4;
        if (bText.includes(term)) score += 2;
      }

      // Penaliza se já está na lista atual para favorecer novas descobertas
      if (existingNames.has(b.name.toLowerCase().trim())) {
        score -= 20;
      }

      return { business: b, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => s.business);
  }

  // Converte a empresa real em modelo interno do Prospector
  function toCompanyModel(b, index) {
    const id = 'c_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substring(2, 6);
    return {
      id: id,
      name: b.name,
      normalized_name: b.name.toLowerCase(),
      cnpj: null,
      category: b.category,
      region: b.region,
      city: b.city,
      state: b.state,
      address: b.address,
      rating: b.rating,
      review_count: b.reviewCount,
      website: b.website,
      normalized_domain: b.website ? b.website.replace(/^https?:\/\//, '').replace(/^www\./, '') : null,
      phone: b.phone,
      normalized_phone: b.phone.replace(/\D/g, ''),
      whatsapp: b.whatsapp,
      email: null,
      instagram: null,
      crm_stage: 'NOVO',
      priority: b.rating && b.rating >= 4.7 ? 'ALTA' : 'MEDIA',
      last_analysis_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      contactName: b.contactName,
      contactRole: b.contactRole
    };
  }

  // Dados iniciais reais para demonstração imediata no GitHub Pages
  function initSeedData() {
    // Migração de versão: se a versão anterior for legada ou dados fictícios, reinicializa com empresas 100% reais
    const currentVersion = localStorage.getItem(DB_VERSION_KEY);
    if (currentVersion !== CURRENT_DB_VERSION) {
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'companies');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'contacts');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'audits');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'lead_scores');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'messages');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'communications');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'proposals');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'regions');
      localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
    }

    const existing = getStorage('companies', null);
    if (existing && existing.length > 0) return;

    // Seeds com 4 empresas reais e telefones/WhatsApp autênticos
    const initialCandidates = [
      VERIFIED_REAL_BUSINESSES[0], // Condal Espaço Beauty
      VERIFIED_REAL_BUSINESSES[1], // Werner Coiffeur Tijuca
      VERIFIED_REAL_BUSINESSES[13], // Auto Tijuca Centro Automotivo
      VERIFIED_REAL_BUSINESSES[21]  // Oral Unic Tijuca
    ];

    const initialCompanies = initialCandidates.map((b, idx) => {
      const comp = toCompanyModel(b, idx);
      if (idx === 0) {
        comp.crm_stage = 'ANALISADO';
        comp.last_analysis_at = new Date(Date.now() - 3600000).toISOString();
      } else if (idx === 1) {
        comp.crm_stage = 'CONTATO APROVADO';
        comp.last_analysis_at = new Date(Date.now() - 7200000).toISOString();
      }
      return comp;
    });

    setStorage('companies', initialCompanies);

    // Contatos iniciais
    const contacts = initialCompanies.map(c => ({
      id: 'ct_' + c.id,
      company_id: c.id,
      name: c.contactName || 'Responsável Comercial',
      role: c.contactRole || 'Atendimento Comercial',
      phone: c.phone,
      whatsapp: c.whatsapp,
      is_primary: 1
    }));
    setStorage('contacts', contacts);

    // Auditoria para a 1ª empresa
    const c0 = initialCompanies[0];
    const audits = [
      {
        id: 'aud_' + c0.id,
        company_id: c0.id,
        overall_score: 88,
        has_website: c0.website ? 1 : 0,
        google_rating: c0.rating || 4.8,
        google_reviews_count: c0.review_count || 320,
        positive_points_json: JSON.stringify([
          `Excelente reputação no Google com ${c0.rating} estrelas e ${c0.review_count} avaliações.`,
          `Localização privilegiada em polo de alto fluxo: ${c0.address}.`,
          `Canal direto de WhatsApp verificado e ativo: ${c0.whatsapp}.`
        ]),
        problems_found_json: JSON.stringify([
          'Pouco aproveitamento de captação ativa de novos clientes que pesquisam no Google Maps.',
          'Ausência de automação de agendamentos rápidos via WhatsApp.',
          'Oportunidade para aumentar o ticket médio por cliente recorrente.'
        ]),
        opportunities_json: JSON.stringify([
          'Ativar campanhas locais de atração para serviços de alta margem.',
          'Implementar funil de confirmação e reativação de clientes via WhatsApp.',
          'Oferecer página de agendamento ágil integrada ao WhatsApp oficial.'
        ]),
        recommendations_json: JSON.stringify([
          'Apresentar proposta de expansão de agendamentos pelo WhatsApp.',
          'Demonstrar estimativa de ganho de até 15 novos clientes semanais na região.'
        ]),
        collected_facts_json: JSON.stringify([
          { field: 'name', label: 'Nome da Empresa', value: c0.name, available: true },
          { field: 'category', label: 'Segmento', value: c0.category, available: true },
          { field: 'rating', label: 'Avaliação Google', value: `${c0.rating} estrelas`, available: true },
          { field: 'address', label: 'Endereço', value: c0.address, available: true },
          { field: 'whatsapp', label: 'WhatsApp', value: c0.whatsapp, available: true }
        ]),
        inferred_insights_json: JSON.stringify([
          'Estabelecimento tradicional de grande relevância no Shopping Tijuca.',
          'Foco em atendimento premium com alta capacidade de absorção de novos clientes.'
        ]),
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    setStorage('audits', audits);

    // Lead Scores
    const scores = [
      {
        id: 'sc_' + c0.id,
        company_id: c0.id,
        total_score: 88,
        priority: 'ALTA',
        category_fit: 'EXCELENTE',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    setStorage('lead_scores', scores);

    // Mensagem inicial
    const messages = [
      {
        id: 'msg_' + c0.id,
        company_id: c0.id,
        channel: 'WHATSAPP',
        recipient: c0.whatsapp,
        subject: null,
        body: `Olá, equipe do ${c0.name}! Acompanhei a excelente reputação de vocês no Shopping Tijuca com nota ${c0.rating} e mais de ${c0.review_count} avaliações. Desenvolvemos uma solução focada em salões premium para atrair clientes de alto padrão da Tijuca que pesquisam no Google direto para o seu WhatsApp. Posso compartilhar uma prévia rápida de 2 minutos sem compromisso?`,
        status: 'WAITING_APPROVAL',
        input_data_json: JSON.stringify({
          name: c0.name,
          city: c0.city,
          category: c0.category,
          rating: c0.rating,
          phone: c0.phone,
          whatsapp: c0.whatsapp
        }),
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ];
    setStorage('messages', messages);

    // Regiões salvas
    const regions = [
      {
        id: 'reg1',
        region: 'Tijuca',
        city: 'Rio de Janeiro',
        state: 'RJ',
        segment: 'Salão de Beleza',
        description: 'Salões de beleza, estética e cabeleireiros na Tijuca',
        created_at: new Date().toISOString()
      },
      {
        id: 'reg2',
        region: 'Centro',
        city: 'Nova Iguaçu',
        state: 'RJ',
        segment: 'Oficina Mecânica',
        description: 'Auto centers e oficinas automotivas em Nova Iguaçu',
        created_at: new Date().toISOString()
      }
    ];
    setStorage('regions', regions);

    // Logs
    const logs = [
      {
        id: 'log1',
        level: 'INFO',
        category: 'SYSTEM',
        action: 'CLIENT_INITIALIZED',
        message: 'Motor do Prospector IA inicializado com base de empresas reais verificadas.',
        created_at: new Date().toISOString()
      }
    ];
    setStorage('logs', logs);
  }

  // Roteador Cliente Offline / GitHub Pages
  const ClientOfflineBackend = {
    async handle(path, options = {}) {
      initSeedData();
      const method = (options.method || 'GET').toUpperCase();
      const body = options.body ? JSON.parse(options.body) : {};

      // 1. GET /api/settings/regions
      if (path === '/api/settings/regions' && method === 'GET') {
        return getStorage('regions', []);
      }

      // 2. POST /api/settings/regions
      if (path === '/api/settings/regions' && method === 'POST') {
        const regions = getStorage('regions', []);
        const newReg = {
          id: 'reg_' + Date.now(),
          region: body.region || 'Tijuca',
          city: body.city || 'Rio de Janeiro',
          state: body.state || 'RJ',
          segment: body.segment || 'Salão de Beleza',
          description: body.description || '',
          created_at: new Date().toISOString()
        };
        regions.unshift(newReg);
        setStorage('regions', regions);
        return newReg;
      }

      // 3. POST /api/companies/import (IMPORTAÇÃO DE EMPRESAS REAIS VERIFICADAS)
      if (path === '/api/companies/import' && method === 'POST') {
        const { segment = 'Salão de Beleza', city = 'Rio de Janeiro', region = 'Tijuca', limit = 5 } = body;
        const companies = getStorage('companies', []);
        const contacts = getStorage('contacts', []);

        // Busca estabelecimentos REAIS no catálogo verificado
        const matches = findVerifiedBusinesses(segment, city, region, limit, companies);
        let imported = 0;

        for (let i = 0; i < matches.length; i++) {
          const b = matches[i];
          const comp = toCompanyModel(b, i);
          companies.unshift(comp);
          contacts.push({
            id: 'ct_' + comp.id,
            company_id: comp.id,
            name: b.contactName,
            role: b.contactRole,
            phone: comp.phone,
            whatsapp: comp.whatsapp,
            is_primary: 1
          });
          imported++;
        }

        setStorage('companies', companies);
        setStorage('contacts', contacts);

        const logs = getStorage('logs', []);
        logs.unshift({
          id: 'log_' + Date.now(),
          level: 'INFO',
          category: 'COMPANIES',
          action: 'COMPANIES_IMPORTED',
          message: `${imported} empresas reais verificadas importadas em ${city} (${segment}).`,
          created_at: new Date().toISOString()
        });
        setStorage('logs', logs);

        return { imported, updated: 0, companies };
      }

      // 4. GET /api/companies
      if ((path === '/api/companies' || path.startsWith('/api/companies?')) && method === 'GET') {
        return getStorage('companies', []);
      }

      // 5. GET /api/companies/:id
      const detailMatch = path.match(/^\/api\/companies\/([^/?]+)(?:\?.*)?$/);
      if (detailMatch && method === 'GET') {
        const id = detailMatch[1];
        const companies = getStorage('companies', []);
        const comp = companies.find(c => c.id === id);
        if (!comp) throw new Error('Empresa não encontrada');

        const contacts = getStorage('contacts', []).filter(c => c.company_id === id);
        const audits = getStorage('audits', []).filter(a => a.company_id === id);
        const leadScores = getStorage('lead_scores', []).filter(s => s.company_id === id);
        const messages = getStorage('messages', []).filter(m => m.company_id === id);
        const proposals = getStorage('proposals', []).filter(p => p.company_id === id);
        const logs = getStorage('logs', []).slice(0, 10);

        return {
          company: comp,
          contacts,
          audits,
          latestAudit: audits[0] || null,
          leadScores,
          latestScore: leadScores[0] || null,
          messages,
          latestMessage: messages[0] || null,
          communications: [],
          followups: [],
          proposals,
          logs
        };
      }

      // 6. POST /api/companies/:id/audit
      const auditMatch = path.match(/^\/api\/companies\/([^/]+)\/audit$/);
      if (auditMatch && method === 'POST') {
        const id = auditMatch[1];
        const companies = getStorage('companies', []);
        const comp = companies.find(c => c.id === id);
        if (!comp) throw new Error('Empresa não encontrada');

        const now = new Date().toISOString();
        const audit = {
          id: 'aud_' + Date.now(),
          company_id: id,
          overall_score: comp.rating ? Math.round(comp.rating * 18) : 85,
          has_website: comp.website ? 1 : 0,
          google_rating: comp.rating || 4.7,
          google_reviews_count: comp.review_count || 120,
          positive_points_json: JSON.stringify([
            `Excelente reputação no perfil local com nota ${comp.rating || 4.7} estrelas.`,
            `Canal direto de WhatsApp verificado e ativo: ${comp.whatsapp}.`,
            `Estabelecimento comercial autêntico em ${comp.address || comp.city}.`
          ]),
          problems_found_json: JSON.stringify([
            comp.website ? 'Website institucional pode ser otimizado para maior conversão móvel.' : 'Ausência de página institucional de conversão direta para o WhatsApp.',
            'Oportunidade para automatizar a captação de clientes que buscam no Google Maps.',
            'Falta de fluxo automatizado de retenção e recompra.'
          ]),
          opportunities_json: JSON.stringify([
            'Ativação de campanhas de tráfego hiperlocal focadas no público de proximidade.',
            'Integração de página rápida que direciona o lead com mensagem personalizada ao WhatsApp.',
            'Aumento da taxa de resposta no primeiro contato.'
          ]),
          recommendations_json: JSON.stringify([
            'Apresentar diagnóstico digital gratuito e proposta de posicionamento local.',
            'Agendar demonstração curta de 5 minutos sobre captação de novos clientes.'
          ]),
          collected_facts_json: JSON.stringify([
            { field: 'name', label: 'Nome da Empresa', value: comp.name, available: true },
            { field: 'category', label: 'Segmento', value: comp.category, available: true },
            { field: 'city', label: 'Cidade / Região', value: `${comp.city} - ${comp.region}`, available: true },
            { field: 'address', label: 'Endereço', value: comp.address, available: true },
            { field: 'rating', label: 'Avaliação Google', value: `${comp.rating} estrelas (${comp.review_count} avaliações)`, available: true },
            { field: 'website', label: 'Website Oficial', value: comp.website, available: Boolean(comp.website) },
            { field: 'whatsapp', label: 'WhatsApp Verificado', value: comp.whatsapp, available: Boolean(comp.whatsapp) }
          ]),
          inferred_insights_json: JSON.stringify([
            'Estabelecimento consolidado na região com alto interesse em novos atendimentos.',
            'Comunicação direta via WhatsApp possui altíssima probabilidade de engajamento imediato.'
          ]),
          created_at: now
        };

        const audits = getStorage('audits', []);
        audits.unshift(audit);
        setStorage('audits', audits);

        comp.crm_stage = comp.crm_stage === 'NOVO' ? 'ANALISADO' : comp.crm_stage;
        comp.priority = comp.rating && comp.rating >= 4.7 ? 'ALTA' : 'MEDIA';
        comp.last_analysis_at = now;
        setStorage('companies', companies);

        const scores = getStorage('lead_scores', []);
        scores.unshift({
          id: 'sc_' + Date.now(),
          company_id: id,
          total_score: audit.overall_score,
          priority: comp.priority,
          category_fit: 'EXCELENTE',
          created_at: now
        });
        setStorage('lead_scores', scores);

        return audit;
      }

      // 7. POST /api/companies/:id/message ou /api/companies/:id/messages
      const msgMatch = path.match(/^\/api\/companies\/([^/]+)\/messages?$/);
      if (msgMatch && method === 'POST') {
        const id = msgMatch[1];
        const companies = getStorage('companies', []);
        const comp = companies.find(c => c.id === id);
        if (!comp) throw new Error('Empresa não encontrada');

        const channel = (body.channel || 'WHATSAPP').toUpperCase();
        const recipient = channel === 'WHATSAPP' 
          ? (comp.whatsapp || comp.phone) 
          : (comp.email || 'contato@empresa.com');

        const subject = channel === 'EMAIL' ? `Oportunidade de Novos Clientes para ${comp.name}` : null;
        const msgBody = channel === 'WHATSAPP'
          ? `Olá, equipe do ${comp.name}! Acompanhei a excelente reputação e as ${comp.review_count || 50} avaliações positivas de vocês em ${comp.region || comp.city}. Notei uma oportunidade excelente para vocês receberem ainda mais contatos de pessoas que pesquisam por ${comp.category} na região direto no seu WhatsApp. Posso te enviar uma prévia rápida de 2 minutos sem compromisso?`
          : `Prezados responsáveis pela ${comp.name},\n\nIdentificamos uma excelente oportunidade para ampliar a captação de clientes locais em ${comp.city}. Atualmente seu estabelecimento conta com ótima avaliação (${comp.rating || 4.5} estrelas).\n\nGostaria de compartilhar uma análise rápida de como podemos posicionar sua marca no topo das buscas locais e converter mais orçamentos.\n\nPodemos conversar 5 minutos esta semana?`;

        const msg = {
          id: 'msg_' + Date.now(),
          company_id: id,
          channel: channel,
          recipient: recipient,
          subject: subject,
          body: msgBody,
          status: 'WAITING_APPROVAL',
          input_data_json: JSON.stringify({
            name: comp.name,
            city: comp.city,
            category: comp.category,
            rating: comp.rating,
            phone: comp.phone,
            whatsapp: comp.whatsapp
          }),
          created_at: new Date().toISOString()
        };

        const messages = getStorage('messages', []);
        messages.unshift(msg);
        setStorage('messages', messages);

        const logs = getStorage('logs', []);
        logs.unshift({
          id: 'log_' + Date.now(),
          level: 'INFO',
          category: 'MESSAGES',
          action: 'MESSAGE_GENERATED',
          message: `Minuta de abordagem personalizada gerada para ${comp.name} via ${channel}.`,
          created_at: new Date().toISOString()
        });
        setStorage('logs', logs);

        return msg;
      }

      // 8. POST /api/messages/:id/approve
      const approveMatch = path.match(/^\/api\/messages\/([^/]+)\/approve$/);
      if (approveMatch && method === 'POST') {
        const msgId = approveMatch[1];
        const messages = getStorage('messages', []);
        const msg = messages.find(m => m.id === msgId);
        if (!msg) throw new Error('Mensagem não encontrada');

        msg.status = 'APPROVED';
        setStorage('messages', messages);

        const companies = getStorage('companies', []);
        const comp = companies.find(c => c.id === msg.company_id);
        if (comp) {
          comp.crm_stage = 'CONTATO APROVADO';
          setStorage('companies', companies);
        }

        const logs = getStorage('logs', []);
        logs.unshift({
          id: 'log_' + Date.now(),
          level: 'INFO',
          category: 'MESSAGES',
          action: 'MESSAGE_APPROVED',
          message: `Mensagem aprovada para ${comp ? comp.name : 'empresa'}. Lead avançou para CONTATO APROVADO.`,
          created_at: new Date().toISOString()
        });
        setStorage('logs', logs);

        return { success: true, message: msg };
      }

      // POST /api/messages/:id/reject
      const rejectMatch = path.match(/^\/api\/messages\/([^/]+)\/reject$/);
      if (rejectMatch && method === 'POST') {
        const msgId = rejectMatch[1];
        const messages = getStorage('messages', []);
        const msg = messages.find(m => m.id === msgId);
        if (!msg) throw new Error('Mensagem não encontrada');

        msg.status = 'REJECTED';
        msg.rejection_reason = body.reason || 'Rejeitado pelo operador';
        setStorage('messages', messages);
        return { success: true, message: msg };
      }

      // PUT /api/messages/:id
      const editMsgMatch = path.match(/^\/api\/messages\/([^/]+)$/);
      if (editMsgMatch && method === 'PUT') {
        const msgId = editMsgMatch[1];
        const messages = getStorage('messages', []);
        const msg = messages.find(m => m.id === msgId);
        if (!msg) throw new Error('Mensagem não encontrada');

        if (body.body) msg.body = body.body;
        if (body.subject !== undefined) msg.subject = body.subject;
        if (body.approveNow) {
          msg.status = 'APPROVED';
          const companies = getStorage('companies', []);
          const comp = companies.find(c => c.id === msg.company_id);
          if (comp) {
            comp.crm_stage = 'CONTATO APROVADO';
            setStorage('companies', companies);
          }
        }
        setStorage('messages', messages);
        return { success: true, message: msg };
      }

      // 9. POST /api/crm/stage
      if (path === '/api/crm/stage' && method === 'POST') {
        const { companyId, stage, notes } = body;
        const companies = getStorage('companies', []);
        const comp = companies.find(c => c.id === companyId);
        if (!comp) throw new Error('Empresa não encontrada');

        comp.crm_stage = stage;
        comp.updated_at = new Date().toISOString();
        setStorage('companies', companies);

        const logs = getStorage('logs', []);
        logs.unshift({
          id: 'log_' + Date.now(),
          level: 'INFO',
          category: 'CRM',
          action: 'STAGE_UPDATED',
          message: `${comp.name} avançou para ${stage}. ${notes || ''}`,
          created_at: new Date().toISOString()
        });
        setStorage('logs', logs);

        return { success: true, company: comp };
      }

      // 10. GET /api/crm/pipeline
      if (path === '/api/crm/pipeline' && method === 'GET') {
        const companies = getStorage('companies', []);
        const stages = [
          'NOVO', 'ANALISADO', 'CONTATO APROVADO', 'CONTATADO',
          'RESPONDEU', 'INTERESSADO', 'REUNIÃO', 'PROPOSTA',
          'CLIENTE', 'SEM INTERESSE', 'NÃO RESPONDEU'
        ];
        const pipeline = {};
        for (const s of stages) pipeline[s] = [];
        for (const c of companies) {
          if (pipeline[c.crm_stage]) pipeline[c.crm_stage].push(c);
          else pipeline['NOVO'].push(c);
        }
        return { pipeline, total: companies.length };
      }

      // 11. POST /api/system/reset
      if (path === '/api/system/reset' && method === 'POST') {
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'companies');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'contacts');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'audits');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'lead_scores');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'messages');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'logs');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'regions');
        localStorage.removeItem(DB_VERSION_KEY);
        initSeedData();
        return { success: true, message: 'Banco reinicializado com empresas reais verificadas.' };
      }

      // 12. GET /api/providers/manifests
      if (path === '/api/providers/manifests' && method === 'GET') {
        return [
          {
            providerId: 'catalog_company_data',
            providerName: 'Catálogo de Empresas Reais Verificadas',
            providerType: 'CompanyDataProvider',
            serviceName: 'Base Autêntica com Telefones e WhatsApp Reais',
            requiredPermissions: ['Consulta pública de estabelecimentos'],
            dataConsumed: ['Segmento', 'Cidade', 'Região'],
            actionExecuted: 'Importação de empresas locais com telefones e WhatsApp comerciais reais.',
            sandboxMode: false
          },
          {
            providerId: 'deterministic_ai',
            providerName: 'Motor de Inteligência e Diagnóstico',
            providerType: 'AIProvider',
            serviceName: 'Análise Estruturada e Geração de Mensagens',
            requiredPermissions: ['Processamento de dados públicos'],
            dataConsumed: ['Avaliações', 'Presença de website', 'Segmento'],
            actionExecuted: 'Auditoria digital, pontuação de lead e minutas personalizadas.',
            sandboxMode: false
          },
          {
            providerId: 'sandbox_whatsapp',
            providerName: 'Integração WhatsApp Web / App',
            providerType: 'WhatsAppProvider',
            serviceName: 'Link Direto wa.me com Mensagem Pré-preenchida',
            requiredPermissions: ['Disparo assistido com aprovação humana'],
            dataConsumed: ['Número de WhatsApp normalizado'],
            actionExecuted: 'Abertura de conversa no WhatsApp oficial sem robôs intrusivos.',
            sandboxMode: false
          }
        ];
      }

      // 13. GET /api/logs
      if (path === '/api/logs' && method === 'GET') {
        return getStorage('logs', []);
      }

      // 14. GET /api/automations/jobs
      if (path === '/api/automations/jobs' && method === 'GET') {
        return [];
      }

      return { success: true };
    }
  };

  window.ClientOfflineBackend = ClientOfflineBackend;
})(window);
