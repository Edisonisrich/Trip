(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const esc = (v='') => String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const maps = q => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  const money = n => 'NT' + String.fromCharCode(36) + Math.round(Number(n)||0).toLocaleString('zh-TW');

  function eventRow(item){
    const chips = (item.chips || []).map(c => '<span class="chip">'+esc(c)+'</span>').join('');
    return '<div class="row"><div class="time">'+esc(item.time||'')+'</div><div class="rail"><div class="dot"></div></div><div class="card"><div class="cardbody"><div class="title">'+esc(item.title)+'</div>'+(item.desc?'<div class="desc">'+esc(item.desc)+'</div>':'')+(chips?'<div class="chips">'+chips+'</div>':'')+'</div></div></div>';
  }

  function moveRow(item){
    const copyText = [item.destination, item.address].filter(Boolean).join('\n');
    return '<div class="row move"><div class="time">'+esc(item.time||'')+'</div><div class="rail"><div class="dot"></div></div><div class="card"><div class="cardbody"><div class="route"><div class="title">'+esc(item.from)+' → '+esc(item.to)+'</div><span class="mode">'+esc(item.mode||'MOVE')+'</span></div>'+(item.desc?'<div class="desc">'+esc(item.desc)+'</div>':'')+(item.destination?'<div class="dest" data-copy="'+esc(copyText)+'"><b>'+esc(item.destination)+'</b>'+(item.address?'<span>'+esc(item.address)+'</span>':'')+'<div class="actions"><button class="btn copy">複製目的地</button><a class="btn secondary" target="_blank" rel="noopener" href="'+maps(copyText)+'">開地圖</a></div></div>':'')+'</div></div></div>';
  }

  function alertBox(a){
    return '<div class="alert"><b>'+esc(a.title)+'</b><span>'+esc(a.text)+'</span></div>';
  }

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

  function renderBudget(budget){
    if(!budget) return '<section class="budgetpage"><div class="budgetnotes">尚未建立費用資料。</div></section>';
    const included = (budget.items||[]).filter(x=>x.includeInTotal!==false && Number.isFinite(Number(x.twd)));
    const total = included.reduce((s,x)=>s+Number(x.twd),0);
    const people = Number(budget.people)||1;
    const groups = ['confirmed','estimated','pending'];
    const labels = {confirmed:'已付款／已確認',estimated:'預估費用',pending:'尚未計價'};
    const rows = groups.map(group=>{
      const items=(budget.items||[]).filter(x=>x.status===group);
      if(!items.length) return '';
      return '<div class="budgetgroup"><h3>'+labels[group]+'</h3>'+items.map(x=>{
        const price = x.twd!=null ? money(x.twd) : '待確認';
        const foreign = x.foreign ? '<span class="foreign">'+esc(x.foreign)+'</span>' : '';
        const excluded = x.includeInTotal===false ? '<span class="notcounted">不計入總額</span>' : '';
        return '<div class="budgetrow"><div><b>'+esc(x.label)+'</b>'+(x.note?'<small>'+esc(x.note)+'</small>':'')+'</div><div class="budgetprice">'+foreign+'<strong>'+price+'</strong>'+excluded+'</div></div>';
      }).join('')+'</div>';
    }).join('');
    const notes=(budget.notes||[]).map(n=>'<li>'+esc(n)+'</li>').join('');
    return '<section class="budgetpage"><div class="budgethero"><small>目前可計算總額</small><strong>'+money(total)+'</strong><div>兩人平均約 '+money(total/people)+'</div></div>'+rows+(notes?'<div class="budgetnotes"><b>還沒算進去</b><ul>'+notes+'</ul></div>':'')+(budget.fxNote?'<div class="fxnote">'+esc(budget.fxNote)+'</div>':'')+'</section>';
  }

  function renderOverview(data){
    const slotLabel = t => {
      const s=String(t||'');
      if (/出發前|通關後|白天|上午|09:30|11:00/.test(s)) return '上午';
      if (/15:00|16:00|下午/.test(s)) return '下午';
      if (/19:00|20:10|住宿|晚上|當日/.test(s)) return '晚上';
      return '行程';
    };
    const dayCols=(data.days||[]).map((d,i)=>{
      const items=(d.items||[]).map(x=>{
        const title=x.type==='move' ? (esc(x.from)+' → '+esc(x.to)) : esc(x.title||'');
        return '<div class="overview-event"><span>'+esc(x.time||slotLabel(x.time))+'</span><b>'+title+'</b>'+(x.mode?'<em>'+esc(x.mode)+'</em>':'')+'</div>';
      }).join('');
      return '<a class="overview-day" href="?day='+(i+1)+'"><div class="overview-dayhead"><small>DAY '+String(i+1).padStart(2,'0')+' · '+esc(d.dow)+'</small><strong>'+esc(d.date)+'</strong><h3>'+esc(d.short||d.title)+'</h3></div><div class="overview-events">'+items+'</div><div class="overview-open">查看完整行程 →</div></a>';
    }).join('');
    return '<section class="trip-overview"><div class="overview-heading"><div><div class="kicker">TRIP AT A GLANCE</div><h2>四日行程總覽</h2></div><p>先看四天全程，再用上方日期 Tab 進入每天的詳細時間軸。</p></div><div class="overview-grid">'+dayCols+'</div></section>';
  }

  function render(data){
    document.title = data.title + '｜Trip';
    $('#trip-title').textContent = data.title;
    const metaLine = [data.dateLabel, data.durationLabel, data.partyLabel].filter(Boolean).join('｜');
    $('#trip-subtitle').textContent = metaLine || data.subtitle || '';
    $('#trip-eyebrow').textContent = data.eyebrow || 'TRIP';

    const hero = document.querySelector('.hero');
    if (data.coverImage && data.coverImage.url) {
      hero.classList.add('has-photo');
      hero.style.setProperty('--hero-image', 'url("' + data.coverImage.url.replace(/"/g, '%22') + '")');
      let credit = document.getElementById('hero-credit');
      if (!credit) {
        credit = document.createElement('a');
        credit.id = 'hero-credit';
        credit.className = 'photo-credit hero-credit';
        credit.target = '_blank';
        credit.rel = 'noopener';
        document.querySelector('.hero .shell').appendChild(credit);
      }
      credit.href = data.coverImage.source || '#';
      credit.textContent = data.coverImage.credit || 'Photo';
    }

    $('#summary').innerHTML = (data.summary||[]).map(x=>{
      const hasMore = (x.details&&x.details.length) || x.searchKeyword || x.note;
      if(!hasMore) return '<div class="box"><small>'+esc(x.label)+'</small><strong>'+esc(x.value)+'</strong></div>';
      return '<details class="box info-card"><summary><div><small>'+esc(x.label)+'</small><strong>'+esc(x.value)+'</strong><span class="tapmore">點開看完整資訊</span></div><span class="chevron">⌄</span></summary>'+bookingDetails(x)+'</details>';
    }).join('');

    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    const hasDay = params.has('day');
    const requestedDay = Math.max(1, Math.min((data.days||[]).length, parseInt(params.get('day') || '1', 10) || 1));
    const isOverview = !view && !hasDay;

    $('#daynav').innerHTML =
      '<a class="daypill '+(isOverview?'active':'')+'" href="./"><div class="dow">ALL</div><div class="date">總覽</div></a>' +
      (data.days||[]).map((d,i)=>'<a class="daypill '+(!view && !isOverview && requestedDay===i+1?'active':'')+'" href="?day='+(i+1)+'"><div class="dow">'+esc(d.dow)+'</div><div class="date">'+esc(d.date)+'</div></a>').join('') +
      '<a class="daypill '+(view==='cost'?'active':'')+'" href="?view=cost"><div class="dow">$</div><div class="date">費用</div></a>' +
      '<a class="daypill '+(view==='info'?'active':'')+'" href="?view=info"><div class="dow">INFO</div><div class="date">Tickets</div></a>';

    if (isOverview) {
      $('#days').innerHTML = renderOverview(data);
    } else if (!view) {
      const i = requestedDay - 1;
      const d = (data.days||[])[i];
      if (d) {
        const rows=(d.items||[]).map(x=>x.type==='move'?moveRow(x):eventRow(x)).join('');
        const alerts=(d.alerts||[]).map(alertBox).join('');
        const dayPhoto = d.image && d.image.url ? '<figure class="dayphoto"><img src="'+esc(d.image.url)+'" alt="'+esc(d.image.alt||d.title)+'" loading="eager"><figcaption><a target="_blank" rel="noopener" href="'+esc(d.image.source||'#')+'">'+esc(d.image.credit||'Photo')+'</a></figcaption></figure>' : '';
        $('#days').innerHTML = '<section class="day single-day" id="day-'+requestedDay+'"><div class="dayhead"><div><div class="kicker">'+esc(d.dow)+' · '+esc(d.date)+'</div><h2>'+esc(d.title)+'</h2></div><div class="daynum">'+String(requestedDay).padStart(2,'0')+'</div></div>'+(d.intro?'<p class="intro">'+esc(d.intro)+'</p>':'')+dayPhoto+'<div class="timeline">'+rows+'</div>'+alerts+'</section>';
      } else {
        $('#days').innerHTML = '';
      }
    } else {
      $('#days').innerHTML = '';
    }

    const budgetEl = $('#budget');
    if (budgetEl) {
      if (view === 'cost') {
        budgetEl.style.display = 'block';
        budgetEl.innerHTML = renderBudget(data.budget);
      } else {
        budgetEl.style.display = 'none';
        budgetEl.innerHTML = '';
      }
    }

    if (view === 'info') {
      $('#wallet').style.display = 'block';
      $('#wallet').innerHTML = '<h2>Tickets & Bookings</h2><div class="walletgrid">'+(data.wallet||[]).map(w=>{
        const hasMore = (w.details&&w.details.length) || w.searchKeyword || w.note;
        if(!hasMore) return '<div class="ticket"><small>'+esc(w.type)+'</small><b>'+esc(w.title)+'</b><div class="meta">'+esc(w.meta)+'</div></div>';
        return '<details class="ticket ticket-expand"><summary><div><small>'+esc(w.type)+'</small><b>'+esc(w.title)+'</b><div class="meta">'+esc(w.meta)+'</div><span class="tapmore darktext">點開看完整資訊</span></div><span class="chevron light">⌄</span></summary>'+bookingDetails(w,true)+'</details>';
      }).join('')+'</div>';
    } else {
      $('#wallet').style.display = 'none';
      $('#wallet').innerHTML = '';
    }

    $('#bottom').innerHTML =
      '<a class="nav '+(isOverview?'active':'')+'" href="./"><b>▦</b>總覽</a>' +
      (data.days||[]).map((d,i)=>'<a class="nav '+(!view && !isOverview && requestedDay===i+1?'active':'')+'" href="?day='+(i+1)+'"><b>'+String(i+1).padStart(2,'0')+'</b>'+esc(d.short||d.dow)+'</a>').join('') +
      '<a class="nav '+(view==='cost'?'active':'')+'" href="?view=cost"><b>$</b>費用</a>' +
      '<a class="nav '+(view==='info'?'active':'')+'" href="?view=info"><b>◎</b>資訊</a>';

    const loading = $('#loading');
    if (loading) loading.remove();

    document.querySelectorAll('.copy').forEach(btn=>btn.addEventListener('click',async()=>{
      const box=btn.closest('[data-copy]');
      const value=box?box.getAttribute('data-copy'):'';
      try{
        await navigator.clipboard.writeText(value);
        const old=btn.textContent;
        btn.textContent='已複製 ✓';
        setTimeout(()=>btn.textContent=old,1200);
      } catch(e) {
        window.prompt('請複製：',value);
      }
    }));
  }

  fetch('./trip.json?v=20261002-1330',{cache:'no-store'})
    .then(r=>{if(!r.ok) throw new Error('HTTP '+r.status); return r.json();})
    .then(render)
    .catch(err=>{
      const loading = $('#loading');
      if (loading) {
        loading.className='error';
        loading.textContent='行程資料載入失敗，請重新整理頁面。 '+err.message;
      }
    });
})();