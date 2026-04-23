# NeonTech Reports

Aplicativo web **mobile-first** para geração de **relatórios técnicos** com fotos, dados de cliente e equipamentos. Visual neon (azul elétrico + verde lima), funciona offline e salva tudo localmente no aparelho.

🌐 **Live:** https://neon-report-maker.lovable.app

---

## ✨ Funcionalidades

- 📋 Criação e edição de relatórios técnicos completos
- 👤 Cadastro de cliente (nome, CPF/CNPJ, contato, endereço)
- ⚙️ Múltiplos equipamentos por relatório com status (Operacional / Atenção / Crítico / Inoperante)
- 📸 Captura de fotos pela câmera do celular com **compressão automática**
- 💾 Armazenamento 100% local via **IndexedDB** (funciona offline)
- 📊 Painel de monitoramento de uso de armazenamento com alertas
- 📤 Exportar / importar backup em JSON
- 📄 Geração de **PDF** profissional + impressão direta
- 💡 Autosave a cada edição
- 📱 Otimizações mobile: imagens menores, animações reduzidas, lazy loading

---

## 🛠️ Tecnologias

| Categoria | Stack |
|-----------|-------|
| **Framework** | React 18 + TypeScript 5 |
| **Build** | Vite 5 (SWC) |
| **Estilo** | Tailwind CSS v3 + design tokens HSL semânticos |
| **UI** | shadcn/ui + Radix UI |
| **Roteamento** | React Router v6 |
| **Estado servidor** | TanStack Query |
| **Persistência local** | IndexedDB via `idb-keyval` |
| **PDF** | jsPDF (carregado sob demanda) |
| **Ícones** | lucide-react |
| **Notificações** | sonner |
| **Testes** | Vitest |
| **Backend** | — (100% client-side) |

---

## 🚀 Como rodar localmente

```bash
# 1. Clonar o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Instalar dependências
npm install        # ou bun install

# 3. Rodar em modo desenvolvimento
npm run dev        # http://localhost:8080

# 4. Build de produção
npm run build

# 5. Pré-visualizar build
npm run preview

# 6. Rodar testes
npm test
```

---

## 📐 Passo a passo do desenvolvimento

O app foi construído de forma incremental no Lovable, na seguinte ordem:

### 1. Definição da identidade visual
- Paleta neon: **azul elétrico** (`--neon-blue`) + **verde lima** (`--neon-lime`)
- Tipografia futurista: **Orbitron** (display) + **Rajdhani** (corpo)
- Tokens HSL semânticos em `src/index.css` e `tailwind.config.ts` (gradientes, glows, sombras)

### 2. Modelagem de dados (`src/types/report.ts`)
- Tipos `Report`, `Client`, `Equipment`
- Enum de status com labels e cores associadas

### 3. Camada de persistência (`src/lib/storage.ts`)
- CRUD baseado em `idb-keyval` com prefixo `report:`
- Funções de **export/import JSON** para backup
- Geração de IDs únicos

### 4. Estrutura de rotas e layout
- `src/App.tsx` com `BrowserRouter`
- Páginas: `Reports` (lista), `ReportEditor` (edição), `NotFound`
- Componentes globais: `AppHeader`, `NavLink`, `ErrorBoundary`

### 5. Tela inicial / lista de relatórios (`src/pages/Reports.tsx`)
- Grid de cards com busca, contagem de equipamentos e data
- Botões de novo relatório, exportar e importar backup

### 6. Editor de relatórios (`src/pages/ReportEditor.tsx`)
- Formulário com seções: cabeçalho, cliente, equipamentos, observações
- **Autosave** com debounce de 800ms
- Adição/remoção dinâmica de equipamentos

### 7. Card de equipamento (`src/components/EquipmentCard.tsx`)
- Campos técnicos: marca, modelo, série, patrimônio, diagnóstico, ação, peças
- Upload de fotos via input `capture="environment"` (câmera do celular)
- Miniaturas com `loading="lazy"` e botão de remoção

### 8. Compressão de imagens (`src/lib/image.ts`)
- Detecção de mobile via `userAgent` + viewport
- Redimensionamento via `<canvas>` para JPEG (mais leve no IndexedDB)
- Qualidade adaptativa: **0.65 / 900px** mobile, **0.78 / 1280px** desktop

### 9. Geração de PDF (`src/lib/pdf.ts`)
- jsPDF carregado dinamicamente via `import()` — reduz bundle inicial
- Layout A4 com header neon, dados do cliente, blocos por equipamento, fotos em grid 2 colunas, assinaturas e numeração de páginas

### 10. Otimizações mobile
- CSS adaptativo desabilitando `grid-bg`, *flicker* e *glows* abaixo de 768px
- Botões de excluir foto sempre visíveis em telas touch
- Lazy loading de imagens

