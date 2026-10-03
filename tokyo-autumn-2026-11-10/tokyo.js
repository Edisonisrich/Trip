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
    const parseHour=s=>{
      const m=String(s||'').match(/(\d{1,2}):(\d{2})/);
      return m ? Number(m[1])+Number(m[2])/60 : null;
    };
    const classify=x=>{
      const t=(x.title||'')+' '+(x.desc||'')+' '+(x.mode||'');
      if(/JX|STARLUX|航空|班機/.test(t)) return 'flight';
      if(/Bistro|用餐|餐/.test(t)) return 'meal';
      if(/租車|自駕|CHARTER|包車|→/.test(t)||x.type==='move') return 'move';
      if(/住宿|Hotel|House|La Vista|Check-in|Check-out/.test(t)) return 'hotel';
      return 'play';
    };
    const days=data.days||[];
    const hours=[9,10,11,12,13,14,15,16,17,18,19,20,21,22];
    const headers=days.map((d,i)=>
      '<a class="cal-h" href="?day='+(i+1)+'" style="grid-column:'+(i+2)+';grid-row:1"><b>'+esc(d.date)+'</b><small>'+esc(d.dow)+' · '+esc(d.short||'')+'</small></a>'
    ).join('');
    let slots='';
    hours.forEach((h,ri)=>{
      const row=ri+2;
      slots+='<div class="cal-t" style="grid-row:'+row+'">'+String(h).padStart(2,'0')+':00</div>';
      days.forEach((_,di)=>slots+='<div class="cal-slot" style="grid-column:'+(di+2)+';grid-row:'+row+'"></div>');
    });
    const blocks=[];
    days.forEach((d,di)=>{
      (d.items||[]).forEach(x=>{
        const h=parseHour(x.time);
        if(h==null) return;
        const cls=classify(x);
        const title=x.type==='move' ? esc(x.from)+' → '+esc(x.to) : esc(x.title||'');
        const row=Math.floor(Math.max(9,Math.min(22,h))-9)+2;
        const span=cls==='flight'?2:1;
        blocks.push('<a href="?day='+(di+1)+'" class="cal-b cb-'+cls+'" style="grid-column:'+(di+2)+';grid-row:'+row+' / span '+span+'"><b>'+title+'</b><span>'+esc(x.time||'')+'</span></a>');
      });
    });
    const mobile=days.map((d,di)=>{
      const rows=(d.items||[]).filter(x=>parseHour(x.time)!=null).map(x=>{
        const cls=classify(x);
        const title=x.type==='move' ? esc(x.from)+' → '+esc(x.to) : esc(x.title||'');
        return '<a class="mrow" href="?day='+(di+1)+'"><div class="mtime">'+esc(x.time||'')+'</div><div class="cal-b cb-'+cls+'"><b>'+title+'</b></div></a>';
      }).join('');
      return '<section class="mcal-day"><a class="mcal-dh" href="?day='+(di+1)+'"><b>'+esc(d.date)+'</b><span>'+esc(d.dow)+' · '+esc(d.short||'')+'</span></a>'+rows+'</section>';
    }).join('');

    return '<section class="trip-overview">'+
      '<div class="overview-heading"><div><div class="kicker">TRIP AT A GLANCE</div><h2>行程總表</h2></div><p>只顯示已確認時間；完整內容請用上方日期 Tab 查看。</p></div>'+
      '<div class="cal-wrap"><div class="cal"><div class="cal-corner"></div>'+headers+slots+blocks.join('')+'</div></div>'+
      '<div class="mcal">'+mobile+'</div>'+
      '<div class="cal-legend"><span><i class="cb-flight"></i>班機</span><span><i class="cb-move"></i>交通</span><span><i class="cb-meal"></i>餐飲</span><span><i class="cb-hotel"></i>住宿</span></div>'+
    '</section>';
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

  fetch('./trip.json?ts=20261004a')
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