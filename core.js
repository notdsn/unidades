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
export function validateBackup(data) {
 if(!data||data.version!==1||!['units','people','reports'].every(k=>Array.isArray(data[k])))throw Error('Arquivo de backup inválido.');
 const str=(v)=>typeof v==='string'; const ids=new Set();
 for(const u of data.units) {if(!u||!str(u.id)||!str(u.name)||!u.name.trim()||typeof u.active!=='boolean'||ids.has(u.id))throw Error('Cadastro de Unidade inválido.');ids.add(u.id);}
 const pids=new Set(); for(const p of data.people) {if(!p||!str(p.id)||pids.has(p.id)||!str(p.name)||!p.name.trim()||!ids.has(p.unitId)|| (p.lesson!=null&&p.lesson!==''&&(!Number.isInteger(p.lesson)||p.lesson<0)) || (p.accepted&&!/^\d{4}-\d{2}-\d{2}$/.test(p.accepted)))throw Error('Cadastro de consolidado inválido.');pids.add(p.id);}
 const rids=new Set(), keys=new Set();for(const r of data.reports) {if(!r||!str(r.id)||rids.has(r.id)||!ids.has(r.unitId)||!['unit','consolidation'].includes(r.type)||!str(r.date)||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||r.week!==weekOf(r.date)||keys.has(duplicateKey(r))||(r.type==='consolidation'&&(!str(r.person)||!r.person.trim())))throw Error('Relatório inválido ou duplicado.'); for(const k of r.type==='unit'?['participants','unbelievers','visitors','total']:['lesson'])if(!Number.isInteger(r[k])||r[k]<0)throw Error('Número inválido em relatório.');rids.add(r.id);keys.add(duplicateKey(r));}
 return data;
}
