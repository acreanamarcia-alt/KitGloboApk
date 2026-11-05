import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Escola,
  Turma,
  Kit,
  Pedido,
  Vendedor,
  CartItem,
  OrderStatus,
  PaymentMethod,
} from './types';
import {
  getEscolas,
  getTurmas,
  getKits,
  getVendedores,
  getPedidos,
  createPedido,
  updatePedidoStatus,
  saveEscola,
  saveTurma,
  saveKit,
  saveVendedor,
  deleteVendedor,
  subscribeToStore,
  resetToSeedData,
} from './services/storage';
import { Header } from './components/Header';
import { SchoolCard } from './components/SchoolCard';
import { KitModal } from './components/KitModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { AdminPanel } from './components/AdminPanel';
import { ToastProvider, useToast } from './components/Toast';
import { SchoolCardSkeleton } from './components/SkeletonLoaders';
import {
  Search,
  Sparkles,
  Store,
  ShieldCheck,
  CheckCircle2,
  Clock,
  CalendarCheck,
  HelpCircle,
  MapPin,
  Bell,
  Code2,
  Phone,
  Package,
} from 'lucide-react';
import { useFirebaseNotifications } from './hooks/useFirebaseNotifications';

const HERO_IMAGE = '/src/assets/images/kitglobo_hero_supplies_1793849387218.jpg';
const STORE_IMAGE = '/src/assets/images/kitglobo_store_pickup_1793849386990.jpg';

