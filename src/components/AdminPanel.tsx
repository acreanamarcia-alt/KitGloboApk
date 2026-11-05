import React, { useState, useEffect } from 'react';
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
  Printer,
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { VendedoresComissoesModule } from './VendedoresComissoesModule';
import { SalesCommissionReport } from './SalesCommissionReport';
import { AdminDashboardFinanceiro } from './AdminDashboardFinanceiro';
import { EstoqueMonitor } from './EstoqueMonitor';
import { useFirebaseNotifications } from '../hooks/useFirebaseNotifications';
import {
  signInWithGoogleAdmin,
  auth,
  onAuthStateChanged,
  signOut,
  ADMIN_EMAILS as FIREBASE_ADMIN_EMAILS,
} from '../lib/firebase';

// Constante com os 2 endereços permitidos para acesso ao Painel Administrativo
export const ADMIN_EMAILS: string[] = [
  'acreanamarcia@gmail.com',
  'diretoria@papelariaglobo.com.br',
];

interface AdminPanelProps {
  escolas: Escola[];
  turmas: Turma[];
  kits: Kit[];
  pedidos: Pedido[];
  vendedores: Vendedor[];
  onSaveEscola: (escola: Escola) => void;
  onDeleteEscola?: (escolaId: string) => void;
  onSaveTurma: (turma: Turma) => void;
  onDeleteTurma?: (turmaId: string) => void;
  onSaveKit: (kit: Kit) => void;
  onUpdateStatus: (pedidoId: string, status: OrderStatus, whatsappNotificado?: boolean) => void;
  onSaveVendedor?: (vendedor: Vendedor) => void;
  onDeleteVendedor?: (vendedorId: string) => void;
  onResetData: () => void;
  onBackToStore?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  escolas,
  turmas,
  kits,
  pedidos,
  vendedores,
  onSaveEscola,
  onDeleteEscola,
  onSaveTurma,
  onDeleteTurma,
  onSaveKit,
  onUpdateStatus,
  onSaveVendedor,
  onDeleteVendedor,
  onResetData,
  onBackToStore,
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
    'acreanamarcia@gmail.com': {
      senha: 'globo2027',
      user: {
        nome: 'Márcia Albuquerque (Google Admin)',
        email: 'acreanamarcia@gmail.com',
        cargo: 'Gerência Geral & Operações',
        nivel: 'gerencia_total',
        nivelLabel: 'Nível 1 - Acesso Operacional Total',
      },
    },
  };

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('kitglobo_admin_auth') === 'true';
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Google Gmail Authentication Handler
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setLoginError(null);
    try {
      const result = await signInWithGoogleAdmin();
      if (result && result.email) {
        const emailLower = result.email.toLowerCase();
        let userObj: AdminUser;

        if (emailLower === 'diretoria@papelariaglobo.com.br') {
          userObj = AUTHORIZED_USERS['diretoria@papelariaglobo.com.br'].user;
        } else if (AUTHORIZED_USERS[emailLower]) {
          userObj = AUTHORIZED_USERS[emailLower].user;
        } else {
          userObj = {
            nome: result.name || 'Márcia Albuquerque',
            email: emailLower,
            cargo: 'Gerência Geral & Operações',
            nivel: 'gerencia_total',
            nivelLabel: 'Nível 1 - Acesso Operacional Total',
          };
        }

        setIsAdminLoggedIn(true);
        setLoggedAdminUser(userObj);
        localStorage.setItem('kitglobo_admin_auth', 'true');
        localStorage.setItem('kitglobo_admin_user', JSON.stringify(userObj));
        showToast(
          `Bem-vindo(a), ${userObj.nome}!`,
          `Autenticado via Google Gmail: ${userObj.email}`,
          'success'
        );
      }
    } catch (err: any) {
      const msg = err?.message || 'Falha na autenticação com Google Gmail.';
      setLoginError(msg);
      showToast('Acesso Negado', msg, 'error');
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
      setLoginError('Credenciais inválidas. O acesso é restrito exclusivamente às pessoas autorizadas.');
    }
  };

  const handleAdminLogout = () => {
    signOut(auth).catch(() => {});
    setIsAdminLoggedIn(false);
    localStorage.removeItem('kitglobo_admin_auth');
    localStorage.removeItem('kitglobo_admin_user');
    showToast('Sessão encerrada', 'Você saiu do Painel Administrativo.', 'info');
    if (onBackToStore) {
      onBackToStore();
    }
  };

  // Proteção por email autorizado no Firebase Auth para o Painel Administrativo
  useEffect(() => {
    let isSubscribed = true;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!isSubscribed) return;

      // 1. Usuário não autenticado no Firebase Auth
      if (!currentUser) {
        // Valida se há sessão local prévia autorizada (fallback para ambiente de testes/iframe)
        const savedAuth = localStorage.getItem('kitglobo_admin_auth') === 'true';
        const savedUserStr = localStorage.getItem('kitglobo_admin_user');
        let localEmail = '';
        if (savedUserStr) {
          try {
            localEmail = JSON.parse(savedUserStr)?.email?.toLowerCase() || '';
          } catch (e) {}
        }
        const isLocalAuthorized = savedAuth && ADMIN_EMAILS.some((adm) => adm.toLowerCase() === localEmail);

        if (!isLocalAuthorized) {
          setIsAdminLoggedIn(false);
          showToast(
            'Acesso Restrito',
            'Usuário não autenticado. Redirecionando para a tela inicial...',
            'error'
          );
          if (onBackToStore) {
            onBackToStore();
          } else if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }
        return;
      }

      // 2. Validação se o email autenticado está na lista ADMIN_EMAILS (2 endereços permitidos)
      const userEmail = currentUser.email?.toLowerCase().trim() || '';
      const isAuthorized = ADMIN_EMAILS.some(
        (adminEmail) => adminEmail.toLowerCase() === userEmail
      );

      if (!isAuthorized) {
        // Email não autorizado: desconecta e redireciona para a tela inicial
        signOut(auth).catch(() => {});
        setIsAdminLoggedIn(false);
        localStorage.removeItem('kitglobo_admin_auth');
        localStorage.removeItem('kitglobo_admin_user');
        showToast(
          'Acesso Negado',
          `O e-mail ${currentUser.email || 'não identificado'} não possui permissão administrativa. Redirecionando...`,
          'error'
        );
        if (onBackToStore) {
          onBackToStore();
        } else if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.location.href = '/';
        }
        return;
      }

      // 3. Usuário autenticado e com email autorizado em ADMIN_EMAILS
      setIsAdminLoggedIn(true);
      const userObj: AdminUser = {
        nome: currentUser.displayName || (userEmail === 'acreanamarcia@gmail.com' ? 'Márcia Albuquerque' : 'Roberto Melo'),
        email: userEmail,
        cargo: userEmail === 'acreanamarcia@gmail.com' ? 'Gerência Geral & Operações' : 'Diretor Financeiro & Auditoria',
        nivel: userEmail === 'acreanamarcia@gmail.com' ? 'gerencia_total' : 'diretoria_financeira',
        nivelLabel: userEmail === 'acreanamarcia@gmail.com' ? 'Nível 1 - Acesso Operacional Total' : 'Nível 2 - Acesso Financeiro & Gestão',
      };
      setLoggedAdminUser(userObj);
      localStorage.setItem('kitglobo_admin_auth', 'true');
      localStorage.setItem('kitglobo_admin_user', JSON.stringify(userObj));
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [onBackToStore, showToast]);

  // Kit editor state
  const [selectedKitTurmaId, setSelectedKitTurmaId] = useState(turmas[0]?.id || '');
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState('');

  // Modais de Inclusão de Produtos e Materiais com Upload de Imagem Local
  const [showAddExtraModal, setShowAddExtraModal] = useState(false);
  const [extraNome, setExtraNome] = useState('');
  const [extraPreco, setExtraPreco] = useState('');
  const [extraDescricao, setExtraDescricao] = useState('');
  const [extraCategoria, setExtraCategoria] = useState<ItemExtra['categoria']>('mochilas_estojos');
  const [extraImagePreview, setExtraImagePreview] = useState<string | null>(null);

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemNome, setItemNome] = useState('');
  const [itemQuantidade, setItemQuantidade] = useState<number>(1);
  const [itemUnidade, setItemUnidade] = useState('unid');
  const [itemMarca, setItemMarca] = useState('');
  const [itemCategoria, setItemCategoria] = useState<ItemKit['categoria']>('caderno');
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);

  // Escola Edit State
  const [showEditEscola, setShowEditEscola] = useState(false);
  const [editingEscola, setEditingEscola] = useState<Escola | null>(null);
  const [editEscolaNome, setEditEscolaNome] = useState('');
  const [editEscolaEndereco, setEditEscolaEndereco] = useState('');
  const [editEscolaBairro, setEditEscolaBairro] = useState('');
  const [editEscolaTelefone, setEditEscolaTelefone] = useState('');
  const [editEscolaBadgeColor, setEditEscolaBadgeColor] = useState('#0D3B8E');
  const [editEscolaAtivo, setEditEscolaAtivo] = useState(true);

  // Extra Product Edit State
  const [showEditExtraModal, setShowEditExtraModal] = useState(false);
  const [editingExtra, setEditingExtra] = useState<ItemExtra | null>(null);
  const [editExtraNome, setEditExtraNome] = useState('');
  const [editExtraPreco, setEditExtraPreco] = useState('');
  const [editExtraDescricao, setEditExtraDescricao] = useState('');
  const [editExtraCategoria, setEditExtraCategoria] = useState<ItemExtra['categoria']>('mochilas_estojos');
  const [editExtraImagePreview, setEditExtraImagePreview] = useState<string | null>(null);

  // Mandatory Item Edit State
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemKit | null>(null);
  const [editItemNome, setEditItemNome] = useState('');
  const [editItemQuantidade, setEditItemQuantidade] = useState<number>(1);
  const [editItemUnidade, setEditItemUnidade] = useState('unid');
  const [editItemMarca, setEditItemMarca] = useState('');
  const [editItemCategoria, setEditItemCategoria] = useState<ItemKit['categoria']>('caderno');
  const [editItemImagePreview, setEditItemImagePreview] = useState<string | null>(null);

  // Leitor de arquivo local (FileReader) para conversão em base64 DataURL
  const handleLocalImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onPreviewReady: (dataUrl: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Formato Inválido', 'Selecione uma imagem válida (PNG, JPG, WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Arquivo Grande', 'A imagem deve ter até 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onPreviewReady(dataUrl);
        showToast('Foto Carregada!', `${file.name} pronta para ser salva no kit.`, 'success');
      }
    };
    reader.onerror = () => {
      showToast('Erro no Upload', 'Falha ao processar arquivo local.', 'error');
    };
    reader.readAsDataURL(file);
  };

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

  // Handlers para Edição e Exclusão de Escolas
  const handleOpenEditEscola = (esc: Escola) => {
    setEditingEscola(esc);
    setEditEscolaNome(esc.nome);
    setEditEscolaEndereco(esc.endereco);
    setEditEscolaBairro(esc.bairro);
    setEditEscolaTelefone(esc.telefone || '');
    setEditEscolaBadgeColor(esc.badge_color || '#0D3B8E');
    setEditEscolaAtivo(esc.ativo);
    setShowEditEscola(true);
  };

  const handleSaveEditEscola = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEscola || !editEscolaNome.trim()) return;

    const updated: Escola = {
      ...editingEscola,
      nome: editEscolaNome.trim(),
      endereco: editEscolaEndereco.trim() || 'Rio Branco - AC',
      bairro: editEscolaBairro.trim() || 'Centro, Rio Branco - AC',
      telefone: editEscolaTelefone.trim() || undefined,
      badge_color: editEscolaBadgeColor,
      ativo: editEscolaAtivo,
    };

    onSaveEscola(updated);
    showToast('Escola Atualizada!', `${updated.nome} alterada com sucesso.`, 'success');
    setShowEditEscola(false);
    setEditingEscola(null);
  };

  const handleDeleteEscola = (esc: Escola) => {
    const escTurmas = turmas.filter((t) => t.escola_id === esc.id);
    const msg =
      escTurmas.length > 0
        ? `Atenção: A instituição "${esc.nome}" possui ${escTurmas.length} turmas vinculadas. Deseja realmente excluí-la do catálogo?`
        : `Deseja realmente excluir a escola "${esc.nome}"?`;

    if (!window.confirm(msg)) return;

    if (onDeleteEscola) {
      onDeleteEscola(esc.id);
      showToast('Escola Removida', `${esc.nome} foi excluída do sistema.`, 'info');
    }
  };

  const handleToggleEscolaAtivo = (esc: Escola) => {
    const updated: Escola = { ...esc, ativo: !esc.ativo };
    onSaveEscola(updated);
    showToast(
      updated.ativo ? 'Escola Ativada' : 'Escola Oculta',
      `${updated.nome} agora está ${updated.ativo ? 'visível na loja' : 'desativada'}.`,
      'info'
    );
  };

  // Handlers para Edição de Produtos Extras
  const handleOpenEditExtra = (extra: ItemExtra) => {
    setEditingExtra(extra);
    setEditExtraNome(extra.nome);
    setEditExtraPreco(extra.preco.toString());
    setEditExtraDescricao(extra.descricao);
    setEditExtraCategoria(extra.categoria);
    setEditExtraImagePreview(extra.foto_url || null);
    setShowEditExtraModal(true);
  };

  const handleSaveEditExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKit || !editingExtra || !editExtraNome.trim() || !editExtraPreco) return;

    const updatedExtra: ItemExtra = {
      ...editingExtra,
      nome: editExtraNome.trim(),
      preco: parseFloat(editExtraPreco) || 0,
      descricao: editExtraDescricao.trim() || 'Item adicional comercializado pela Papelaria Globo',
      categoria: editExtraCategoria,
      foto_url: editExtraImagePreview || undefined,
    };

    const updatedKit: Kit = {
      ...activeKit,
      itens_extras_json: activeKit.itens_extras_json.map((ex) =>
        ex.id === editingExtra.id ? updatedExtra : ex
      ),
    };

    onSaveKit(updatedKit);
    showToast('Produto Atualizado!', `${updatedExtra.nome} alterado com sucesso.`, 'success');
    setShowEditExtraModal(false);
    setEditingExtra(null);
  };

  // Handlers para Edição de Itens Obrigatórios
  const handleOpenEditItem = (item: ItemKit) => {
    setEditingItem(item);
    setEditItemNome(item.nome);
    setEditItemQuantidade(item.quantidade);
    setEditItemUnidade(item.unidade);
    setEditItemMarca(item.marca_sugerida || '');
    setEditItemCategoria(item.categoria);
    setEditItemImagePreview(item.foto_url || null);
    setShowEditItemModal(true);
  };

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKit || !editingItem || !editItemNome.trim() || editItemQuantidade <= 0) return;

    const updatedItem: ItemKit = {
      ...editingItem,
      nome: editItemNome.trim(),
      quantidade: editItemQuantidade,
      unidade: editItemUnidade.trim() || 'unid',
      marca_sugerida: editItemMarca.trim() || undefined,
      categoria: editItemCategoria,
      foto_url: editItemImagePreview || undefined,
    };

    const updatedKit: Kit = {
      ...activeKit,
      itens_json: activeKit.itens_json.map((it) =>
        it.id === editingItem.id ? updatedItem : it
      ),
    };

    onSaveKit(updatedKit);
    showToast('Material Atualizado!', `${updatedItem.nome} alterado com sucesso.`, 'success');
    setShowEditItemModal(false);
    setEditingItem(null);
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
              Área Restrita · Firebase Auth
            </span>
            <h3 className="text-xl font-black text-[#0D3B8E] mt-1">Painel Administrativo Papelaria Globo</h3>
            <p className="text-xs text-slate-500">
              Acesso exclusivo para administradores autorizados da gestão 2027.
            </p>
          </div>
        </div>

        {/* Botão de Login com Google (Gmail) */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border-2 border-slate-300 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-xs font-black text-slate-800">
              {isGoogleLoading ? 'Autenticando via Google...' : 'Entrar com Google (Gmail)'}
            </span>
          </button>

          <div className="bg-blue-50/80 border border-blue-200/80 p-2.5 rounded-xl text-[11px] text-[#0D3B8E] space-y-1">
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0D3B8E]" />
              E-mails com liberação de acesso Google:
            </span>
            <p className="text-[10px] text-slate-600 font-mono">
              acreanamarcia@gmail.com · gerencia@papelariaglobo.com.br · diretoria@papelariaglobo.com.br
            </p>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ou acesse com perfil e senha
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>
        </div>

        {/* Perfis Autorizados (Seletor Rápido) */}
        <div className="mt-2 space-y-2">
          <span className="text-[11px] font-bold text-slate-600 block">Selecione o perfil administrativo:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setAdminEmail('acreanamarcia@gmail.com');
                setAdminPassword('globo2027');
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                adminEmail === 'acreanamarcia@gmail.com'
                  ? 'border-[#0D3B8E] bg-blue-50/70 ring-2 ring-[#0D3B8E]/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-[#0D3B8E]">
                <UserCheck className="w-4 h-4 text-[#D92323]" />
                <span>Pessoa 1: Márcia (Gmail)</span>
              </div>
              <span className="text-[11px] text-slate-500 block truncate">acreanamarcia@gmail.com</span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">Nível 1 · Gerência Total</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminEmail('diretoria@papelariaglobo.com.br');
                setAdminPassword('admin2027');
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                adminEmail === 'diretoria@papelariaglobo.com.br'
                  ? 'border-[#0D3B8E] bg-blue-50/70 ring-2 ring-[#0D3B8E]/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-[#0D3B8E]">
                <UserCheck className="w-4 h-4 text-[#FFC700]" />
                <span>Pessoa 2: Roberto Melo</span>
              </div>
              <span className="text-[11px] text-slate-500 block truncate">diretoria@papelariaglobo.com.br</span>
              <span className="text-[10px] text-purple-700 font-bold block mt-0.5">Nível 2 · Finanças & Auditoria</span>
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
      {/* Cabeçalho Limpo para Impressão com Dados Oficiais da Papelaria Globo */}
      <div className="hidden print:block p-6 border-b-2 border-slate-900 bg-white">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#D92323] font-black text-sm tracking-wider">PAPELARIA</span>
              <span className="font-black text-[#0D3B8E] text-xl">GLOBO LTDA</span>
              <span className="bg-[#FFC700] text-[#0D3B8E] text-[10px] font-black px-2 py-0.5 rounded">kitGlobo 2027</span>
            </div>
            <p className="text-xs text-slate-700 mt-1 font-semibold">
              CNPJ: 04.123.456/0001-89 · Av. Brasil, 452 - Centro, Rio Branco - AC · CEP 69900-068
            </p>
            <p className="text-xs font-bold text-[#0D3B8E] mt-1">
              RELATÓRIO GERENCIAL OFICIAL · {activeTab === 'financeiro' ? 'Dashboard Financeiro de Vendas' : activeTab === 'estoque' ? 'Monitoramento de Estoque de Kits (Alerta 80%)' : activeTab === 'comissoes' ? 'Relatório de Comissões de Vendas (2%)' : 'Controle Operacional e Pedidos'}
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-600 space-y-0.5">
            <p>Emissão: <strong>{new Date().toLocaleDateString('pt-BR')}</strong> às {new Date().toLocaleTimeString('pt-BR')}</p>
            <p>Operador: <strong>{loggedAdminUser.nome}</strong></p>
            <p className="font-mono text-emerald-800 font-bold">{loggedAdminUser.nivelLabel}</p>
          </div>
        </div>
      </div>

      {/* Admin Top Bar com Usuário Logado */}
      <div className="bg-[#0D3B8E] text-white p-5 border-b-4 border-[#FFC700] no-print">
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
                window.print();
              }}
              className="no-print flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] rounded-xl shadow-md border-2 border-[#FFC700] transition-transform active:scale-95 cursor-pointer"
              title="Gerar versão impressa limpa com gráficos e resumos financeiros"
            >
              <Printer className="w-3.5 h-3.5 text-[#0D3B8E]" />
              <span>Imprimir Relatório</span>
            </button>

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
        <div className="flex items-center gap-1 overflow-x-auto pt-4 mt-2 border-t border-white/10 text-xs no-print">
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

      {/* Tab 2: Cadastro & Gestão Completa de Escolas */}
      {activeTab === 'escolas' && (
        <div className="p-5 space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/70 p-4 rounded-2xl border border-[#0D3B8E]/20">
            <div>
              <h3 className="text-base font-black text-[#0D3B8E]">
                Escolas Particulares Parceiras de Rio Branco - AC
              </h3>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Cadastre instituições, edite endereços, contatos e gerencie turmas do catálogo 2027
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddEscola(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] font-black rounded-xl shadow-md border-2 border-[#FFC700] transition-transform active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-[#0D3B8E]" />
              <span>+ Cadastrar Nova Escola</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {escolas.map((esc) => {
              const escTurmas = turmas.filter((t) => t.escola_id === esc.id);
              const badgeBg = esc.badge_color || '#0D3B8E';

              return (
                <div
                  key={esc.id}
                  className="p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-[#FFC700] transition-all space-y-3 flex flex-col justify-between shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                          style={{ backgroundColor: badgeBg }}
                          title={`Cor da instituição: ${badgeBg}`}
                        />
                        <span className="font-black text-sm text-slate-900 leading-snug">{esc.nome}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleEscolaAtivo(esc)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                          esc.ativo
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Clique para alternar visibilidade na loja"
                      >
                        {esc.ativo ? '✓ Ativa' : 'Oculta'}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 flex items-start gap-1">
                      <span>📍</span>
                      <span>{esc.endereco} · {esc.bairro}</span>
                    </p>

                    {esc.telefone && (
                      <p className="text-[11px] text-[#0D3B8E] font-semibold flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{esc.telefone}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                      {escTurmas.length} {escTurmas.length === 1 ? 'turma' : 'turmas'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditEscola(esc)}
                        className="p-1.5 text-slate-600 hover:text-[#0D3B8E] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar escola"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEscola(esc)}
                        className="p-1.5 text-slate-400 hover:text-[#D92323] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir escola"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
                className="bg-white p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl border-2 border-[#0D3B8E]/20 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#0D3B8E] text-[#FFC700] flex items-center justify-center font-bold">
                      <School className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Cadastrar Nova Escola em Rio Branco</h4>
                      <p className="text-[11px] text-slate-500">Parceiro Oficial kitGlobo 2027</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddEscola(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome da Instituição de Ensino: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Colégio Anglo Acre"
                    value={novaEscolaNome}
                    onChange={(e) => setNovaEscolaNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold focus:border-[#0D3B8E] focus:outline-none"
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
                    className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold focus:border-[#0D3B8E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Bairro / Região em Rio Branco:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Bosque, Rio Branco - AC"
                    value={novaEscolaBairro}
                    onChange={(e) => setNovaEscolaBairro(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold focus:border-[#0D3B8E] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddEscola(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0D3B8E] hover:bg-[#09265E] text-white font-black rounded-xl shadow-md border-2 border-[#FFC700] cursor-pointer"
                  >
                    Salvar Escola
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal Editar Escola */}
          {showEditEscola && editingEscola && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form
                onSubmit={handleSaveEditEscola}
                className="bg-white p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl border-2 border-[#0D3B8E]/20 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#FFC700] text-[#0D3B8E] flex items-center justify-center font-bold">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Editar Escola</h4>
                      <p className="text-[11px] text-slate-500">{editingEscola.nome}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditEscola(false);
                      setEditingEscola(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome da Escola: *
                  </label>
                  <input
                    type="text"
                    required
                    value={editEscolaNome}
                    onChange={(e) => setEditEscolaNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold focus:border-[#0D3B8E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Endereço Completo:
                  </label>
                  <input
                    type="text"
                    value={editEscolaEndereco}
                    onChange={(e) => setEditEscolaEndereco(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold focus:border-[#0D3B8E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Bairro / Região:
                  </label>
                  <input
                    type="text"
                    value={editEscolaBairro}
                    onChange={(e) => setEditEscolaBairro(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold focus:border-[#0D3B8E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Telefone de Contato:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (68) 3224-4000"
                    value={editEscolaTelefone}
                    onChange={(e) => setEditEscolaTelefone(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold focus:border-[#0D3B8E] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editEscolaAtivo"
                    checked={editEscolaAtivo}
                    onChange={(e) => setEditEscolaAtivo(e.target.checked)}
                    className="w-4 h-4 text-[#0D3B8E] rounded focus:ring-[#FFC700]"
                  />
                  <label htmlFor="editEscolaAtivo" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Escola Ativa (Visível na Vitrine Pública)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditEscola(false);
                      setEditingEscola(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0D3B8E] hover:bg-[#09265E] text-white font-black rounded-xl shadow-md border-2 border-[#FFC700] cursor-pointer"
                  >
                    Salvar Alterações
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

      {/* Tab 4: Kits & Itens com Inclusão e Alteração de Produtos e Imagens via Upload Local */}
      {activeTab === 'kits' && (
        <div className="p-5 space-y-5 text-xs">
          {/* Seletor de Turma e Gestão do Preço Base */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block text-xs">
                Selecione a Turma para Gerenciar os Produtos e Materiais:
              </label>
              <select
                value={selectedKitTurmaId}
                onChange={(e) => {
                  setSelectedKitTurmaId(e.target.value);
                  setIsEditingPrice(false);
                }}
                className="px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:border-[#0D3B8E] focus:outline-none"
              >
                {turmas.map((t) => {
                  const esc = escolas.find((e) => e.id === t.escola_id);
                  const hasKit = kits.some((k) => k.turma_id === t.id);
                  return (
                    <option key={t.id} value={t.id}>
                      {esc?.nome} — {t.serie} ({t.turno}) {hasKit ? '✓' : '(Sem Kit)'}
                    </option>
                  );
                })}
              </select>
            </div>

            {activeKit && (
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                    Preço Base do Kit Fechado
                  </span>
                  {isEditingPrice ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-black text-slate-500">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        className="w-24 px-2 py-1 border-2 border-[#0D3B8E] rounded-lg font-mono font-bold text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(tempPrice);
                          if (isNaN(val) || val <= 0) {
                            showToast('Valor Inválido', 'Digite um valor numérico válido.', 'error');
                            return;
                          }
                          const updated = { ...activeKit, preco: val };
                          onSaveKit(updated);
                          setIsEditingPrice(false);
                          showToast('Preço Atualizado!', `Novo valor base do kit: ${formatCurrency(val)}`, 'success');
                        }}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                        title="Salvar novo preço"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingPrice(false)}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xl font-black text-[#D92323] font-mono tabular-nums">
                      {formatCurrency(activeKit.preco)}
                    </span>
                  )}
                </div>

                {!isEditingPrice && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempPrice(activeKit.preco.toString());
                      setIsEditingPrice(true);
                    }}
                    className="p-2 text-slate-500 hover:text-[#0D3B8E] hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                    title="Editar Preço Base"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {activeKit ? (
            <div className="space-y-6">
              {/* Barra de Ações: Adicionar Itens e Produtos Extras com Imagens */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/70 border border-[#0D3B8E]/20 rounded-2xl">
                <div>
                  <h4 className="font-bold text-[#0D3B8E] text-xs">
                    Catálogo de Materiais & Produtos da Turma: {selectedTurma?.serie}
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    {selectedEscolaForKit?.nome} · Ano Letivo 2027
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddItemModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#0D3B8E] hover:bg-[#09265E] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FFC700]" />
                    <span>+ Material Obrigatório</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExtraImagePreview(null);
                      setShowAddExtraModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] font-black rounded-xl shadow-xs border-2 border-[#FFC700] transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#0D3B8E]" />
                    <span>+ Produto Extra com Imagem (Host Local)</span>
                  </button>
                </div>
              </div>

              {/* Seção 1: Materiais Obrigatórios do Kit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#0D3B8E]" />
                    <span>Materiais Obrigatórios no Kit Fechado ({activeKit.itens_json.length} itens)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Itens que compõem o kit selado na Papelaria Globo
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-80 overflow-y-auto bg-white shadow-xs">
                  {activeKit.itens_json.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                      Nenhum material cadastrado neste kit ainda.
                    </div>
                  ) : (
                    activeKit.itens_json.map((it, idx) => (
                      <div
                        key={it.id || idx}
                        className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {it.foto_url ? (
                            <img
                              src={it.foto_url}
                              alt={it.nome}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">{it.nome}</span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              {it.marca_sugerida && <span>Marca: <strong className="text-slate-700">{it.marca_sugerida}</strong></span>}
                              <span>·</span>
                              <span className="capitalize">{it.categoria.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-blue-50 text-[#0D3B8E] px-2.5 py-1 rounded-lg font-bold text-xs border border-blue-100">
                            {it.quantidade} {it.unidade}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenEditItem(it)}
                            className="p-1.5 text-slate-400 hover:text-[#0D3B8E] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar material"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Deseja remover "${it.nome}" deste kit?`)) {
                                const updated: Kit = {
                                  ...activeKit,
                                  itens_json: activeKit.itens_json.filter((_, i) => i !== idx),
                                };
                                onSaveKit(updated);
                                showToast('Material Removido', `Item excluído da lista obrigatória.`, 'info');
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#D92323] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remover material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Seção 2: Produtos e Acessórios Extras Opcionais com Upload de Imagem */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#D92323]" />
                      <span>Produtos Extras Disponíveis para Venda ({activeKit.itens_extras_json?.length || 0})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Produtos opcionais com fotos locais (mochilas, estojos, calculadoras) que os pais podem incluir no pedido
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setExtraImagePreview(null);
                      setShowAddExtraModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] font-black rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Produto</span>
                  </button>
                </div>

                {(!activeKit.itens_extras_json || activeKit.itens_extras_json.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-2">
                    <p className="text-slate-500">Nenhum produto extra cadastrado para esta série ainda.</p>
                    <button
                      type="button"
                      onClick={() => setShowAddExtraModal(true)}
                      className="px-4 py-2 bg-[#0D3B8E] text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Cadastrar Primeiro Produto com Imagem
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeKit.itens_extras_json.map((extra) => (
                      <div
                        key={extra.id}
                        className="p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-[#FFC700] transition-all flex flex-col justify-between shadow-xs"
                      >
                        <div>
                          {extra.foto_url ? (
                            <div className="w-full h-32 mb-2 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                              <img
                                src={extra.foto_url}
                                alt={extra.nome}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                                Foto Local
                              </span>
                            </div>
                          ) : (
                            <div className="w-full h-24 mb-2 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                              <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                              <span className="text-[10px]">Sem imagem vinculada</span>
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-2 mt-1">
                            <strong className="text-slate-900 block text-xs leading-tight">{extra.nome}</strong>
                            <span className="font-mono font-black text-[#D92323] whitespace-nowrap">
                              {formatCurrency(extra.preco)}
                            </span>
                          </div>

                          <span className="inline-block bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-semibold mt-1">
                            {extra.categoria === 'mochilas_estojos'
                              ? 'Mochilas & Estojos'
                              : extra.categoria === 'escrita_premium'
                              ? 'Escrita Premium'
                              : extra.categoria === 'artes'
                              ? 'Artes & Desenho'
                              : 'Organização'}
                          </span>

                          <p className="text-slate-500 text-[11px] mt-1.5 line-clamp-2">
                            {extra.descricao}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            Disponível na Loja
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditExtra(extra)}
                              className="p-1.5 text-slate-400 hover:text-[#0D3B8E] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar produto extra"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Deseja excluir o produto "${extra.nome}" deste kit?`)) {
                                  const updated: Kit = {
                                    ...activeKit,
                                    itens_extras_json: activeKit.itens_extras_json.filter((ex) => ex.id !== extra.id),
                                  };
                                  onSaveKit(updated);
                                  showToast('Produto Excluído', `${extra.nome} foi removido do catálogo.`, 'info');
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-[#D92323] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir produto extra"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-[#0D3B8E]/25 space-y-3">
              <div className="w-12 h-12 bg-blue-100 text-[#0D3B8E] rounded-2xl flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Nenhum Kit Escolar Cadastrado para esta Turma
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                A turma <strong>{selectedTurma?.serie}</strong> ainda não possui uma lista de materiais vinculada para o ano 2027.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!selectedTurma) return;
                  const newKit: Kit = {
                    id: `kit-${selectedTurma.id}-${Date.now().toString(36)}`,
                    turma_id: selectedTurma.id,
                    preco: 280.0,
                    itens_json: [
                      {
                        id: `it-${Date.now()}-1`,
                        nome: 'Caderno Universitário Capa Dura 200 fls',
                        quantidade: 2,
                        unidade: 'unid',
                        marca_sugerida: 'Tilibra',
                        categoria: 'caderno',
                        obrigatorio: true,
                      },
                      {
                        id: `it-${Date.now()}-2`,
                        nome: 'Caixa de Lápis de Cor 24 Cores EcoLápis',
                        quantidade: 1,
                        unidade: 'cx',
                        marca_sugerida: 'Faber-Castell',
                        categoria: 'arte_pintura',
                        obrigatorio: true,
                      },
                      {
                        id: `it-${Date.now()}-3`,
                        nome: 'Resma de Papel Chamex A4 500 Folhas',
                        quantidade: 1,
                        unidade: 'pct',
                        marca_sugerida: 'Chamex',
                        categoria: 'caderno',
                        obrigatorio: true,
                      },
                    ],
                    itens_extras_json: [],
                  };
                  onSaveKit(newKit);
                  showToast('Kit Inicializado!', `Kit oficial criado para ${selectedTurma.serie}.`, 'success');
                }}
                className="px-5 py-2.5 bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] font-black rounded-xl text-xs shadow-md border-2 border-[#FFC700] cursor-pointer"
              >
                + Criar Kit Oficial para esta Turma
              </button>
            </div>
          )}

          {/* Modal: Inclusão de Novo Produto / Item Extra com Upload de Imagem */}
          {showAddExtraModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!activeKit || !extraNome.trim() || !extraPreco) return;

                  const newExtra: ItemExtra = {
                    id: `ext-${Date.now().toString(36)}`,
                    nome: extraNome.trim(),
                    preco: parseFloat(extraPreco) || 0,
                    descricao: extraDescricao.trim() || 'Item adicional comercializado pela Papelaria Globo',
                    categoria: extraCategoria,
                    foto_url: extraImagePreview || undefined,
                  };

                  const updated: Kit = {
                    ...activeKit,
                    itens_extras_json: [...(activeKit.itens_extras_json || []), newExtra],
                  };

                  onSaveKit(updated);
                  showToast('Produto Adicionado!', `${newExtra.nome} incluído aos extras do kit com sucesso.`, 'success');
                  setShowAddExtraModal(false);
                  setExtraNome('');
                  setExtraPreco('');
                  setExtraDescricao('');
                  setExtraImagePreview(null);
                }}
                className="bg-white p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl border-2 border-[#0D3B8E]/20 text-xs max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#FFC700] text-[#0D3B8E] flex items-center justify-center font-bold">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Novo Produto / Item Extra com Imagem</h4>
                      <p className="text-[11px] text-slate-500">Cadastrar no catálogo local da Papelaria Globo</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddExtraModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome do Produto Extra: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mochila com Rodinhas e Alça Acolchoada"
                    value={extraNome}
                    onChange={(e) => setExtraNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold focus:border-[#0D3B8E] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Preço Unitário (R$): *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={extraPreco}
                      onChange={(e) => setExtraPreco(e.target.value)}
                      className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-mono font-bold focus:border-[#0D3B8E] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Categoria do Produto:
                    </label>
                    <select
                      value={extraCategoria}
                      onChange={(e) => setExtraCategoria(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold bg-white focus:border-[#0D3B8E] focus:outline-none"
                    >
                      <option value="mochilas_estojos">Mochilas & Estojos</option>
                      <option value="escrita_premium">Escrita Premium</option>
                      <option value="organizacao">Organização</option>
                      <option value="artes">Artes & Pintura</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Descrição do Produto:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalhes sobre o material, compartimentos, marca e garantia..."
                    value={extraDescricao}
                    onChange={(e) => setExtraDescricao(e.target.value)}
                    className="w-full px-3.5 py-2 border-2 border-slate-200 rounded-xl font-medium focus:border-[#0D3B8E] focus:outline-none resize-none"
                  />
                </div>

                {/* Espaço para Imagem via Host Local / Upload FileReader */}
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border-2 border-dashed border-[#0D3B8E]/30">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#0D3B8E]">
                    <ImageIcon className="w-4 h-4 text-[#D92323]" />
                    <span>Upload da Imagem do Produto (Host Local / Arquivo):</span>
                  </label>

                  {extraImagePreview ? (
                    <div className="space-y-2">
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border-2 border-[#0D3B8E] bg-white">
                        <img
                          src={extraImagePreview}
                          alt="Pré-visualização do produto"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setExtraImagePreview(null)}
                          className="absolute top-2 right-2 bg-[#D92323] text-white p-1 rounded-lg shadow-md hover:bg-rose-700 cursor-pointer"
                          title="Remover imagem"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold block text-center">
                        ✓ Imagem pronta para inclusão no kit
                      </span>
                    </div>
                  ) : (
                    <div className="text-center py-4 px-2">
                      <Upload className="w-8 h-8 text-[#0D3B8E] mx-auto mb-2 opacity-70" />
                      <label className="inline-block px-4 py-2 bg-white text-[#0D3B8E] border-2 border-[#0D3B8E] font-bold rounded-xl cursor-pointer hover:bg-blue-50 transition-colors shadow-xs">
                        <span>Escolher Arquivo do Computador</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLocalImageUpload(e, setExtraImagePreview)}
                        />
                      </label>
                      <p className="text-[10px] text-slate-500 mt-2">
                        Formatos suportados: PNG, JPG, JPEG, WEBP (Máx: 5MB)
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddExtraModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0D3B8E] hover:bg-[#09265E] text-white font-black rounded-xl shadow-md border-2 border-[#FFC700] cursor-pointer"
                  >
                    Salvar Produto Extra
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal: Inclusão de Material Obrigatório ao Kit */}
          {showAddItemModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!activeKit || !itemNome.trim() || itemQuantidade <= 0) return;

                  const newItem: ItemKit = {
                    id: `it-${Date.now().toString(36)}`,
                    nome: itemNome.trim(),
                    quantidade: itemQuantidade,
                    unidade: itemUnidade.trim() || 'unid',
                    marca_sugerida: itemMarca.trim() || undefined,
                    categoria: itemCategoria,
                    obrigatorio: true,
                    foto_url: itemImagePreview || undefined,
                  };

                  const updated: Kit = {
                    ...activeKit,
                    itens_json: [...activeKit.itens_json, newItem],
                  };

                  onSaveKit(updated);
                  showToast('Material Cadastrado!', `${newItem.nome} inserido na lista do kit.`, 'success');
                  setShowAddItemModal(false);
                  setItemNome('');
                  setItemQuantidade(1);
                  setItemMarca('');
                  setItemImagePreview(null);
                }}
                className="bg-white p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl border-2 border-[#0D3B8E]/20 text-xs max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#0D3B8E] text-[#FFC700] flex items-center justify-center font-bold">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Adicionar Material Obrigatório</h4>
                      <p className="text-[11px] text-slate-500">Item obrigatório para a turma {selectedTurma?.serie}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome do Material: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tesoura Sem Ponta Mundial"
                    value={itemNome}
                    onChange={(e) => setItemNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold focus:border-[#0D3B8E] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Quantidade: *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={itemQuantidade}
                      onChange={(e) => setItemQuantidade(parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-mono font-bold focus:border-[#0D3B8E] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Unidade:
                    </label>
                    <select
                      value={itemUnidade}
                      onChange={(e) => setItemUnidade(e.target.value)}
                      className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold bg-white focus:border-[#0D3B8E] focus:outline-none"
                    >
                      <option value="unid">Unidade (unid)</option>
                      <option value="cx">Caixa (cx)</option>
                      <option value="pct">Pacote (pct)</option>
                      <option value="folhas">Folhas</option>
                      <option value="conj">Conjunto</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Marca Sugerida:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Faber-Castell, Acrilex"
                      value={itemMarca}
                      onChange={(e) => setItemMarca(e.target.value)}
                      className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold focus:border-[#0D3B8E] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Categoria:
                    </label>
                    <select
                      value={itemCategoria}
                      onChange={(e) => setItemCategoria(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold bg-white focus:border-[#0D3B8E] focus:outline-none"
                    >
                      <option value="caderno">Caderno / Papelaria</option>
                      <option value="escrita">Escrita & Correção</option>
                      <option value="arte_pintura">Arte & Pintura</option>
                      <option value="geometria_organizacao">Geometria & Medidas</option>
                      <option value="higiene_apoio">Higiene & Apoio</option>
                    </select>
                  </div>
                </div>

                {/* Upload de foto opcional do material */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Foto do Material (Opcional):
                  </label>
                  {itemImagePreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={itemImagePreview}
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => setItemImagePreview(null)}
                        className="text-[11px] text-[#D92323] font-bold hover:underline cursor-pointer"
                      >
                        Remover Foto
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-semibold cursor-pointer hover:bg-slate-100">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Carregar Foto Local</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleLocalImageUpload(e, setItemImagePreview)}
                      />
                    </label>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0D3B8E] hover:bg-[#09265E] text-white font-black rounded-xl shadow-md border-2 border-[#FFC700] cursor-pointer"
                  >
                    Salvar Material
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal: Edição de Produto / Item Extra */}
          {showEditExtraModal && editingExtra && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form
                onSubmit={handleSaveEditExtra}
                className="bg-white p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl border-2 border-[#0D3B8E]/20 text-xs max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#0D3B8E] text-[#FFC700] flex items-center justify-center font-bold">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Editar Produto Extra</h4>
                      <p className="text-[11px] text-slate-500">Alterar dados, valor e imagem do produto</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditExtraModal(false);
                      setEditingExtra(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome do Produto Extra: *
                  </label>
                  <input
                    type="text"
                    required
                    value={editExtraNome}
                    onChange={(e) => setEditExtraNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold focus:border-[#0D3B8E] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Preço Unitário (R$): *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editExtraPreco}
                      onChange={(e) => setEditExtraPreco(e.target.value)}
                      className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-mono font-bold focus:border-[#0D3B8E] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Categoria do Produto:
                    </label>
                    <select
                      value={editExtraCategoria}
                      onChange={(e) => setEditExtraCategoria(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold bg-white focus:border-[#0D3B8E] focus:outline-none"
                    >
                      <option value="mochilas_estojos">Mochilas & Estojos</option>
                      <option value="escrita_premium">Escrita Premium</option>
                      <option value="organizacao">Organização</option>
                      <option value="artes">Artes & Pintura</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Descrição do Produto:
                  </label>
                  <textarea
                    rows={2}
                    value={editExtraDescricao}
                    onChange={(e) => setEditExtraDescricao(e.target.value)}
                    className="w-full px-3.5 py-2 border-2 border-slate-200 rounded-xl font-medium focus:border-[#0D3B8E] focus:outline-none resize-none"
                  />
                </div>

                {/* Espaço para Imagem via Host Local / Upload FileReader */}
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border-2 border-dashed border-[#0D3B8E]/30">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#0D3B8E]">
                    <ImageIcon className="w-4 h-4 text-[#D92323]" />
                    <span>Upload da Imagem do Produto (Host Local / Arquivo):</span>
                  </label>

                  {editExtraImagePreview ? (
                    <div className="space-y-2">
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border-2 border-[#0D3B8E] bg-white">
                        <img
                          src={editExtraImagePreview}
                          alt="Pré-visualização do produto"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setEditExtraImagePreview(null)}
                          className="absolute top-2 right-2 bg-[#D92323] text-white p-1 rounded-lg shadow-md hover:bg-rose-700 cursor-pointer"
                          title="Remover imagem"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold block text-center">
                        ✓ Imagem atualizada pronta para salvar
                      </span>
                    </div>
                  ) : (
                    <div className="text-center py-4 px-2">
                      <Upload className="w-8 h-8 text-[#0D3B8E] mx-auto mb-2 opacity-70" />
                      <label className="inline-block px-4 py-2 bg-white text-[#0D3B8E] border-2 border-[#0D3B8E] font-bold rounded-xl cursor-pointer hover:bg-blue-50 transition-colors shadow-xs">
                        <span>Escolher Nova Imagem Local</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLocalImageUpload(e, setEditExtraImagePreview)}
                        />
                      </label>
                      <p className="text-[10px] text-slate-500 mt-2">
                        Formatos suportados: PNG, JPG, JPEG, WEBP (Máx: 5MB)
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditExtraModal(false);
                      setEditingExtra(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0D3B8E] hover:bg-[#09265E] text-white font-black rounded-xl shadow-md border-2 border-[#FFC700] cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal: Edição de Material Obrigatório do Kit */}
          {showEditItemModal && editingItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form
                onSubmit={handleSaveEditItem}
                className="bg-white p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl border-2 border-[#0D3B8E]/20 text-xs max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#0D3B8E] text-[#FFC700] flex items-center justify-center font-bold">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Editar Material Obrigatório</h4>
                      <p className="text-[11px] text-slate-500">Alterar quantidade, marca e categoria</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditItemModal(false);
                      setEditingItem(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome do Material: *
                  </label>
                  <input
                    type="text"
                    required
                    value={editItemNome}
                    onChange={(e) => setEditItemNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold focus:border-[#0D3B8E] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Quantidade: *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editItemQuantidade}
                      onChange={(e) => setEditItemQuantidade(parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-mono font-bold focus:border-[#0D3B8E] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Unidade:
                    </label>
                    <select
                      value={editItemUnidade}
                      onChange={(e) => setEditItemUnidade(e.target.value)}
                      className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold bg-white focus:border-[#0D3B8E] focus:outline-none"
                    >
                      <option value="unid">Unidade (unid)</option>
                      <option value="cx">Caixa (cx)</option>
                      <option value="pct">Pacote (pct)</option>
                      <option value="folhas">Folhas</option>
                      <option value="conj">Conjunto</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Marca Sugerida:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Faber-Castell, Acrilex"
                      value={editItemMarca}
                      onChange={(e) => setEditItemMarca(e.target.value)}
                      className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold focus:border-[#0D3B8E] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Categoria:
                    </label>
                    <select
                      value={editItemCategoria}
                      onChange={(e) => setEditItemCategoria(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold bg-white focus:border-[#0D3B8E] focus:outline-none"
                    >
                      <option value="caderno">Caderno / Papelaria</option>
                      <option value="escrita">Escrita & Correção</option>
                      <option value="arte_pintura">Arte & Pintura</option>
                      <option value="geometria_organizacao">Geometria & Medidas</option>
                      <option value="higiene_apoio">Higiene & Apoio</option>
                    </select>
                  </div>
                </div>

                {/* Upload de foto opcional do material */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Foto do Material (Opcional):
                  </label>
                  {editItemImagePreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={editItemImagePreview}
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => setEditItemImagePreview(null)}
                        className="text-[11px] text-[#D92323] font-bold hover:underline cursor-pointer"
                      >
                        Remover Foto
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-semibold cursor-pointer hover:bg-slate-100">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Carregar Foto Local</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleLocalImageUpload(e, setEditItemImagePreview)}
                      />
                    </label>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditItemModal(false);
                      setEditingItem(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0D3B8E] hover:bg-[#09265E] text-white font-black rounded-xl shadow-md border-2 border-[#FFC700] cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
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
