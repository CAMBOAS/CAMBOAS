(function(){
  function cloneInlineComputedStyles(source, target){
    const walkerSource=document.createTreeWalker(source, NodeFilter.SHOW_ELEMENT);
    const walkerTarget=document.createTreeWalker(target, NodeFilter.SHOW_ELEMENT);
    while(true){
      const s=walkerSource.nextNode(); const t=walkerTarget.nextNode();
      if(!s || !t) break;
      const cs=getComputedStyle(s);
      let css='';
      for(const prop of ['font','fontFamily','fontSize','fontWeight','lineHeight','color','background','backgroundColor','padding','margin','border','borderRadius','boxShadow','display','position','top','left','right','bottom','width','height','minWidth','minHeight','maxWidth','maxHeight','textAlign','justifyContent','alignItems','gap','gridTemplateColumns','flexDirection','overflow','whiteSpace']){
        css += prop.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())+':'+cs[prop]+';';
      }
      t.setAttribute('style', (t.getAttribute('style')||'') + css);
      if(t.tagName==='CANVAS'){ try{ const img=document.createElement('img'); img.src=s.toDataURL(); img.setAttribute('style', t.getAttribute('style')||''); t.replaceWith(img);}catch(e){} }
    }
  }
  window.html2canvas = function(node, opts){
    opts = opts || {};
    return new Promise(function(resolve, reject){
      try{
        const scale = opts.scale || 1;
        const rect = node.getBoundingClientRect();
        const width = Math.ceil(opts.windowWidth || opts.width || rect.width || node.scrollWidth || 300);
        const height = Math.ceil(opts.windowHeight || opts.height || rect.height || node.scrollHeight || 150);
        const clone = node.cloneNode(true);
        cloneInlineComputedStyles(node, clone);
        const wrap = document.createElement('div');
        wrap.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
        wrap.style.width = width+'px'; wrap.style.height = height+'px';
        wrap.style.background = opts.backgroundColor || '#ffffff';
        wrap.appendChild(clone);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width*scale}" height="${height*scale}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(wrap)}</foreignObject></svg>`;
        const img = new Image();
        img.onload = function(){
          const canvas = document.createElement('canvas'); canvas.width = width*scale; canvas.height = height*scale;
          const ctx = canvas.getContext('2d');
          if(opts.backgroundColor){ ctx.fillStyle = opts.backgroundColor; ctx.fillRect(0,0,canvas.width,canvas.height); }
          ctx.drawImage(img,0,0,canvas.width,canvas.height); resolve(canvas);
        };
        img.onerror = reject;
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      } catch(err){ reject(err); }
    });
  };
})();
