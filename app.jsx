import { useState, useEffect, useMemo, useReducer, useCallback } from "react";
import {
  LayoutDashboard, PlusCircle, FileText, Download, Trash2, Pencil,
  X, Check, ChevronDown, Search, Upload, AlertCircle, TrendingUp,
  TrendingDown, Wallet, Tag, Menu, Bell, LogOut, RefreshCw, Info
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from "recharts";
import * as XLSX from "xlsx";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Alimentação","Transporte","Saúde","Lazer","Educação",
  "Moradia","Vestuário","Tecnologia","Viagem","Outros"
];
const PAYMENT_METHODS = ["Crédito Personnalité","Débito","Pix","Dinheiro","Outros"];
const CAT_COLORS = {
  "Alimentação":"#EC7000","Transporte":"#c9a84c","Saúde":"#4CAF50",
  "Lazer":"#2196F3","Educação":"#9C27B0","Moradia":"#FF5722",
  "Vestuário":"#E91E63","Tecnologia":"#00BCD4","Viagem":"#8BC34A","Outros":"#9E9E9E"
};

// ─── KEYWORD CATEGORIZER ─────────────────────────────────────────────────────
const categorize = (desc) => {
  const d = desc.toUpperCase();
  if (/IFOOD|RAPPI|UBER.?EATS|MCDON|BURGER|PIZZA|REST|LANCH|PADARIA|MERCADO|SUPER|CARREFOUR|PÃO.?DE.?AÇÚCAR|EXTRA|HORTIFRUTI|STARBUCKS|CACAU/.test(d)) return "Alimentação";
  if (/UBER|99|TAXI|METRO|TREM|BUS|ONIBUS|PASSAGEM|SHELL|POSTO|IPIRANGA|BR.?DISTR|PETROB|AUTOPASS|BILHETE/.test(d)) return "Transporte";
  if (/FARMAC|DROGARIA|CLINICA|HOSPIT|MEDICO|PLANO.?SAUDE|AMIL|UNIMED|SULAMERICA|HAPVIDA|BRADESC.?SAUDE/.test(d)) return "Saúde";
  if (/NETFLIX|SPOTIFY|STEAM|CINEMA|TEATRO|SHOW|CLUBE|BAR|BALADA|AMAZON.?PRIME|DISNEY|HBO|GLOBOPLAY/.test(d)) return "Lazer";
  if (/ESCOLA|FACUL|CURSO|UDEMY|COURSERA|LIVRO|LIVRARIA|SARAIVA|CULTURA|ALURA|FIAP|USP|UNICAMP/.test(d)) return "Educação";
  if (/ALUGUEL|CONDOMIN|LUZ|AGUA|GAS|INTERNET|CLARO|VIVO|TIM|OI|NET|ENEL|SABESP|COMGAS/.test(d)) return "Moradia";
  if (/ZARA|RENNER|MARISA|RIACHUELO|C&A|HERING|SHEIN|NIKE|ADIDAS|AREZZO|LOJAS/.test(d)) return "Vestuário";
  if (/AMAZON|AMERICANAS|MAGAZINE|SUBMARINO|SHOPEE|MERCADO.?LIVRE|SAMSUNG|APPLE|KABUM|PICHAU/.test(d)) return "Tecnologia";
  if (/HOTEL|AIRBNB|LATAM|GOL|AZUL|RYANAIR|BOOKING|TRIVAGO|DECOLAR|PASSAG/.test(d)) return "Viagem";
  return "Outros";
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const generateMockData = () => {
  const now = new Date();
  const data = [];
  const descs = [
    ["IFOOD*RESTAURANTE","Alimentação"],["UBER TRIP","Transporte"],
    ["NETFLIX.COM","Lazer"],["FARMACIA DROGASIL","Saúde"],
    ["AMAZON.COM.BR","Tecnologia"],["SUPERMERCADO EXTRA","Alimentação"],
    ["POSTO IPIRANGA","Transporte"],["SPOTIFY","Lazer"],
    ["ACADEMIA SMART FIT","Saúde"],["CURSO UDEMY","Educação"],
    ["ZARA BRASIL","Vestuário"],["LATAM AIRLINES","Viagem"],
    ["STARBUCKS","Alimentação"],["99 APP","Transporte"],
    ["ALUGUEL MENSAL","Moradia"],["CLARO INTERNET","Moradia"],
  ];
  for (let m = 5; m >= 0; m--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const numTx = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < numTx; i++) {
      const [desc, cat] = descs[Math.floor(Math.random() * descs.length)];
      const day = 1 + Math.floor(Math.random() * 28);
      data.push({
        id: `mock-${m}-${i}`,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day).toISOString().split("T")[0],
        description: desc,
        category: cat,
        amount: parseFloat((20 + Math.random() * 480).toFixed(2)),
        payment: "Crédito Personnalité",
        origin: "exemplo"
      });
    }
  }
  return data.sort((a,b) => b.date.localeCompare(a.date));
};

