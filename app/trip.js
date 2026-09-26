(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const esc = (v='') => String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const maps = q => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);

  function eventRow(item){
    const chips = (item.chips || []).map(c => '<span class="chip">'+esc(c)+'</span>').join('');
    return '<div class="row"><div class="time">'+esc(item.time||'')+'</div><div class="rail"><div class="dot"></div></div><div class="card"><div class="cardbody"><div class="title">'+esc(item.title)+'</div>'+(item.desc?'<div class="desc">'+esc(item.desc)+'</div>':'')+(chips?'<div class="chips">'+chips+'</div>':'')+'</div></div></div>';
  }
  function moveRow(item){
    const copyText = [item.destination, item.address].filter(Boolean).join('\n');
    return '<div class="row move"><div class="time">'+esc(item.time||'')+'</div><div class="rail"><div class="dot"></div></div><div class="card"><div class="cardbody"><div class="route"><div class="title">'+esc(item.from)+' → '+esc(item.to)+'</div><span class="mode">'+esc(item.mode||'MOVE')+'</span></div>'+(item.desc?'<div class="desc">'+esc(item.desc)+'</div>':'')+(item.destination?'<div class="dest" data-copy="'+esc(copyText)+'"><b>'+esc(item.destination)+'</b>'+(item.address?'<span>'+esc(item.address)+'</span>':'')+'<div class="actions"><button class="btn copy">複製目的地</button><a class="btn secondary" target="_blank" rel="noopener" href="'+maps(copyText)+'">開地圖</a></div></div>':'')+'</div></div></div>';
  }
  function alertBox(a){return '<div class="alert"><b>'+esc(a.title)+'</b><span>'+esc(a.text)+'</span></div>'}

  function detailRows(details){
    return (details||[]).map(d=>'<div class="detailrow"><span>'+esc(d.label)+'</span><b>'+esc(d.value)+'</b></div>').join('');
  }
  function bookingDetails(x, dark=false){
    const rows = detailRows(x.details);
    const search = x.searchKeyword ? '<div class="searchhint"><small>Gmail 搜尋</small><code>'+esc(x.searchKeyword)+'</code></div>' : '';
    const note = x.note ? '<div class="detailnote">'+esc(x.note)+'</div>' : '';
    const cls = dark ? ' bookingdetail dark' : ' bookingdetail';
    return (rows||search||note) ? '<div class="'+cls.trim()+'">'+rows+search+note+'</div>' : '';
  }

  function render(data){
    document.title = data.title + '｜Trip';
    $('#trip-title').textContent = data.title;
    const metaLine = [data.dateLabel, data.durationLabel, data.partyLabel].filter(Boolean).join('｜');
    $('#trip-subtitle').textContent = metaLine || data.subtitle || '';
    $('#trip-eyebrow').textContent = data.eyebrow || 'TRIP';
    $('#summary').innerHTML = (data.summary||[]).map(x=>{
      const hasMore = (x.details&&x.details.length) || x.searchKeyword || x.note;
      if(!hasMore) return '<div class="box"><small>'+esc(x.label)+'</small><strong>'+esc(x.value)+'</strong></div>';
      return '<details class="box info-card"><summary><div><small>'+esc(x.label)+'</small><strong>'+esc(x.value)+'</strong><span class="tapmore">點開看完整資訊</span></div><span class="chevron">⌄</span></summary>'+bookingDetails(x)+'</details>';
    }).join('');

    const nav = (data.days||[]).map((d,i)=>'<a class="daypill" href="#day-'+(i+1)+'"><div class="dow">'+esc(d.dow)+'</div><div class="date">'+esc(d.date)+'</div></a>').join('') + '<a class="daypill" href="#wallet"><div class="dow">INFO</div><div class="date">Tickets</div></a>';
    $('#daynav').innerHTML = nav;

    $('#days').innerHTML = (data.days||[]).map((d,i)=>{
      const rows=(d.items||[]).map(x=>x.type==='move'?moveRow(x):eventRow(x)).join('');
      const alerts=(d.alerts||[]).map(alertBox).join('');
      return '<section class="day" id="day-'+(i+1)+'"><div class="dayhead"><div><div class="kicker">'+esc(d.dow)+' · '+esc(d.date)+'</div><h2>'+esc(d.title)+'</h2></div><div class="daynum">'+String(i+1).padStart(2,'0')+'</div></div>'+(d.intro?'<p class="intro">'+esc(d.intro)+'</p>':'')+'<div class="timeline">'+rows+'</div>'+alerts+'</section>';
    }).join('');

    $('#wallet').innerHTML = '<h2>Tickets & Bookings</h2><div class="walletgrid">'+(data.wallet||[]).map(w=>{
      const hasMore = (w.details&&w.details.length) || w.searchKeyword || w.note;
      if(!hasMore) return '<div class="ticket"><small>'+esc(w.type)+'</small><b>'+esc(w.title)+'</b><div class="meta">'+esc(w.meta)+'</div></div>';
      return '<details class="ticket ticket-expand"><summary><div><small>'+esc(w.type)+'</small><b>'+esc(w.title)+'</b><div class="meta">'+esc(w.meta)+'</div><span class="tapmore darktext">點開看完整資訊</span></div><span class="chevron light">⌄</span></summary>'+bookingDetails(w,true)+'</details>';
    }).join('')+'</div>';
    $('#bottom').innerHTML = (data.days||[]).slice(0,4).map((d,i)=>'<a class="nav" href="#day-'+(i+1)+'"><b>'+String(i+1).padStart(2,'0')+'</b>'+esc(d.short||d.dow)+'</a>').join('')+'<a class="nav" href="#wallet"><b>◎</b>資訊</a>';
    $('#loading').remove();
    document.querySelectorAll('.copy').forEach(btn=>btn.addEventListener('click',async()=>{
      const box=btn.closest('[data-copy]'); const value=box?box.getAttribute('data-copy'):'';
      try{await navigator.clipboard.writeText(value);const old=btn.textContent;btn.textContent='已複製 ✓';setTimeout(()=>btn.textContent=old,1200)}
      catch(e){window.prompt('請複製：',value)}
    }));
  }
  fetch('./trip.json?ts=20260926c')
    .then(r=>{if(!r.ok) throw new Error('HTTP '+r.status); return r.json()})
    .then(render)
    .catch(err=>{$('#loading').className='error';$('#loading').textContent='行程資料載入失敗，請重新整理頁面。 '+err.message});
})();