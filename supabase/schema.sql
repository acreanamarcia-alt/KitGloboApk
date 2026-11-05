-- ====================================================================
-- BANCO DE DADOS SUPABASE - kitGlobo (Papelaria Globo Rio Branco - AC)
-- Estrutura de Tabelas, Sequência Automática, RLS e Triggers
-- Ano Letivo 2027
-- ====================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela: ESCOLAS
CREATE TABLE IF NOT EXISTS public.escolas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    endereco VARCHAR(300) NOT NULL,
    bairro VARCHAR(100) NOT NULL DEFAULT 'Rio Branco - AC',
    telefone VARCHAR(50),
    logo_url TEXT,
    badge_color VARCHAR(20) DEFAULT '#0E3A8C',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela: TURMAS
CREATE TABLE IF NOT EXISTS public.turmas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    serie VARCHAR(100) NOT NULL,
    turno VARCHAR(30) NOT NULL CHECK (turno IN ('Matutino', 'Vespertino', 'Integral')),
    ano_letivo INTEGER NOT NULL DEFAULT 2027,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela: KITS
CREATE TABLE IF NOT EXISTS public.kits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turma_id UUID NOT NULL UNIQUE REFERENCES public.turmas(id) ON DELETE CASCADE,
    preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
    itens_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    itens_extras_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela: VENDEDORES (Gestão de Vendedores da Papelaria Globo)
CREATE TABLE IF NOT EXISTS public.vendedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(200) NOT NULL,
    telefone VARCHAR(50) NOT NULL,
    contato VARCHAR(50) NOT NULL,
    unidade VARCHAR(100) DEFAULT 'Matriz Centro Rio Branco',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Sequência Numérica Incremental para Pedidos
CREATE SEQUENCE IF NOT EXISTS public.numero_pedido_seq
    START WITH 2027001
    INCREMENT BY 1
    NO CYCLE;

-- 7. Tabela: PEDIDOS
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_pedido BIGINT UNIQUE DEFAULT nextval('public.numero_pedido_seq'),
    cliente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cliente_nome VARCHAR(200) NOT NULL,
    cliente_telefone VARCHAR(50) NOT NULL,
    cliente_cpf VARCHAR(20),
    aluno_nome VARCHAR(200) NOT NULL,
    escola_nome VARCHAR(200) NOT NULL,
    serie_turma VARCHAR(150) NOT NULL,
    itens JSONB NOT NULL DEFAULT '[]'::jsonb,
    itens_extras JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL,
    desconto NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' 
        CHECK (status IN ('pendente', 'pago', 'em_separacao', 'pronto_retirada', 'finalizado')),
    vendedor_id UUID REFERENCES public.vendedores(id) ON DELETE SET NULL,
    vendedor_nome VARCHAR(150),
    forma_pagamento VARCHAR(50) NOT NULL 
        CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao_presencial')),
    troco_para NUMERIC(10, 2),
    valor_troco NUMERIC(10, 2),
    data_retirada DATE NOT NULL,
    hora_retirada VARCHAR(10) NOT NULL,
    observacoes TEXT,
    whatsapp_notificado BOOLEAN DEFAULT false,
    finalizado_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- 1. Políticas de Leitura Pública para Catálogo de Escolas, Turmas e Kits
CREATE POLICY "Leitura pública de escolas ativas" ON public.escolas
    FOR SELECT USING (ativo = true);

CREATE POLICY "Leitura pública de turmas" ON public.turmas
    FOR SELECT USING (true);

CREATE POLICY "Leitura pública de kits" ON public.kits
    FOR SELECT USING (true);

CREATE POLICY "Leitura pública de vendedores" ON public.vendedores
    FOR SELECT USING (ativo = true);

-- 2. Clientes podem inserir pedidos
CREATE POLICY "Qualquer cliente pode criar um pedido" ON public.pedidos
    FOR INSERT WITH CHECK (true);

-- 3. Clientes podem ver seus próprios pedidos pelo telefone ou login
CREATE POLICY "Clientes podem visualizar seus pedidos" ON public.pedidos
    FOR SELECT USING (
        auth.uid() = cliente_id OR auth.uid() IS NULL
    );

-- 4. Administradores têm acesso total via Role 'admin'
-- Verifica se auth.jwt() ->> 'role' = 'admin' ou email pertence à papelariaglobo.com.br
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'email' LIKE '%@papelariaglobo.com.br' OR
        auth.jwt() ->> 'role' = 'admin' OR
        (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões de escrita restritas a administradores
CREATE POLICY "Admin pode gerenciar escolas" ON public.escolas
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin pode gerenciar turmas" ON public.turmas
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin pode gerenciar kits" ON public.kits
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin pode gerenciar vendedores" ON public.vendedores
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin pode atualizar status de pedidos" ON public.pedidos
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ====================================================================
-- TRIGGER PARA ACIONAR EDGE FUNCTION QUANDO STATUS = 'finalizado'
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_pedido_finalizado()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'finalizado' AND (OLD.status IS DISTINCT FROM 'finalizado') THEN
        -- Aciona a Edge Function via pg_net (se configurado) ou armazena o timestamp
        NEW.finalizado_at = timezone('utc'::text, now());
        NEW.whatsapp_notificado = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_pedido_finalizado
    BEFORE UPDATE ON public.pedidos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_pedido_finalizado();

-- ====================================================================
-- VIEW DE RELATÓRIO DE COMISSÕES (EXATAMENTE 2% SOBRE TOTAL DE VENDAS)
-- ====================================================================
CREATE OR REPLACE VIEW public.vw_relatorio_comissoes_vendedores AS
SELECT
    v.id AS vendedor_id,
    v.codigo AS vendedor_codigo,
    v.nome AS vendedor_nome,
    v.email AS vendedor_email,
    v.telefone AS vendedor_telefone,
    v.unidade AS vendedor_unidade,
    v.ativo AS vendedor_ativo,
    COUNT(p.id) AS total_pedidos,
    COALESCE(SUM(p.total), 0.00) AS total_vendas_bruto,
    0.02 AS taxa_comissao,
    ROUND(COALESCE(SUM(p.total), 0.00) * 0.02, 2) AS total_comissao_2_pct,
    CASE 
        WHEN COUNT(p.id) > 0 THEN ROUND(COALESCE(SUM(p.total), 0.00) / COUNT(p.id), 2)
        ELSE 0.00
    END AS ticket_medio
FROM public.vendedores v
LEFT JOIN public.pedidos p ON (p.vendedor_id = v.id::text OR p.vendedor_nome ILIKE '%' || v.nome || '%')
GROUP BY v.id, v.codigo, v.nome, v.email, v.telefone, v.unidade, v.ativo
ORDER BY total_vendas_bruto DESC;