// ─── REDUCER ─────────────────────────────────────────────────────────────────
const initialState = {
  transactions: [],
  loaded: false
};
function reducer(state, action) {
  let next;
  switch(action.type) {
    case "LOAD": return { ...state, transactions: action.payload, loaded: true };
    case "ADD":
      next = [action.payload, ...state.transactions];
      localStorage.setItem("fin_transactions", JSON.stringify(next));
      return { ...state, transactions: next };
    case "ADD_MANY":
      next = [...action.payload, ...state.transactions];
      localStorage.setItem("fin_transactions", JSON.stringify(next));
      return { ...state, transactions: next };
    case "DELETE":
      next = state.transactions.filter(t => t.id !== action.payload);
      localStorage.setItem("fin_transactions", JSON.stringify(next));
      return { ...state, transactions: next };
    case "UPDATE":
      next = state.transactions.map(t => t.id === action.payload.id ? action.payload : t);
      localStorage.setItem("fin_transactions", JSON.stringify(next));
      return { ...state, transactions: next };
    default: return state;
  }
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in
          ${t.type === "success" ? "bg-green-600 text-white" : t.type === "error" ? "bg-red-600 text-white" : "bg-amber-500 text-black"}`}>
          {t.type === "success" ? <Check size={16}/> : <AlertCircle size={16}/>}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ transactions }) {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());

  const filtered = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.date + "T12:00:00");
      return d.getMonth() === selMonth && d.getFullYear() === selYear;
    }), [transactions, selMonth, selYear]);

  const prevFiltered = useMemo(() => {
    const prev = new Date(selYear, selMonth - 1, 1);
    return transactions.filter(t => {
      const d = new Date(t.date + "T12:00:00");
      return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
    });
  }, [transactions, selMonth, selYear]);

  const total = filtered.reduce((s,t) => s + t.amount, 0);
  const prevTotal = prevFiltered.reduce((s,t) => s + t.amount, 0);
  const variation = prevTotal > 0 ? ((total - prevTotal) / prevTotal * 100) : 0;

  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a,b) => b.value - a.value);
  }, [filtered]);

  const topCat = byCategory[0]?.name || "—";

  const monthly6 = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selYear, selMonth - i, 1);
      const m = d.getMonth(); const y = d.getFullYear();
      const sum = transactions.filter(t => {
        const td = new Date(t.date + "T12:00:00");
        return td.getMonth() === m && td.getFullYear() === y;
      }).reduce((s,t) => s + t.amount, 0);
      result.push({ month: d.toLocaleString("pt-BR", { month: "short" }), total: parseFloat(sum.toFixed(2)) });
    }
    return result;
  }, [transactions, selMonth, selYear]);

  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2">
          <select value={selMonth} onChange={e => setSelMonth(+e.target.value)}
            className="bg-transparent text-[#EC7000] font-semibold text-sm outline-none">
            {months.map((m,i) => <option key={i} value={i} className="bg-[#1e1e1e]">{m}</option>)}
          </select>
          <select value={selYear} onChange={e => setSelYear(+e.target.value)}
            className="bg-transparent text-[#EC7000] font-semibold text-sm outline-none">
            {[2023,2024,2025,2026].map(y => <option key={y} value={y} className="bg-[#1e1e1e]">{y}</option>)}
          </select>
        </div>
        <span className="text-xs text-[#666]">{filtered.length} transações no período</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total do mês", value: `R$ ${total.toLocaleString("pt-BR",{minimumFractionDigits:2})}`, icon: <Wallet size={18}/>, accent: "#EC7000" },
          { label: "vs. mês anterior", value: `${variation >= 0 ? "+" : ""}${variation.toFixed(1)}%`, icon: variation >= 0 ? <TrendingUp size={18}/> : <TrendingDown size={18}/>, accent: variation >= 0 ? "#ef4444" : "#22c55e" },
          { label: "Transações", value: filtered.length, icon: <FileText size={18}/>, accent: "#c9a84c" },
          { label: "Maior categoria", value: topCat, icon: <Tag size={18}/>, accent: CAT_COLORS[topCat] || "#9E9E9E" },
        ].map((k,i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#666] uppercase tracking-wider">{k.label}</span>
              <span style={{color: k.accent}}>{k.icon}</span>
            </div>
            <span className="text-lg font-bold text-white leading-tight">{k.value}</span>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[#999] mb-4 uppercase tracking-wider">Por Categoria</h3>
          {byCategory.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-[#555] text-sm">Sem dados no período</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                  {byCategory.map((e,i) => <Cell key={i} fill={CAT_COLORS[e.name] || "#9E9E9E"}/>)}
                </Pie>
                <Tooltip formatter={v => `R$ ${v.toLocaleString("pt-BR",{minimumFractionDigits:2})}`}
                  contentStyle={{background:"#1e1e1e",border:"1px solid #333",borderRadius:8,color:"#fff"}}/>
                <Legend formatter={v => <span style={{color:"#aaa",fontSize:11}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[#999] mb-4 uppercase tracking-wider">Últimos 6 Meses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly6} margin={{top:0,right:0,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a"/>
              <XAxis dataKey="month" tick={{fill:"#666",fontSize:11}}/>
              <YAxis tick={{fill:"#666",fontSize:11}}/>
              <Tooltip formatter={v => `R$ ${v.toLocaleString("pt-BR",{minimumFractionDigits:2})}`}
                contentStyle={{background:"#1e1e1e",border:"1px solid #333",borderRadius:8,color:"#fff"}}/>
              <Bar dataKey="total" fill="#EC7000" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line chart */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[#999] mb-4 uppercase tracking-wider">Evolução de Gastos</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={monthly6} margin={{top:0,right:16,left:-20,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a"/>
            <XAxis dataKey="month" tick={{fill:"#666",fontSize:11}}/>
            <YAxis tick={{fill:"#666",fontSize:11}}/>
            <Tooltip formatter={v => `R$ ${v.toLocaleString("pt-BR",{minimumFractionDigits:2})}`}
              contentStyle={{background:"#1e1e1e",border:"1px solid #333",borderRadius:8,color:"#fff"}}/>
            <Line type="monotone" dataKey="total" stroke="#c9a84c" strokeWidth={2.5}
              dot={{fill:"#c9a84c",r:4}} activeDot={{r:6}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[#999] mb-4 uppercase tracking-wider">Detalhamento por Categoria</h3>
          <div className="space-y-2">
            {byCategory.map((c,i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: CAT_COLORS[c.name]}}/>
                <span className="text-sm text-[#aaa] w-28 flex-shrink-0">{c.name}</span>
                <div className="flex-1 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${(c.value/total*100).toFixed(0)}%`, background: CAT_COLORS[c.name]}}/>
                </div>
                <span className="text-sm font-semibold text-white w-24 text-right">
                  R$ {c.value.toLocaleString("pt-BR",{minimumFractionDigits:2})}
                </span>
                <span className="text-xs text-[#555] w-10 text-right">{(c.value/total*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADD TRANSACTION ──────────────────────────────────────────────────────────
function AddTransaction({ dispatch, addToast }) {
  const empty = { date: new Date().toISOString().split("T")[0], description: "", category: "Alimentação", amount: "", payment: "Crédito Personnalité" };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const handleSubmit = () => {
    if (!form.description || !form.amount || !form.date) { addToast("Preencha todos os campos obrigatórios", "error"); return; }
    const tx = { ...form, amount: parseFloat(form.amount), id: editing || `tx-${Date.now()}`, origin: "manual" };
    dispatch({ type: editing ? "UPDATE" : "ADD", payload: tx });
    addToast(editing ? "Transação atualizada!" : "Transação adicionada!", "success");
    setForm(empty); setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#999] mb-4 uppercase tracking-wider">
          {editing ? "Editar Transação" : "Nova Transação"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#666] mb-1 block">Data *</label>
            <input type="date" value={form.date} onChange={e => setForm({...form,date:e.target.value})}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#EC7000]"/>
          </div>
          <div>
            <label className="text-xs text-[#666] mb-1 block">Valor (R$) *</label>
            <input type="number" step="0.01" min="0" placeholder="0,00" value={form.amount}
              onChange={e => setForm({...form,amount:e.target.value})}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#EC7000]"/>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-[#666] mb-1 block">Descrição *</label>
            <input type="text" placeholder="Ex: Supermercado Extra" value={form.description}
              onChange={e => setForm({...form,description:e.target.value})}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#EC7000]"/>
          </div>
          <div>
            <label className="text-xs text-[#666] mb-1 block">Categoria</label>
            <select value={form.category} onChange={e => setForm({...form,category:e.target.value})}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#EC7000]">
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#666] mb-1 block">Forma de Pagamento</label>
            <select value={form.payment} onChange={e => setForm({...form,payment:e.target.value})}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#EC7000]">
              {PAYMENT_METHODS.map(p => <option key={p} value={p} className="bg-[#111]">{p}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={handleSubmit}
            className="flex-1 bg-[#EC7000] hover:bg-[#d46500] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
            <PlusCircle size={16}/>{editing ? "Salvar" : "Adicionar"}
          </button>
          {editing && (
            <button onClick={() => { setForm(empty); setEditing(null); }}
              className="px-4 bg-[#2a2a2a] hover:bg-[#333] text-white py-2.5 rounded-lg text-sm transition-colors">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TRANSACTIONS LIST ────────────────────────────────────────────────────────
function TransactionsList({ transactions, dispatch, addToast }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Todas");
  const [filterMonth, setFilterMonth] = useState("todos");
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const months = useMemo(() => {
    const s = new Set(transactions.map(t => t.date.slice(0,7)));
    return ["todos", ...Array.from(s).sort().reverse()];
  }, [transactions]);

  const filtered = useMemo(() =>
    transactions.filter(t =>
      (filterCat === "Todas" || t.category === filterCat) &&
      (filterMonth === "todos" || t.date.startsWith(filterMonth)) &&
      (t.description.toLowerCase().includes(search.toLowerCase()))
    ), [transactions, filterCat, filterMonth, search]);

  const startEdit = (t) => { setEditId(t.id); setEditForm({...t}); };
  const saveEdit = () => {
    dispatch({ type: "UPDATE", payload: { ...editForm, amount: parseFloat(editForm.amount) } });
    addToast("Atualizado!", "success"); setEditId(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 flex-1 min-w-40">
          <Search size={14} className="text-[#555]"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            className="bg-transparent text-sm text-white outline-none w-full placeholder-[#444]"/>
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="Todas">Todas categorias</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none">
          {months.map(m => <option key={m} value={m} className="bg-[#111]">{m === "todos" ? "Todos os meses" : m}</option>)}
        </select>
      </div>

      <div className="text-xs text-[#555]">{filtered.length} transações</div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 text-center text-[#555] text-sm">
            Nenhuma transação encontrada
          </div>
        )}
        {filtered.map(t => (
          <div key={t.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            {editId === t.id ? (
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm,date:e.target.value})}
                  className="col-span-2 bg-[#111] border border-[#333] rounded-lg px-2 py-1.5 text-white text-sm outline-none"/>
                <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm,description:e.target.value})}
                  className="col-span-2 bg-[#111] border border-[#333] rounded-lg px-2 py-1.5 text-white text-sm outline-none"/>
                <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm,amount:e.target.value})}
                  className="bg-[#111] border border-[#333] rounded-lg px-2 py-1.5 text-white text-sm outline-none"/>
                <select value={editForm.category} onChange={e => setEditForm({...editForm,category:e.target.value})}
                  className="bg-[#111] border border-[#333] rounded-lg px-2 py-1.5 text-white text-sm outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                </select>
                <div className="col-span-2 flex gap-2">
                  <button onClick={saveEdit} className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-sm flex items-center justify-center gap-1"><Check size={14}/>Salvar</button>
                  <button onClick={() => setEditId(null)} className="flex-1 bg-[#2a2a2a] text-white py-1.5 rounded-lg text-sm flex items-center justify-center gap-1"><X size={14}/>Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{background: CAT_COLORS[t.category]}}/>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{t.description}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-[#555]">{new Date(t.date+"T12:00:00").toLocaleDateString("pt-BR")}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{background: CAT_COLORS[t.category]+"22", color: CAT_COLORS[t.category]}}>{t.category}</span>
                    {t.origin === "fatura" && <span className="text-xs text-[#c9a84c]">fatura</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-white text-sm">R$ {t.amount.toLocaleString("pt-BR",{minimumFractionDigits:2})}</span>
                  <button onClick={() => startEdit(t)} className="text-[#555] hover:text-[#c9a84c] transition-colors"><Pencil size={15}/></button>
                  <button onClick={() => { dispatch({type:"DELETE",payload:t.id}); addToast("Excluído","success"); }}
                    className="text-[#555] hover:text-red-500 transition-colors"><Trash2 size={15}/></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── INVOICE READER ───────────────────────────────────────────────────────────
function InvoiceReader({ dispatch, addToast }) {
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("upload");

  const parseFaturaText = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const results = [];
    const dateRegex = /(\d{2}\/\d{2})/;
    const valueRegex = /R?\$?\s?([\d\.]+,\d{2})/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dateMatch = line.match(dateRegex);
      const valueMatch = line.match(valueRegex);

      if (dateMatch && valueMatch) {
        const rawValue = valueMatch[1].replace(/\./g,"").replace(",",".");
        const amount = parseFloat(rawValue);
        if (amount <= 0 || amount > 50000) continue;

        const desc = line.replace(dateRegex,"").replace(valueRegex,"").trim()
          .replace(/^[-–—\s]+/,"").trim();
        if (desc.length < 3) continue;

        const [day, month] = dateMatch[1].split("/");
        const year = new Date().getFullYear();
        const dateStr = `${year}-${month.padStart(2,"0")}-${day.padStart(2,"0")}`;

        results.push({
          id: `fat-${Date.now()}-${i}`,
          date: dateStr,
          description: desc,
          category: categorize(desc),
          amount,
          payment: "Crédito Personnalité",
          origin: "fatura"
        });
      }
    }
    return results;
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) { addToast("Por favor selecione um arquivo PDF", "error"); return; }

    setLoading(true);
    try {
      if (window.pdfjsLib) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          fullText += content.items.map(i => i.str).join(" ") + "\n";
        }
        const parsed = parseFaturaText(fullText);
        if (parsed.length === 0) {
          addToast("Nenhuma transação encontrada. Tente um PDF de fatura Itaú Personnalité.", "error");
        } else {
          setPreview(parsed);
          setStep("preview");
        }
      } else {
        addToast("PDF.js não carregado. Use o modo de exemplo abaixo.", "error");
      }
    } catch(err) {
      addToast("Erro ao ler o PDF: " + err.message, "error");
    }
    setLoading(false);
  };

  const loadExample = () => {
    const ex = [
      { id:`fat-ex-1`, date:"2026-05-10", description:"IFOOD*RESTAURANTE JPN", category:"Alimentação", amount:52.90, payment:"Crédito Personnalité", origin:"fatura" },
      { id:`fat-ex-2`, date:"2026-05-12", description:"UBER TRIP SAO PAULO", category:"Transporte", amount:34.50, payment:"Crédito Personnalité", origin:"fatura" },
      { id:`fat-ex-3`, date:"2026-05-14", description:"NETFLIX.COM", category:"Lazer", amount:39.90, payment:"Crédito Personnalité", origin:"fatura" },
      { id:`fat-ex-4`, date:"2026-05-15", description:"FARMACIA DROGASIL", category:"Saúde", amount:87.30, payment:"Crédito Personnalité", origin:"fatura" },
      { id:`fat-ex-5`, date:"2026-05-18", description:"SUPERMERCADO EXTRA", category:"Alimentação", amount:312.75, payment:"Crédito Personnalité", origin:"fatura" },
      { id:`fat-ex-6`, date:"2026-05-20", description:"POSTO IPIRANGA SP", category:"Transporte", amount:180.00, payment:"Crédito Personnalité", origin:"fatura" },
      { id:`fat-ex-7`, date:"2026-05-22", description:"AMAZON.COM.BR", category:"Tecnologia", amount:299.00, payment:"Crédito Personnalité", origin:"fatura" },
    ];
    setPreview(ex); setStep("preview");
  };

  const importAll = () => {
    dispatch({ type: "ADD_MANY", payload: preview });
    addToast(`${preview.length} transações importadas!`, "success");
    setPreview([]); setStep("upload");
  };

  const removePreview = (id) => setPreview(p => p.filter(t => t.id !== id));

  return (
    <div className="space-y-4">
      {step === "upload" && (
        <>
          <div className="bg-[#1a1a1a] border-2 border-dashed border-[#333] rounded-xl p-8 text-center hover:border-[#EC7000] transition-colors">
            <Upload size={32} className="mx-auto mb-3 text-[#EC7000]"/>
            <p className="text-sm text-white font-medium mb-1">Upload da Fatura Itaú Personnalité</p>
            <p className="text-xs text-[#555] mb-4">Arquivo PDF da fatura do cartão</p>
            <label className="cursor-pointer bg-[#EC7000] hover:bg-[#d46500] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              {loading ? "Lendo PDF..." : "Selecionar PDF"}
              <input type="file" accept=".pdf" onChange={handleFile} className="hidden"/>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#2a2a2a]"/>
            <span className="text-xs text-[#555]">ou</span>
            <div className="flex-1 h-px bg-[#2a2a2a]"/>
          </div>

          <button onClick={loadExample}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#c9a84c] text-[#c9a84c] py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <Info size={16}/>Carregar fatura de exemplo
          </button>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <p className="text-xs text-[#666] font-semibold mb-2 uppercase tracking-wider">Como funciona</p>
            <ul className="text-xs text-[#555] space-y-1.5">
              <li>• Baixe sua fatura Itaú Personnalité em PDF pelo app ou internet banking</li>
              <li>• Faça upload do arquivo aqui</li>
              <li>• O app extrai automaticamente todos os lançamentos</li>
              <li>• Revise e confirme antes de importar</li>
            </ul>
          </div>
        </>
      )}

      {step === "preview" && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{preview.length} transações encontradas</h3>
            <button onClick={() => { setPreview([]); setStep("upload"); }}
              className="text-xs text-[#555] hover:text-white flex items-center gap-1"><X size={12}/>Cancelar</button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {preview.map(t => (
              <div key={t.id} className="bg-[#111] border border-[#2a2a2a] rounded-lg p-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: CAT_COLORS[t.category]}}/>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{t.description}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#555]">{new Date(t.date+"T12:00:00").toLocaleDateString("pt-BR")}</span>
                    <span className="text-xs px-1 py-0.5 rounded" style={{background: CAT_COLORS[t.category]+"22", color: CAT_COLORS[t.category]}}>{t.category}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-white flex-shrink-0">R$ {t.amount.toLocaleString("pt-BR",{minimumFractionDigits:2})}</span>
                <button onClick={() => removePreview(t.id)} className="text-[#444] hover:text-red-500 transition-colors flex-shrink-0"><X size={14}/></button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={importAll}
              className="flex-1 bg-[#EC7000] hover:bg-[#d46500] text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
              <Check size={16}/>Importar {preview.length} transações
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
function ExportPanel({ transactions, addToast }) {
  const exportXLSX = () => {
    if (transactions.length === 0) { addToast("Nenhuma transação para exportar", "error"); return; }

    const wb = XLSX.utils.book_new();

    // Sheet 1 - all
    const ws1Data = [["Data","Descrição","Categoria","Valor (R$)","Pagamento","Origem"],
      ...transactions.map(t => [t.date, t.description, t.category, t.amount, t.payment, t.origin])];
    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    ws1["!cols"] = [{wch:12},{wch:40},{wch:16},{wch:12},{wch:22},{wch:10}];
    XLSX.utils.book_append_sheet(wb, ws1, "Transações");

    // Sheet 2 - by category
    const catMap = {};
    transactions.forEach(t => {
      if (!catMap[t.category]) catMap[t.category] = { total: 0, count: 0 };
      catMap[t.category].total += t.amount;
      catMap[t.category].count++;
    });
    const grandTotal = transactions.reduce((s,t) => s + t.amount, 0);
    const ws2Data = [["Categoria","Total (R$)","% do Total","Qtd. Transações"],
      ...Object.entries(catMap).sort((a,b) => b[1].total - a[1].total)
        .map(([cat,d]) => [cat, d.total.toFixed(2), ((d.total/grandTotal)*100).toFixed(1)+"%", d.count])];
    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    ws2["!cols"] = [{wch:16},{wch:14},{wch:12},{wch:18}];
    XLSX.utils.book_append_sheet(wb, ws2, "Por Categoria");

    // Sheet 3 - monthly
    const monthMap = {};
    transactions.forEach(t => {
      const m = t.date.slice(0,7);
      monthMap[m] = (monthMap[m] || 0) + t.amount;
    });
    const ws3Data = [["Mês","Total (R$)"],
      ...Object.entries(monthMap).sort().map(([m,v]) => [m, v.toFixed(2)])];
    const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
    XLSX.utils.book_append_sheet(wb, ws3, "Mensal");

    XLSX.writeFile(wb, `financeiro_${new Date().toISOString().slice(0,10)}.xlsx`);
    addToast("Planilha exportada!", "success");
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-900/30 rounded-xl flex items-center justify-center">
            <Download size={20} className="text-green-400"/>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Exportar para Excel</p>
            <p className="text-xs text-[#555]">{transactions.length} transações no total</p>
          </div>
        </div>
        <p className="text-xs text-[#666] mb-4">Gera um arquivo .xlsx com 3 abas: todas as transações, resumo por categoria e evolução mensal.</p>
        <button onClick={exportXLSX}
          className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
          <Download size={16}/>Baixar Planilha Excel
        </button>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
        <p className="text-xs text-[#666] font-semibold mb-3 uppercase tracking-wider">O arquivo conterá</p>
        <div className="space-y-2">
          {[
            ["Aba 1","Todas as transações com data, descrição, categoria e valor"],
            ["Aba 2","Resumo por categoria com total e % de participação"],
            ["Aba 3","Evolução mensal dos gastos totais"],
          ].map(([tab, desc]) => (
            <div key={tab} className="flex gap-3">
              <span className="text-xs font-bold text-[#EC7000] w-10 flex-shrink-0">{tab}</span>
              <span className="text-xs text-[#555]">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toasts, setToasts] = useState([]);
  const [showInstall, setShowInstall] = useState(true);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("fin_transactions");
    if (saved) {
      try { dispatch({ type: "LOAD", payload: JSON.parse(saved) }); }
      catch { dispatch({ type: "LOAD", payload: generateMockData() }); }
    } else {
      dispatch({ type: "LOAD", payload: generateMockData() });
    }
  }, []);

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20}/> },
    { id: "add", label: "Adicionar", icon: <PlusCircle size={20}/> },
    { id: "list", label: "Extrato", icon: <FileText size={20}/> },
    { id: "invoice", label: "Fatura", icon: <Upload size={20}/> },
    { id: "export", label: "Exportar", icon: <Download size={20}/> },
  ];

  const titles = { dashboard: "Dashboard", add: "Nova Transação", list: "Extrato", invoice: "Importar Fatura", export: "Exportar Excel" };

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col lg:flex-row" style={{fontFamily:"'DM Sans', sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .animate-fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }
      `}</style>

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#0d0d0d] border-r border-[#1e1e1e] p-4 min-h-screen">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-[#EC7000] rounded-lg flex items-center justify-center text-white font-bold text-xs">P</div>
            <span className="text-sm font-bold text-white">Personnalité</span>
          </div>
          <span className="text-xs text-[#444]">Gestão Financeira</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {nav.map(n => (
            <button key={n.id} onClick={() => setActiveTab(n.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left
                ${activeTab === n.id ? "bg-[#EC7000] text-white" : "text-[#555] hover:text-white hover:bg-[#1a1a1a]"}`}>
              {n.icon}<span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="text-xs text-[#333] px-2 mt-4">{state.transactions.length} transações salvas</div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-[#0d0d0d] border-b border-[#1e1e1e] px-4 py-3 flex items-center justify-between lg:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-6 h-6 bg-[#EC7000] rounded flex items-center justify-center text-white font-bold text-xs">P</div>
          </div>
          <h1 className="text-sm font-semibold text-white lg:text-base">{titles[activeTab]}</h1>
          <div className="flex items-center gap-2 text-xs text-[#444]">
            <span className="hidden sm:block">{new Date().toLocaleDateString("pt-BR",{weekday:"short",day:"numeric",month:"short"})}</span>
          </div>
        </header>

        {/* Install banner */}
        {showInstall && (
          <div className="bg-[#1a0f00] border-b border-[#EC7000]/30 px-4 py-2 flex items-center gap-3">
            <Info size={14} className="text-[#EC7000] flex-shrink-0"/>
            <p className="text-xs text-[#aaa] flex-1">
              <span className="text-[#EC7000] font-semibold">Instalar como app: </span>
              Android: menu ⋮ → "Adicionar à tela inicial" · iOS: botão ↑ → "Adicionar à Tela de Início"
            </p>
            <button onClick={() => setShowInstall(false)} className="text-[#555] hover:text-white flex-shrink-0"><X size={14}/></button>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto pb-24 lg:pb-6">
          {!state.loaded ? (
            <div className="flex items-center justify-center h-40 text-[#555]">
              <RefreshCw size={20} className="animate-spin mr-2"/>Carregando...
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && <Dashboard transactions={state.transactions}/>}
              {activeTab === "add" && <AddTransaction dispatch={dispatch} addToast={addToast}/>}
              {activeTab === "list" && <TransactionsList transactions={state.transactions} dispatch={dispatch} addToast={addToast}/>}
              {activeTab === "invoice" && <InvoiceReader dispatch={dispatch} addToast={addToast}/>}
              {activeTab === "export" && <ExportPanel transactions={state.transactions} addToast={addToast}/>}
            </>
          )}
        </main>
      </div>

      {/* Bottom nav - mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-[#1e1e1e] flex z-40">
        {nav.map(n => (
          <button key={n.id} onClick={() => setActiveTab(n.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors
              ${activeTab === n.id ? "text-[#EC7000]" : "text-[#444]"}`}>
            {n.icon}
            <span className="text-[10px]">{n.label}</span>
          </button>
        ))}
      </nav>

      <Toast toasts={toasts}/>
    </div>
  );
}
