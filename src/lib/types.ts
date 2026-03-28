export interface Institution {
  id: string;
  name: string;
  address: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  site_memo: string;
  created_at: string;
  updated_at: string;
}

export interface Performance {
  id: string;
  institution_id: string;
  episode: "환경_푸른고래이야기" | "장애인식개선_모두의놀이터";
  performance_date: string;
  sessions: number;
  time_slot: string;
  audience_count: number;
  agreed_price: number;
  status: "상담중" | "견적발송" | "확정" | "자료발송" | "공연완료" | "정산완료";
  payment_method: "카드" | "계좌이체" | null;
  is_paid: boolean;
  tax_invoice_needed: boolean;
  tax_invoice_issued: boolean;
  needs_criminal_check: boolean;
  post_notes: string;
  created_at: string;
  updated_at: string;
  // Joined data
  institution?: Institution;
}

export interface Document {
  id: string;
  performance_id: string;
  doc_type: "estimate" | "invoice";
  doc_number: string;
  version: number;
  google_doc_id: string;
  pdf_url: string;
  sent_to_email: string;
  sent_at: string;
  created_at: string;
}

export interface StaffAssignment {
  id: string;
  performance_id: string;
  staff_id: string | null;
  staff_name: string;
  staff_role: string;
  pay_amount: number;
  is_paid: boolean;
  created_at: string;
}

export interface Alert {
  performance_id: string;
  institution_name: string;
  alert_type: string;
  message: string;
  action_date: string;
  priority: number;
}

export const STATUS_FLOW = [
  "상담중", "견적발송", "확정", "자료발송", "공연완료", "정산완료"
] as const;

export const EPISODES = [
  "환경_푸른고래이야기",
  "장애인식개선_모두의놀이터",
] as const;

export const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  "상담중": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-400" },
  "견적발송": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-400" },
  "확정": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-400" },
  "자료발송": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-400" },
  "공연완료": { bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-700", dot: "bg-slate-400" },
  "정산완료": { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", dot: "bg-green-500" },
};
