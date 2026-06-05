# 💳 Personnalité Financeiro — PWA

App de gestão financeira pessoal com leitura de fatura Itaú Personnalité.

---

## 📁 Arquivos

```
financeiro-pwa/
├── index.html         ← Página principal (PWA wrapper)
├── app.jsx            ← App React completo
├── manifest.json      ← Configuração PWA (ícone, nome, cor)
├── service-worker.js  ← Cache offline
└── README.md          ← Este arquivo
```

---

## 🚀 Como hospedar GRATUITAMENTE em 2 minutos

### Opção 1 — Netlify Drop (mais fácil)

1. Acesse **https://app.netlify.com/drop**
2. Arraste a pasta `financeiro-pwa` inteira para a área indicada
3. Aguarde o upload (menos de 30 segundos)
4. Copie a URL gerada (ex: `https://amazing-name-123.netlify.app`)
5. Abra essa URL no celular → instale como PWA!

### Opção 2 — Vercel

1. Acesse **https://vercel.com** e faça login
2. Clique em "Add New → Project"
3. Faça upload da pasta ou conecte ao GitHub
4. Deploy automático

### Opção 3 — GitHub Pages

1. Crie um repositório público no GitHub
2. Faça upload dos arquivos
3. Vá em Settings → Pages → Branch: main
4. Acesse `https://seu-usuario.github.io/nome-do-repo`

---

## 📱 Instalar como app no celular

### Android (Chrome)
1. Abra a URL no Chrome
2. Toque no menu ⋮ (três pontos)
3. Selecione **"Adicionar à tela inicial"**
4. Confirme → pronto! Ícone aparece na tela inicial

### iOS (Safari)
1. Abra a URL no Safari
2. Toque no botão **Compartilhar** ↑ (na barra inferior)
3. Selecione **"Adicionar à Tela de Início"**
4. Confirme → pronto!

---

## ✨ Funcionalidades

- **Dashboard** — KPIs, gráfico de pizza por categoria, barras mensais, linha de evolução
- **Nova Transação** — Registro manual rápido com formulário otimizado para mobile
- **Extrato** — Lista completa com filtros, busca, edição e exclusão
- **Importar Fatura** — Upload PDF da fatura Itaú Personnalité com categorização automática
- **Exportar Excel** — Planilha .xlsx com 3 abas (transações, categorias, mensal)
- **Offline** — Funciona sem internet após primeira visita
- **Dados persistidos** — localStorage salva tudo entre sessões

---

## 🎨 Design

Tema escuro premium inspirado no Itaú Personnalité:
- Laranja Itaú `#EC7000`
- Dourado `#c9a84c`  
- Grafite `#111111`
- Tipografia DM Sans
