import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

type Ocorrencia = {
 id: string; nome_aluno: string; turma: string; disciplina: string;
 motivo: string; medida_prevista: string; quantidade_rodadas: number;
 status: "pendente_validacao" | "confirmada" | "cumprida" | "cancelada";
 observacao_administrativa: string | null; data_ocorrencia: string;
};
const statusLabel: Record<Ocorrencia["status"],string> = {
 pendente_validacao:"Aguardando validação",confirmada:"Confirmada",cumprida:"Cumprida",cancelada:"Cancelada"
};
export function OcorrenciasAdministrativas() {
 const [items,setItems]=useState<Ocorrencia[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [saving,setSaving]=useState<string|null>(null);
 const [authorized,setAuthorized]=useState(false);
 async function load() {
  setLoading(true);setError("");
  const {data:user,error:authError}=await supabase.auth.getUser();
  if(authError||!user.user){setAuthorized(false);setLoading(false);return;}
  // Permissões reais são aplicadas pelas políticas RLS do Supabase.
  const {data,error:queryError}=await supabase.from("ocorrencias_disciplinares").select("id,nome_aluno,turma,disciplina,motivo,medida_prevista,quantidade_rodadas,status,observacao_administrativa,data_ocorrencia").order("data_ocorrencia",{ascending:false}).limit(30);
  if(queryError){setError("Não foi possível consultar as ocorrências. Verifique as permissões administrativas no Supabase.");setAuthorized(false);}
  else {setItems((data??[]) as Ocorrencia[]);setAuthorized(true);}
  setLoading(false);
 }
 useEffect(()=>{void load()},[]);
 async function update(id:string,status:Ocorrencia["status"]) {
  if(!window.confirm(`Confirmar alteração da ocorrência para "${statusLabel[status]}"?`))return;
  setSaving(id);setError("");
  const {data,error:updateError}=await supabase.from("ocorrencias_disciplinares").update({status,atualizado_em:new Date().toISOString()}).eq("id",id).select("id");
  if(updateError||!data?.length)setError("Alteração não autorizada ou não salva. Confira as políticas de acesso.");
  else await load();
  setSaving(null);
 }
 return <section className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm" aria-label="Ocorrências disciplinares restritas">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="rounded-xl bg-amber-500/10 p-2 text-amber-600"><ClipboardCheck className="size-5"/></span><div><h2 className="font-bold">Ocorrências administrativas</h2><p className="text-xs text-muted-foreground">Área restrita · validação e acompanhamento</p></div></div><button onClick={()=>void load()} type="button" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold"><RefreshCw className="size-3.5"/> Atualizar</button></div>
  {loading?<p className="text-sm text-muted-foreground">Consultando registros autorizados...</p>:error?<p role="alert" className="text-sm text-destructive">{error}</p>:!authorized?<p className="text-sm text-muted-foreground">Acesso administrativo necessário.</p>:items.length===0?<p className="text-sm text-muted-foreground">Nenhuma ocorrência disponível para esta conta.</p>:<div className="space-y-2">{items.map(item=><article key={item.id} className="rounded-xl border border-border bg-background p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold">{item.nome_aluno} <span className="text-xs font-normal text-muted-foreground">· {item.turma}</span></p><p className="text-xs text-muted-foreground">{item.disciplina} · {item.data_ocorrencia}</p></div><span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"><AlertTriangle className="size-3"/>{statusLabel[item.status]??item.status}</span></div><p className="mt-2 text-sm">{item.motivo}</p><p className="mt-1 text-xs text-muted-foreground">{item.medida_prevista} · {item.quantidade_rodadas} rodada(s)</p>{item.observacao_administrativa&&<p className="mt-2 rounded-lg bg-muted p-2 text-xs">{item.observacao_administrativa}</p>}<div className="mt-3 flex flex-wrap gap-2">{(["confirmada","cumprida","cancelada"] as const).filter(s=>s!==item.status).map(s=><button key={s} disabled={saving===item.id} onClick={()=>void update(item.id,s)} type="button" className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50">Marcar: {statusLabel[s]}</button>)}</div></article>)}</div>}
 </section>;
}
