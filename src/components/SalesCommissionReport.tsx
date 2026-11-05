import React, { useState, useMemo } from 'react';
import { Vendedor, Pedido } from '../types';
import { formatCurrency } from '../services/pdfGenerator';
import {
  Percent,
  TrendingUp,
  DollarSign,
  Award,
  Users,
  Search,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Mail,
  Phone,
  ShoppingBag,
  Clock,
  Sparkles,
  Filter,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
  Eye,
} from 'lucide-react';

export interface SalesCommissionReportProps {
  vendedores: Vendedor[];
  pedidos: Pedido[];
  taxaComissao?: number; // Defaults to 0.02 (2%)
  onSelectPedido?: (pedidoId: string) => void;
  className?: string;
}

export interface SellerCommissionSummary {
  vendedor: Vendedor;
  totalVendasVolume: number;
  taxaComissao: number; // 0.02
  totalComissaoValor: number;
  quantidadePedidos: number;
  ticketMedio: number;
  vendasVinculadas: {
    id: string;
    numero_pedido: number;
    cliente_nome: string;
    cliente_telefone?: string;
    data: string;
    escola_nome: string;
    serie_turma?: string;
    forma_pagamento: string;
    total: number;
    comissao: number;
    status: string;
  }[];
}

export const SalesCommissionReport: React.FC<SalesCommissionReportProps> = ({
  vendedores,
  pedidos,
  taxaComissao = 0.02,
  onSelectPedido,
  className = '',
}) => {
  // Component State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'comissao' | 'pedidos' | 'nome'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedSellerId, setExpandedSellerId] = useState<string | null>(null);
  const [filterOnlyActive, setFilterOnlyActive] = useState(false);
  const [filterWithSalesOnly, setFilterWithSalesOnly] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Compute 2% commission calculations per seller based on stored orders data
  const sellersSummaries: SellerCommissionSummary[] = useMemo(() => {
    return vendedores.map((seller) => {
      // Find orders linked to this seller (by ID or exact seller name matching)
      const linkedOrders = pedidos.filter(
        (order) =>
          order.vendedor_id === seller.id ||
          order.vendedor_nome.toLowerCase().includes(seller.nome.toLowerCase())
      );

      // Total sales volume for this seller
      const totalVendasVolume = Number(
        linkedOrders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)
      );

      // Strict 2% commission calculation: totalVendasVolume * 0.02
      const totalComissaoValor = Number((totalVendasVolume * taxaComissao).toFixed(2));
      const quantidadePedidos = linkedOrders.length;
      const ticketMedio =
        quantidadePedidos > 0 ? Number((totalVendasVolume / quantidadePedidos).toFixed(2)) : 0;

      const vendasVinculadas = linkedOrders.map((order) => ({
        id: order.id,
        numero_pedido: order.numero_pedido,
        cliente_nome: order.cliente_nome,
        cliente_telefone: order.cliente_telefone,
        data: order.created_at,
        escola_nome: order.escola_nome,
        serie_turma: order.serie_turma,
        forma_pagamento: order.forma_pagamento,
        total: order.total,
        // 2% on individual order
        comissao: Number((order.total * taxaComissao).toFixed(2)),
        status: order.status,
      }));

      return {
        vendedor: seller,
        totalVendasVolume,
        taxaComissao,
        totalComissaoValor,
        quantidadePedidos,
        ticketMedio,
        vendasVinculadas,
      };
    });
  }, [vendedores, pedidos, taxaComissao]);

  // Global KPI totals
  const totalVolumeGeral = useMemo(() => {
    return Number(sellersSummaries.reduce((acc, s) => acc + s.totalVendasVolume, 0).toFixed(2));
  }, [sellersSummaries]);

  const totalComissoesGeral = useMemo(() => {
    return Number((totalVolumeGeral * taxaComissao).toFixed(2));
  }, [totalVolumeGeral, taxaComissao]);

  const totalPedidosGeral = useMemo(() => {
    return sellersSummaries.reduce((acc, s) => acc + s.quantidadePedidos, 0);
  }, [sellersSummaries]);

  const topSeller = useMemo(() => {
    const sorted = [...sellersSummaries].sort((a, b) => b.totalVendasVolume - a.totalVendasVolume);
    return sorted.length > 0 && sorted[0].totalVendasVolume > 0 ? sorted[0] : null;
  }, [sellersSummaries]);

  const sellersWithSalesCount = useMemo(() => {
    return sellersSummaries.filter((s) => s.quantidadePedidos > 0).length;
  }, [sellersSummaries]);

  // Filter and sort list
  const filteredAndSortedSellers = useMemo(() => {
    let result = [...sellersSummaries];

    // Filter by search keyword
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.vendedor.nome.toLowerCase().includes(q) ||
          s.vendedor.email.toLowerCase().includes(q) ||
          s.vendedor.telefone.includes(q) ||
          s.vendedor.codigo.toLowerCase().includes(q) ||
          s.vendedor.unidade.toLowerCase().includes(q)
      );
    }

    // Filter only active sellers
    if (filterOnlyActive) {
      result = result.filter((s) => s.vendedor.ativo !== false);
    }

    // Filter only sellers with sales
    if (filterWithSalesOnly) {
      result = result.filter((s) => s.quantidadePedidos > 0);
    }

    // Sort
    result.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortBy === 'volume') {
        valA = a.totalVendasVolume;
        valB = b.totalVendasVolume;
      } else if (sortBy === 'comissao') {
        valA = a.totalComissaoValor;
        valB = b.totalComissaoValor;
      } else if (sortBy === 'pedidos') {
        valA = a.quantidadePedidos;
        valB = b.quantidadePedidos;
      } else {
        valA = a.vendedor.nome;
        valB = b.vendedor.nome;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }

      return sortOrder === 'asc' ? valA - (valB as number) : (valB as number) - valA;
    });

    return result;
  }, [sellersSummaries, searchTerm, filterOnlyActive, filterWithSalesOnly, sortBy, sortOrder]);

  // Sort toggle handler
  const handleSortToggle = (field: 'volume' | 'comissao' | 'pedidos' | 'nome') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Código Vendedor',
      'Nome do Vendedor',
      'E-mail Corporativo',
      'Telefone',
      'Unidade',
      'Status',
      'Qtd. de Pedidos',
      'Volume de Vendas (R$)',
      'Taxa de Comissão (%)',
      'Comissão Calculada (R$)',
      'Ticket Médio (R$)',
    ];

    const rows = filteredAndSortedSellers.map((s) => [
      `"${s.vendedor.codigo}"`,
      `"${s.vendedor.nome}"`,
      `"${s.vendedor.email}"`,
      `"${s.vendedor.telefone}"`,
      `"${s.vendedor.unidade}"`,
      s.vendedor.ativo !== false ? 'Ativo' : 'Inativo',
      s.quantidadePedidos,
      s.totalVendasVolume.toFixed(2),
      '2.00%',
      s.totalComissaoValor.toFixed(2),
      s.ticketMedio.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `relatorio_comissoes_2pct_vendedores_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={`rounded-3xl transition-colors duration-200 ${
        isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
      } ${className}`}
    >
      <div className="p-5 sm:p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 bg-[#FFC700] text-[#0D3B8E] text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                <Percent className="w-3 h-3 text-[#D92323]" />
                Taxa Oficial: 2% (0.02)
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Papelaria Globo · Rio Branco - AC · Ano Letivo 2027
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#0D3B8E] dark:text-blue-400 tracking-tight">
              Relatório de Comissões de Vendas (Sales Commission Report)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Demonstrativo consolidado de volume bruto de vendas por vendedor e comissão automática de 2% calculada sobre os pedidos.
            </p>
          </div>

          {/* Action buttons and Dark Mode switch */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              title={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro (Dark Mode)'}
              className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-300 transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-300 dark:border-emerald-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Sales Volume */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-[#0D3B8E]/20 dark:border-slate-700 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Volume Total de Vendas
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#0D3B8E] dark:text-blue-300 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#0D3B8E] dark:text-blue-400 font-mono mt-1.5 tabular-nums">
              {formatCurrency(totalVolumeGeral)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Base de <strong>{totalPedidosGeral} pedidos</strong> vinculados à equipe
            </div>
          </div>

          {/* Card 2: Total Commission at 2% */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-slate-800/80 border-2 border-[#FFC700] dark:border-amber-500/80 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#D92323]" />
                Comissões a Pagar (2%)
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FFC700] text-[#0D3B8E] flex items-center justify-center font-black shadow-xs">
                <DollarSign className="w-4 h-4 stroke-[3]" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#D92323] dark:text-amber-300 font-mono mt-1.5 tabular-nums">
              {formatCurrency(totalComissoesGeral)}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              Fórmula exata: <code>total_vendas * 0.02</code>
            </div>
          </div>

          {/* Card 3: Top Seller */}
          <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-slate-800/80 border-2 border-emerald-400/40 dark:border-emerald-700/60 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Vendedor Destaque
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-black px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                1º Lugar
              </span>
            </div>
            {topSeller ? (
              <>
                <div className="text-base font-black text-slate-900 dark:text-white mt-1.5 truncate">
                  {topSeller.vendedor.nome}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 flex items-center justify-between">
                  <span>{formatCurrency(topSeller.totalVendasVolume)} vendidos</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    Comissão: {formatCurrency(topSeller.totalComissaoValor)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 mt-2">Sem vendas computadas</div>
            )}
          </div>

          {/* Card 4: Sellers Active & Participation */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Participação Comercial
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1.5 tabular-nums">
              {sellersWithSalesCount}{' '}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                / {vendedores.length} vendedores
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Vendedores com comissões a receber no período
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar vendedor por nome, e-mail, telefone ou unidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#0D3B8E] dark:text-white font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterWithSalesOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-colors cursor-pointer ${
                filterWithSalesOnly
                  ? 'bg-[#0D3B8E] text-[#FFC700] border-[#0D3B8E]'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Com Vendas ({sellersWithSalesCount})
            </button>

            <button
              onClick={() => setFilterOnlyActive((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-colors cursor-pointer ${
                filterOnlyActive
                  ? 'bg-[#0D3B8E] text-[#FFC700] border-[#0D3B8E]'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Somente Ativos
            </button>

            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold ml-1">
              Exibindo <strong>{filteredAndSortedSellers.length}</strong> de {vendedores.length}
            </span>
          </div>
        </div>

        {/* Sellers Commission Table */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs bg-white dark:bg-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5 whitespace-nowrap">
                    <button
                      onClick={() => handleSortToggle('nome')}
                      className="flex items-center gap-1 hover:text-[#0D3B8E] dark:hover:text-blue-300 cursor-pointer"
                    >
                      <span>Vendedor</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="p-3.5 whitespace-nowrap">Contatos (E-mail / Fone)</th>
                  <th className="p-3.5 whitespace-nowrap">Unidade / Setor</th>
                  <th className="p-3.5 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleSortToggle('pedidos')}
                      className="inline-flex items-center gap-1 hover:text-[#0D3B8E] dark:hover:text-blue-300 cursor-pointer"
                    >
                      <span>Qtd. Vendas</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="p-3.5 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleSortToggle('volume')}
                      className="inline-flex items-center gap-1 hover:text-[#0D3B8E] dark:hover:text-blue-300 cursor-pointer"
                    >
                      <span>Volume de Vendas (R$)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="p-3.5 whitespace-nowrap text-center">Taxa (%)</th>
                  <th className="p-3.5 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleSortToggle('comissao')}
                      className="inline-flex items-center gap-1 hover:text-[#0D3B8E] dark:hover:text-blue-300 cursor-pointer"
                    >
                      <span>Comissão a Pagar (2%)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="p-3.5 whitespace-nowrap text-center">Extrato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                {filteredAndSortedSellers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                      Nenhum vendedor encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedSellers.map((sellerSummary, index) => {
                    const isExpanded = expandedSellerId === sellerSummary.vendedor.id;
                    const isLeader = index === 0 && sellerSummary.totalVendasVolume > 0 && sortBy === 'volume';

                    return (
                      <React.Fragment key={sellerSummary.vendedor.id}>
                        <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                          {/* Seller Info */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-[#0D3B8E] text-[#FFC700] font-black text-xs flex items-center justify-center shrink-0 border border-[#FFC700]/70 shadow-2xs">
                                {sellerSummary.vendedor.codigo.replace('VEND-', '')}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <strong className="text-slate-900 dark:text-white font-bold text-xs">
                                    {sellerSummary.vendedor.nome}
                                  </strong>
                                  {isLeader && (
                                    <span className="bg-[#FFC700] text-[#0D3B8E] text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                                      ★ Top 1
                                    </span>
                                  )}
                                  {sellerSummary.vendedor.ativo === false && (
                                    <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                      Inativo
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                  ID: {sellerSummary.vendedor.codigo}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <a
                                href={`mailto:${sellerSummary.vendedor.email}`}
                                className="text-slate-700 dark:text-slate-300 hover:text-[#0D3B8E] dark:hover:text-blue-300 flex items-center gap-1 text-[11px]"
                              >
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[160px]">{sellerSummary.vendedor.email}</span>
                              </a>
                              <a
                                href={`https://wa.me/55${sellerSummary.vendedor.telefone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                              >
                                <Phone className="w-3 h-3 shrink-0" />
                                <span>{sellerSummary.vendedor.telefone}</span>
                              </a>
                            </div>
                          </td>

                          {/* Unit / Store Location */}
                          <td className="p-3.5 text-slate-600 dark:text-slate-300 text-[11px]">
                            {sellerSummary.vendedor.unidade}
                          </td>

                          {/* Orders Count & Ticket */}
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full font-mono font-bold text-[11px] ${
                                sellerSummary.quantidadePedidos > 0
                                  ? 'bg-blue-50 dark:bg-blue-900/40 text-[#0D3B8E] dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                              }`}
                            >
                              {sellerSummary.quantidadePedidos} {sellerSummary.quantidadePedidos === 1 ? 'pedido' : 'pedidos'}
                            </span>
                            {sellerSummary.ticketMedio > 0 && (
                              <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                Méd: {formatCurrency(sellerSummary.ticketMedio)}
                              </span>
                            )}
                          </td>

                          {/* Total Sales Volume (R$) */}
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums text-xs">
                            {formatCurrency(sellerSummary.totalVendasVolume)}
                          </td>

                          {/* Commission Rate (2%) */}
                          <td className="p-3.5 text-center">
                            <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 font-mono font-black text-[11px] px-2 py-0.5 rounded border border-amber-300/60 dark:border-amber-700">
                              2,00%
                            </span>
                          </td>

                          {/* Commission Value (R$) */}
                          <td className="p-3.5 text-right font-mono font-black text-[#D92323] dark:text-amber-400 text-sm tabular-nums">
                            {formatCurrency(sellerSummary.totalComissaoValor)}
                          </td>

                          {/* Toggle Drilldown Button */}
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() =>
                                setExpandedSellerId(isExpanded ? null : sellerSummary.vendedor.id)
                              }
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                isExpanded
                                  ? 'bg-[#0D3B8E] text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <span>{isExpanded ? 'Ocultar' : 'Vendas'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Order List for Seller */}
                        {isExpanded && (
                          <tr className="bg-blue-50/40 dark:bg-slate-900/90">
                            <td colSpan={8} className="p-4 border-y border-blue-200 dark:border-slate-700">
                              <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-blue-200/60 dark:border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-[#0D3B8E] dark:text-blue-400" />
                                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                                      Extrato de Vendas Vinculadas — {sellerSummary.vendedor.nome} ({sellerSummary.vendasVinculadas.length} pedidos)
                                    </h5>
                                  </div>
                                  <span className="text-[11px] text-slate-600 dark:text-slate-300">
                                    Total comissionado deste vendedor:{' '}
                                    <strong className="text-[#D92323] dark:text-amber-400 font-mono">
                                      {formatCurrency(sellerSummary.totalComissaoValor)}
                                    </strong>{' '}
                                    (2% sobre {formatCurrency(sellerSummary.totalVendasVolume)})
                                  </span>
                                </div>

                                {sellerSummary.vendasVinculadas.length === 0 ? (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                                    Nenhum pedido vinculado a este vendedor até o momento. Conforme os clientes selecionam o vendedor no checkout do kitGlobo, as vendas e comissões de 2% aparecem automaticamente aqui.
                                  </p>
                                ) : (
                                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                                    <table className="w-full text-left text-[11px]">
                                      <thead>
                                        <tr className="bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                                          <th className="p-2.5">Nº Pedido</th>
                                          <th className="p-2.5">Cliente</th>
                                          <th className="p-2.5">Data / Hora</th>
                                          <th className="p-2.5">Instituição / Série</th>
                                          <th className="p-2.5">Pagamento</th>
                                          <th className="p-2.5">Status</th>
                                          <th className="p-2.5 text-right">Valor Venda</th>
                                          <th className="p-2.5 text-right text-emerald-700 dark:text-emerald-400">
                                            Comissão (2%)
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {sellerSummary.vendasVinculadas.map((item) => (
                                          <tr
                                            key={item.id}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-700/40"
                                          >
                                            <td className="p-2.5 font-mono font-bold text-[#0D3B8E] dark:text-blue-400">
                                              #{item.numero_pedido}
                                            </td>
                                            <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                                              {item.cliente_nome}
                                              {item.cliente_telefone && (
                                                <span className="block text-[10px] text-slate-400">
                                                  {item.cliente_telefone}
                                                </span>
                                              )}
                                            </td>
                                            <td className="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                              {new Date(item.data).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })}
                                            </td>
                                            <td className="p-2.5 text-slate-700 dark:text-slate-300">
                                              <span className="font-semibold">{item.escola_nome}</span>
                                              {item.serie_turma && (
                                                <span className="block text-[10px] text-slate-400">
                                                  {item.serie_turma}
                                                </span>
                                              )}
                                            </td>
                                            <td className="p-2.5 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
                                              {item.forma_pagamento.replace('_', ' ')}
                                            </td>
                                            <td className="p-2.5">
                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                                                {item.status.replace('_', ' ')}
                                              </span>
                                            </td>
                                            <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                              {formatCurrency(item.total)}
                                            </td>
                                            <td className="p-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                                              +{formatCurrency(item.comissao)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Summary Note */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            * A comissão de 2% (0.02) é creditada automaticamente a cada pedido concluído na Papelaria Globo.
          </div>
          <div className="font-mono mt-1 sm:mt-0">
            Atualizado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  );
};
