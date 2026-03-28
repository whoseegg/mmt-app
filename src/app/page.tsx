"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  STATUS_FLOW, EPISODES, STATUS_COLORS,
  type Performance, type Institution, type Document as DocRecord,
  type StaffAssignment, type Alert,
} from "@/lib/types";

// ─── Helpers ───
function fmt(n: number) { return n?.toLocaleString("ko-KR") ?? "0"; }
function diffDays(dateStr: string) {
  const d = new Date(dateStr); const now = new Date();
  now.setHours(0,0,0,0); d.setHours(0,0,0,0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

// ─── Login Screen ───
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError("로그인 실패: " + error.message); setLoading(false); }
    else onLogin();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-1">MMT</h1>
        <p className="text-sm text-slate-400 text-center mb-6">공연 관리 시스템</p>
        <div className="space-y-3">
          <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-300" />
          <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-300" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 bg-slate-800 text-white text-sm rounded-xl hover:bg-slate-700 transition-colors font-medium disabled:opacity-50">
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </div>
        <p className="text-xs text-slate-300 text-center mt-6">WhoseEgg Inc.</p>
      </div>
    </div>
  );
}

// ─── Badge Component ───
function Badge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS["상담중"];
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text} ${c.border} border`}><span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>{status}</span>;
}

// ─── Field Component ───
function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-300 outline-none" />
    </div>
  );
}

// ─── CheckItem Component ───
function CheckItem({ label, checked, onChange, sub }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; sub?: boolean;
}) {
  return (
    <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${checked ? "bg-green-50" : "bg-slate-50"} ${sub ? "ml-6" : ""}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded" />
      <span className={`text-sm ${checked ? "text-green-700 line-through" : "text-slate-700"}`}>{label}</span>
      {checked && <span className="ml-auto text-green-500 text-sm">✓</span>}
    </label>
  );
}

// ─── Pipeline Card ───
function PerfCard({ p, inst, onClick }: { p: Performance; inst?: Institution; onClick: () => void }) {
  const dd = diffDays(p.performance_date);
  const urgent = dd >= 0 && dd <= 2 && !["공연완료","정산완료"].includes(p.status);
  const name = inst?.name || "기관명 없음";
  return (
    <div onClick={onClick} className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${urgent ? "border-red-300 ring-1 ring-red-100" : "border-slate-200"}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-sm text-slate-800 truncate flex-1">{name}</h4>
        {urgent && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium ml-2 whitespace-nowrap">D-{dd}</span>}
      </div>
      <p className="text-xs text-slate-500 mb-2">{p.episode === "환경_푸른고래이야기" ? "🐋 푸른고래이야기" : "🎪 모두의놀이터"}</p>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{p.performance_date}</span>
        <span className="font-medium text-slate-700">{fmt(p.agreed_price)}원</span>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
        <span>{p.sessions}회차 · {p.audience_count}명</span>
        <span>{inst?.contact_name}</span>
      </div>
    </div>
  );
}

// ─── Alert Panel ───
function AlertPanel({ alerts, onClickAlert }: { alerts: Alert[]; onClickAlert: (id: string) => void }) {
  if (!alerts.length) return <div className="text-center py-8 text-slate-400 text-sm">오늘 처리할 알림이 없습니다</div>;
  const icons: Record<string, string> = { "자료발송": "📧", "리마인드": "📞", "정산": "💰", "계산서": "🧾" };
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={i} onClick={() => onClickAlert(a.performance_id)} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
          <span className="text-lg mt-0.5">{icons[a.alert_type] || "🔔"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{a.institution_name} {a.message}</p>
            <p className="text-xs text-slate-400 mt-0.5">{a.action_date}</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full whitespace-nowrap">{a.alert_type}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Pipeline View ───
function PipelineView({ performances, institutions, onClickCard }: {
  performances: Performance[]; institutions: Record<string, Institution>; onClickCard: (p: Performance) => void;
}) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4" style={{ minWidth: STATUS_FLOW.length * 260 }}>
        {STATUS_FLOW.map(status => {
          const items = performances.filter(p => p.status === status);
          const c = STATUS_COLORS[status];
          return (
            <div key={status} className="flex-1 min-w-[240px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                <span className="text-sm font-semibold text-slate-700">{status}</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className={`space-y-3 p-2 rounded-xl min-h-[200px] ${items.length ? "bg-slate-50/50" : "bg-slate-50/30 border border-dashed border-slate-200"}`}>
                {items.map(p => <PerfCard key={p.id} p={p} inst={institutions[p.institution_id]} onClick={() => onClickCard(p)} />)}
                {!items.length && <div className="text-center py-10 text-slate-300 text-xs">없음</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Calendar View ───
function CalendarView({ performances, institutions, month, setMonth, onClickCard }: {
  performances: Performance[]; institutions: Record<string, Institution>;
  month: Date; setMonth: (d: Date) => void; onClickCard: (p: Performance) => void;
}) {
  const year = month.getFullYear(); const m = month.getMonth();
  const firstDay = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  if (weeks.length && weeks[weeks.length - 1].length < 7) while (weeks[weeks.length - 1].length < 7) weeks[weeks.length - 1].push(null);

  const getPerfs = (day: number | null) => {
    if (!day) return [];
    const ds = `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return performances.filter(p => p.performance_date === ds);
  };
  const today = new Date();
  const isToday = (d: number | null) => d !== null && today.getFullYear() === year && today.getMonth() === m && today.getDate() === d;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonth(new Date(year, m - 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">◀</button>
        <h3 className="text-lg font-bold text-slate-800">{year}년 {m + 1}월</h3>
        <button onClick={() => setMonth(new Date(year, m + 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">▶</button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400 mb-2">
        {["일","월","화","수","목","금","토"].map(d => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-b-0 border-slate-100">
            {week.map((day, di) => {
              const perfs = getPerfs(day);
              return (
                <div key={di} className={`min-h-[80px] p-1 border-r last:border-r-0 border-slate-100 ${day ? "bg-white" : "bg-slate-50/50"} ${di === 0 ? "text-red-400" : di === 6 ? "text-blue-400" : ""}`}>
                  {day && <div className={`text-xs font-medium mb-1 px-1 ${isToday(day) ? "bg-slate-800 text-white w-5 h-5 rounded-full flex items-center justify-center" : ""}`}>{day}</div>}
                  {perfs.map(p => (
                    <div key={p.id} onClick={() => onClickCard(p)} className={`text-xs px-1.5 py-0.5 rounded mb-0.5 cursor-pointer truncate ${STATUS_COLORS[p.status]?.bg} ${STATUS_COLORS[p.status]?.text} hover:opacity-80`}>
                      {institutions[p.institution_id]?.name || "기관"}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Performance Detail Modal ───
function PerformanceDetail({ p, inst, onClose, onSave, onDelete }: {
  p: Performance; inst?: Institution; onClose: () => void;
  onSave: (perf: Partial<Performance>, institution?: Partial<Institution>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [tab, setTab] = useState("info");
  const [saving, setSaving] = useState(false);
  const [formP, setFormP] = useState({ ...p });
  const [formI, setFormI] = useState({ ...(inst || { name: "", address: "", contact_name: "", contact_email: "", contact_phone: "", site_memo: "" }) });
  const [staffList, setStaffList] = useState<StaffAssignment[]>([]);
  const [docList, setDocList] = useState<DocRecord[]>([]);
  const [newStaff, setNewStaff] = useState({ name: "", role: "", pay: "" });
  const [docLoading, setDocLoading] = useState(false);

  // Load staff & documents
  useEffect(() => {
    supabase.from("staff_assignments").select("*").eq("performance_id", p.id).order("created_at").then(({ data }) => setStaffList(data || []));
    supabase.from("documents").select("*").eq("performance_id", p.id).order("created_at", { ascending: false }).then(({ data }) => setDocList(data || []));
  }, [p.id]);

  const save = async (pUpdates?: Partial<Performance>, iUpdates?: Partial<Institution>) => {
    setSaving(true);
    const newP = { ...formP, ...pUpdates };
    const newI = { ...formI, ...iUpdates };
    setFormP(newP); setFormI(newI);
    await onSave(newP, newI);
    setSaving(false);
  };

  const changeStatus = async (direction: 1 | -1) => {
    const idx = STATUS_FLOW.indexOf(formP.status as typeof STATUS_FLOW[number]);
    const newIdx = idx + direction;
    if (newIdx >= 0 && newIdx < STATUS_FLOW.length) {
      await save({ status: STATUS_FLOW[newIdx] });
    }
  };

  const addStaff = async () => {
    if (!newStaff.name) return;
    const { data } = await supabase.from("staff_assignments").insert({
      performance_id: p.id, staff_name: newStaff.name, staff_role: newStaff.role,
      pay_amount: Number(newStaff.pay) || 0, is_paid: false,
    }).select().single();
    if (data) setStaffList([...staffList, data]);
    setNewStaff({ name: "", role: "", pay: "" });
  };

  const toggleStaffPaid = async (sa: StaffAssignment) => {
    await supabase.from("staff_assignments").update({ is_paid: !sa.is_paid }).eq("id", sa.id);
    setStaffList(staffList.map(s => s.id === sa.id ? { ...s, is_paid: !s.is_paid } : s));
  };

  const removeStaff = async (id: string) => {
    await supabase.from("staff_assignments").delete().eq("id", id);
    setStaffList(staffList.filter(s => s.id !== id));
  };

  const generateDoc = async (docType: "estimate" | "invoice") => {
    setDocLoading(true);
    try {
      const subtotal = formP.agreed_price;
      const vat = Math.round(subtotal * 0.1);
      const total = subtotal + vat;
      const docDate = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\./g, ". ").trim();

      // Generate document number
      const { data: numData } = await supabase.rpc("generate_doc_number", { p_doc_type: docType });
      const docNumber = numData || `#${new Date().toISOString().slice(2, 7).replace("-", "")}-01`;

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: docType, doc_number: docNumber,
          recipient: formI.name, doc_name: "MMT 공연", doc_date: docDate,
          item_name: formP.episode === "환경_푸른고래이야기" ? '"오토끼의 시간여행"_푸른고래이야기' : '"오토끼의 시간여행"_모두의놀이터',
          item_unit: "회", item_qty: formP.sessions, item_price: Math.round(subtotal / formP.sessions),
          item_amount: subtotal, subtotal, vat, total, notes: "",
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      // Save to DB
      const { data: docData } = await supabase.from("documents").insert({
        performance_id: p.id, doc_type: docType, doc_number: docNumber,
        version: (docList.filter(d => d.doc_type === docType).length) + 1,
        google_doc_id: result.google_doc_id, sent_to_email: formI.contact_email,
      }).select().single();
      if (docData) setDocList([docData, ...docList]);

      // Download PDF
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${result.pdf_base64}`;
      link.download = result.pdf_filename;
      link.click();

      alert(`${docType === "estimate" ? "견적서" : "거래명세서"} 생성 완료! PDF가 다운로드됩니다.`);
    } catch (err) {
      alert("문서 생성 실패: " + (err instanceof Error ? err.message : "알 수 없는 오류"));
    }
    setDocLoading(false);
  };

  const sendDocByEmail = async (doc: DocRecord) => {
    if (!formI.contact_email) return alert("담당자 이메일이 없습니다.");
    try {
      // Re-export PDF from Google Drive
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: doc.doc_type, doc_number: doc.doc_number,
          recipient: formI.name, doc_name: "MMT 공연",
          doc_date: new Date(doc.created_at).toLocaleDateString("ko-KR"),
          item_name: formP.episode === "환경_푸른고래이야기" ? '"오토끼의 시간여행"_푸른고래이야기' : '"오토끼의 시간여행"_모두의놀이터',
          item_unit: "회", item_qty: formP.sessions,
          item_price: Math.round(formP.agreed_price / formP.sessions),
          item_amount: formP.agreed_price,
          subtotal: formP.agreed_price, vat: Math.round(formP.agreed_price * 0.1),
          total: Math.round(formP.agreed_price * 1.1), notes: "",
        }),
      });
      const docResult = await res.json();

      const typeName = doc.doc_type === "estimate" ? "견적서" : "거래명세서";
      const emailRes = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: formI.contact_email,
          subject: `[후즈에그] ${formI.name} ${typeName} 송부드립니다 (${doc.doc_number})`,
          html: `<p>${formI.contact_name || ""} 선생님 안녕하세요,</p><p>㈜후즈에그입니다.</p><p>요청하신 ${typeName}를 첨부드리오니 확인 부탁드립니다.</p><p>감사합니다.</p><br/><p>㈜후즈에그<br/>이상묵 대표<br/>T. 010-6201-9326<br/>E. mugi8014@gmail.com</p>`,
          attachments: docResult.pdf_base64 ? [{ filename: docResult.pdf_filename, content: docResult.pdf_base64 }] : [],
        }),
      });
      const emailResult = await emailRes.json();
      if (emailResult.success) {
        await supabase.from("documents").update({ sent_to_email: formI.contact_email, sent_at: new Date().toISOString() }).eq("id", doc.id);
        setDocList(docList.map(d => d.id === doc.id ? { ...d, sent_to_email: formI.contact_email, sent_at: new Date().toISOString() } : d));
        alert(`${typeName}가 ${formI.contact_email}로 발송되었습니다.`);
      } else throw new Error(emailResult.error);
    } catch (err) {
      alert("이메일 발송 실패: " + (err instanceof Error ? err.message : "알 수 없는 오류"));
    }
  };

  const tabs = [
    { key: "info", label: "기본 정보" },
    { key: "settlement", label: "정산 관리" },
    { key: "staff", label: "투입 인력" },
    { key: "docs", label: "문서 이력" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-8 pb-8 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{formI.name || "기관명 없음"}</h2>
              <p className="text-sm text-slate-500 mt-1">{formP.performance_date} · {formP.sessions}회차 · {formP.episode === "환경_푸른고래이야기" ? "🐋 푸른고래이야기" : "🎪 모두의놀이터"}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl p-1">✕</button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Badge status={formP.status} />
            <div className="flex gap-1 ml-auto">
              <button onClick={() => changeStatus(-1)} disabled={STATUS_FLOW.indexOf(formP.status as typeof STATUS_FLOW[number]) === 0 || saving} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors">← 이전</button>
              <button onClick={() => changeStatus(1)} disabled={STATUS_FLOW.indexOf(formP.status as typeof STATUS_FLOW[number]) === STATUS_FLOW.length - 1 || saving} className="text-xs px-2.5 py-1 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-30 transition-colors">다음 →</button>
            </div>
          </div>
          <div className="flex gap-1 mt-4 bg-slate-100 rounded-lg p-0.5">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 text-xs py-2 rounded-md font-medium transition-all ${tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {tab === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="기관명" value={formI.name} onChange={v => setFormI({ ...formI, name: v })} />
                <Field label="담당자" value={formI.contact_name} onChange={v => setFormI({ ...formI, contact_name: v })} />
                <Field label="이메일" value={formI.contact_email} onChange={v => setFormI({ ...formI, contact_email: v })} />
                <Field label="연락처" value={formI.contact_phone || ""} onChange={v => setFormI({ ...formI, contact_phone: v })} />
                <Field label="주소" value={formI.address} onChange={v => setFormI({ ...formI, address: v })} />
                <Field label="공연일" value={formP.performance_date} type="date" onChange={v => setFormP({ ...formP, performance_date: v })} />
                <Field label="시간" value={formP.time_slot || ""} onChange={v => setFormP({ ...formP, time_slot: v })} />
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">에피소드</label>
                  <select value={formP.episode} onChange={e => setFormP({ ...formP, episode: e.target.value as Performance["episode"] })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none bg-white">
                    {EPISODES.map(ep => <option key={ep} value={ep}>{ep}</option>)}
                  </select>
                </div>
                <Field label="회차" value={formP.sessions} type="number" onChange={v => setFormP({ ...formP, sessions: Number(v) || 1 })} />
                <Field label="관람 인원" value={formP.audience_count} type="number" onChange={v => setFormP({ ...formP, audience_count: Number(v) || 0 })} />
                <Field label="공연 금액 (원)" value={formP.agreed_price} type="number" onChange={v => setFormP({ ...formP, agreed_price: Number(v) || 0 })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">현장 메모 (주차, 엘리베이터, 층수, 공간 등)</label>
                <textarea value={formI.site_memo || ""} onChange={e => setFormI({ ...formI, site_memo: e.target.value })} rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none resize-none" placeholder="주차 가능여부, 엘리베이터, 층수, 공간 사이즈, 천장 높이 등" />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={formP.needs_criminal_check} onChange={e => setFormP({ ...formP, needs_criminal_check: e.target.checked })} className="rounded" />
                범죄경력조회 필요
              </label>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">공연 후 특이사항</label>
                <textarea value={formP.post_notes || ""} onChange={e => setFormP({ ...formP, post_notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none resize-none" placeholder="공연 후 메모" />
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => save()} disabled={saving} className="flex-1 py-2.5 text-sm text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors font-medium disabled:opacity-50">
                  {saving ? "저장 중..." : "변경사항 저장"}
                </button>
                <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(p.id); onClose(); } }} className="px-4 py-2.5 text-sm text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">삭제</button>
              </div>
            </div>
          )}

          {tab === "settlement" && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500">공급가액</span><p className="font-semibold text-slate-800 mt-1">{fmt(formP.agreed_price)}원</p></div>
                  <div><span className="text-slate-500">VAT (10%)</span><p className="font-semibold text-slate-800 mt-1">{fmt(Math.round(formP.agreed_price * 0.1))}원</p></div>
                  <div className="col-span-2 pt-3 border-t border-slate-200"><span className="text-slate-500">합계 (VAT 포함)</span><p className="font-bold text-lg text-amber-600 mt-1">{fmt(Math.round(formP.agreed_price * 1.1))}원</p></div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">결제 방식</label>
                <select value={formP.payment_method || ""} onChange={e => save({ payment_method: (e.target.value || null) as Performance["payment_method"] })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none bg-white">
                  <option value="">미정</option>
                  <option value="카드">카드</option>
                  <option value="계좌이체">계좌이체</option>
                </select>
              </div>
              <div className="space-y-2">
                <CheckItem label="입금 확인" checked={formP.is_paid} onChange={v => save({ is_paid: v })} />
                <CheckItem label="세금계산서 필요" checked={formP.tax_invoice_needed} onChange={v => save({ tax_invoice_needed: v })} />
                {formP.tax_invoice_needed && <CheckItem label="세금계산서 발급 완료 (홈택스)" checked={formP.tax_invoice_issued} onChange={v => save({ tax_invoice_issued: v })} sub />}
              </div>
            </div>
          )}

          {tab === "staff" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">총괄 관리자만 열람/관리 가능한 영역입니다.</p>
              {staffList.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{s.staff_name} <span className="text-xs text-slate-400 ml-1">{s.staff_role}</span></p>
                    <p className="text-xs text-slate-500 mt-0.5">{fmt(s.pay_amount)}원</p>
                  </div>
                  <button onClick={() => toggleStaffPaid(s)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${s.is_paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {s.is_paid ? "정산완료" : "미정산"}
                  </button>
                  <button onClick={() => removeStaff(s.id)} className="text-slate-300 hover:text-red-400 text-sm transition-colors">✕</button>
                </div>
              ))}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                <input value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="이름" className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none" />
                <input value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} placeholder="역할" className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none" />
                <input value={newStaff.pay} onChange={e => setNewStaff({ ...newStaff, pay: e.target.value })} placeholder="페이" type="number" className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none" />
                <button onClick={addStaff} className="bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors">추가</button>
              </div>
            </div>
          )}

          {tab === "docs" && (
            <div className="space-y-4">
              {docList.length > 0 ? docList.map(d => (
                <div key={d.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="text-lg">{d.doc_type === "estimate" ? "📄" : "📋"}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{d.doc_type === "estimate" ? "견적서" : "거래명세서"} {d.doc_number}</p>
                    <p className="text-xs text-slate-400">v{d.version} · {new Date(d.created_at).toLocaleDateString("ko-KR")} {d.sent_at ? `· 발송완료 ${new Date(d.sent_at).toLocaleDateString("ko-KR")}` : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    {d.google_doc_id && <a href={`https://docs.google.com/document/d/${d.google_doc_id}/edit`} target="_blank" rel="noreferrer" className="text-xs px-2 py-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors">Google Docs</a>}
                    {!d.sent_at && <button onClick={() => sendDocByEmail(d)} className="text-xs px-2 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">메일 발송</button>}
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 text-slate-300">
                  <p className="text-3xl mb-2">📄</p>
                  <p className="text-sm">발행된 문서가 없습니다</p>
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => generateDoc("estimate")} disabled={docLoading} className="flex-1 text-xs py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 font-medium transition-colors disabled:opacity-50">
                  {docLoading ? "생성 중..." : "견적서(Estimate) 생성"}
                </button>
                <button onClick={() => generateDoc("invoice")} disabled={docLoading} className="flex-1 text-xs py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium transition-colors disabled:opacity-50">
                  {docLoading ? "생성 중..." : "거래명세서(Invoice) 생성"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── New Performance Modal ───
function NewPerformanceForm({ onSave, onClose }: { onSave: (inst: Partial<Institution>, perf: Partial<Performance>) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", contact_name: "", contact_email: "", contact_phone: "", address: "", site_memo: "",
    episode: EPISODES[0] as string, date: "", sessions: 1, time: "10:00", audience: 0, price: 0,
  });
  const [saving, setSaving] = useState(false);
  const up = (k: string, v: string | number) => setForm({ ...form, [k]: v });

  const submit = async () => {
    if (!form.name || !form.date) return alert("기관명과 공연일은 필수입니다.");
    setSaving(true);
    await onSave(
      { name: form.name, contact_name: form.contact_name, contact_email: form.contact_email, contact_phone: form.contact_phone, address: form.address, site_memo: form.site_memo },
      { episode: form.episode as Performance["episode"], performance_date: form.date, sessions: form.sessions, time_slot: form.time, audience_count: form.audience, agreed_price: form.price, status: "상담중" }
    );
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-12 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl mx-4 mb-8" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">새 공연 등록</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <Field label="기관명 *" value={form.name} onChange={v => up("name", v)} />
            <Field label="담당자명" value={form.contact_name} onChange={v => up("contact_name", v)} />
            <Field label="이메일" value={form.contact_email} onChange={v => up("contact_email", v)} />
            <Field label="연락처" value={form.contact_phone} onChange={v => up("contact_phone", v)} />
            <Field label="주소" value={form.address} onChange={v => up("address", v)} />
            <Field label="공연일 *" value={form.date} type="date" onChange={v => up("date", v)} />
            <Field label="시간" value={form.time} onChange={v => up("time", v)} />
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">에피소드</label>
              <select value={form.episode} onChange={e => up("episode", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none bg-white">
                {EPISODES.map(ep => <option key={ep} value={ep}>{ep}</option>)}
              </select>
            </div>
            <Field label="회차" value={form.sessions} type="number" onChange={v => up("sessions", Number(v))} />
            <Field label="관람 인원" value={form.audience} type="number" onChange={v => up("audience", Number(v))} />
            <Field label="공연 금액 (원)" value={form.price} type="number" onChange={v => up("price", Number(v))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">현장 메모</label>
            <textarea value={form.site_memo} onChange={e => up("site_memo", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none resize-none" placeholder="주차, 엘리베이터, 층수, 공간 등" />
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">취소</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 text-sm text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors font-medium disabled:opacity-50">
            {saving ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───
export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [institutions, setInstitutions] = useState<Record<string, Institution>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [view, setView] = useState("pipeline");
  const [selected, setSelected] = useState<Performance | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [month, setMonth] = useState(new Date());
  const [sideOpen, setSideOpen] = useState(true);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_ev, session) => setAuthed(!!session));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    const { data: perfs } = await supabase.from("performances").select("*").order("performance_date", { ascending: true });
    const { data: insts } = await supabase.from("institutions").select("*");
    const { data: alertData } = await supabase.from("v_alerts").select("*");
    if (perfs) setPerformances(perfs);
    if (insts) {
      const map: Record<string, Institution> = {};
      insts.forEach((i: Institution) => { map[i.id] = i; });
      setInstitutions(map);
    }
    if (alertData) setAlerts(alertData);
  }, []);

  useEffect(() => { if (authed) loadData(); }, [authed, loadData]);

  // CRUD handlers
  const handleSavePerformance = async (perf: Partial<Performance>, institution?: Partial<Institution>) => {
    if (perf.id) {
      const { id, institution: _inst, created_at: _ca, updated_at: _ua, ...updateData } = perf as Performance & { institution?: Institution };
      await supabase.from("performances").update(updateData).eq("id", id);
    }
    if (institution && perf.institution_id) {
      const { id: _id, created_at: _ca, updated_at: _ua, ...instUpdate } = institution as Institution;
      await supabase.from("institutions").update(instUpdate).eq("id", perf.institution_id);
    }
    await loadData();
  };

  const handleDeletePerformance = async (id: string) => {
    await supabase.from("performances").delete().eq("id", id);
    setSelected(null);
    await loadData();
  };

  const handleAddPerformance = async (inst: Partial<Institution>, perf: Partial<Performance>) => {
    // Check if institution exists
    const { data: existing } = await supabase.from("institutions").select("id").eq("name", inst.name).limit(1);
    let institutionId: string;
    if (existing?.length) {
      institutionId = existing[0].id;
      await supabase.from("institutions").update(inst).eq("id", institutionId);
    } else {
      const { data: newInst } = await supabase.from("institutions").insert(inst).select().single();
      institutionId = newInst!.id;
    }
    await supabase.from("performances").insert({ ...perf, institution_id: institutionId });
    await loadData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthed(false);
  };

  // Loading
  if (authed === null) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400">로딩 중...</p></div>;
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  // Stats
  const stats = {
    total: performances.length,
    active: performances.filter(p => !["공연완료", "정산완료"].includes(p.status)).length,
    thisMonth: performances.filter(p => { const d = new Date(p.performance_date); return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear(); }).length,
    unpaid: performances.filter(p => p.status === "공연완료" && !p.is_paid).length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-bold text-slate-800 tracking-tight">MMT</h1>
              <span className="text-xs text-slate-400 hidden sm:inline">공연 관리</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button onClick={() => setView("pipeline")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === "pipeline" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}>파이프라인</button>
                <button onClick={() => setView("calendar")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === "calendar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}>캘린더</button>
              </div>
              <button onClick={() => setSideOpen(!sideOpen)} className={`p-2 rounded-lg text-xs transition-colors relative ${sideOpen ? "bg-slate-200" : "hover:bg-slate-100"}`}>
                🔔 {alerts.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{alerts.length}</span>}
              </button>
              <button onClick={() => setShowNew(true)} className="bg-slate-800 text-white text-xs px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors font-medium">+ 새 공연</button>
              <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-2 transition-colors">로그아웃</button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "전체 공연", value: stats.total, icon: "📋" },
            { label: "진행 중", value: stats.active, icon: "🔄" },
            { label: "이번 달", value: stats.thisMonth, icon: "📅" },
            { label: "입금 대기", value: stats.unpaid, icon: "💰" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3">
              <span className="text-xl">{s.icon}</span>
              <div><p className="text-xs text-slate-500">{s.label}</p><p className="text-lg font-bold text-slate-800">{s.value}</p></div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex gap-5">
          <div className={sideOpen ? "flex-1 min-w-0" : "w-full"}>
            {view === "pipeline" && <PipelineView performances={performances} institutions={institutions} onClickCard={p => setSelected(p)} />}
            {view === "calendar" && <CalendarView performances={performances} institutions={institutions} month={month} setMonth={setMonth} onClickCard={p => setSelected(p)} />}
          </div>
          {sideOpen && (
            <div className="w-80 flex-shrink-0 hidden lg:block">
              <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800">알림</h3>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{alerts.length}건</span>
                </div>
                <AlertPanel alerts={alerts} onClickAlert={id => { const p = performances.find(x => x.id === id); if (p) setSelected(p); }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selected && <PerformanceDetail p={selected} inst={institutions[selected.institution_id]} onClose={() => { setSelected(null); loadData(); }} onSave={handleSavePerformance} onDelete={handleDeletePerformance} />}
      {showNew && <NewPerformanceForm onSave={handleAddPerformance} onClose={() => setShowNew(false)} />}
    </div>
  );
}
