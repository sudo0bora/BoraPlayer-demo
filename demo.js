/* Deliberately standalone: no Tauri, backend, account or YouTube code. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id), content=$('demo-content'), media=$('demo-media');
  const names=['Midnight Current','Soft Focus','Blue Motion','Golden Hour','Slow Orbit','After the Rain','Open Windows','Night Drive','Quiet Frequency','Last Light','Paper Planes','Home Again'];
  const catalog=names.map((title,i)=>({id:`sample-${i}`,title,artist:i%2?'Studio North':'Bora Sessions',art:`art/cover-${i}.svg`,src:`samples/session-${i%4}.wav`,sample:true,video:false}));
  const saved=new Set(['sample-0','sample-2','sample-4','sample-6','sample-8','sample-10']);
  const favorites=new Set(['sample-0','sample-4']), local=[], playlists=[{name:'After hours',ids:['sample-0','sample-1','sample-4','sample-7']},{name:'A little focus',ids:['sample-2','sample-3','sample-5','sample-8']}];
  let view='browse', tab='for-you', libraryTab='songs', query='', current=catalog[0], queue=[...catalog], mode='audio', selectedPlaylist=null, noticeTimer, shuffle=false, repeat=false;
  const el=(tag,cls,text)=>{ const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n; };
  function button(label,cls,action,aria) { const b=el('button',cls,label); b.type='button';if(aria)b.setAttribute('aria-label',aria);b.addEventListener('click',action);return b; }
  function notify(text) { $('demo-status').textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('demo-status').textContent='',4500); }
  function ad(id) { const n=el('div','ad-slot discovery-ad-slot'); n.dataset.adSlot=id;AdSlot.render(id,n);return n; }
  function all() { return [...catalog,...local]; }
  function matches(t) { return `${t.title} ${t.artist}`.toLowerCase().includes(query.toLowerCase()); }
  function save(t) { saved.has(t.id)?saved.delete(t.id):saved.add(t.id);render();update();notify(saved.has(t.id)?'Saved to this demo library.':'Removed from this demo library.'); }
  function favorite(t) { favorites.has(t.id)?favorites.delete(t.id):favorites.add(t.id);render();update(); }
  function card(t,index,list) {
    const n=el('article','music-card'), art=el('div','music-card-art'), img=el('img');img.src=t.art;img.alt='';img.loading='lazy';art.append(img,button('','demo-cover-button',()=>play(t,list),`Play ${t.title}`));
    if((index+1)%5===0) AdSlot.thumbnail(art,`discover-art-${index+1}`);
    const actions=el('div','demo-card-actions');
    const playBtn=button('▶','',()=>play(t,list),`Play ${t.title}`), saveBtn=button(saved.has(t.id)?'✓':'＋','',()=>save(t),`${saved.has(t.id)?'Unsave':'Save'} ${t.title}`), favBtn=button(favorites.has(t.id)?'♥':'♡','',()=>favorite(t),`Favorite ${t.title}`);
    saveBtn.setAttribute('aria-pressed',String(saved.has(t.id)));favBtn.setAttribute('aria-pressed',String(favorites.has(t.id)));
    actions.append(playBtn,saveBtn,favBtn,button('⋯','',()=>trackMenu(t),`More actions for ${t.title}`));
    n.append(art,el('h3','music-card-title',t.title),el('p','music-card-artist',t.artist),actions);return n;
  }
  function row(t,index,list,advertising=true) {
    const n=el('div','demo-row'+(current?.id===t.id?' is-playing':''));
    let art=el('img');art.src=t.art;art.alt='';
    if(advertising&&(index+1)%5===0) { art=el('div','track-sponsored-art');AdSlot.thumbnail(art,`library-art-${index+1}`);n.append(art); }
    const info=el('span');info.append(el('strong','',t.title),el('small','',t.artist));
    const b=button('','',()=>play(t,list),`Play ${t.title}`);if(art.tagName==='IMG')b.append(art);b.append(info);
    n.append(b,button(favorites.has(t.id)?'♥':'♡','icon-btn',()=>favorite(t),`Favorite ${t.title}`),button('⋯','icon-btn',()=>trackMenu(t),`More actions for ${t.title}`));return n;
  }
  function rows(list) { if(!list.length)content.append(el('p','demo-empty','Nothing here yet. Save a sample song or add local files.'));list.forEach((t,i)=>content.append(row(t,i,list))); }
  function libraryNavigation() {
    const nav=el('div','demo-library-tabs');
    for(const [key,label] of [['songs','Saved songs'],['favorites','Favorites'],['playlists','Playlists'],['artists','Artists']]) { const b=button(label,'',()=>{libraryTab=key;selectedPlaylist=null;render();});b.setAttribute('aria-pressed',String(libraryTab===key));nav.append(b); }
    content.append(nav);
  }
  function render() {
    content.replaceChildren();$('view-title').textContent=view==='browse'?'Discover':view==='online-library'?'Library':view==='library'?'Downloads':'Settings';
    document.querySelectorAll('#nav-links [data-view]').forEach(n=>n.classList.toggle('active',n.dataset.view===view));
    $('demo-tabs').hidden=view!=='browse';$('demo-search-form').hidden=view==='settings';$('demo-add').hidden=view==='settings';
    if(view==='browse') {
      let list=all().filter(matches);if(tab==='explore')list=[...list].reverse();if(tab==='trending')list=[...list.slice(4),...list.slice(0,4)];
      content.append(ad('discover-banner-1'));
      const section=el('section','music-shelf'), grid=el('div','music-grid');
      section.append(el('h2','',query?`Results for “${query}”`:tab==='radio'?'Start a sample station':tab==='explore'?'Something to get lost in':tab==='trending'?'On repeat':'Your next listen'));
      list.forEach((t,i)=>grid.append(card(t,i,list)));section.append(grid);content.append(section);
      if(!list.length)content.append(el('p','demo-empty','No matches in the demo collection. Online search is available in the installed app.'));
      if(!query){const p=el('p','demo-empty','Fictional collection · original instrumental samples. Add your files for your own music.');content.append(p);}return;
    }
    if(view==='online-library') {
      libraryNavigation();
      if(libraryTab==='playlists') {
        const h=el('div','demo-playlist-header');h.append(el('h2','',selectedPlaylist?.name||'Made by you'),button('＋ New playlist','secondary-btn',()=>newPlaylist()));content.append(h);
        if(selectedPlaylist){content.append(button('← All playlists','demo-text-button',()=>{selectedPlaylist=null;render();}));rows(all().filter(t=>selectedPlaylist.ids.includes(t.id)&&matches(t)));}
        else {const grid=el('div','playlists-grid');playlists.forEach(p=>{const b=button('','playlist-card demo-playlist-card',()=>{selectedPlaylist=p;render();});b.append(el('h3','',p.name),el('p','',`${p.ids.length} songs`));grid.append(b);});const a=el('div','playlist-card grid-ad-card');AdSlot.render('playlist-grid-ad-1',a,{bare:true});grid.append(a);content.append(grid);}return;
      }
      if(libraryTab==='artists') {
        const grid=el('div','playlists-grid');[...new Set(all().filter(t=>saved.has(t.id)).map(t=>t.artist))].forEach(name=>{const b=button('','playlist-card',()=>{query=name;$('demo-search').value=name;libraryTab='songs';render();});b.append(el('h3','',name),el('p','','View saved songs'));grid.append(b);});content.append(grid);return;
      }
      rows(all().filter(t=>saved.has(t.id)&&(libraryTab!=='favorites'||favorites.has(t.id))&&matches(t)));content.append(ad('library-footer-1'));return;
    }
    if(view==='library') {content.append(el('p','demo-empty','Local files selected in this tab appear here. This demo never downloads or converts YouTube content.'));rows(local.filter(matches));return;}
    const settings=el('div','demo-settings');
    const appearance=el('div');appearance.append(el('h2','','Make it yours'),el('p','','Try the same light and dark surfaces used by the app.'),button('Dark','secondary-btn',()=>document.documentElement.dataset.theme='dark'),button('Light','secondary-btn',()=>document.documentElement.dataset.theme='light'));
    const privacy=el('div');privacy.append(el('h2','','A demo with no account'),el('p','','No login, backend, analytics or live YouTube connection. Local files and edits stay in this tab. Reload to reset the collection.'),button('About BoraPlayer','secondary-btn',showAbout),button('Reset demo','secondary-btn',reset));settings.append(appearance,privacy);content.append(settings);
  }
  function dialog(title) {const d=el('dialog'), h=el('h2','',title), close=button('Close','secondary-btn',()=>d.close());d.append(h);d.addEventListener('close',()=>d.remove());document.body.append(d);return{d,close};}
  function newPlaylist(t) { const {d,close}=dialog('New playlist'), form=el('form'), label=el('label','','Playlist name'), input=el('input','search-input');input.maxLength=80;input.required=true;input.id='demo-playlist-name';label.htmlFor=input.id;const create=el('button','primary-btn','Create playlist');create.type='submit';form.append(label,input,create,close);form.addEventListener('submit',e=>{e.preventDefault();if(!input.value.trim())return;playlists.push({name:input.value.trim(),ids:t?[t.id]:[]});d.close();render();notify('Playlist created in this tab.');});d.append(form);d.showModal();input.focus(); }
  function trackMenu(t) {const {d,close}=dialog(t.title);d.append(el('p','',t.sample?'Original generated demo sample.':'Local file · stays in this tab.'),button(saved.has(t.id)?'Remove from Library':'Save to Library','secondary-btn',()=>{save(t);d.close();}));
    playlists.forEach(p=>d.append(button(`Add to ${p.name}`,'secondary-btn',()=>{if(!p.ids.includes(t.id))p.ids.push(t.id);d.close();notify(`Added to ${p.name}.`);})));
    d.append(button('＋ New playlist','secondary-btn',()=>{d.close();newPlaylist(t);}),close);d.showModal(); }
  async function play(t,list=queue) {
    queue=[...list];if(!queue.some(x=>x.id===t.id))queue.unshift(t);
    if(current?.id!==t.id||!media.getAttribute('src')) {current=t;media.src=t.src;media.load();}
    update();try{await media.play();}catch{notify('This browser could not play that format. Try MP3, WAV or MP4.');}update();
  }
  function toggle(){if(media.paused)play(current);else media.pause();}
  function next(direction=1){let i=queue.findIndex(t=>t.id===current.id);i=shuffle?Math.floor(Math.random()*queue.length):(i+direction+queue.length)%queue.length;if(queue[i])play(queue[i]);}
  function update() {
    $('current-track-name').textContent=current.title;$('current-track-artist').textContent=current.artist;
    $('current-album-art').style.backgroundImage=`url("${current.art}")`;$('current-album-art').style.backgroundSize='cover';$('current-album-art').replaceChildren();
    $('demo-stage-title').textContent=current.title;$('demo-stage-artist').textContent=current.artist;$('demo-stage-cover').src=current.art;
    $('play-btn').innerHTML=`<i class="fa-solid fa-${media.paused?'play':'pause'}" aria-hidden="true"></i>`;$('play-btn').setAttribute('aria-label',media.paused?'Play':'Pause');
    $('player-save').disabled=false;$('player-save').setAttribute('aria-pressed',String(saved.has(current.id)));$('player-save').innerHTML=saved.has(current.id)?'✓':'＋';
    $('player-download').disabled=false;$('player-download').setAttribute('aria-label','About downloads in this demo');
    $('shuffle-btn').setAttribute('aria-pressed',String(shuffle));$('repeat-btn').setAttribute('aria-pressed',String(repeat));
    $('demo-mode').textContent=mode==='audio'?'Video':'Audio';$('demo-mode').setAttribute('aria-pressed',String(mode==='video'));
    $('demo-stage-art').classList.toggle('video-mode',mode==='video');$('demo-visual').hidden=mode!=='video'||current.video;
    time();renderQueue();
  }
  function fmt(v){return `${Math.floor(v/60)}:${String(Math.floor(v%60)).padStart(2,'0')}`;}
  function time(){const duration=Number.isFinite(media.duration)?media.duration:16;$('time-current').textContent=fmt(media.currentTime||0);$('time-total').textContent=fmt(duration);$('seek-bar').value=String((media.currentTime||0)/duration*100);$('player-controls').style.setProperty('--playback-progress',`${$('seek-bar').value}%`);}
  function renderQueue(){const panel=$('demo-stage-panel');if(panel.dataset.kind==='lyrics')return;panel.replaceChildren();queue.forEach((t,i)=>panel.append(row(t,i,queue,false)));}
  let previousFocus;
  function stage(open=true){if(open){previousFocus=document.activeElement;$('demo-stage').hidden=false;$('app-container').inert=true;$('demo-stage-controls').append(document.querySelector('#player-controls .playback-controls'));$('demo-stage-close').focus();update();}else{$('demo-stage').hidden=true;$('app-container').inert=false;$('player-controls').insertBefore(document.querySelector('#demo-stage-controls .playback-controls'),$('player-extras'));previousFocus?.focus();}}
  function showAbout(){$('demo-about').showModal();}
  function reset(){media.pause();media.removeAttribute('src');media.load();for(const t of local)URL.revokeObjectURL(t.src);local.length=0;saved.clear();['sample-0','sample-2','sample-4','sample-6','sample-8','sample-10'].forEach(id=>saved.add(id));favorites.clear();favorites.add('sample-0');favorites.add('sample-4');playlists.splice(2);playlists[0].ids=['sample-0','sample-1','sample-4','sample-7'];playlists[1].ids=['sample-2','sample-3','sample-5','sample-8'];current=catalog[0];queue=[...catalog];view='browse';query='';$('demo-search').value='';mode='audio';shuffle=repeat=false;media.loop=false;selectedPlaylist=null;render();update();notify('Demo reset. Selected local files released.');}
  document.querySelectorAll('#nav-links [data-view]').forEach(n=>{n.tabIndex=0;n.setAttribute('role','button');const nav=()=>{view=n.dataset.view;query='';$('demo-search').value='';render();};n.addEventListener('click',nav);n.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();nav();}});});
  document.querySelectorAll('[data-tab]').forEach(n=>n.addEventListener('click',()=>{tab=n.dataset.tab;document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===n)));render();}));
  $('demo-search-form').addEventListener('submit',e=>{e.preventDefault();query=$('demo-search').value.trim();render();});$('demo-search').addEventListener('input',()=>{query=$('demo-search').value.trim();render();});
  for(const id of ['demo-help','demo-tour','demo-sidebar-help'])$(id).addEventListener('click',showAbout);$('demo-start').addEventListener('click',()=>$('demo-about').close());
  $('demo-add').addEventListener('click',()=>$('demo-files').click());$('demo-files').addEventListener('change',e=>{
    let count=0,rejected=0;for(const file of [...e.target.files]) {const extension=file.name.split('.').pop().toLowerCase();if(local.length>=20||file.size>100*1024*1024||!['mp3','wav','ogg','oga','flac','m4a','aac','mp4','webm','opus'].includes(extension)){rejected++;continue;}const video=['mp4','webm'].includes(extension);local.push({id:`local-${local.length}-${Date.now()}`,title:file.name.replace(/\.[^.]+$/,''),artist:'Local file',src:URL.createObjectURL(file),art:`art/cover-${local.length%12}.svg`,video,sample:false});count++;}e.target.value='';view='library';query='';$('demo-search').value='';render();notify(`${count} local file(s) added. Nothing uploaded.${rejected?' Some files exceeded the format, 100 MiB or 20-file limit.':''}`);
  });
  $('play-btn').addEventListener('click',toggle);$('next-btn').addEventListener('click',()=>next());$('prev-btn').addEventListener('click',()=>{if(media.currentTime>3)media.currentTime=0;else next(-1);});
  $('shuffle-btn').addEventListener('click',()=>{shuffle=!shuffle;update();});$('repeat-btn').addEventListener('click',()=>{repeat=!repeat;media.loop=repeat;update();});
  $('seek-bar').addEventListener('input',e=>{if(Number.isFinite(media.duration))media.currentTime=Number(e.target.value)/100*media.duration;time();});
  $('volume-slider').addEventListener('input',e=>media.volume=Number(e.target.value)/100);$('mute-btn').addEventListener('click',()=>{media.muted=!media.muted;$('mute-btn').setAttribute('aria-label',media.muted?'Unmute':'Mute');});
  $('player-save').addEventListener('click',()=>save(current));$('player-download').addEventListener('click',()=>notify('Online downloads are an installed-app feature. Use Add local files to try playback here.'));
  const now=document.querySelector('.now-playing');now.tabIndex=0;now.setAttribute('role','button');now.setAttribute('aria-label','Open now playing');now.addEventListener('click',()=>stage());now.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();stage();}});
  $('fullscreen-toggle-btn').addEventListener('click',()=>stage());$('queue-toggle-btn').addEventListener('click',()=>stage());$('demo-stage-close').addEventListener('click',()=>stage(false));
  $('demo-mode').addEventListener('click',()=>{mode=mode==='audio'?'video':'audio';update();});
  $('demo-queue-tab').addEventListener('click',()=>{$('demo-stage-panel').dataset.kind='queue';renderQueue();});$('demo-lyrics-tab').addEventListener('click',()=>{$('demo-stage-panel').dataset.kind='lyrics';$('demo-stage-panel').textContent=current.sample?'An instrumental moment. The installed app supports lyrics for your music.':'Lyrics are unavailable for files imported into this demo.';});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('demo-stage').hidden&&!document.querySelector('dialog[open]'))stage(false);if(e.key==='Tab'&&!$('demo-stage').hidden&&!document.querySelector('dialog[open]')){const nodes=[...$('demo-stage').querySelectorAll('button,input')].filter(n=>n.getClientRects().length&&!n.disabled);if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}}});
  media.addEventListener('timeupdate',time);media.addEventListener('loadedmetadata',time);media.addEventListener('play',update);media.addEventListener('pause',update);media.addEventListener('ended',()=>next());media.addEventListener('error',()=>notify('Could not play that file. Try a browser-supported audio or video format.'));
  window.addEventListener('beforeunload',()=>local.forEach(t=>URL.revokeObjectURL(t.src)));
  const region=el('div','player-track-region');now.before(region);region.append(now,document.querySelector('.player-song-actions'));
  render();update();
})();
