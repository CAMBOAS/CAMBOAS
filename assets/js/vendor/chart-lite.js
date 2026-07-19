(function(){
  const _easings = [
    t => 1 - Math.pow(1-t, 3),                                                    /* 0 ease-out cubic  */
    t => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2,                            /* 1 ease-in-out     */
    t => { const c=2*Math.PI/3; return t===0?0:t===1?1:Math.pow(2,-10*t)*Math.sin((t*10-.75)*c)+1; }, /* 2 elastic */
    t => 1 - Math.pow(2, -10*t),                                                  /* 3 expo-out        */
    t => {                                                                         /* 4 bounce-out      */
      const n1=7.5625, d1=2.75;
      if(t<1/d1) return n1*t*t;
      if(t<2/d1) return n1*(t-=1.5/d1)*t+.75;
      if(t<2.5/d1) return n1*(t-=2.25/d1)*t+.9375;
      return n1*(t-=2.625/d1)*t+.984375;
    },
  ];

  class ChartLite {
    constructor(canvas, config){
      this.canvas = canvas && canvas.getContext ? canvas : (canvas && canvas.canvas ? canvas.canvas : null);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.config = config || {};
      this._animProgress = 1;
      this._rafId = null;
      this.resize = this.resize.bind(this);
      window.addEventListener('resize', this.resize);
      this.draw();
    }
    destroy(){
      window.removeEventListener('resize', this.resize);
      if(this._rafId) cancelAnimationFrame(this._rafId);
      if(this.ctx && this.canvas) this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }
    resize(){ this.draw(); }
    animate(easingIdx, duration){
      if(this._rafId) cancelAnimationFrame(this._rafId);
      const easing = _easings[easingIdx % _easings.length];
      const dur = duration || 900;
      const start = performance.now();
      this._animProgress = 0;
      const tick = (now) => {
        const t = Math.min((now - start) / dur, 1);
        this._animProgress = easing(t);
        this.draw();
        if(t < 1) this._rafId = requestAnimationFrame(tick);
        else { this._animProgress = 1; this.draw(); this._rafId = null; }
      };
      this._rafId = requestAnimationFrame(tick);
    }
    draw(){
      if(!this.ctx || !this.canvas) return;
      const parent = this.canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;
      const width  = Math.max(300, Math.floor(parent ? parent.clientWidth  : this.canvas.clientWidth  || 600));
      const height = Math.max(220, Math.floor(parent ? parent.clientHeight : this.canvas.clientHeight || 280));
      this.canvas.width  = width  * dpr;
      this.canvas.height = height * dpr;
      this.canvas.style.width  = width  + 'px';
      this.canvas.style.height = height + 'px';
      const ctx = this.ctx;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,width,height);
      const labels = (((this.config||{}).data||{}).labels) || [];
      const ds     = ((((this.config||{}).data||{}).datasets)||[])[0] || {};
      const data   = (ds.data||[]).map(v => Number(v)||0);
      const pad    = {l:42, r:18, t:18, b:30};
      const chartW = width  - pad.l - pad.r;
      const chartH = height - pad.t - pad.b;
      const max    = Math.max(1, ...data);
      /* grid */
      ctx.strokeStyle = 'rgba(148,163,184,0.12)'; ctx.lineWidth = 1;
      ctx.fillStyle = '#94a3b8'; ctx.font = '12px sans-serif';
      const steps = 4;
      for(let i=0; i<=steps; i++){
        const y = pad.t + (chartH/steps)*i;
        ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(width-pad.r,y); ctx.stroke();
        ctx.fillText(String(Math.round(max - (max/steps)*i)), 6, y+4);
      }
      /* x labels */
      labels.forEach((lab,i)=>{
        const x = pad.l + (chartW*Math.max(0,i)) / Math.max(1,labels.length-1);
        ctx.fillText(String(lab).slice(0,3), x-10, height-8);
      });
      /* area + line with animation progress */
      const progress = typeof this._animProgress === 'number' ? Math.max(0, Math.min(1, this._animProgress)) : 1;
      if(data.length >= 2){
        const allPts = data.map((v,i)=>({
          x: pad.l + (chartW*Math.max(0,i))/Math.max(1,data.length-1),
          y: pad.t + chartH - ((v-0)/(max-0||1))*chartH
        }));
        /* interpolate last visible point so line tip is smooth */
        const rawIdx = progress * (data.length - 1);
        const lastIdx = Math.floor(rawIdx);
        const frac = rawIdx - lastIdx;
        let pts = allPts.slice(0, lastIdx + 1);
        if(lastIdx < allPts.length - 1){
          const a = allPts[lastIdx], b = allPts[lastIdx+1];
          pts = pts.concat([{x: a.x+(b.x-a.x)*frac, y: a.y+(b.y-a.y)*frac}]);
        }
        if(pts.length < 2) pts = allPts.slice(0,2);
        /* filled area */
        ctx.beginPath();
        pts.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
        ctx.lineTo(pts[pts.length-1].x, pad.t+chartH);
        ctx.lineTo(pts[0].x, pad.t+chartH);
        ctx.closePath();
        ctx.fillStyle = 'rgba(139,92,246,0.18)'; ctx.fill();
        /* line */
        ctx.beginPath();
        pts.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
        ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2.5; ctx.stroke();
        /* dots — only at fully rendered data points */
        ctx.fillStyle = '#22d3ee';
        allPts.slice(0, lastIdx+1).forEach(p => {
          ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill();
        });
      }
    }
  }
  window.Chart = ChartLite;
})();
