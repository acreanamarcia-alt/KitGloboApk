export type OrderStatus = 'pendente' | 'pago' | 'em_separacao' | 'pronto_retirada' | 'finalizado';

export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao_presencial';

export interface Escola {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  telefone?: string;
  logo_url?: string;
  badge_color?: string;
  ativo: boolean;
  total_turmas?: number;
}

export interface Turma {
  id: string;
  escola_id: string;
  serie: string;
  turno: 'Matutino' | 'Vespertino' | 'Integral';
  ano_letivo: number; // 2027
}

export interface ItemKit {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  marca_sugerida?: string;
  categoria: 'caderno' | 'escrita' | 'arte_pintura' | 'geometria_organizacao' | 'higiene_apoio';
  obrigatorio: boolean;
}

export interface ItemExtra {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  categoria: 'mochilas_estojos' | 'escrita_premium' | 'organizacao' | 'artes';
  foto_url?: string;
}

export interface Kit {
  id: string;
  turma_id: string;
  preco: number; // Preço do kit base fechado
  itens_json: ItemKit[];
  itens_extras_json: ItemExtra[];
}

export interface Vendedor {
  id: string;
  codigo: string;
  nome: string;
  email: string;
  telefone: string;
  contato: string;
  unidade: string;
  ativo?: boolean;
}

export interface Venda {
  id: string;
  numero_pedido?: number;
  vendedor_id: string;
  vendedor_nome?: string;
  cliente_nome: string;
  cliente_telefone?: string;
  total: number;
  created_at: string;
  status?: OrderStatus;
  forma_pagamento?: PaymentMethod;
  escola_nome?: string;
  serie_turma?: string;
}

export interface ItemVendaComissao {
  id: string;
  numero_pedido: number;
  cliente_nome: string;
  cliente_telefone?: string;
  data: string;
  total: number;
  comissao: number; // 2% exato (total * 0.02)
  status: OrderStatus;
  escola_nome: string;
  serie_turma?: string;
  forma_pagamento: PaymentMethod;
}

export interface ComissaoVendedorResumo {
  vendedor: Vendedor;
  totalVendasValor: number;
  taxaComissao: number; // 0.02 (2%)
  totalComissaoValor: number;
  quantidadeVendas: number;
  ticketMedio: number;
  vendas: ItemVendaComissao[];
}

export interface RelatorioComissoesGeral {
  taxaPadrao: number; // 0.02 (2%)
  totalFaturamentoVendedores: number;
  totalComissoesPagar: number;
  totalPedidosComissionados: number;
  vendedorDestaque: ComissaoVendedorResumo | null;
  resumosPorVendedor: ComissaoVendedorResumo[];
  geradoEm: string;
}

export interface CartItem {
  cart_id: string;
  kit_id: string;
  escola_id: string;
  escola_nome: string;
  turma_id: string;
  serie: string;
  turno: string;
  aluno_nome: string;
  preco_base_kit: number;
  itens_obrigatorios: ItemKit[];
  itens_extras_selecionados: {
    item: ItemExtra;
    quantidade: number;
  }[];
  subtotal: number;
}

export interface Pedido {
  id: string;
  numero_pedido: number; // Incremental sequential (ex: 2027001)
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email?: string;
  cliente_cpf?: string;
  aluno_nome: string;
  escola_nome: string;
  serie_turma: string;
  itens: {
    kit_id: string;
    serie: string;
    preco_kit: number;
    obrigatorios: ItemKit[];
  }[];
  itens_extras: {
    id: string;
    nome: string;
    quantidade: number;
    preco_unitario: number;
  }[];
  subtotal: number;
  desconto: number;
  total: number;
  status: OrderStatus;
  vendedor_id: string;
  vendedor_nome: string;
  forma_pagamento: PaymentMethod;
  troco_para: number | null;
  valor_troco: number | null;
  data_retirada: string; // YYYY-MM-DD
  hora_retirada: string; // HH:MM
  observacoes?: string;
  created_at: string;
  finalizado_at?: string;
  whatsapp_notificado?: boolean;
}
