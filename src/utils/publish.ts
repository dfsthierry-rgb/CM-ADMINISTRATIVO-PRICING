import { TableItem, CalcParams } from '../types';
import { calculatePrices, normalizeMaterial, smartSort } from './calculations';
import { VERSION } from '../constants';

export function generatePublishHtml(
  type: 'complete' | 'sellers', 
  data: TableItem[], 
  params: CalcParams, 
  mode: 'simple' | 'compare'
) {
  const base = params.f1 * params.f2 * params.f3;
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR');
  
  const variations = data.filter(i => i.variation !== null).map(i => i.variation as number);
  const avgVar = variations.length > 0 ? variations.reduce((a, b) => a + b, 0) / variations.length : 0;
  
  const varStyle = avgVar >= 0 ? 'color: blue; font-weight: bold;' : 'color: red; font-weight: bold;';
  const varText = (type === 'complete' && mode === 'compare') ? ` | <span style="${varStyle}">Variação Geral: ${avgVar >= 0 ? '▲ +' : '▼ '}${avgVar.toFixed(1)}%</span>` : '';
  
  let paramsHtml = '';
  if (type === 'complete') {
    paramsHtml = `
    <div style="background:#f1f5f9; padding:10px; border-radius:6px; margin-bottom:15px; font-size:11px; color:#475569; border:1px solid #e2e8f0;">
      <strong>Parâmetros Utilizados:</strong> 
      f1: ${params.f1} | f2: ${params.f2} | f3: ${params.f3} | 
      Markup CRT: ${params.markupCrt} | Markup ROL: ${params.markupRol} | 
      Div18: ${params.div18} | Div12: ${params.div12} | Div7: ${params.div7} | DivCT: ${params.divCT}
    </div>`;
  }

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
body{font-family:Inter, Arial,sans-serif;margin:0;padding:20px;background:#f5f5f5; scroll-behavior: smooth;}
.container{max-width:1400px;margin:0 auto;background:white;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);padding:20px;}
.header{background:linear-gradient(135deg,#1e3a5f,#2563eb);color:white;padding:20px;border-radius:8px;margin-bottom:20px;}
.header h1{margin:0;font-size:24px;}
.header p{margin:5px 0 0;opacity:0.9;font-size:14px;}
.filters{background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;display:flex;gap:10px;flex-wrap:wrap; position: relative; z-index: 30; box-shadow: 0 2px 4px rgba(0,0,0,0.05);}
.filters input,.filters select{padding:8px 12px;border:1px solid #ddd;border-radius:4px;font-size:14px;}
.table-wrap{overflow:auto; max-height: 75vh; border: 1px solid #eee; border-radius: 8px; background: white;}
table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px; table-layout: auto;}
thead{position:sticky; top: 0; z-index: 20;}
th{background:#1e3a5f;color:white;padding:12px 8px;text-align:left; border-bottom: 2px solid #0f172a; position: sticky; top: 0; z-index: 20; background-clip: padding-box;}
th.right{text-align:right;}
td{padding:8px;border-bottom:1px solid #eee;}
td.right{text-align:right;}
.mat-316{background:#f3e8ff;}
.mat-304{background:#dbeafe;}
.mat-302{background:#dcfce7;}
.mat-galv{background:#fef9c3;}
.mat-carb{background:#e5e7eb;}
tr:hover{background:#f0f0f0 !important;}
.footer{text-align:center;padding:20px;color:#666;font-size:12px;}
</style></head><body>
<div class="container">
<div class="header"><h1>Central Mesh - Tabela de Preços</h1>
<p>Publicado em: ${dateStr}${varText} | v${VERSION}</p></div>
${paramsHtml}`;

  // Summaries (Only for Complete + Compare)
  if (type === 'complete' && mode === 'compare') {
    const matSummary: Record<string, {count: number, vars: number[]}> = {};
    const meshSummary: Record<string, {count: number, vars: number[]}> = {};
    
    data.filter(i => i.changeType !== 'removed').forEach(item => {
      if (!matSummary[item.material]) matSummary[item.material] = {count: 0, vars: []};
      matSummary[item.material].count++;
      if (item.variation !== null) matSummary[item.material].vars.push(item.variation);
      
      if (!meshSummary[item.mesh]) meshSummary[item.mesh] = {count: 0, vars: []};
      meshSummary[item.mesh].count++;
      if (item.variation !== null) meshSummary[item.mesh].vars.push(item.variation);
    });

    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
<div style="background:#eff6ff;padding:15px;border-radius:8px;"><h3 style="margin:0 0 10px;color:#1e3a5f;">📊 Resumo por Material</h3><div style="max-height:150px;overflow:auto;">`;
    Object.keys(matSummary).sort().forEach(m => {
      const s = matSummary[m];
      const avg = s.vars.length ? s.vars.reduce((a,b)=>a+b,0)/s.vars.length : 0;
      html += `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #ddd;"><span>${m} (${s.count})</span><span style="color:${avg>=0?'blue':'green'};font-weight:bold;">${avg>=0?'+':''}${avg.toFixed(1)}%</span></div>`;
    });
    html += `</div></div>
<div style="background:#f0fdf4;padding:15px;border-radius:8px;"><h3 style="margin:0 0 10px;color:#166534;">🔢 Resumo por Malha</h3><div style="max-height:150px;overflow:auto;">`;
    Object.keys(meshSummary).sort((a,b)=>parseFloat(a)-parseFloat(b)).forEach(m => {
      const s = meshSummary[m];
      const avg = s.vars.length ? s.vars.reduce((a,b)=>a+b,0)/s.vars.length : 0;
      html += `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #ddd;"><span>Malha ${m} (${s.count})</span><span style="color:${avg>=0?'blue':'green'};font-weight:bold;">${avg>=0?'+':''}${avg.toFixed(1)}%</span></div>`;
    });
    html += `</div></div></div>`;
  }

  // Filters UI
  html += `<div class="filters">
<input type="text" id="fcode" placeholder="Código..." onkeyup="filterTable()">
<select id="fmat" onchange="filterTable()"><option value="">Material</option>`;
  const mats = Array.from(new Set(data.map(i => i.material))).sort();
  mats.forEach(m => { html += `<option value="${m}">${m}</option>`; });
  html += `</select>
<select id="fmesh" onchange="filterTable()"><option value="">Malha</option>`;
  const meshes = Array.from(new Set(data.map(i => i.mesh))).sort((a,b)=>parseFloat(a)-parseFloat(b));
  meshes.forEach(m => { html += `<option value="${m}">${m}</option>`; });
  html += `</select>
<select id="fwire" onchange="filterTable()"><option value="">Fio</option>`;
  const wires = Array.from(new Set(data.map(i => i.wire))).sort((a,b)=>parseFloat(a)-parseFloat(b));
  wires.forEach(w => { html += `<option value="${w}">${w}</option>`; });
  html += `</select>
<select id="fwidth" onchange="filterTable()"><option value="">Largura</option>`;
  const widths = Array.from(new Set(data.map(i => i.width))).sort((a,b)=>parseFloat(a)-parseFloat(b));
  widths.forEach(w => { html += `<option value="${w}">${w}</option>`; });
  html += `</select>
<button onclick="clearFilters()" style="background:#ef4444;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">Limpar</button>
<span id="counter" style="margin-left:auto;color:#666;"></span>
</div>`;

  // Table
  html += `<div class="table-wrap"><table><thead><tr>
<th>Código</th><th>Material</th><th>Malha</th><th>Fio</th><th>Largura</th>`;
  if (type === 'complete') html += '<th class="right">$/m²</th>';
  html += `<th class="right">18% CRT</th><th class="right">18% ROL</th>
<th class="right">12% CRT</th><th class="right">12% ROL</th>
<th class="right">7% CRT</th><th class="right">7% ROL</th>`;
  if (type === 'complete') html += '<th class="right">CT CRT</th><th class="right">CT ROL</th>';
  html += '</tr></thead><tbody id="tbody">';

  const sortedData = [...data]
    .filter(i => i.changeType !== 'removed')
    .sort((a, b) => {
      const s1 = smartSort(a.mesh, b.mesh);
      if (s1 !== 0) return s1;
      const s2 = smartSort(a.wire, b.wire);
      if (s2 !== 0) return s2;
      const s3 = smartSort(a.width, b.width);
      if (s3 !== 0) return s3;
      return (a.material || '').localeCompare(b.material || '');
    });

  sortedData.forEach(item => {
    const price = item.newPrice !== null ? item.newPrice : item.priceM2;
    const p = calculatePrices(price, params);
    const mNorm = normalizeMaterial(item.material).toLowerCase();
    const matClass = mNorm.includes('316') ? 'mat-316' : mNorm.includes('304') ? 'mat-304' : mNorm.includes('302') ? 'mat-302' : mNorm.includes('galv') ? 'mat-galv' : mNorm.includes('carb') ? 'mat-carb' : '';

    html += `<tr class="${matClass}" data-code="${item.code}" data-mat="${item.material}" data-mesh="${item.mesh}" data-wire="${item.wire}" data-width="${item.width}">
<td>${item.code || '-'}</td>
<td>${item.material || '-'}</td>
<td>${item.mesh || '-'}</td>
<td>${item.wire || '-'}</td>
<td>${item.width || '-'}</td>`;
    if (type === 'complete') html += `<td class="right" style="font-weight:bold;">${price.toFixed(2)}</td>`;
    html += `<td class="right">${p.crt18.toFixed(2)}</td>
<td class="right">${p.rol18.toFixed(2)}</td>
<td class="right">${p.crt12.toFixed(2)}</td>
<td class="right">${p.rol12.toFixed(2)}</td>
<td class="right">${p.crt7.toFixed(2)}</td>
<td class="right">${p.rol7.toFixed(2)}</td>`;
    if (type === 'complete') html += `<td class="right">${p.crtCT.toFixed(2)}</td><td class="right">${p.rolCT.toFixed(2)}</td>`;
    html += '</tr>';
  });

  html += `</tbody></table></div>
<div class="footer">Central Mesh - Tabela de Preços | v${VERSION}</div>
</div>
<script>
function filterTable(){
  var c=document.getElementById("fcode").value.toLowerCase();
  var m=document.getElementById("fmat").value;
  var mesh=document.getElementById("fmesh").value;
  var wire=document.getElementById("fwire").value;
  var width=document.getElementById("fwidth").value;
  var rows=document.querySelectorAll("#tbody tr");
  var count=0;
  rows.forEach(function(r){
    var show=true;
    if(c&&r.dataset.code.toLowerCase().indexOf(c)<0)show=false;
    if(m&&r.dataset.mat!==m)show=false;
    if(mesh&&r.dataset.mesh!==mesh)show=false;
    if(wire&&r.dataset.wire!==wire)show=false;
    if(width&&r.dataset.width!==width)show=false;
    r.style.display=show?"":"none";
    if(show)count++;
  });
  document.getElementById("counter").textContent=count+" itens";
}
function clearFilters(){
  document.getElementById("fcode").value="";
  document.getElementById("fmat").value="";
  document.getElementById("fmesh").value="";
  document.getElementById("fwire").value="";
  document.getElementById("fwidth").value="";
  filterTable();
}
filterTable();
</script></body></html>`;

  return html;
}
