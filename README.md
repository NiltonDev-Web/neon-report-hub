# 📱 NeonTech Reports — Relatórios Técnicos Offline

**Versão Atual: 1.1.0** | **Android versionCode: 2**

Aplicativo móvel e web para geração de **relatórios técnicos com fotos**, dados de clientes e equipamentos. Funciona **100% offline**, salva todos os dados na memória do próprio celular e exporta relatórios formatados diretamente em **PDF**, prontos para envio via WhatsApp ou E-mail.

---

## 🌟 Novidades da Versão 1.1.0

- 📄 **Geração de PDF por Equipamento Individual**:
  - Agora é possível emitir laudos técnicos focados exclusivamente em uma única máquina, contendo o cabeçalho oficial, dados do cliente, laudo do equipamento selecionado, suas fotos e campo de assinaturas.
- ⚡ **Botão Direto no Card do Equipamento**:
  - Cada equipamento no editor possui o botão dedicado `PDF do Equipamento` para emissão imediata em 1 clique.
- 📑 **Novo Painel de Exportação (`PdfExportDialog`)**:
  - Ao clicar no botão principal `GERAR PDF`, é exibido um modal moderno com opções para:
    1. **Relatório Geral Completo**: unifica todos os equipamentos em um único documento.
    2. **Relatório por Equipamento Individual**: lista interativa com os equipamentos cadastrados para exportação individual.
    3. **Gerar Todos Separados**: gera automaticamente um PDF para cada equipamento em lote.
- 🚀 **Atalho Rápido na Tela Inicial**:
  - Cada card de relatório na tela inicial agora possui um botão direto `PDF` para exportação rápida sem precisar abrir o editor.
- 🔄 **Atualização Segura sem Perda de Dados**:
  - O instalador Android foi atualizado para `versionCode 2` mantendo a assinatura e o `applicationId` (`com.neontech.reports`), garantindo que o Android preserve 100% dos dados salvos no celular ao atualizar.

---

## 🚀 Tecnologias Aplicadas

O projeto une tecnologias modernas de desenvolvimento web à capacidade de compilação nativa para dispositivos móveis:

| Camada | Tecnologia | O que faz no projeto? |
| :--- | :--- | :--- |
| **Interface & Lógica** | **React 18 + TypeScript** | Cria a interface interativa com tipagem segura e componentização modular. |
| **Estilização** | **Tailwind CSS + shadcn/ui** | Design responsivo, moderno (estilo neon) e otimizado para celulares. |
| **Plataforma Mobile** | **Capacitor (Ionic)** | Converte a aplicação React em um aplicativo **Android nativo (`.apk`)**. |
| **Banco Local (Offline)** | **IndexedDB (`idb-keyval`)** | Armazena todos os relatórios, fotos e dados localmente no celular sem precisar de internet ou servidor. |
| **Geração de PDF** | **jsPDF** | Renderiza e monta o documento de relatório técnico no padrão A4 diretamente no aparelho. |
| **Integração Nativa** | **Capacitor Filesystem & Share** | Salva o PDF na pasta do celular e abre a tela nativa do Android para compartilhar via WhatsApp, Drive, etc. |
| **Compressão de Imagens** | **HTML5 Canvas API** | Redimensiona e compacta fotos tiradas pela câmera para não sobrecarregar a memória do aparelho. |

---

## 💡 Como o Aplicativo Funciona

1. **Funcionamento 100% Local e Offline:**
   - Nenhum dado depende de servidores externos ou conexão com a internet.
   - Os relatórios e fotos ficam salvos no banco de dados local do celular (**IndexedDB**).

2. **Criação do Relatório:**
   - Dados do cliente com máscara automática de **CPF/CNPJ**.
   - Data do serviço editável e identificação do técnico responsável.
   - Lista dinâmica de equipamentos com diagnósticos, peças trocadas e status (Operacional, Atenção, Crítico, Inoperante).

3. **Captura e Otimização de Fotos:**
   - Aciona a câmera do celular diretamente pelo aplicativo.
   - Reduz automaticamente o tamanho da imagem antes de salvar, economizando espaço e acelerando a geração do PDF.

4. **Exportação e Compartilhamento de PDF:**
   - **Relatório Completo**: gera um documento unificado contendo o cabeçalho técnico, dados do cliente e todos os equipamentos com diagnósticos e fotos.
   - **Relatório Individual por Equipamento**: gera um PDF exclusivo para o equipamento selecionado (com seus dados cadastrais, laudo e fotos específicas), ideal para enviar laudos individuais para cada máquina ou setor.
   - **Geração Direta no Card**: cada equipamento possui seu próprio botão "PDF do Equipamento" para emissão em 1 clique.
   - **Geração em Lote**: opção para gerar e baixar todos os relatórios individuais de uma só vez ("Gerar Todos Separados").
   - No celular, aciona o menu nativo do Android para envio imediato via WhatsApp, E-mail ou Drive.

5. **Backup de Segurança:**
   - Permite exportar e importar todos os dados salvos em um arquivo `.json` a qualquer momento.

---

## 📂 Estrutura do Projeto

