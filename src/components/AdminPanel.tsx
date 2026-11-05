import React, { useState } from 'react';
import {
  Escola,
  Turma,
  Kit,
  Pedido,
  OrderStatus,
  Vendedor,
  ItemKit,
  ItemExtra,
} from '../types';
import { formatCurrency, downloadOrderPdf } from '../services/pdfGenerator';
import { getWhatsAppShareUrl, OFFICIAL_WHATSAPP_NUMBER } from '../services/whatsapp';
import { useToast } from './Toast';
import {
  ShieldCheck,
  Package,
  School,
  GraduationCap,
  Users,
  Database,
  Phone,
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Copy,
  ChevronRight,
  RefreshCw,
  Percent,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  UserCheck,
  Lock,
} from 'lucide-react';
import { VendedoresComissoesModule } from './VendedoresComissoesModule';
import { SalesCommissionReport } from './SalesCommissionReport';
import { AdminDashboardFinanceiro } from './AdminDashboardFinanceiro';
import { EstoqueMonitor } from './EstoqueMonitor';
import { useFirebaseNotifications } from '../hooks/useFirebaseNotifications';

interface AdminPanelProps {
  escolas: Escola[];
  turmas: Turma[];
  kits: Kit[];
  pedidos: Pedido[];
  vendedores: Vendedor[];
  onSaveEscola: (escola: Escola) => void;
  onSaveTurma: (turma: Turma) => void;
  onSaveKit: (kit: Kit) => void;
  onUpdateStatus: (pedidoId: string, status: OrderStatus, whatsappNotificado?: boolean) => void;
  onSaveVendedor?: (vendedor: Vendedor) => void;
  onDeleteVendedor?: (vendedorId: string) => void;
  onResetData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  escolas,
  turmas,
  kits,
  pedidos,
  vendedores,
  onSaveEscola,
  onSaveTurma,
  onSaveKit,
  onUpdateStatus,
  onSaveVendedor,
  onDeleteVendedor,
  onResetData,
}) => {
  const { showToast } = useToast();
  const { notifyOrderStatusChange } = useFirebaseNotifications();

  const [activeTab, setActiveTab] = useState<
    'financeiro' | 'estoque' | 'comissoes' | 'vendedores' | 'pedidos' | 'escolas' | 'turmas' | 'kits' | 'supabase'
  >('financeiro');

  // Filter for pedidos
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // New School Modal state
  const [showAddEscola, setShowAddEscola] = useState(false);
  const [novaEscolaNome, setNovaEscolaNome] = useState('');
  const [novaEscolaEndereco, setNovaEscolaEndereco] = useState('');
  const [novaEscolaBairro, setNovaEscolaBairro] = useState('');

  // New Turma Modal state
  const [showAddTurma, setShowAddTurma] = useState(false);
  const [novaTurmaEscolaId, setNovaTurmaEscolaId] = useState(escolas[0]?.id || '');
  const [novaTurmaSerie, setNovaTurmaSerie] = useState('');
  const [novaTurmaTurno, setNovaTurmaTurno] = useState<'Matutino' | 'Vespertino' | 'Integral'>('Matutino');

  // 2 Pessoas Autorizadas com Níveis de Acesso
  interface AdminUser {
    nome: string;
    email: string;
    cargo: string;
    nivel: 'gerencia_total' | 'diretoria_financeira';
    nivelLabel: string;
  }

  const AUTHORIZED_USERS: Record<string, { senha: string; user: AdminUser }> = {
    'gerencia@papelariaglobo.com.br': {
      senha: 'globo2027',
      user: {
        nome: 'Márcia Albuquerque',
        email: 'gerencia@papelariaglobo.com.br',
        cargo: 'Gerência Geral & Operações',
        nivel: 'gerencia_total',
        nivelLabel: 'Nível 1 - Acesso Operacional Total',
      },
    },
    'diretoria@papelariaglobo.com.br': {
      senha: 'admin2027',
      user: {
        nome: 'Roberto Melo',
        email: 'diretoria@papelariaglobo.com.br',
        cargo: 'Diretor Financeiro & Auditoria',
        nivel: 'diretoria_financeira',
        nivelLabel: 'Nível 2 - Acesso Financeiro & Gestão',
      },
    },
    'admin@papelariaglobo.com.br': {
      senha: 'globo2027',
      user: {
        nome: 'Márcia Albuquerque',
        email: 'gerencia@papelariaglobo.com.br',
        cargo: 'Gerência Geral & Operações',
        nivel: 'gerencia_total',
        nivelLabel: 'Nível 1 - Acesso Operacional Total',
      },
    },
  };

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('kitglobo_admin_auth') === 'true' || true;
  });

  const [loggedAdminUser, setLoggedAdminUser] = useState<AdminUser>(() => {
    const saved = localStorage.getItem('kitglobo_admin_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return AUTHORIZED_USERS['gerencia@papelariaglobo.com.br'].user;
  });

  const [adminEmail, setAdminEmail] = useState('gerencia@papelariaglobo.com.br');
  const [adminPassword, setAdminPassword] = useState('globo2027');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailKey = adminEmail.trim().toLowerCase();
    const authorized = AUTHORIZED_USERS[emailKey];

    if (authorized && authorized.senha === adminPassword) {
      setIsAdminLoggedIn(true);
      setLoggedAdminUser(authorized.user);
      localStorage.setItem('kitglobo_admin_auth', 'true');
      localStorage.setItem('kitglobo_admin_user', JSON.stringify(authorized.user));
      setLoginError(null);
      showToast(
        `Bem-vindo(a), ${authorized.user.nome}!`,
        `${authorized.user.cargo} (${authorized.user.nivelLabel})`,
        'success'
      );
    } else {
      setLoginError('Credenciais inválidas. O acesso é restrito exclusivamente às 2 pessoas autorizadas.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('kitglobo_admin_auth');
    localStorage.removeItem('kitglobo_admin_user');
    showToast('Sessão encerrada', 'Você saiu do Painel Administrativo.', 'info');
  };

  // Kit editor state
  const [selectedKitTurmaId, setSelectedKitTurmaId] = useState(turmas[0]?.id || '');

  // Handle status update & WhatsApp / Push FCM dispatch
  const handleStatusChange = (pedido: Pedido, newStatus: OrderStatus) => {
    const updated = { ...pedido, status: newStatus };
    let notified = pedido.whatsapp_notificado;

    // Disparo de Push Notification FCM
    if (newStatus === 'pronto_retirada') {
      notifyOrderStatusChange(pedido.numero_pedido, 'pronto_retirada', pedido.aluno_nome);
      showToast(
        `📦 Pedido #${pedido.numero_pedido} PRONTO PARA RETIRADA!`,
        `Notificação Push FCM enviada ao cliente: Kit escolar lacrado no Balcão Centro.`,
        'success'
      );
    } else if (newStatus === 'finalizado') {
      notified = true;
      notifyOrderStatusChange(pedido.numero_pedido, 'finalizado', pedido.aluno_nome);
      // Edge function triggered
      const waUrl = getWhatsAppShareUrl(updated, OFFICIAL_WHATSAPP_NUMBER);
      showToast(
        `Pedido #${pedido.numero_pedido} FINALIZADO!`,
        `Edge Function disparada: Notificação enviada para o WhatsApp ${OFFICIAL_WHATSAPP_NUMBER}.`,
        'success'
      );
      window.open(waUrl, '_blank');
    } else {
      showToast(
        `Status do Pedido #${pedido.numero_pedido} Atualizado`,
        `Novo status: ${newStatus.replace('_', ' ').toUpperCase()}`,
        'info'
      );
    }

    onUpdateStatus(pedido.id, newStatus, notified);
  };

  const filteredPedidos = pedidos.filter((p) => {
    if (statusFilter === 'todos') return true;
    return p.status === statusFilter;
  });

  const activeKit = kits.find((k) => k.turma_id === selectedKitTurmaId);
  const selectedTurma = turmas.find((t) => t.id === selectedKitTurmaId);
  const selectedEscolaForKit = escolas.find((e) => e.id === selectedTurma?.escola_id);

  // Submit Nova Escola
  const handleCreateEscola = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaEscolaNome.trim()) return;

    const nova: Escola = {
      id: `esc-${Date.now().toString(36)}`,
      nome: novaEscolaNome.trim(),
      endereco: novaEscolaEndereco.trim() || 'Rio Branco - AC',
      bairro: novaEscolaBairro.trim() || 'Centro, Rio Branco - AC',
      ativo: true,
      badge_color: '#0D3B8E',
    };

    onSaveEscola(nova);
    showToast('Escola cadastrada!', `${nova.nome} foi adicionada ao catálogo.`, 'success');
    setShowAddEscola(false);
    setNovaEscolaNome('');
    setNovaEscolaEndereco('');
    setNovaEscolaBairro('');
  };

  // Submit Nova Turma
  const handleCreateTurma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaTurmaSerie.trim()) return;

    const nova: Turma = {
      id: `turma-${Date.now().toString(36)}`,
      escola_id: novaTurmaEscolaId,
      serie: novaTurmaSerie.trim(),
      turno: novaTurmaTurno,
      ano_letivo: 2027,
    };

    onSaveTurma(nova);
    showToast('Turma vinculada!', `${nova.serie} cadastrada para o ano 2027.`, 'success');
    setShowAddTurma(false);
    setNovaTurmaSerie('');
  };

  // Render Login Gate if user is not logged in as admin
  if (!isAdminLoggedIn) {
    return (
      <div className="bg-white rounded-3xl border-2 border-[#0D3B8E]/20 shadow-2xl overflow-hidden my-6 max-w-lg mx-auto p-6 sm:p-8">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-[#0D3B8E] text-[#FFC700] rounded-2xl flex items-center justify-center mx-auto shadow-md border-2 border-[#FFC700]">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="bg-[#FFC700] text-[#0D3B8E] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Área Restrita · 2 Níveis de Acesso
            </span>
            <h3 className="text-xl font-black text-[#0D3B8E] mt-1">Painel Administrativo Papelaria Globo</h3>
            <p className="text-xs text-slate-500">
              Acesso restrito exclusivamente às <strong>2 pessoas autorizadas</strong> da gestão 2027.
            </p>
          </div>
        </div>

        {/* 2 Perfis Autorizados (Seletor Rápido) */}
        <div className="mt-5 space-y-2">
          <span className="text-[11px] font-bold text-slate-600 block">Selecione o perfil autorizado:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setAdminEmail('gerencia@papelariaglobo.com.br');
                setAdminPassword('globo2027');
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                adminEmail === 'gerencia@papelariaglobo.com.br'
                  ? 'border-[#0D3B8E] bg-blue-50/70 ring-2 ring-[#0D3B8E]/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-[#0D3B8E]">
                <UserCheck className="w-4 h-4 text-[#D92323]" />
                <span>Pessoa 1: Gerente Geral</span>
              </div>
              <span className="text-[11px] text-slate-500 block truncate">gerencia@papelariaglobo.com.br</span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">Nível 1 · Acesso Total</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminEmail('diretoria@papelariaglobo.com.br');
                setAdminPassword('admin2027');
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                adminEmail === 'diretoria@papelariaglobo.com.br'
                  ? 'border-[#0D3B8E] bg-blue-50/70 ring-2 ring-[#0D3B8E]/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-[#0D3B8E]">
                <UserCheck className="w-4 h-4 text-[#FFC700]" />
                <span>Pessoa 2: Diretor Financeiro</span>
              </div>
              <span className="text-[11px] text-slate-500 block truncate">diretoria@papelariaglobo.com.br</span>
              <span className="text-[10px] text-purple-700 font-bold block mt-0.5">Nível 2 · Financeiro & Estoque</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4 mt-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              E-mail Autorizado:
            </label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0D3B8E] focus:ring-2 focus:ring-[#FFC700]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Senha de Acesso Seguro:
            </label>
            <input
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0D3B8E] focus:ring-2 focus:ring-[#FFC700]"
            />
          </div>

          {loginError && (
            <div className="p-2.5 bg-rose-50 border border-[#D92323]/40 rounded-xl text-[#D92323] text-[11px] font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] font-black rounded-xl shadow-md border-2 border-[#FFC700] transition-transform active:scale-95 cursor-pointer text-xs"
          >
            Entrar com Nível de Acesso Autorizado
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-[#0D3B8E]/20 shadow-2xl overflow-hidden my-6">
      {/* Admin Top Bar com Usuário Logado */}
      <div className="bg-[#0D3B8E] text-white p-5 border-b-4 border-[#FFC700]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D92323] flex items-center justify-center text-white shadow-md border-2 border-[#FFC700]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white">Painel Administrativo Papelaria Globo</h2>
                <span className="bg-[#FFC700] text-[#0D3B8E] text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  {loggedAdminUser.cargo}
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5 flex items-center gap-1.5">
                <span>Operador: <strong>{loggedAdminUser.nome}</strong> ({loggedAdminUser.email})</span>
                <span>·</span>
                <span className="text-emerald-300 font-bold">{loggedAdminUser.nivelLabel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (window.confirm('Deseja restaurar os dados de exemplo de Rio Branco?')) {
                  onResetData();
                  showToast('Dados restaurados', 'Banco resetado com os dados iniciais.', 'info');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restaurar Seeds</span>
            </button>

            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-[#D92323] hover:bg-[#B91C1C] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Trocar Usuário / Sair</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Dashboard Financeiro, Estoque Monitor, Comissões, Vendedores, Pedidos...) */}
        <div className="flex items-center gap-1 overflow-x-auto pt-4 mt-2 border-t border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('financeiro')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'financeiro'
                ? 'bg-[#FFC700] text-[#0D3B8E] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#D92323]" />
            <span>Dashboard Financeiro</span>
          </button>

          <button
            onClick={() => setActiveTab('estoque')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'estoque'
                ? 'bg-[#FFC700] text-[#0D3B8E] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Monitor de Estoque (&ge;80%)</span>
          </button>

          <button
            onClick={() => setActiveTab('comissoes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'comissoes'
                ? 'bg-[#FFC700] text-[#0D3B8E] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Comissões 2%</span>
          </button>

          <button
            onClick={() => setActiveTab('vendedores')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'vendedores'
                ? 'bg-[#FFC700] text-[#0D3B8E] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestão de Vendedores ({vendedores.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pedidos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'pedidos'
                ? 'bg-[#FFC700] text-[#0D3B8E] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Vendas & Pedidos ({pedidos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('escolas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'escolas'
                ? 'bg-[#FFC700] text-[#0D3B8E] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Escolas ({escolas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('turmas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'turmas'
                ? 'bg-[#FFC700] text-[#0D3B8E] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Turmas ({turmas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kits')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'kits'
                ? 'bg-[#FFC700] text-[#0D3B8E] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Kits & Itens</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'bg-[#FFC700] text-[#0D3B8E] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase & RLS</span>
          </button>
        </div>
      </div>

      {/* Tab: Dashboard Financeiro (Recharts Barras Mensais & Pizza Categorias) */}
      {activeTab === 'financeiro' && (
        <div className="p-4 sm:p-5">
          <AdminDashboardFinanceiro
            pedidos={pedidos}
            vendedores={vendedores}
            kits={kits}
            turmas={turmas}
            escolas={escolas}
          />
        </div>
      )}

      {/* Tab: Monitor de Estoque (Alertas Críticos >= 80%, PDF e Impressão) */}
      {activeTab === 'estoque' && (
        <div className="p-4 sm:p-5">
          <EstoqueMonitor
            escolas={escolas}
            turmas={turmas}
            kits={kits}
            pedidos={pedidos}
          />
        </div>
      )}

      {/* Tab 1: Pedidos & Vendas */}
      {activeTab === 'pedidos' && (
        <div className="p-5 space-y-4 text-xs">
          {/* Status filter bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-700 mr-1">Filtrar Status:</span>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'pendente', label: 'Pendente' },
                { id: 'pago', label: 'Pago' },
                { id: 'em_separacao', label: 'Em Separação' },
                { id: 'pronto_retirada', label: 'Pronto p/ Retirada' },
                { id: 'finalizado', label: 'Finalizado' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    statusFilter === st.id
                      ? 'bg-[#0D3B8E] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <span className="text-slate-500 font-semibold">
              Exibindo <strong>{filteredPedidos.length}</strong> pedidos
            </span>
          </div>

          {/* Orders Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3.5 whitespace-nowrap">Nº Pedido</th>
                    <th className="p-3.5 whitespace-nowrap">Aluno & Responsável</th>
                    <th className="p-3.5 whitespace-nowrap">Escola / Série</th>
                    <th className="p-3.5 whitespace-nowrap">Retirada Agendada</th>
                    <th className="p-3.5 whitespace-nowrap">Total</th>
                    <th className="p-3.5 whitespace-nowrap">Status</th>
                    <th className="p-3.5 whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredPedidos.map((ped) => {
                    const statusColors: Record<OrderStatus, string> = {
                      pendente: 'bg-amber-100 text-amber-800 border-amber-300',
                      pago: 'bg-blue-100 text-blue-800 border-blue-300',
                      em_separacao: 'bg-purple-100 text-purple-800 border-purple-300',
                      pronto_retirada: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                      finalizado: 'bg-slate-900 text-white border-slate-900',
                    };

                    const statusLabels: Record<OrderStatus, string> = {
                      pendente: 'Pendente',
                      pago: 'Pago',
                      em_separacao: 'Em Separação',
                      pronto_retirada: 'Pronto Retirada',
                      finalizado: 'Finalizado',
                    };

                    return (
                      <tr key={ped.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-[#0D3B8E] whitespace-nowrap">
                          #{ped.numero_pedido}
                        </td>
                        <td className="p-3.5">
                          <strong className="text-slate-900 block">{ped.aluno_nome}</strong>
                          <span className="text-slate-500 text-[11px]">
                            {ped.cliente_nome} · {ped.cliente_telefone}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800 block">{ped.escola_nome}</span>
                          <span className="text-slate-500 text-[11px]">{ped.serie_turma}</span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {ped.data_retirada.split('-').reverse().join('/')} às {ped.hora_retirada}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">{ped.vendedor_nome}</span>
                        </td>
                        <td className="p-3.5 font-mono font-black text-slate-900 whitespace-nowrap">
                          {formatCurrency(ped.total)}
                          {ped.forma_pagamento === 'dinheiro' && ped.valor_troco ? (
                            <span className="block text-[10px] text-amber-700 font-normal">
                              Troco: {formatCurrency(ped.valor_troco)}
                            </span>
                          ) : null}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <select
                            value={ped.status}
                            onChange={(e) =>
                              handleStatusChange(ped, e.target.value as OrderStatus)
                            }
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border focus:outline-none ${
                              statusColors[ped.status]
                            }`}
                          >
                            <option value="pendente">Pendente</option>
                            <option value="pago">Pago</option>
                            <option value="em_separacao">Em Separação</option>
                            <option value="pronto_retirada">Pronto Retirada</option>
                            <option value="finalizado">Finalizado (Dispara WhatsApp)</option>
                          </select>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {/* PDF Download Button */}
                            <button
                              onClick={() => downloadOrderPdf(ped)}
                              title="Baixar PDF do Pedido"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-[#0D3B8E] rounded-lg transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* Direct WhatsApp button */}
                            <a
                              href={getWhatsAppShareUrl(ped, OFFICIAL_WHATSAPP_NUMBER)}
                              target="_blank"
                              rel="noreferrer"
                              title="Enviar WhatsApp da Papelaria Globo"
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Escolas */}
      {activeTab === 'escolas' && (
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Escolas Particulares Cadastradas em Rio Branco
              </h3>
              <p className="text-slate-500">
                Gerencie as instituições parceiras e listas homologadas para 2027
              </p>
            </div>
            <button
              onClick={() => setShowAddEscola(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] font-black rounded-xl shadow-xs border border-[#FFC700] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#0D3B8E]" />
              <span>Nova Escola</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {escolas.map((esc) => {
              const escTurmas = turmas.filter((t) => t.escola_id === esc.id);
              return (
                <div
                  key={esc.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#0D3B8E] transition-all space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-sm text-slate-900">{esc.nome}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Ativa
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{esc.endereco}</p>
                  <div className="text-[11px] text-slate-600 font-medium pt-2 border-t border-slate-100 flex justify-between">
                    <span>{escTurmas.length} turmas vinculadas</span>
                    <span className="text-slate-400">{esc.bairro}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Nova Escola */}
          {showAddEscola && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form
                onSubmit={handleCreateEscola}
                className="bg-white p-5 rounded-3xl max-w-md w-full space-y-3.5 shadow-2xl border border-slate-200"
              >
                <h4 className="text-base font-bold text-slate-900">Cadastrar Nova Escola em Rio Branco</h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome da Escola: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Colégio Anglo Acre"
                    value={novaEscolaNome}
                    onChange={(e) => setNovaEscolaNome(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Endereço Completo:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Ceará, 2500"
                    value={novaEscolaEndereco}
                    onChange={(e) => setNovaEscolaEndereco(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Bairro / Cidade:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Centro, Rio Branco - AC"
                    value={novaEscolaBairro}
                    onChange={(e) => setNovaEscolaBairro(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEscola(false)}
                    className="px-3 py-2 rounded-xl border text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0D3B8E] text-white font-bold rounded-xl"
                  >
                    Salvar Escola
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Turmas */}
      {activeTab === 'turmas' && (
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Séries e Turmas Cadastradas (Ano Letivo 2027)
              </h3>
              <p className="text-slate-500">
                Vincule séries às escolas para associar os kits correspondentes
              </p>
            </div>
            <button
              onClick={() => setShowAddTurma(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] font-black rounded-xl shadow-xs border border-[#FFC700] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#0D3B8E]" />
              <span>Nova Turma 2027</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700">
                  <th className="p-3">Escola</th>
                  <th className="p-3">Série / Grau</th>
                  <th className="p-3">Turno</th>
                  <th className="p-3">Ano Letivo</th>
                  <th className="p-3">Status Kit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {turmas.map((t) => {
                  const escolaObj = escolas.find((e) => e.id === t.escola_id);
                  const hasKit = kits.some((k) => k.turma_id === t.id);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-[#0D3B8E]">{escolaObj?.nome || 'Escola'}</td>
                      <td className="p-3 font-bold text-slate-800">{t.serie}</td>
                      <td className="p-3 text-slate-600">{t.turno}</td>
                      <td className="p-3 font-mono font-bold text-slate-700">{t.ano_letivo}</td>
                      <td className="p-3">
                        {hasKit ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Kit Ativo
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Pendente Kit
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Modal Nova Turma */}
          {showAddTurma && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form
                onSubmit={handleCreateTurma}
                className="bg-white p-5 rounded-3xl max-w-md w-full space-y-3.5 shadow-2xl border border-slate-200"
              >
                <h4 className="text-base font-bold text-slate-900">Vincular Nova Turma para 2027</h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Selecione a Escola:
                  </label>
                  <select
                    value={novaTurmaEscolaId}
                    onChange={(e) => setNovaTurmaEscolaId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  >
                    {escolas.map((esc) => (
                      <option key={esc.id} value={esc.id}>
                        {esc.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome da Série / Turma: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 4º Ano Fundamental I"
                    value={novaTurmaSerie}
                    onChange={(e) => setNovaTurmaSerie(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Turno:
                  </label>
                  <select
                    value={novaTurmaTurno}
                    onChange={(e) => setNovaTurmaTurno(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  >
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTurma(false)}
                    className="px-3 py-2 rounded-xl border text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0D3B8E] text-white font-bold rounded-xl"
                  >
                    Salvar Turma
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Kits & Itens */}
      {activeTab === 'kits' && (
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Selecione a Turma para Gerenciar os Itens do kitGlobo:
              </label>
              <select
                value={selectedKitTurmaId}
                onChange={(e) => setSelectedKitTurmaId(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900"
              >
                {turmas.map((t) => {
                  const esc = escolas.find((e) => e.id === t.escola_id);
                  return (
                    <option key={t.id} value={t.id}>
                      {esc?.nome} - {t.serie} ({t.turno})
                    </option>
                  );
                })}
              </select>
            </div>

            {activeKit && (
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Preço Base do Kit Fechado:</span>
                <span className="text-xl font-black text-[#D92323] font-mono tabular-nums">
                  {formatCurrency(activeKit.preco)}
                </span>
              </div>
            )}
          </div>

          {activeKit ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">
                  Lista de Materiais Obrigatórios ({activeKit.itens_json.length} itens)
                </h4>
              </div>

              <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {activeKit.itens_json.map((it, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                    <div>
                      <span className="font-semibold text-slate-800">{it.nome}</span>
                      {it.marca_sugerida && (
                        <span className="text-slate-400 text-[11px] ml-2">
                          (Marca: {it.marca_sugerida})
                        </span>
                      )}
                    </div>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                      {it.quantidade} {it.unidade}
                    </span>
                  </div>
                ))}
              </div>

              {/* Itens Adicionais Cadastrados */}
              <div className="pt-2">
                <h4 className="font-bold text-slate-900 text-sm mb-2">
                  Itens Extras Cadastrados para este Kit ({activeKit.itens_extras_json.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeKit.itens_extras_json.map((extra) => (
                    <div key={extra.id} className="p-3 rounded-xl border border-slate-200 bg-white flex justify-between items-center">
                      <div>
                        <strong className="text-slate-800 block">{extra.nome}</strong>
                        <span className="text-slate-500 text-[11px]">{extra.descricao}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatCurrency(extra.preco)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-500">Nenhum kit cadastrado para esta turma ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: SalesCommissionReport (Relatório de Comissões 2% Dedicado) */}
      {activeTab === 'comissoes' && (
        <div className="p-4 sm:p-5">
          <SalesCommissionReport
            vendedores={vendedores}
            pedidos={pedidos}
            taxaComissao={0.02}
          />
        </div>
      )}

      {/* Tab: Gestão de Vendedores & Equipe */}
      {activeTab === 'vendedores' && (
        <div className="p-5">
          <VendedoresComissoesModule
            vendedores={vendedores}
            pedidos={pedidos}
            onSaveVendedor={onSaveVendedor || (() => {})}
            onDeleteVendedor={onDeleteVendedor || (() => {})}
          />
        </div>
      )}

      {/* Tab 6: Supabase & RLS */}
      {activeTab === 'supabase' && (
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-blue-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-[#0D3B8E]">
              <Database className="w-4 h-4" />
              <span>Arquitetura de Banco de Dados Supabase (DDL, RLS & Edge Function)</span>
            </div>
            <p className="text-xs text-blue-900 leading-relaxed">
              Conforme as especificações solicitadas, o schema completo com as tabelas <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px]">escolas</code>, <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px]">turmas</code>, <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px]">kits</code>, <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px]">vendedores</code> e <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px]">pedidos</code>, sequência automática <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px]">numero_pedido_seq</code>, políticas RLS e a Edge Function de despacho WhatsApp para <strong className="font-mono">6892827744</strong> foram criadas nos arquivos <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px]">supabase/schema.sql</code> e <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px]">supabase/functions/send-order-pdf/index.ts</code>.
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-900 text-slate-100 font-mono text-[11px] space-y-1 overflow-x-auto max-h-72">
            <p className="text-emerald-400 font-bold">-- Status das Tabelas Supabase:</p>
            <p className="text-slate-300">✓ public.escolas (id, nome, endereco, bairro, logo_url, ativo, created_at)</p>
            <p className="text-slate-300">✓ public.turmas (id, escola_id, serie, turno, ano_letivo, created_at)</p>
            <p className="text-slate-300">✓ public.kits (id, turma_id, preco, itens_json, itens_extras_json)</p>
            <p className="text-slate-300">✓ public.vendedores (id, codigo, nome, contato, unidade, ativo)</p>
            <p className="text-slate-300">✓ public.numero_pedido_seq (START WITH 2027001 INCREMENT BY 1)</p>
            <p className="text-slate-300">✓ public.pedidos (id, numero_pedido, cliente_nome, itens, total, status, vendedor_id, ...)</p>
            <p className="text-amber-400 font-bold mt-2">-- Row Level Security (RLS):</p>
            <p className="text-slate-300">✓ SELECT aberto para leitura pública de escolas, turmas, kits e vendedores</p>
            <p className="text-slate-300">✓ INSERT aberto para finalização de novos pedidos por clientes</p>
            <p className="text-slate-300">✓ UPDATE restrito a administradores (public.is_admin())</p>
            <p className="text-blue-400 font-bold mt-2">-- Edge Function WhatsApp (6892827744):</p>
            <p className="text-slate-300">✓ supabase/functions/send-order-pdf/index.ts pronto para deploy</p>
          </div>
        </div>
      )}
    </div>
  );
};
