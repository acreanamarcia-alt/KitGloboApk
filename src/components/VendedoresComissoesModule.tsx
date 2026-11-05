import React, { useState, useMemo } from 'react';
import {
  Vendedor,
  Pedido,
  ComissaoVendedorResumo,
  ItemVendaComissao,
} from '../types';
import {
  calcularComissaoVendedor,
  gerarRelatorioComissoes,
  TAXA_COMISSAO_PADRAO,
} from '../services/storage';
import { formatCurrency } from '../services/pdfGenerator';
import { useToast } from './Toast';
import {
  Users,
  DollarSign,
  TrendingUp,
  Award,
  Search,
  Plus,
  UserPlus,
  Mail,
  Phone,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronUp,
  Briefcase,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  ShoppingBag,
  Clock,
  Sparkles,
  Layers,
  ArrowUpDown,
  FileText,
  Percent,
  Moon,
  Sun,
} from 'lucide-react';

interface VendedoresComissoesModuleProps {
  vendedores: Vendedor[];
  pedidos: Pedido[];
  onSaveVendedor: (vendedor: Vendedor) => void;
  onDeleteVendedor: (vendedorId: string) => void;
}

export const VendedoresComissoesModule: React.FC<VendedoresComissoesModuleProps> = ({
  vendedores,
  pedidos,
  onSaveVendedor,
  onDeleteVendedor,
}) => {
  const { showToast } = useToast();

  // Local View State
  const [activeSubTab, setActiveSubTab] = useState<'relatorio' | 'gestao'>('relatorio');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendedorDetail, setSelectedVendedorDetail] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'vendas' | 'comissao' | 'nome' | 'qtd'>('vendas');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [darkModePreview, setDarkModePreview] = useState(false);

  // Modal State for Add / Edit Salesperson
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formUnidade, setFormUnidade] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);

  // Generate complete commission report with pure logic
  const relatorioGeral = useMemo(() => {
    return gerarRelatorioComissoes(vendedores, pedidos, TAXA_COMISSAO_PADRAO);
  }, [vendedores, pedidos]);

  // Filter and sort commission summaries
  const filteredSummaries = useMemo(() => {
    let list = [...relatorioGeral.resumosPorVendedor];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          r.vendedor.nome.toLowerCase().includes(term) ||
          r.vendedor.email.toLowerCase().includes(term) ||
          r.vendedor.telefone.includes(term) ||
          r.vendedor.codigo.toLowerCase().includes(term) ||
          r.vendedor.unidade.toLowerCase().includes(term)
      );
    }

    list.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortField === 'vendas') {
        valA = a.totalVendasValor;
        valB = b.totalVendasValor;
      } else if (sortField === 'comissao') {
        valA = a.totalComissaoValor;
        valB = b.totalComissaoValor;
      } else if (sortField === 'qtd') {
        valA = a.quantidadeVendas;
        valB = b.quantidadeVendas;
      } else {
        valA = a.vendedor.nome;
        valB = b.vendedor.nome;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc'
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }

      return sortDirection === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

    return list;
  }, [relatorioGeral, searchTerm, sortField, sortDirection]);

  // Handle open add modal
  const handleOpenAddModal = () => {
    setEditingVendedor(null);
    const nextCodeNum = 100 + vendedores.length + 1;
    setFormCodigo(`VEND-${nextCodeNum}`);
    setFormNome('');
    setFormEmail('');
    setFormTelefone('(68) 9');
    setFormUnidade('Matriz Centro (Av. Brasil)');
    setFormAtivo(true);
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (v: Vendedor) => {
    setEditingVendedor(v);
    setFormCodigo(v.codigo);
    setFormNome(v.nome);
    setFormEmail(v.email);
    setFormTelefone(v.telefone || v.contato);
    setFormUnidade(v.unidade);
    setFormAtivo(v.ativo ?? true);
    setIsModalOpen(true);
  };

  // Handle Save Salesperson
  const handleSubmitVendedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formEmail.trim() || !formTelefone.trim()) {
      showToast('Campos obrigatórios', 'Preencha Nome, E-mail e Telefone.', 'error');
      return;
    }

    const vendedorToSave: Vendedor = {
      id: editingVendedor ? editingVendedor.id : `vend-${Date.now().toString(36)}`,
      codigo: formCodigo.trim() || `VEND-${100 + vendedores.length + 1}`,
      nome: formNome.trim(),
      email: formEmail.trim().toLowerCase(),
      telefone: formTelefone.trim(),
      contato: formTelefone.trim(),
      unidade: formUnidade.trim() || 'Papelaria Globo Matriz',
      ativo: formAtivo,
    };

    onSaveVendedor(vendedorToSave);
    setIsModalOpen(false);

    showToast(
      editingVendedor ? 'Vendedor atualizado!' : 'Vendedor cadastrado!',
      `${vendedorToSave.nome} está registrado no sistema com comissão padrão de 2%.`,
      'success'
    );
  };

  // Toggle active status directly
  const handleToggleStatus = (vendedor: Vendedor) => {
    const updated: Vendedor = {
      ...vendedor,
      ativo: !vendedor.ativo,
    };
    onSaveVendedor(updated);
    showToast(
      updated.ativo ? 'Vendedor Ativado' : 'Vendedor Desativado',
      `${updated.nome} agora está ${updated.ativo ? 'disponível' : 'oculto'} no checkout.`,
      'info'
    );
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Código',
      'Nome do Vendedor',
      'E-mail',
      'Telefone',
      'Unidade',
      'Qtd. Vendas',
      'Total em Vendas (R$)',
      'Taxa Comissão',
      'Comissão a Pagar (R$)',
      'Status',
    ];

    const rows = relatorioGeral.resumosPorVendedor.map((r) => [
      `"${r.vendedor.codigo}"`,
      `"${r.vendedor.nome}"`,
      `"${r.vendedor.email}"`,
      `"${r.vendedor.telefone}"`,
      `"${r.vendedor.unidade}"`,
      r.quantidadeVendas,
      r.totalVendasValor.toFixed(2),
      '2.00%',
      r.totalComissaoValor.toFixed(2),
      r.vendedor.ativo !== false ? 'Ativo' : 'Inativo',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `relatorio_comissoes_papelaria_globo_2027_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exportação concluída', 'Relatório CSV de comissões gerado com sucesso.', 'success');
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  const toggleSort = (field: 'vendas' | 'comissao' | 'nome' | 'qtd') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div
      className={`space-y-6 transition-colors duration-200 ${
        darkModePreview ? 'dark bg-slate-900 text-slate-100 p-4 rounded-3xl' : 'text-slate-900'
      }`}
    >
      {/* Top Controls & Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-[#FFC700] text-[#0D3B8E] text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Percent className="w-3 h-3 text-[#D92323]" />
              Taxa Fixa: 2,00%
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Papelaria Globo · Rio Branco (Ano 2027)
            </span>
          </div>
          <h3 className="text-xl font-black text-[#0D3B8E] dark:text-amber-400 mt-1">
            Gestão de Vendedores & Relatório de Comissões
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Acompanhe o faturamento comissionado e gerencie os vendedores autorizados para o kitGlobo.
          </p>
        </div>

        {/* View Switcher, Dark Mode & New Salesperson Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subtabs Switcher */}
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveSubTab('relatorio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'relatorio'
                  ? 'bg-[#0D3B8E] text-[#FFC700] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Relatório de Comissões (2%)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('gestao')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'gestao'
                  ? 'bg-[#0D3B8E] text-[#FFC700] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Cadastro ({vendedores.length})</span>
            </button>
          </div>

          {/* Dark Mode Preview Toggle */}
          <button
            onClick={() => setDarkModePreview((prev) => !prev)}
            title={darkModePreview ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro (Dark Mode)'}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkModePreview ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Add New Seller Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] font-black text-xs rounded-xl shadow-xs border-2 border-[#FFC700] transition-transform active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#0D3B8E]" />
            <span>Novo Vendedor</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Faturamento */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-[#0D3B8E]/15 dark:border-slate-700 shadow-xs relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Vendas Vendedores
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0D3B8E] dark:text-blue-300 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0D3B8E] dark:text-blue-400 font-mono mt-1 tabular-nums">
            {formatCurrency(relatorioGeral.totalFaturamentoVendedores)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {relatorioGeral.totalPedidosComissionados} pedidos
            </span>{' '}
            vinculados aos vendedores
          </div>
        </div>

        {/* Total Comissão a Pagar (2%) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-[#FFC700] dark:border-amber-500 shadow-xs relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D92323]" />
              Comissões a Pagar (2%)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-[#0D3B8E] dark:text-[#FFC700] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#D92323] dark:text-amber-300 font-mono mt-1 tabular-nums">
            {formatCurrency(relatorioGeral.totalComissoesPagar)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Calculado rigorosamente a <strong>2,00%</strong> sobre cada venda
          </div>
        </div>

        {/* Vendedor Destaque */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-500/20 dark:border-emerald-700 shadow-xs relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              Líder de Vendas
            </span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full">
              Top 1
            </span>
          </div>
          {relatorioGeral.vendedorDestaque ? (
            <>
              <div className="text-base font-black text-slate-900 dark:text-white mt-1 truncate">
                {relatorioGeral.vendedorDestaque.vendedor.nome}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>{formatCurrency(relatorioGeral.vendedorDestaque.totalVendasValor)} vendidos</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Comissão: {formatCurrency(relatorioGeral.vendedorDestaque.totalComissaoValor)}
                </span>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 mt-2">Sem vendas registradas ainda</div>
          )}
        </div>

        {/* Equipe Comercial */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Equipe Cadastrada
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {vendedores.filter((v) => v.ativo !== false).length}{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              / {vendedores.length} ativos
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Disponíveis no seletor de suporte do checkout
          </div>
        </div>
      </div>

      {/* TAB 1: RELATÓRIO DE COMISSÕES (2%) */}
      {activeSubTab === 'relatorio' && (
        <div className="space-y-4">
          {/* Actions & Search Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar por vendedor, e-mail ou unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#0D3B8E] dark:text-white font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Relatório</span>
              </button>
            </div>
          </div>

          {/* Commission Summary Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs bg-white dark:bg-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5 whitespace-nowrap">
                      <button
                        onClick={() => toggleSort('nome')}
                        className="flex items-center gap-1 hover:text-[#0D3B8E] cursor-pointer"
                      >
                        <span>Vendedor</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-3.5 whitespace-nowrap">E-mail & Telefone</th>
                    <th className="p-3.5 whitespace-nowrap">Unidade / Setor</th>
                    <th className="p-3.5 whitespace-nowrap text-center">
                      <button
                        onClick={() => toggleSort('qtd')}
                        className="inline-flex items-center gap-1 hover:text-[#0D3B8E] cursor-pointer"
                      >
                        <span>Qtd. Vendas</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => toggleSort('vendas')}
                        className="inline-flex items-center gap-1 hover:text-[#0D3B8E] cursor-pointer"
                      >
                        <span>Total de Vendas (R$)</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-3.5 whitespace-nowrap text-center">Taxa</th>
                    <th className="p-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => toggleSort('comissao')}
                        className="inline-flex items-center gap-1 hover:text-[#0D3B8E] cursor-pointer"
                      >
                        <span>Comissão a Pagar (2%)</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-3.5 whitespace-nowrap text-center">Detalhamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                  {filteredSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Nenhum vendedor encontrado para o filtro aplicado.
                      </td>
                    </tr>
                  ) : (
                    filteredSummaries.map((resumo, idx) => {
                      const isExpanded = selectedVendedorDetail === resumo.vendedor.id;
                      const isTopSeller = idx === 0 && resumo.totalVendasValor > 0;

                      return (
                        <React.Fragment key={resumo.vendedor.id}>
                          <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors">
                            {/* Vendedor Info */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-[#0D3B8E] text-[#FFC700] font-black text-xs flex items-center justify-center shrink-0 border border-[#FFC700]/60">
                                  {resumo.vendedor.codigo.replace('VEND-', '')}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <strong className="text-slate-900 dark:text-white font-bold text-xs">
                                      {resumo.vendedor.nome}
                                    </strong>
                                    {isTopSeller && (
                                      <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-300">
                                        ★ LÍDER
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                    {resumo.vendedor.codigo}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Contatos */}
                            <td className="p-3.5">
                              <div className="space-y-0.5">
                                <a
                                  href={`mailto:${resumo.vendedor.email}`}
                                  className="text-slate-700 dark:text-slate-300 hover:text-[#0D3B8E] flex items-center gap-1 text-[11px]"
                                >
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[150px]">{resumo.vendedor.email}</span>
                                </a>
                                <a
                                  href={`https://wa.me/55${resumo.vendedor.telefone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                                >
                                  <Phone className="w-3 h-3 shrink-0" />
                                  <span>{resumo.vendedor.telefone}</span>
                                </a>
                              </div>
                            </td>

                            {/* Unidade */}
                            <td className="p-3.5 text-slate-600 dark:text-slate-300 text-[11px]">
                              {resumo.vendedor.unidade}
                            </td>

                            {/* Qtd. Vendas */}
                            <td className="p-3.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                                  resumo.quantidadeVendas > 0
                                    ? 'bg-blue-50 dark:bg-blue-900/40 text-[#0D3B8E] dark:text-blue-300'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                                }`}
                              >
                                {resumo.quantidadeVendas} {resumo.quantidadeVendas === 1 ? 'venda' : 'vendas'}
                              </span>
                            </td>

                            {/* Total de Vendas */}
                            <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                              {formatCurrency(resumo.totalVendasValor)}
                            </td>

                            {/* Taxa (2%) */}
                            <td className="p-3.5 text-center">
                              <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-mono font-bold text-[11px] border border-amber-300/50">
                                2,00%
                              </span>
                            </td>

                            {/* Valor Comissão a Pagar (2%) */}
                            <td className="p-3.5 text-right font-mono font-black text-[#D92323] dark:text-amber-400 text-sm tabular-nums">
                              {formatCurrency(resumo.totalComissaoValor)}
                            </td>

                            {/* Detalhamento Button */}
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() =>
                                  setSelectedVendedorDetail(
                                    isExpanded ? null : resumo.vendedor.id
                                  )
                                }
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                  isExpanded
                                    ? 'bg-[#0D3B8E] text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                <span>{isExpanded ? 'Recolher' : 'Ver Vendas'}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Sales Drilldown Drawer */}
                          {isExpanded && (
                            <tr className="bg-blue-50/50 dark:bg-slate-900/80">
                              <td colSpan={8} className="p-4 border-y border-blue-200 dark:border-slate-700">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Briefcase className="w-4 h-4 text-[#0D3B8E] dark:text-amber-400" />
                                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                                        Extrato de Vendas Vinculadas — {resumo.vendedor.nome} ({resumo.vendas.length} pedidos)
                                      </h5>
                                    </div>
                                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                                      Comissão acumulada: <strong>{formatCurrency(resumo.totalComissaoValor)}</strong> (calculada a 2%)
                                    </span>
                                  </div>

                                  {resumo.vendas.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-2">
                                      Nenhuma venda registrada para este vendedor no momento. As vendas vinculadas pelo cliente durante o checkout aparecerão aqui automaticamente.
                                    </p>
                                  ) : (
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                                      <table className="w-full text-left text-[11px]">
                                        <thead>
                                          <tr className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                                            <th className="p-2.5">ID Venda / Nº Pedido</th>
                                            <th className="p-2.5">Nome do Cliente</th>
                                            <th className="p-2.5">Data da Venda</th>
                                            <th className="p-2.5">Colégio & Turma</th>
                                            <th className="p-2.5">Forma Pgto.</th>
                                            <th className="p-2.5 text-right">Valor da Venda</th>
                                            <th className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">
                                              Comissão (2%)
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                          {resumo.vendas.map((item) => (
                                            <tr
                                              key={item.id}
                                              className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
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
                                                <span className="font-medium">{item.escola_nome}</span>
                                                {item.serie_turma && (
                                                  <span className="block text-[10px] text-slate-400">
                                                    {item.serie_turma}
                                                  </span>
                                                )}
                                              </td>
                                              <td className="p-2.5 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
                                                {item.forma_pagamento.replace('_', ' ')}
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
        </div>
      )}

      {/* TAB 2: GESTÃO & CADASTRO DE VENDEDORES */}
      {activeSubTab === 'gestao' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                Lista de Vendedores Cadastrados ({vendedores.length})
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cada vendedor recebe comissão automática de 2% quando selecionado no checkout do kitGlobo
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0D3B8E] hover:bg-[#09265E] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FFC700]" />
              <span>Cadastrar Novo Vendedor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {vendedores.map((v) => {
              const resumo = calcularComissaoVendedor(v, pedidos, TAXA_COMISSAO_PADRAO);
              const isAtivo = v.ativo !== false;

              return (
                <div
                  key={v.id}
                  className={`p-4 rounded-2xl border-2 transition-all bg-white dark:bg-slate-800 flex flex-col justify-between space-y-3 ${
                    isAtivo
                      ? 'border-slate-200 dark:border-slate-700 hover:border-[#0D3B8E] dark:hover:border-blue-400'
                      : 'border-rose-200 dark:border-rose-900 opacity-70 bg-rose-50/20'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-[#0D3B8E] text-[#FFC700] font-black flex items-center justify-center shrink-0 border border-[#FFC700]/70">
                          {v.codigo.replace('VEND-', '')}
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-white block text-sm font-bold">
                            {v.nome}
                          </strong>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            ID: {v.codigo}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(v)}
                        title={isAtivo ? 'Clique para desativar' : 'Clique para ativar'}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                          isAtivo
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {isAtivo ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{v.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{v.telefone || v.contato}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Unidade: <strong className="text-slate-700 dark:text-slate-200">{v.unidade}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Seller Mini Commission Stats */}
                  <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Vendas Totais:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">
                        {formatCurrency(resumo.totalVendasValor)} ({resumo.quantidadeVendas})
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 dark:text-slate-400 block">Comissão (2%):</span>
                      <strong className="text-[#D92323] dark:text-amber-400 font-mono">
                        {formatCurrency(resumo.totalComissaoValor)}
                      </strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => handleOpenEditModal(v)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Editar Vendedor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Tem certeza que deseja excluir o vendedor ${v.nome}? Ele deixará de aparecer nas opções de comissão.`
                          )
                        ) {
                          onDeleteVendedor(v.id);
                          showToast('Vendedor removido', `${v.nome} foi removido do cadastro.`, 'info');
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                      title="Excluir Vendedor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Salesperson */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitVendedor}
            className="bg-white dark:bg-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl border-2 border-[#0D3B8E]/30 dark:border-slate-700 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0D3B8E] text-[#FFC700] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {editingVendedor ? 'Editar Vendedor' : 'Cadastrar Novo Vendedor'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo do Vendedor: *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Amanda Bezerra de Lima"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#0D3B8E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Código Identificador:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: VEND-111"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Taxa de Comissão:
                </label>
                <input
                  type="text"
                  disabled
                  value="2,00% (Fixo)"
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-black text-[#D92323] dark:text-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                E-mail Corporativo: *
              </label>
              <input
                type="email"
                required
                placeholder="Ex: amanda.bezerra@papelariaglobo.com.br"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0D3B8E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Telefone / WhatsApp de Atendimento: *
              </label>
              <input
                type="text"
                required
                placeholder="(68) 99999-9999"
                value={formTelefone}
                onChange={(e) => setFormTelefone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#0D3B8E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unidade / Posto de Trabalho em Rio Branco:
              </label>
              <select
                value={formUnidade}
                onChange={(e) => setFormUnidade(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
              >
                <option value="Matriz Centro (Av. Brasil)">Matriz Centro (Av. Brasil)</option>
                <option value="Loja Bosque / Plantão">Loja Bosque / Plantão</option>
                <option value="Vendas Rio Branco Online">Vendas Rio Branco Online</option>
                <option value="Atendimento Educacional">Atendimento Educacional</option>
                <option value="Atendimento Rápido WhatsApp">Atendimento Rápido WhatsApp</option>
                <option value="Suporte Disk Entregas Globo">Suporte Disk Entregas Globo</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="formAtivo"
                checked={formAtivo}
                onChange={(e) => setFormAtivo(e.target.checked)}
                className="w-4 h-4 rounded text-[#0D3B8E]"
              />
              <label htmlFor="formAtivo" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Vendedor ativo (disponível no checkout e comissões)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] font-black rounded-xl border-2 border-[#FFC700] shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                {editingVendedor ? 'Salvar Alterações' : 'Cadastrar Vendedor'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
