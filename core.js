export const normalize = (v='') => v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
export function dateSP(date=new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(date); }
export function weekOf(day=dateSP()) { const d=new Date(day+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()-d.getUTCDay()); return d.toISOString().slice(0,10); }
export function shiftDay(day,n) { const d=new Date(day+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
export function fieldKey(label) {
 const k=normalize(label);
 if(k==='unidade'||k==='nome da unidade')return 'unit';
 if(k==='lider')return 'leader'; if(['colider','co lider'].includes(k))return 'coleader';
 if(k.startsWith('participante'))return 'participants';
 if(k.startsWith('nao crente')||k.startsWith('nao crist'))return 'unbelievers';
 if(k.startsWith('visitante'))return 'visitors'; if(k==='total')return 'total';
 if(k==='consolidador'||k==='consolidadora')return 'mentor';
 if(k==='consolidado'||k==='consolidada')return 'person';
 if(k.startsWith('licao'))return 'lesson'; return null;
}
export function parseReports(text) {
 const results=[]; let current={};
 const flush=()=>{ if(Object.keys(current).length) { const type=('person' in current||'mentor' in current||'lesson' in current)?'consolidation':'unit'; results.push({...current,type}); } current={}; };
 for(let line of text.split(/\r?\n/)) {
  line=line.replace(/[*_`]/g,'').trim();
  // Strip copied WhatsApp timestamp/sender prefixes, preserving the report itself.
  line=line.replace(/^\[\d{1,2}[:/]\d{2}[^\]]*\]\s*[^:]+:\s*/, '');
  if(/^relat[oó]rio\s+(de\s+)?consolida/i.test(line)) { if(current.unit||current.person)flush(); continue; }
  const m=line.match(/^([^:：=]+)\s*[:：=]\s*(.*)$/); if(!m)continue;
  const key=fieldKey(m[1]); if(!key)continue;
  if(key==='unit'&&current.unit)flush();
  if(key==='person'&&current.person) { const base={unit:current.unit,mentor:current.mentor}; flush(); current=base; }
  const val=m[2].trim();
  current[key]=['participants','unbelievers','visitors','total','lesson'].includes(key)?(/^\d+$/.test(val)?Number(val):''):val;
 }
 flush(); return results;
}
export function matchUnit(units,name) { const found=units.filter(u=>normalize(u.name)===normalize(name)); return found.length===1?found[0]:null; }
export function pendingFor(units,people,reports,week) {
 const active=units.filter(u=>u.active);
 return {unit:active.filter(u=>!reports.some(r=>r.unitId===u.id&&r.week===week&&r.type==='unit')),consolidation:active.filter(u=>people.some(p=>p.unitId===u.id&&p.active!==false&&(!(p.accepted||p.started)||(p.accepted||p.started)<=shiftDay(week,6)))&&!reports.some(r=>r.unitId===u.id&&r.week===week&&r.type==='consolidation'))};
}
export function duplicateKey(r) { return [r.unitId,r.week,r.type,r.type==='consolidation'?normalize(r.person):''].join('|'); }

export const NO_MEETING_REASONS = ['Chuva','Feriado','Sem encontro','Outro'];
export function normalizePhone(value='') {
 let n=String(value).replace(/\D/g,'');
 if(n.startsWith('0055'))n=n.slice(2);
 if((n.length===12||n.length===13)&&n.startsWith('55'))n=n.slice(2);
 if(!/^[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(n))return '';
 return '55'+n;
}
export function whatsAppLink(phone,message='') {
 const normalized=normalizePhone(phone);
 return normalized?'https://wa.me/'+normalized+(message?'?text='+encodeURIComponent(message):''):'';
}
export const validDate = value => typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
export function acceptedInWeek(people,week) {
 return people.filter(p=>{const d=p.accepted||p.started;return validDate(d)&&weekOf(d)===week;});
}
export function reconcileVisitorFollowUps(reports,previous=[]) {
 return reports.filter(r=>r.type==='unit'&&!r.noMeeting&&r.visitors>0).map(r=>{
  const old=previous.find(f=>f.sourceReportId===r.id);
  const changed=old&&old.count!==r.visitors;
  return {...old,id:old?.id||'visitors-'+r.id,sourceReportId:r.id,unitId:r.unitId,week:r.week,dueWeek:shiftDay(r.week,7),count:r.visitors,status:!changed&&old?.status==='completed'?'completed':'pending',names:old?.names||'',completedAt:!changed?old?.completedAt||'':''};
 });
}
export function dueFollowUps(data,week) {
 return (data.followUps||[]).filter(f=>f.status!=='completed'&&f.dueWeek<=week&&data.units.some(u=>u.id===f.unitId&&u.active));
}
export function lessonEvents(data,person,asOf=dateSP()) {
 const events=data.reports.filter(r=>r.type==='consolidation'&&r.unitId===person.unitId&&normalize(r.person)===normalize(person.name)).map(r=>({lesson:r.lesson,date:r.date,at:r.savedAt||''}));
 events.push(...(person.lessonUpdates||[]));
 if(!events.length&&Number.isInteger(person.lesson)) {const date=person.started||person.accepted;if(validDate(date))events.push({lesson:person.lesson,date,at:''});}
 return events.filter(e=>validDate(e.date)&&e.date<=asOf&&Number.isInteger(e.lesson)).sort((a,b)=>a.date.localeCompare(b.date)||(a.at||'').localeCompare(b.at||''));
}
export function stalledConsolidados(data,asOf=dateSP()) {
 return data.people.filter(p=>p.active!==false&&data.units.some(u=>u.id===p.unitId&&u.active)).flatMap(p=>{
  const events=lessonEvents(data,p,asOf);if(!events.length)return [];
  let highest=-1,since=events[0].date;
  for(const event of events)if(event.lesson>highest){highest=event.lesson;since=event.date;}
  const days=Math.floor((Date.parse(asOf+'T12:00:00Z')-Date.parse(since+'T12:00:00Z'))/86400000);
  return days>=21?[{...p,lesson:events.at(-1).lesson,since,days,weeks:Math.floor(days/7)}]:[];
 });
}
export function weeklySeries(data,endWeek=weekOf(),count=8) {
 return Array.from({length:count},(_,i)=>{
  const week=shiftDay(endWeek,-7*(count-1-i));const reports=data.reports.filter(r=>r.week===week&&r.type==='unit'&&!r.noMeeting);
  return {week,participants:reports.reduce((n,r)=>n+r.participants,0),visitors:reports.reduce((n,r)=>n+r.visitors,0),accepted:acceptedInWeek(data.people,week).length,hasData:reports.length>0||data.reports.some(r=>r.week===week)||acceptedInWeek(data.people,week).length>0};
 });
}
export function weeklySummary(data,week) {
 const format=d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4),safe=s=>String(s||'').replace(/[\r\n*_`]/g,' ').trim();
 const active=data.units.filter(u=>u.active),rs=data.reports.filter(r=>r.week===week&&r.type==='unit'),normal=rs.filter(r=>!r.noMeeting),notMet=rs.filter(r=>r.noMeeting),pending=pendingFor(data.units,data.people,data.reports,week).unit;
 const received=normal.filter(r=>active.some(u=>u.id===r.unitId)).length;
 const name=r=>safe(data.units.find(u=>u.id===r.unitId)?.name||'Unidade');
 const sum=key=>normal.reduce((n,r)=>n+(r[key]||0),0);
 const lines=['*Resumo da semana · Unidades*',`*${format(week)} a ${format(shiftDay(week,6))}*`,'Domingo a sábado · Brasília (UTC−3)','',`*Relatórios recebidos:* ${received} de ${active.length} Unidades ativas`,`*Sem encontro informado:* ${notMet.filter(r=>active.some(u=>u.id===r.unitId)).length}`,`*Ainda pendentes:* ${pending.length}`,'','*Números da semana*',`Participantes: ${sum('participants')}`,`Não crentes: ${sum('unbelievers')}`,`Visitantes da primeira vez: ${sum('visitors')}`,`Total informado: ${sum('total')}`,`Aceitaram Jesus: ${acceptedInWeek(data.people,week).length}`,'','*Enviaram relatório*',...(normal.length?normal.map(r=>'• '+name(r)):['Nenhuma Unidade.']),'','*Ainda pendentes*',...(pending.length?pending.map(u=>'• '+safe(u.name)):['Nenhuma Unidade.']),'','*Não se reuniu*',...(notMet.length?notMet.map(r=>'• '+name(r)+' — '+safe(r.reason)+(r.note?' ('+safe(r.note)+')':'')):['Nenhuma Unidade.'])];
 return lines.join('\n');
}
export function validateBackup(data) {
 if(!data||data.version!==1||!['units','people','reports'].every(k=>Array.isArray(data[k])))throw Error('Arquivo de backup inválido.');
 const str=v=>typeof v==='string',safeId=v=>str(v)&&/^[A-Za-z0-9_-]+$/.test(v),optional=(obj,keys)=>keys.every(k=>obj[k]==null||str(obj[k]));
 const ids=new Set();
 for(const u of data.units) {
  if(!u||!safeId(u.id)||!str(u.name)||!u.name.trim()||typeof u.active!=='boolean'||ids.has(u.id)||!optional(u,['phone','leader','coleader','notes'])||(u.phone&&!normalizePhone(u.phone)))throw Error('Cadastro de Unidade inválido.');ids.add(u.id);
 }
 const pids=new Set();for(const p of data.people) {
  if(!p||!safeId(p.id)||pids.has(p.id)||!str(p.name)||!p.name.trim()||!ids.has(p.unitId)||(p.lesson!=null&&p.lesson!==''&&(!Number.isInteger(p.lesson)||p.lesson<0))||['accepted','started'].some(k=>p[k]&&!validDate(p[k]))||!optional(p,['mentor','notes'])||(p.active!=null&&typeof p.active!=='boolean'))throw Error('Cadastro de consolidado inválido.');
  if(p.lessonUpdates!=null&&(!Array.isArray(p.lessonUpdates)||p.lessonUpdates.some(e=>!e||!validDate(e.date)||!Number.isInteger(e.lesson)||e.lesson<0||!optional(e,['at']))))throw Error('Histórico de lições inválido.');pids.add(p.id);
 }
 const rids=new Set(),keys=new Set();for(const r of data.reports) {
  if(!r||!safeId(r.id)||rids.has(r.id)||!ids.has(r.unitId)||!['unit','consolidation'].includes(r.type)||!validDate(r.date)||r.week!==weekOf(r.date)||keys.has(duplicateKey(r))||(r.type==='consolidation'&&(!str(r.person)||!r.person.trim()))||!optional(r,['mentor','leader','coleader','savedAt','note'])||(r.noMeeting!=null&&typeof r.noMeeting!=='boolean'))throw Error('Relatório inválido ou duplicado.');
  if(r.noMeeting&&(r.type!=='unit'||!NO_MEETING_REASONS.includes(r.reason)))throw Error('Informe um motivo válido para não haver encontro.');
  for(const k of r.type==='unit'?['participants','unbelievers','visitors','total']:['lesson']) {
   if(r.noMeeting&&r[k]==null)r[k]=0;
   if(!Number.isInteger(r[k])||r[k]<0||(r.noMeeting&&r[k]!==0))throw Error('Número inválido em relatório.');
  }
  rids.add(r.id);keys.add(duplicateKey(r));
 }
 if(data.followUps!=null&&!Array.isArray(data.followUps))throw Error('Acompanhamento de visitantes inválido.');
 const fids=new Set(),sources=new Set();for(const f of data.followUps||[]) {
  if(!f||!safeId(f.id)||fids.has(f.id)||!str(f.sourceReportId)||sources.has(f.sourceReportId)||!ids.has(f.unitId)||!validDate(f.week)||weekOf(f.week)!==f.week||f.dueWeek!==shiftDay(f.week,7)||!Number.isInteger(f.count)||f.count<=0||!['pending','completed'].includes(f.status)||!optional(f,['names'])||(f.completedAt&&!validDate(f.completedAt)))throw Error('Acompanhamento de visitantes inválido.');fids.add(f.id);sources.add(f.sourceReportId);
 }
 // Migrate old backups non-destructively. Reports remain the source of truth.
 data.followUps=reconcileVisitorFollowUps(data.reports,data.followUps||[]);
 return data;
}
