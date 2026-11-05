import {
  Escola,
  Turma,
  Kit,
  Vendedor,
  Pedido,
  OrderStatus,
  ComissaoVendedorResumo,
  RelatorioComissoesGeral,
  ItemVendaComissao,
} from '../types';
import {
  INITIAL_ESCOLAS,
  INITIAL_TURMAS,
  INITIAL_KITS,
  INITIAL_VENDEDORES,
  INITIAL_PEDIDOS,
} from '../data/mockData';

export const TAXA_COMISSAO_PADRAO = 0.02; // Exatamente 2% (0.02)

const STORAGE_KEYS = {
  ESCOLAS: 'kitglobo_escolas_v1',
  TURMAS: 'kitglobo_turmas_v1',
  KITS: 'kitglobo_kits_v1',
  VENDEDORES: 'kitglobo_vendedores_v1',
  PEDIDOS: 'kitglobo_pedidos_v1',
  ORDER_SEQ: 'kitglobo_order_seq_v1',
};

// Listeners for reactive updates
type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

export function subscribeToStore(listener: StorageListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error notifying listener:', e);
    }
  });
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Failed to read ${key} from localStorage, using fallback:`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  } catch (e) {
    console.error(`Failed to write ${key} to localStorage:`, e);
  }
}

// Initialize if empty
export function initStore(): void {
  if (!localStorage.getItem(STORAGE_KEYS.ESCOLAS)) {
    localStorage.setItem(STORAGE_KEYS.ESCOLAS, JSON.stringify(INITIAL_ESCOLAS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TURMAS)) {
    localStorage.setItem(STORAGE_KEYS.TURMAS, JSON.stringify(INITIAL_TURMAS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.KITS)) {
    localStorage.setItem(STORAGE_KEYS.KITS, JSON.stringify(INITIAL_KITS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.VENDEDORES)) {
    localStorage.setItem(STORAGE_KEYS.VENDEDORES, JSON.stringify(INITIAL_VENDEDORES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PEDIDOS)) {
    localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(INITIAL_PEDIDOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDER_SEQ)) {
    localStorage.setItem(STORAGE_KEYS.ORDER_SEQ, '2027003');
  }
}

// Ensure store is primed
initStore();

// Escolas
export function getEscolas(): Escola[] {
  return getItem<Escola[]>(STORAGE_KEYS.ESCOLAS, INITIAL_ESCOLAS);
}

export function saveEscola(escola: Escola): void {
  const current = getEscolas();
  const index = current.findIndex((e) => e.id === escola.id);
  if (index >= 0) {
    current[index] = escola;
  } else {
    current.unshift(escola);
  }
  setItem(STORAGE_KEYS.ESCOLAS, current);
}

// Turmas
export function getTurmas(): Turma[] {
  return getItem<Turma[]>(STORAGE_KEYS.TURMAS, INITIAL_TURMAS);
}

export function getTurmasByEscola(escolaId: string): Turma[] {
  return getTurmas().filter((t) => t.escola_id === escolaId);
}

export function saveTurma(turma: Turma): void {
  const current = getTurmas();
  const index = current.findIndex((t) => t.id === turma.id);
  if (index >= 0) {
    current[index] = turma;
  } else {
    current.push(turma);
  }
  setItem(STORAGE_KEYS.TURMAS, current);
}

// Kits
export function getKits(): Kit[] {
  return getItem<Kit[]>(STORAGE_KEYS.KITS, INITIAL_KITS);
}

export function getKitByTurma(turmaId: string): Kit | undefined {
  return getKits().find((k) => k.turma_id === turmaId);
}

export function saveKit(kit: Kit): void {
  const current = getKits();
  const index = current.findIndex((k) => k.id === kit.id);
  if (index >= 0) {
    current[index] = kit;
  } else {
    current.push(kit);
  }
  setItem(STORAGE_KEYS.KITS, current);
}

// Vendedores (Gestão & 10 Oficiais Cadastrados)
export function getVendedores(): Vendedor[] {
  return getItem<Vendedor[]>(STORAGE_KEYS.VENDEDORES, INITIAL_VENDEDORES);
}

export function saveVendedor(vendedor: Vendedor): void {
  const current = getVendedores();
  const index = current.findIndex((v) => v.id === vendedor.id);
  if (index >= 0) {
    current[index] = vendedor;
  } else {
    current.push(vendedor);
  }
  setItem(STORAGE_KEYS.VENDEDORES, current);
}

export function deleteVendedor(id: string): void {
  const current = getVendedores();
  const updated = current.filter((v) => v.id !== id);
  setItem(STORAGE_KEYS.VENDEDORES, updated);
}

/**
 * Lógica de Cálculo de Comissão:
 * Aplica exatamente 2% (0.02) sobre o valor total das vendas de cada vendedor.
 */
export function calcularComissaoVendedor(
  vendedor: Vendedor,
  pedidos: Pedido[],
  taxa: number = TAXA_COMISSAO_PADRAO
): ComissaoVendedorResumo {
  const vendasDoVendedor = pedidos.filter(
    (p) =>
      p.vendedor_id === vendedor.id ||
      p.vendedor_nome.toLowerCase().includes(vendedor.nome.toLowerCase())
  );

  const vendasFormatadas: ItemVendaComissao[] = vendasDoVendedor.map((p) => {
    // 2% exato sobre o total da venda
    const comissaoItem = Number((p.total * taxa).toFixed(2));
    return {
      id: p.id,
      numero_pedido: p.numero_pedido,
      cliente_nome: p.cliente_nome,
      cliente_telefone: p.cliente_telefone,
      data: p.created_at,
      total: p.total,
      comissao: comissaoItem,
      status: p.status,
      escola_nome: p.escola_nome,
      serie_turma: p.serie_turma,
      forma_pagamento: p.forma_pagamento,
    };
  });

  const totalVendasValor = Number(
    vendasDoVendedor.reduce((sum, p) => sum + p.total, 0).toFixed(2)
  );
  // Cálculo exato: total * 0.02
  const totalComissaoValor = Number((totalVendasValor * taxa).toFixed(2));
  const quantidadeVendas = vendasDoVendedor.length;
  const ticketMedio =
    quantidadeVendas > 0 ? Number((totalVendasValor / quantidadeVendas).toFixed(2)) : 0;

  return {
    vendedor,
    totalVendasValor,
    taxaComissao: taxa,
    totalComissaoValor,
    quantidadeVendas,
    ticketMedio,
    vendas: vendasFormatadas,
  };
}

/**
 * Gera o relatório consolidado de vendas e comissões a 2% para todos os vendedores.
 */
export function gerarRelatorioComissoes(
  vendedores: Vendedor[],
  pedidos: Pedido[],
  taxa: number = TAXA_COMISSAO_PADRAO
): RelatorioComissoesGeral {
  const resumosPorVendedor = vendedores.map((v) =>
    calcularComissaoVendedor(v, pedidos, taxa)
  );

  // Ordena por maior faturamento de vendas
  resumosPorVendedor.sort((a, b) => b.totalVendasValor - a.totalVendasValor);

  const totalFaturamentoVendedores = Number(
    resumosPorVendedor.reduce((sum, r) => sum + r.totalVendasValor, 0).toFixed(2)
  );
  const totalComissoesPagar = Number(
    (totalFaturamentoVendedores * taxa).toFixed(2)
  );
  const totalPedidosComissionados = resumosPorVendedor.reduce(
    (sum, r) => sum + r.quantidadeVendas,
    0
  );

  const vendedorDestaque =
    resumosPorVendedor.length > 0 && resumosPorVendedor[0].totalVendasValor > 0
      ? resumosPorVendedor[0]
      : null;

  return {
    taxaPadrao: taxa,
    totalFaturamentoVendedores,
    totalComissoesPagar,
    totalPedidosComissionados,
    vendedorDestaque,
    resumosPorVendedor,
    geradoEm: new Date().toISOString(),
  };
}

// Pedidos
export function getPedidos(): Pedido[] {
  return getItem<Pedido[]>(STORAGE_KEYS.PEDIDOS, INITIAL_PEDIDOS);
}

export function getPedidoById(id: string): Pedido | undefined {
  return getPedidos().find((p) => p.id === id);
}

// Incremental sequential order sequence
export function getNextOrderNumber(): number {
  const current = parseInt(localStorage.getItem(STORAGE_KEYS.ORDER_SEQ) || '2027003', 10);
  const next = current + 1;
  localStorage.setItem(STORAGE_KEYS.ORDER_SEQ, next.toString());
  return current;
}

export function createPedido(dados: Omit<Pedido, 'id' | 'numero_pedido' | 'created_at' | 'status'>): Pedido {
  const currentPedidos = getPedidos();
  const numero_pedido = getNextOrderNumber();
  const novoPedido: Pedido = {
    ...dados,
    id: `ped-${numero_pedido}-${Date.now().toString(36)}`,
    numero_pedido,
    status: 'pendente',
    created_at: new Date().toISOString(),
  };

  currentPedidos.unshift(novoPedido);
  setItem(STORAGE_KEYS.PEDIDOS, currentPedidos);
  return novoPedido;
}

export function updatePedidoStatus(
  pedidoId: string,
  newStatus: OrderStatus,
  whatsappNotificado?: boolean
): Pedido | null {
  const current = getPedidos();
  const idx = current.findIndex((p) => p.id === pedidoId);
  if (idx === -1) return null;

  const updated: Pedido = {
    ...current[idx],
    status: newStatus,
    finalizado_at: newStatus === 'finalizado' ? new Date().toISOString() : current[idx].finalizado_at,
    whatsapp_notificado: whatsappNotificado !== undefined ? whatsappNotificado : current[idx].whatsapp_notificado,
  };

  current[idx] = updated;
  setItem(STORAGE_KEYS.PEDIDOS, current);
  return updated;
}

// Reset store to initial state
export function resetToSeedData(): void {
  localStorage.setItem(STORAGE_KEYS.ESCOLAS, JSON.stringify(INITIAL_ESCOLAS));
  localStorage.setItem(STORAGE_KEYS.TURMAS, JSON.stringify(INITIAL_TURMAS));
  localStorage.setItem(STORAGE_KEYS.KITS, JSON.stringify(INITIAL_KITS));
  localStorage.setItem(STORAGE_KEYS.VENDEDORES, JSON.stringify(INITIAL_VENDEDORES));
  localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(INITIAL_PEDIDOS));
  localStorage.setItem(STORAGE_KEYS.ORDER_SEQ, '2027003');
  notifyListeners();
}
