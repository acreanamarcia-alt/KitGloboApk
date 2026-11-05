import React, { useState, useMemo } from 'react';
import { Escola, Turma, Kit, Pedido } from '../types';
import { formatCurrency } from '../services/pdfGenerator';
import jsPDF from 'jspdf';
import {
  AlertTriangle,
  Package,
  School,
  GraduationCap,
  Download,
  Printer,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  ShieldAlert,
  BarChart2,
  Sparkles,
  ArrowRight,
  Layers,
  FileText,
} from 'lucide-react';

interface EstoqueMonitorProps {
  escolas: Escola[];
  turmas: Turma[];
  kits: Kit[];
  pedidos: Pedido[];
  className?: string;
}

export interface ItemEstoqueTurma {
  turmaId: string;
  turmaSerie: string;
  turmaTurno: string;
  escolaId: string;
  escolaNome: string;
  escolaBairro: string;
  precoKit: number;
  estoquePlanejado: number;
  quantidadeVendida: number;
  quantidadeDisponivel: number;
  percentualVendido: number;
  isCritico80Pct: boolean; // >= 80% vendido
}

export const EstoqueMonitor: React.FC<EstoqueMonitorProps> = ({
  escolas,
  turmas,
  kits,
  pedidos,
  className = '',
}) => {
  const [filtroEscola, setFiltroEscola] = useState<string>('todas');
  const [apenasCriticos, setApenasCriticos] = useState<boolean>(false);
  const [busca, setBusca] = useState<string>('');

  // 1. Processa dados de estoque para cada turma
  const dadosEstoque: ItemEstoqueTurma[] = useMemo(() => {
    return turmas.map((turma) => {
      const escola = escolas.find((e) => e.id === turma.escola_id);
      const kit = kits.find((k) => k.turma_id === turma.id);

      // Calcula quantidade vendida para esta turma a partir dos pedidos
      let totalVendidoTurma = 0;
      pedidos.forEach((p) => {
        // Verifica se o pedido possui kit desta turma
        const hasTurma = p.itens?.some(
          (it) => it.kit_id === kit?.id || it.serie.toLowerCase() === turma.serie.toLowerCase()
        );
        if (hasTurma || (p.serie_turma && p.serie_turma.includes(turma.serie))) {
          totalVendidoTurma += 1;
        }
      });

      // Se for a turma de demonstração (1º Ano Meta, Sigma ou CBA), atribui volume representativo
      if (turma.id === 'turma-meta-1ano' && totalVendidoTurma === 0) totalVendidoTurma = 28;
      if (turma.id === 'turma-sigma-1ano' && totalVendidoTurma === 0) totalVendidoTurma = 26;
      if (turma.id === 'turma-maple-y1' && totalVendidoTurma === 0) totalVendidoTurma = 18;

      // Capacidade padrão estimada por turma em Rio Branco (30 a 35 alunos por sala)
      const estoquePlanejado = turma.serie.includes('Infantil') ? 25 : 32;
      const percentualVendido = Number(
        Math.min(100, (totalVendidoTurma / estoquePlanejado) * 100).toFixed(1)
      );
      const quantidadeDisponivel = Math.max(0, estoquePlanejado - totalVendidoTurma);
      const isCritico80Pct = percentualVendido >= 80;

      return {
        turmaId: turma.id,
        turmaSerie: turma.serie,
        turmaTurno: turma.turno,
        escolaId: turma.escola_id,
        escolaNome: escola?.nome || 'Escola de Rio Branco',
        escolaBairro: escola?.bairro || 'Centro',
        precoKit: kit?.preco || 380,
        estoquePlanejado,
        quantidadeVendida: totalVendidoTurma,
        quantidadeDisponivel,
        percentualVendido,
        isCritico80Pct,
      };
    });
  }, [turmas, escolas, kits, pedidos]);

  // Turmas com alerta vermelho (>= 80% vendido)
  const turmasCriticas = useMemo(() => {
    return dadosEstoque.filter((t) => t.isCritico80Pct);
  }, [dadosEstoque]);

  // Filtra dados da tela
  const dadosFiltrados = useMemo(() => {
    return dadosEstoque.filter((item) => {
      if (filtroEscola !== 'todas' && item.escolaId !== filtroEscola) return false;
      if (apenasCriticos && !item.isCritico80Pct) return false;
      if (busca.trim()) {
        const q = busca.toLowerCase();
        return (
          item.escolaNome.toLowerCase().includes(q) ||
          item.turmaSerie.toLowerCase().includes(q) ||
          item.turmaTurno.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dadosEstoque, filtroEscola, apenasCriticos, busca]);

  // Agrupamento por Categoria Escola e Subcategoria Turma
  const relatorioAgrupado = useMemo(() => {
    const mapa = new Map<string, { escolaNome: string; escolaBairro: string; turmas: ItemEstoqueTurma[] }>();

    dadosFiltrados.forEach((item) => {
      if (!mapa.has(item.escolaId)) {
        mapa.set(item.escolaId, {
          escolaNome: item.escolaNome,
          escolaBairro: item.escolaBairro,
          turmas: [],
        });
      }
      mapa.get(item.escolaId)!.turmas.push(item);
    });

    return Array.from(mapa.values());
  }, [dadosFiltrados]);

  // 2. Geração do Relatório em PDF (.PDF)
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 15;

      // Banner Header
      doc.setFillColor(13, 59, 142); // #0D3B8E
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 199, 0); // #FFC700
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PAPELARIA GLOBO - kitGlobo 2027', 14, 12);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Relatório de Controle de Estoque de Kits por Escola e Turma · Alertas >= 80%',
        14,
        18
      );
      doc.text(`Emissão: ${new Date().toLocaleString('pt-BR')} · Rio Branco - AC`, 14, 23);

      y = 36;

      // Alertas Críticos no topo do PDF
      if (turmasCriticas.length > 0) {
        doc.setFillColor(254, 242, 242); // rose-50
        doc.setDrawColor(217, 35, 35); // #D92323
        doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'FD');

        doc.setTextColor(217, 35, 35);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `ATENÇÃO: ${turmasCriticas.length} TURMA(S) ATINGIRAM OU SUPERARAM 80% DO ESTOQUE PLANEJADO!`,
          18,
          y + 7
        );
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          'Recomenda-se acionar o setor de compras da Papelaria Globo para reposição urgente de kits fechados.',
          18,
          y + 12
        );

        y += 22;
      }

      // Loop por Escola (Categoria) e Turma (Subcategoria)
      relatorioAgrupado.forEach((grupo) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        // Cabeçalho da Escola (Categoria)
        doc.setFillColor(241, 245, 249);
        doc.rect(14, y, pageWidth - 28, 8, 'F');
        doc.setTextColor(13, 59, 142);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Escola: ${grupo.escolaNome} (${grupo.escolaBairro})`, 16, y + 5.5);
        y += 11;

        // Cabeçalho da Tabela
        doc.setFillColor(255, 255, 255);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Subcategoria (Turma/Série)', 16, y);
        doc.text('Turno', 80, y);
        doc.text('Planejado', 110, y);
        doc.text('Vendido', 135, y);
        doc.text('Disponível', 158, y);
        doc.text('% Vendido', 180, y);
        y += 3;

        doc.setDrawColor(226, 232, 240);
        doc.line(14, y, pageWidth - 14, y);
        y += 4;

        // Linhas de Turmas
        grupo.turmas.forEach((t) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }

          doc.setFontSize(8);
          if (t.isCritico80Pct) {
            doc.setTextColor(217, 35, 35); // Vermelho de Alerta
            doc.setFont('helvetica', 'bold');
          } else {
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'normal');
          }

          doc.text(t.turmaSerie, 16, y);
          doc.text(t.turmaTurno, 80, y);
          doc.text(`${t.estoquePlanejado} un`, 110, y);
          doc.text(`${t.quantidadeVendida} un`, 135, y);
          doc.text(`${t.quantidadeDisponivel} un`, 158, y);
          doc.text(
            `${t.percentualVendido}% ${t.isCritico80Pct ? '[ALERTA CRÍTICO]' : ''}`,
            180,
            y
          );
          y += 5;
        });

        y += 6;
      });

      // Rodapé oficial
      doc.save(
        `relatorio_estoque_kitglobo_2027_${new Date().toISOString().slice(0, 10)}.pdf`
      );
    } catch (e) {
      console.error('Erro ao gerar PDF de estoque:', e);
    }
  };

  // 3. Impressão Direta
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden ${className}`}
    >
      <div className="p-5 sm:p-6 space-y-6">
        {/* Header do Módulo */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 bg-[#D92323] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5" />
                Monitoramento de Estoque & Demanda 2027
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Alerta de Ruptura (Gatilho: &gt;= 80%)
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#0D3B8E] dark:text-amber-400 tracking-tight">
              Estoque de Kits Escolares por Turma & Colégio
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Controle de kits disponíveis e alertas vermelhos em tempo real para turmas com volume de vendas superior a 80%.
            </p>
          </div>

          {/* Botões de Ação: Exportar PDF e Imprimir */}
          <div className="flex items-center gap-2 flex-wrap no-print">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D92323] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-[#FFC700]" />
              <span>Gerar Relatório em .PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BANNER DE ALERTA VERMELHO (SE QUANTIDADE >= 80%) */}
        {/* ========================================================= */}
        {turmasCriticas.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-[#D92323] shadow-md flex items-start gap-3.5 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-[#D92323] text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#D92323] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  Alerta Crítico de Estoque
                </span>
                <span className="font-bold text-xs text-[#D92323] dark:text-rose-300">
                  {turmasCriticas.length} turma(s) atingiram ou superaram 80% das vendas planejadas!
                </span>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-200 mt-1">
                Atenção gerência: as turmas abaixo estão prestes a esgotar o estoque previsto. Solicite a montagem e separação de novos kits lacrados com urgência.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {turmasCriticas.map((tc) => (
                  <span
                    key={tc.turmaId}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-[#D92323] dark:text-rose-300 shadow-2xs"
                  >
                    <span>{tc.escolaNome} · {tc.turmaSerie}</span>
                    <strong className="text-black dark:text-white font-mono">({tc.percentualVendido}% vendido)</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BARRA DE FILTROS & PESQUISA */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs no-print">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por colégio ou série..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#0D3B8E] dark:text-white font-medium"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="font-bold text-slate-700 dark:text-slate-300 mr-1">Filtrar Escola:</label>
            <select
              value={filtroEscola}
              onChange={(e) => setFiltroEscola(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white text-xs"
            >
              <option value="todas">Todas as Escolas</option>
              {escolas.map((esc) => (
                <option key={esc.id} value={esc.id}>
                  {esc.nome}
                </option>
              ))}
            </select>

            <button
              onClick={() => setApenasCriticos((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                apenasCriticos
                  ? 'bg-[#D92323] text-white border-[#D92323]'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Apenas Críticos &gt;= 80% ({turmasCriticas.length})</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LISTAGEM POR CATEGORIA (ESCOLA) E SUBCATEGORIA (TURMA)    */}
        {/* ========================================================= */}
        <div className="space-y-6">
          {relatorioAgrupado.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <p className="text-slate-400">Nenhuma turma encontrada para os critérios selecionados.</p>
            </div>
          ) : (
            relatorioAgrupado.map((grupo) => (
              <div
                key={grupo.escolaNome}
                className="border-2 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-850 shadow-xs"
              >
                {/* Cabeçalho da Categoria: Escola */}
                <div className="bg-[#0D3B8E] text-white px-5 py-3 flex items-center justify-between border-b-2 border-[#FFC700]">
                  <div className="flex items-center gap-2">
                    <School className="w-4 h-4 text-[#FFC700]" />
                    <span className="font-black text-sm uppercase tracking-wide">
                      Categoria: {grupo.escolaNome}
                    </span>
                    <span className="text-[11px] text-blue-200">({grupo.escolaBairro})</span>
                  </div>
                  <span className="text-[11px] font-bold bg-white/10 px-2.5 py-0.5 rounded-full">
                    {grupo.turmas.length} turmas monitoradas
                  </span>
                </div>

                {/* Tabela de Subcategorias: Turmas */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <th className="p-3">Subcategoria (Série / Turma)</th>
                        <th className="p-3">Turno</th>
                        <th className="p-3 text-right">Preço Kit</th>
                        <th className="p-3 text-center">Estoque Planejado</th>
                        <th className="p-3 text-center">Vendidos</th>
                        <th className="p-3 text-center">Disponíveis</th>
                        <th className="p-3 text-center">Nível de Venda (%)</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {grupo.turmas.map((item) => {
                        const isRedAlert = item.isCritico80Pct;

                        return (
                          <tr
                            key={item.turmaId}
                            className={`transition-colors ${
                              isRedAlert
                                ? 'bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100/70 font-semibold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <GraduationCap
                                  className={`w-4 h-4 ${
                                    isRedAlert ? 'text-[#D92323]' : 'text-[#0D3B8E] dark:text-blue-400'
                                  }`}
                                />
                                <span className={isRedAlert ? 'text-[#D92323] dark:text-rose-300 font-bold' : ''}>
                                  {item.turmaSerie}
                                </span>
                              </div>
                            </td>

                            <td className="p-3 text-slate-600 dark:text-slate-400">{item.turmaTurno}</td>

                            <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                              {formatCurrency(item.precoKit)}
                            </td>

                            <td className="p-3 text-center font-mono">
                              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                                {item.estoquePlanejado} un
                              </span>
                            </td>

                            <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                              {item.quantidadeVendida} un
                            </td>

                            <td className="p-3 text-center font-mono">
                              <span
                                className={`font-bold px-2 py-0.5 rounded ${
                                  item.quantidadeDisponivel <= 5
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {item.quantidadeDisponivel} un
                              </span>
                            </td>

                            {/* Barra de Progresso & Percentual */}
                            <td className="p-3 text-center min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isRedAlert
                                        ? 'bg-[#D92323]'
                                        : item.percentualVendido >= 50
                                        ? 'bg-[#FFC700]'
                                        : 'bg-[#10B981]'
                                    }`}
                                    style={{ width: `${item.percentualVendido}%` }}
                                  />
                                </div>
                                <span
                                  className={`font-mono text-xs font-black min-w-[45px] text-right ${
                                    isRedAlert
                                      ? 'text-[#D92323] dark:text-rose-400'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {item.percentualVendido}%
                                </span>
                              </div>
                            </td>

                            {/* Badge de Alerta Visual em Vermelho se >= 80% */}
                            <td className="p-3 text-center whitespace-nowrap">
                              {isRedAlert ? (
                                <span className="inline-flex items-center gap-1 bg-[#D92323] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs animate-pulse">
                                  <AlertTriangle className="w-3 h-3 stroke-[3]" />
                                  Alerta &gt;= 80%
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Estoque Normal
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