### 11. Painel de uso de armazenamento (`src/components/StorageUsagePanel.tsx`)
- API `navigator.storage.estimate()`
- Barra de progresso com 3 níveis (verde / amarelo / vermelho)
- Alertas orientando backup quando o uso passa de 75% / 90%

### 12. Polimento
- ErrorBoundary global
- Toaster para feedbacks (salvar, excluir, gerar PDF, importar)
- Estilos `print-area` / `no-print` para impressão limpa via `window.print()`

---

## 📁 Estrutura principal

```
src/
├── components/         # AppHeader, EquipmentCard, StorageUsagePanel, ui/
├── hooks/              # use-mobile, use-toast
├── lib/                # storage.ts, image.ts, pdf.ts, utils.ts
├── pages/              # Reports.tsx, ReportEditor.tsx, NotFound.tsx
├── types/              # report.ts
├── index.css           # design tokens HSL + classes neon
└── main.tsx
```

---

## ✅ Checklist de release

Antes de clicar em **Publish**, valide cada item abaixo no preview (de preferência também em um celular real):

### 💾 Autosave
- [ ] Editar título de um relatório → aguardar ~1s → recarregar a página → alterações persistem
- [ ] Editar campo de cliente (nome, telefone) → recarregar → dados mantidos
- [ ] Adicionar equipamento + preencher campos → recarregar → equipamento e campos mantidos
- [ ] Indicador no header alterna entre **"Salvar"** (sujo) e **"Salvo"** (limpo) corretamente

### 📤 Export / Import
- [ ] Botão **Exportar backup** baixa um arquivo `.json` válido contendo `version`, `exportedAt` e `reports`
- [ ] Abrir o JSON em um editor → estrutura legível, fotos em base64 presentes
- [ ] Limpar IndexedDB (DevTools → Application → IndexedDB → Delete database) → app abre vazio
- [ ] Botão **Importar backup** restaura todos os relatórios com fotos intactas
- [ ] Toast de sucesso aparece com a contagem correta de relatórios importados

### 📄 PDF e impressão
- [ ] Tentar gerar PDF sem nome do cliente → erro amigável
- [ ] Tentar gerar PDF sem equipamentos → erro amigável
- [ ] PDF gerado abre corretamente, contém: cabeçalho neon, dados do cliente, todos os equipamentos, status, fotos em grid, observações, assinaturas, numeração de páginas
- [ ] Quebra de página funciona quando há muitos equipamentos/fotos
- [ ] Nome do arquivo segue padrão `<titulo>_<id>.pdf`
- [ ] **Imprimir** (`Ctrl/Cmd+P`) oculta botões (`no-print`) e mostra apenas o conteúdo do relatório

### 📵 Offline
- [ ] Carregar o app uma vez online
- [ ] DevTools → Network → **Offline** (ou ativar modo avião no celular)
- [ ] Recarregar → app continua abrindo
- [ ] Criar novo relatório, adicionar fotos e editar funciona offline
- [ ] Voltar online → dados continuam intactos (sem perda)

### 🗄️ IndexedDB e armazenamento
- [ ] DevTools → Application → IndexedDB → `keyval-store` contém chaves com prefixo `report:`
- [ ] **StorageUsagePanel** na home mostra uso atual em MB e porcentagem
- [ ] Botão de atualizar recalcula o uso
- [ ] Excluir um relatório → uso diminui após refresh do painel
- [ ] Simular alto uso (importar muitos relatórios) → barra muda para **amarelo (>75%)** e depois **vermelho (>90%)** com mensagens corretas
- [ ] Em navegador sem `navigator.storage.estimate` → fallback amigável aparece

### 📱 Mobile
- [ ] Abrir o preview no celular real → sem tela branca
- [ ] Tirar foto pela câmera (`capture="environment"`) funciona
- [ ] Fotos são comprimidas (verificar tamanho do JSON exportado)
- [ ] Animações pesadas e `grid-bg` desabilitados em telas <768px
- [ ] Botão de excluir foto sempre visível (sem depender de hover)

### 🧪 Build e qualidade
- [ ] `npm run build` finaliza sem erros nem warnings críticos
- [ ] `npm test` passa
- [ ] Console do navegador sem erros vermelhos no fluxo principal
- [ ] Rotas inválidas (`/qualquer-coisa`) abrem `NotFound`
- [ ] Refresh em `/report/:id` funciona (SPA fallback)

Quando todos os itens estiverem ✅, clique em **Publish** com tranquilidade.

---

## 📦 Deploy

Publicado automaticamente pela **Lovable**. Para republicar, abra o projeto no Lovable e clique em **Publish**.

## 📝 Licença

Projeto gerado com [Lovable](https://lovable.dev).
