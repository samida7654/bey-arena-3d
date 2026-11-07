(() => {
  if (window.__ytGifCommandLoaded) return;
  window.__ytGifCommandLoaded = true;
  const css = `
  #ytgif-launch{position:absolute;z-index:9999;right:12px;top:12px;border:0;border-radius:22px;padding:9px 14px;background:#ff3158;color:white;font:600 13px Arial;cursor:pointer;box-shadow:0 2px 12px #0008}
  #ytgif-panel{position:fixed;z-index:100000;right:18px;top:80px;width:290px;background:#171717;color:#fff;border:1px solid #444;border-radius:14px;padding:15px;font:13px Arial;box-shadow:0 8px 35px #000b}
  #ytgif-panel h3{margin:0 0 12px;font-size:16px}#ytgif-panel label{display:block;margin:9px 0 4px;color:#ddd}
  #ytgif-panel input{box-sizing:border-box;width:100%;padding:7px;border-radius:7px;border:1px solid #555;background:#262626;color:#fff}
  #ytgif-panel button{border:0;border-radius:8px;padding:9px 11px;margin:10px 5px 0 0;background:#ff3158;color:white;font-weight:600;cursor:pointer}
  #ytgif-panel button.secondary{background:#444}#ytgif-status{margin-top:10px;color:#bbb;line-height:1.4}
  #ytgif-comment-btn{margin-left:8px;padding:5px 9px;border-radius:14px;border:1px solid #777;background:#282828;color:#fff;cursor:pointer;font-size:12px}
  `;
  const style=document.createElement('style');style.textContent=css;document.documentElement.append(style);
  let panel=null;
  const $=s=>panel.querySelector(s);
  function addLaunch(){
    const player=document.querySelector('#movie_player');
    if(!player||player.querySelector('#ytgif-launch'))return;
    if(getComputedStyle(player).position==='static')player.style.position='relative';
    const b=document.createElement('button');b.id='ytgif-launch';b.textContent='GIF on Command';
    b.onclick=()=>{ if(panel){panel.remove();panel=null;return;} openPanel(); };
    player.append(b);
  }
  function openPanel(){
    panel=document.createElement('section');panel.id='ytgif-panel';
    panel.innerHTML=`<h3>🎞 YouTube GIF Maker</h3>
      <label>Start time (seconds)</label><input id="yg-start" type="number" min="0" step=".1" value="0">
      <label>Duration (max 6 seconds)</label><input id="yg-duration" type="number" min=".5" max="6" step=".5" value="3">
      <label>Frames per second</label><input id="yg-fps" type="number" min="2" max="12" value="8">
      <label>Width (pixels)</label><input id="yg-width" type="number" min="160" max="640" step="40" value="360">
      <button id="yg-make">Create & download GIF</button><button class="secondary" id="yg-close">Close</button>
      <div id="ytgif-status">Choose a short clip, then create your GIF. Keep this tab open.</div>`;
    document.body.append(panel);
    $('#yg-close').onclick=()=>{panel.remove();panel=null;};
    $('#yg-make').onclick=makeGif;
  }
  function u16(n){return [n&255,(n>>8)&255]}
  function gifEncode(frames,w,h,delay){
    const out=[];const push=(...a)=>out.push(...a);const ascii=s=>push(...s.split('').map(c=>c.charCodeAt(0)));
    ascii('GIF89a');push(...u16(w),...u16(h),0xF7,0,0);
    for(let i=0;i<256;i++){push(((i>>5)&7)*255/7|0,((i>>2)&7)*255/7|0,(i&3)*255/3|0);}
    push(0x21,0xFF,0x0B);ascii('NETSCAPE2.0');push(3,1,0,0,0);
    for(const pix of frames){
      push(0x21,0xF9,4,0);push(...u16(delay),0,0);
      push(0x2C,0,0,0,0,...u16(w),...u16(h),0,8);
      const codes=[];let dict=new Map();let clear=256,end=257,next=258,size=9;
      const emit=c=>codes.push(c);
      emit(clear);
      let prefix=pix[0]??0;
      for(let i=1;i<pix.length;i++){
        const k=pix[i],key=prefix*256+k;
        if(dict.has(key)){prefix=dict.get(key);}
        else{
          emit(prefix);
          if(next<4096){dict.set(key,next++);if(next===(1<<size)&&size<12)size++;}
          else{emit(clear);dict=new Map();next=258;size=9;}
          prefix=k;
        }
      }
      emit(prefix);emit(end);
      let bytes=[],acc=0,bits=0;
      for(const c of codes){acc|=c<<bits;bits+=size;while(bits>=8){bytes.push(acc&255);acc>>=8;bits-=8;}}
      if(bits)bytes.push(acc&255);
      for(let i=0;i<bytes.length;i+=255){const part=bytes.slice(i,i+255);push(part.length,...part);}
      push(0);
    }
    push(0x3B);return new Uint8Array(out);
  }
  async function makeGif(){
    const video=document.querySelector('video.html5-main-video');
    if(!video){$('#ytgif-status').textContent='Video YouTube tidak dijumpai.';return;}
    const start=Math.max(0,Number($('#yg-start').value)||0);
    const duration=Math.min(6,Math.max(.5,Number($('#yg-duration').value)||3));
    const fps=Math.min(12,Math.max(2,Number($('#yg-fps').value)||8));
    const width=Math.min(640,Math.max(160,Number($('#yg-width').value)||360));
    const height=Math.max(1,Math.round(width*video.videoHeight/video.videoWidth));
    if(!video.videoWidth||!video.videoHeight){$('#ytgif-status').textContent='Tunggu video selesai dimuat dahulu.';return;}
    if(start+duration>video.duration){$('#ytgif-status').textContent='Masa mula + durasi melebihi panjang video.';return;}
    const btn=$('#yg-make');btn.disabled=true;
    try{
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});const frames=[];
      const total=Math.ceil(duration*fps);
      for(let i=0;i<total;i++){
        video.currentTime=start+i/fps;
        await new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>reject(new Error('Video mengambil masa terlalu lama.')),5000);
          video.addEventListener('seeked',()=>{clearTimeout(timer);resolve();},{once:true});
        });
        ctx.drawImage(video,0,0,width,height);
        const data=ctx.getImageData(0,0,width,height).data;const indexed=new Uint8Array(width*height);
        for(let p=0,j=0;p<data.length;p+=4,j++)indexed[j]=((data[p]>>5)<<5)|((data[p+1]>>5)<<2)|(data[p+2]>>6);
        frames.push(indexed);$('#ytgif-status').textContent='Memproses bingkai '+(i+1)+' / '+total+'…';
      }
      const bytes=gifEncode(frames,width,height,Math.max(2,Math.round(100/fps)));
      const url=URL.createObjectURL(new Blob([bytes],{type:'image/gif'}));
      const a=document.createElement('a');a.href=url;a.download='youtube-clip.gif';a.click();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      $('#ytgif-status').textContent='Siap! GIF telah dimuat turun. Jika canvas disekat oleh YouTube, cuba video lain.';
      video.play().catch(()=>{});
    }catch(e){$('#ytgif-status').textContent='Gagal: '+e.message+' (sesetengah video mungkin menyekat tangkapan canvas).';}
    finally{btn.disabled=false;}
  }
  function addCommentButton(){
    const boxes=[...document.querySelectorAll('#contenteditable-root[contenteditable="true"],ytd-commentbox #contenteditable-root')];
    for(const box of boxes){
      if(box.dataset.ytgifButton)return;box.dataset.ytgifButton='1';
      const b=document.createElement('button');b.id='ytgif-comment-btn';b.textContent='Insert GIF link';
      b.onclick=()=>{
        const url=prompt('Paste URL GIF awam (contoh: https://.../clip.gif):');
        if(!url)return;
        try{const u=new URL(url);if(!['https:','http:'].includes(u.protocol))throw 0;
          box.focus();document.execCommand('insertText',false,u.href);
        }catch{alert('URL tidak sah. Gunakan pautan http atau https.');}
      };
      box.parentElement?.append(b);
    }
  }
  const observer=new MutationObserver(()=>{addLaunch();addCommentButton();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  addLaunch();addCommentButton();
})();