```text
neon-report-hub/
├── NeonTech_Reports_v1.1.0_Atualizacao.apk  # APK de atualização pronto para instalar no celular
│
├── android/                 # Projeto nativo Android compilável no Android Studio
│   ├── app/
│   │   ├── src/main/AndroidManifest.xml  # Permissões de câmera e armazenamento
│   │   └── build/outputs/apk/debug/      # Local onde o app-debug.apk é gerado
│   └── local.properties     # Configuração do caminho do Android SDK
│
├── src/
│   ├── components/          # Componentes visuais
│   │   ├── AppHeader.tsx         # Cabeçalho com backup e navegação
│   │   ├── EquipmentCard.tsx     # Card de equipamento com fotos e botão de PDF individual
│   │   ├── PdfExportDialog.tsx   # Modal de escolha de exportação (Completo / Por Equipamento)
│   │   └── StorageUsagePanel.tsx # Indicador visual de consumo do IndexedDB
│   ├── lib/
│   │   ├── pdf.ts           # Geração de PDF (completo ou por equipamento) e nativo Share
│   │   ├── storage.ts       # Gravação local (IndexedDB) e backup JSON
│   │   ├── image.ts         # Compressão automática de fotos
│   │   └── utils.ts         # Utilitários e máscaras (CPF/CNPJ)
│   ├── pages/
│   │   ├── Reports.tsx      # Tela inicial: lista de relatórios, backups e exportação rápida
│   │   └── ReportEditor.tsx # Formulário de edição completa do relatório
│   ├── types/
│   │   └── report.ts        # Modelos de dados e tipos TypeScript
│   ├── App.tsx              # Roteamento e provedores
│   └── main.tsx             # Ponto de entrada React
│
├── capacitor.config.ts      # Configuração do Capacitor para Android
├── package.json             # Dependências, scripts e versão (1.1.0)
└── vite.config.ts           # Configuração de build do Vite
```

---

## 🛠️ Como Executar e Gerar o Aplicativo

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **Android Studio** e **Android SDK** (instalados no computador)
- **Java JDK** (versão 17 ou 21)

---

### 1. Testar no Navegador (Modo de Desenvolvimento)

Para testar e programar na tela do computador:
```powershell
npm install
npm run dev
```
O projeto abrirá no endereço: `http://localhost:8080`.

---

### 2. Como Gerar o Arquivo `.APK` para o Celular

Sempre que fizer alterações no código e quiser gerar uma nova versão para Android, execute os seguintes passos no terminal:

```powershell
# Passo 1: Compilar o código React para produção
npm run build

# Passo 2: Sincronizar os arquivos web com o projeto Android
npx cap sync

# Passo 3: Entrar na pasta android e compilar o APK instalador
cd android
.\gradlew.bat assembleDebug
```

Após o término da compilação com a mensagem **`BUILD SUCCESSFUL`**, o instalador `.apk` estará gerado em:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

### 3. Abrindo no Android Studio (Interface Visual)

Se preferir utilizar a interface do Android Studio:
1. Abra o **Android Studio**.
2. Clique em **File > Open** e selecione a pasta:
   ```
   neon-report-hub/android
   ```
3. No menu superior, vá em:
   **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Quando finalizar, clique em **locate** na notificação que surgir para abrir o arquivo gerado.

---

## 📲 Como Instalar ou Atualizar no Celular Android

### 🔄 Como Atualizar SEM Perder as Informações Já Salvas:

> [!IMPORTANT]
> **NÃO DESINSTALE O APLICATIVO ANTERIOR DO CELULAR!**
> O Android foi configurado com o mesmo `applicationId` (`com.neontech.reports`) e chave de assinatura, com versão incremental (`versionCode: 2`, `versionName: "1.1.0"`). Quando você instala o novo `.apk` por cima da versão existente, o sistema operacional realiza uma **atualização em lote** e preserva **100% de todos os relatórios, clientes, equipamentos e fotos salvos no IndexedDB**.

#### Passo a passo da atualização:

1. **(Opcional - Medida de Segurança adicional)**:
   - No celular, abra o aplicativo atual e toque no botão **`Backup`** na tela inicial para baixar uma cópia de segurança em arquivo `.json`.
2. **Copie o arquivo APK atualizado para o celular**:
   - Utilize o arquivo [`NeonTech_Reports_v1.1.0_Atualizacao.apk`](./NeonTech_Reports_v1.1.0_Atualizacao.apk) presente na raiz deste projeto (ou o `app-debug.apk` da pasta `android/app/build/outputs/apk/debug/`).
   - Envie para o aparelho via WhatsApp, Telegram, Google Drive ou cabo USB.
3. **Inicie a instalação**:
   - No celular, toque no arquivo `.apk`.
   - O Android reconhecerá a versão anterior e exibirá a seguinte mensagem nativa:
     > *"Deseja instalar uma atualização para este app? Seus dados existentes não serão perdidos."*
   - Toque em **`Atualizar`** (ou **`Instalar`**).
4. **Pronto**:
   - Abra o **NeonTech Reports**. Todos os relatórios anteriores continuarão salvos e disponíveis, e as novas funcionalidades de geração de PDF por equipamento individual estarão prontas para uso.