function MainApp() {
  const { showToast } = useToast();
  const { fcmToken, permission, requestPermission, sendLocalTestNotification } =
    useFirebaseNotifications();

  // Reactive State from LocalStorage / Supabase service
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null);
  const [isKitModalOpen, setIsKitModalOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Pedido | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  // Sync state from storage
  const syncData = useCallback(() => {
    setEscolas(getEscolas());
    setTurmas(getTurmas());
    setKits(getKits());
    setVendedores(getVendedores());
    setPedidos(getPedidos());
  }, []);

  useEffect(() => {
    syncData();
    const timer = setTimeout(() => setLoading(false), 250);
    const unsubscribe = subscribeToStore(syncData);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [syncData]);

  // School filtration
  const filteredEscolas = useMemo(() => {
    if (!searchTerm.trim()) return escolas;
    const term = searchTerm.toLowerCase();
    return escolas.filter(
      (e) =>
        e.nome.toLowerCase().includes(term) ||
        e.endereco.toLowerCase().includes(term) ||
        e.bairro.toLowerCase().includes(term)
    );
  }, [escolas, searchTerm]);

  // Open school kit selector
  const handleSelectEscola = useCallback((escola: Escola) => {
    setSelectedEscola(escola);
    setIsKitModalOpen(true);
  }, []);

  // Add kit to cart
  const handleAddToCart = useCallback((item: CartItem) => {
    setCartItems((prev) => [...prev, item]);
    showToast(
      'Kit adicionado ao carrinho!',
      `${item.serie} (${item.escola_nome}) para o aluno ${item.aluno_nome}.`,
      'success'
    );
  }, [showToast]);

  // Cart operations
  const handleRemoveCartItem = useCallback((cartId: string) => {
    setCartItems((prev) => prev.filter((it) => it.cart_id !== cartId));
    showToast('Item removido', 'O kit foi retirado do seu carrinho.', 'info');
  }, [showToast]);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Submit order checkout
  const handleCheckout = useCallback(
    (orderData: {
      cliente_nome: string;
      cliente_telefone: string;
      cliente_cpf: string;
      vendedor_id: string;
      vendedor_nome: string;
      forma_pagamento: PaymentMethod;
      troco_para: number | null;
      valor_troco: number | null;
      data_retirada: string;
      hora_retirada: string;
    }) => {
      if (cartItems.length === 0) return;

      const firstItem = cartItems[0];
      const subtotal = cartItems.reduce((acc, it) => acc + it.subtotal, 0);

      const novoPedido = createPedido({
        cliente_nome: orderData.cliente_nome,
        cliente_telefone: orderData.cliente_telefone,
        cliente_cpf: orderData.cliente_cpf,
        aluno_nome: cartItems.map((c) => c.aluno_nome).join(', '),
        escola_nome: firstItem.escola_nome,
        serie_turma: cartItems.map((c) => c.serie).join(' + '),
        itens: cartItems.map((c) => ({
          kit_id: c.kit_id,
          serie: c.serie,
          preco_kit: c.preco_base_kit,
          obrigatorios: c.itens_obrigatorios,
        })),
        itens_extras: cartItems.flatMap((c) =>
          c.itens_extras_selecionados.map((ext) => ({
            id: ext.item.id,
            nome: ext.item.nome,
            quantidade: ext.quantidade,
            preco_unitario: ext.item.preco,
          }))
        ),
        subtotal,
        desconto: 0,
        total: subtotal,
        vendedor_id: orderData.vendedor_id,
        vendedor_nome: orderData.vendedor_nome,
        forma_pagamento: orderData.forma_pagamento,
        troco_para: orderData.troco_para,
        valor_troco: orderData.valor_troco,
        data_retirada: orderData.data_retirada,
        hora_retirada: orderData.hora_retirada,
        observacoes: `Atendimento via Papelaria Globo Rio Branco - Vendedor: ${orderData.vendedor_nome}`,
      });

      setLastCompletedOrder(novoPedido);
      setCartItems([]);
      setIsCartOpen(false);
      setIsConfirmModalOpen(true);

      showToast(
        'Pedido Concluído com Sucesso!',
        `Seu pedido #${novoPedido.numero_pedido} já foi registrado no balcão da Papelaria Globo.`,
        'success'
      );
    },
    [cartItems, showToast]
  );

  // Turmas for current selected school
  const turmasForSelectedSchool = useMemo(() => {
    if (!selectedEscola) return [];
    return turmas.filter((t) => t.escola_id === selectedEscola.id);
  }, [turmas, selectedEscola]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Brand Header */}
      <Header
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        isAdminOpen={isAdminOpen}
        onToggleAdmin={() => setIsAdminOpen((prev) => !prev)}
      />

      {/* Admin Panel Overlay / View */}
      {isAdminOpen && (
        <div className="max-w-6xl mx-auto px-4 w-full">
          <AdminPanel
            escolas={escolas}
            turmas={turmas}
            kits={kits}
            pedidos={pedidos}
            vendedores={vendedores}
            onSaveEscola={saveEscola}
            onSaveTurma={saveTurma}
            onSaveKit={saveKit}
            onUpdateStatus={updatePedidoStatus}
            onSaveVendedor={saveVendedor}
            onDeleteVendedor={deleteVendedor}
            onResetData={resetToSeedData}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-[#0D3B8E] text-white overflow-hidden py-10 sm:py-14 border-b-4 border-[#FFC700]">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-radial from-blue-700/40 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Copy & Value Proposition */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 bg-[#FFC700] text-[#0D3B8E] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#D92323]" />
                  <span>Volta às Aulas 2027 · Rio Branco - AC</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight text-balance">
                  Compre o <span className="text-[#FFC700] underline decoration-[#D92323] decoration-4">kitGlobo</span> da escola do seu filho sem filas.
                </h1>

                <p className="text-sm sm:text-base text-blue-100 max-w-xl leading-relaxed">
                  A <strong>Papelaria Globo</strong> preparou os kits escolares fechados com todos os itens obrigatórios solicitados pelas principais escolas particulares de Rio Branco para o <strong>Ano Letivo 2027</strong>.
                </p>

                {/* Key Benefits Pill Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/15 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FFC700] shrink-0" />
                    <span className="text-xs font-semibold">100% da Lista Oficial</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/15 flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold">Retirada Agendada</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/15 flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="text-xs font-semibold">Simulador de Troco</span>
                  </div>
                </div>

                {/* Search Bar for Schools */}
                <div className="pt-2">
                  <div className="relative max-w-lg">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Busque pelo colégio do seu filho (ex: Meta, Sigma, Batista)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 placeholder:text-slate-400 rounded-2xl text-xs sm:text-sm font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-[#FFC700]"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Asset */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 group">
                  <img
                    src={HERO_IMAGE}
                    alt="Materiais escolares kitGlobo 2027 Papelaria Globo"
                    referrerPolicy="no-referrer"
                    className="w-full h-64 sm:h-80 object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D3B8E] via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="inline-block bg-[#D92323] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                      Embalagem Selada
                    </div>
                    <h3 className="text-base font-black leading-snug">
                      Kits Padronizados com as Melhores Marcas
                    </h3>
                    <p className="text-[11px] text-blue-200">
                      Faber-Castell, Tilibra, Acrilex e Chamex com etiquetas personalizadas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Schools Showcase Section */}
        <section className="py-10 max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 text-[#0D3B8E] text-xs font-black uppercase tracking-wider mb-1">
                <Store className="w-4 h-4 text-[#D92323]" />
                <span>Vitrine de Colégios de Rio Branco</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Selecione a Escola Particular
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Clique no colégio para escolher a série e visualizar o kit completo com valores e itens extras.
              </p>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Mostrando <strong>{filteredEscolas.length}</strong> de {escolas.length} colégios
            </div>
          </div>

          {/* School Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SchoolCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredEscolas.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md mx-auto space-y-3">
              <HelpCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Nenhum colégio encontrado</h3>
              <p className="text-xs text-slate-500">
                Não encontramos colégios com o termo "{searchTerm}". Você pode cadastrar uma nova escola no Painel Admin ou solicitar via WhatsApp.
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-[#0D3B8E] text-white text-xs font-bold rounded-xl"
              >
                Limpar Busca
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredEscolas.map((escola) => {
                const count = turmas.filter((t) => t.escola_id === escola.id).length;
                return (
                  <SchoolCard
                    key={escola.id}
                    escola={escola}
                    turmasCount={count}
                    onSelect={handleSelectEscola}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* 3-Step Guided Process */}
        <section className="py-12 bg-white border-y-2 border-[#0D3B8E]/10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-1.5 bg-[#FFC700]/25 text-[#0D3B8E] text-xs font-black px-3 py-0.5 rounded-full uppercase tracking-wider mb-2 border border-[#FFC700]">
                <Sparkles className="w-3.5 h-3.5 text-[#D92323]" />
                Passo a Passo Fácil
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0D3B8E] tracking-tight">
                Como Funciona o kitGlobo 2027
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Simplicidade e organização pensadas para pais e alunos de Rio Branco
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="p-6 rounded-3xl bg-slate-50 border-2 border-[#0D3B8E]/15 hover:border-[#FFC700] transition-colors space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0D3B8E] text-[#FFC700] font-black text-sm flex items-center justify-center shadow-md border-2 border-[#FFC700]">
                  01
                </div>
                <h3 className="text-base font-black text-[#0D3B8E]">
                  Escolha o Colégio e Série
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Localize a escola do aluno e selecione a série ou turma correspondente. A lista exata recomendada pela coordenação pedagógica será carregada.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-3xl bg-slate-50 border-2 border-[#0D3B8E]/15 hover:border-[#FFC700] transition-colors space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0D3B8E] text-[#FFC700] font-black text-sm flex items-center justify-center shadow-md border-2 border-[#FFC700]">
                  02
                </div>
                <h3 className="text-base font-black text-[#0D3B8E]">
                  Kit Fechado + Extras Opcionais
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O kit vem fechado com todos os itens obrigatórios. Adicione itens extras como mochila com rodinhas, estojo 100 pens ou calculadora com um só clique.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-3xl bg-slate-50 border-2 border-[#FFC700] hover:border-[#0D3B8E] transition-colors space-y-3 bg-amber-50/40">
                <div className="w-11 h-11 rounded-2xl bg-[#FFC700] text-[#0D3B8E] font-black text-sm flex items-center justify-center shadow-md border-2 border-[#0D3B8E]">
                  03
                </div>
                <h3 className="text-base font-black text-[#0D3B8E]">
                  Agende a Retirada sem Fila
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Escolha o dia e horário para retirar o kit selado na Papelaria Globo no Centro. Simule seu troco para pagamento em dinheiro ou pague via PIX.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Store Pickup Banner */}
        <section className="py-12 max-w-6xl mx-auto px-4">
          <div className="bg-gradient-to-r from-[#09265E] via-[#0D3B8E] to-[#09265E] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#FFC700] text-white">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center">
              <div className="md:col-span-7 p-6 sm:p-10 space-y-4">
                <div className="inline-flex items-center gap-2 bg-[#FFC700] text-[#0D3B8E] text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  <Store className="w-3.5 h-3.5 text-[#D92323]" />
                  <span>Balcão Oficial de Retirada em Rio Branco</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Retire seu kit pronto no centro de Rio Branco
                </h2>

                <div className="space-y-2 text-xs sm:text-sm text-blue-100">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#FFC700] shrink-0 mt-0.5" />
                    <span>
                      <strong>Endereço:</strong> Av. Brasil, 452 - Centro, Rio Branco - AC (Próximo à Praça Plácido de Castro).
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-[#FFC700] shrink-0 mt-0.5" />
                    <span>
                      <strong>Horário de Atendimento:</strong> Segunda a Sexta: 07:30 às 18:00 · Sábados: 08:00 às 13:00.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-[#FFC700] shrink-0 mt-0.5" />
                    <span>
                      <strong>Disk Entregas:</strong> (68) 3302-0245 / 3026-1082 · WhatsApp: (68) 99282-7744.
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href="https://api.whatsapp.com/send?phone=556892827744"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#09265E] hover:bg-[#0D3B8E] text-white font-bold text-xs rounded-xl shadow-md border-2 border-[#FFC700] transition-transform active:scale-95"
                  >
                    <Phone className="w-4 h-4 text-[#FFC700]" />
                    <span>Tirar Dúvidas no WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      if (escolas.length > 0) handleSelectEscola(escolas[0]);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] font-black text-xs rounded-xl shadow-md border-2 border-[#FFC700] transition-transform active:scale-95 cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-[#D92323]" />
                    <span>Ver Kits das Escolas</span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-5 h-64 md:h-full min-h-[260px] relative">
                <img
                  src={STORE_IMAGE}
                  alt="Balcão de retirada Papelaria Globo Rio Branco"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0D3B8E] via-transparent to-transparent md:block hidden" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer com Direitos Autorais da Papelaria Globo Ltda, CNPJ, Endereço e @kikomelodoAcre */}
      <footer className="bg-[#0D3B8E] text-white border-t-4 border-[#FFC700] py-8 text-xs">
        <div className="max-w-6xl mx-auto px-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-[#D92323] font-black text-xs tracking-wider">PAPELARIA</span>
                <span className="font-black text-white text-base">GLOBO</span>
                <span className="bg-[#FFC700] text-[#0D3B8E] text-[10px] font-black px-1.5 py-0.5 rounded">kitGlobo 2027</span>
              </div>
              <p className="text-blue-100 text-[11px]">
                Todos os direitos reservados à <strong>Papelaria Globo Ltda</strong> · CNPJ: <strong>04.123.456/0001-89</strong>
              </p>
              <p className="text-blue-200 text-[11px]">
                Endereço: Av. Brasil, 452 - Centro, Rio Branco - AC · CEP 69900-068 (Próximo à Praça Plácido de Castro)
              </p>
            </div>

            <div className="text-center md:text-right text-[11px] text-blue-200 space-y-0.5">
              <p className="font-black text-[#FFC700]">Disk Entregas: (68) 3302-0245 · (68) 3026-1082</p>
              <p className="text-white/80">WhatsApp Atendimento: (68) 99282-7744</p>
              <p className="text-blue-300">Ano Letivo 2027 · Rio Branco - Acre</p>
            </div>
          </div>

          {/* Linha Divisória e Assinatura do Webdesenvolvedor: @kikomelodoAcre */}
          <div className="pt-3 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between text-[11px] text-blue-200 gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>FCM Push Notifications:</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                  permission === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {permission === 'granted' ? 'Ativo (FCM Pronto)' : 'Aguardando Permissão'}
              </span>
              {permission !== 'granted' && (
                <button
                  onClick={() => {
                    requestPermission().then((t) => {
                      if (t) showToast('Notificações ativadas!', 'Token FCM gerado com sucesso.', 'success');
                    });
                  }}
                  className="px-2 py-0.5 bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] rounded text-[10px] font-bold cursor-pointer"
                >
                  Ativar Push
                </button>
              )}
              {fcmToken && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(fcmToken);
                    showToast('Token copiado!', fcmToken.slice(0, 20) + '...', 'info');
                  }}
                  className="underline text-[10px] text-blue-300 hover:text-white"
                  title={fcmToken}
                >
                  (Copiar Token FCM)
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 font-semibold text-white">
              <Code2 className="w-3.5 h-3.5 text-[#FFC700]" />
              <span>Webdesigner & Desenvolvedor:</span>
              <span className="text-[#FFC700] font-black bg-white/10 px-2.5 py-0.5 rounded-md">
                @kikomelodoAcre
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      {selectedEscola && (
        <KitModal
          escola={selectedEscola}
          turmas={turmasForSelectedSchool}
          kits={kits}
          isOpen={isKitModalOpen}
          onClose={() => setIsKitModalOpen(false)}
          onAddToCart={handleAddToCart}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        vendedores={vendedores}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onCheckout={handleCheckout}
      />

      <OrderConfirmationModal
        pedido={lastCompletedOrder}
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
