(function(){
  class ChartLite {
    constructor(canvas, config){
      this.canvas = canvas && canvas.getContext ? canvas : (canvas && canvas.canvas ? canvas.canvas : null);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.config = config || {};
      this.resize = this.resize.bind(this);
      window.addEventListener('resize', this.resize);
      this.draw();
    }
    destroy(){ window.removeEventListener('resize', this.resize); if(this.ctx&&this.canvas) this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height); }
    resize(){ this.draw(); }
    draw(){
      if(!this.ctx || !this.canvas) return;
      const parent = this.canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(300, Math.floor((parent ? parent.clientWidth : this.canvas.clientWidth || 600)));
      const height = Math.max(220, Math.floor((parent ? parent.clientHeight : this.canvas.clientHeight || 280)));
      this.canvas.width = width * dpr; this.canvas.height = height * dpr;
      this.canvas.style.width = width+'px'; this.canvas.style.height = height+'px';
      const ctx = this.ctx; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,width,height);
      const labels = (((this.config||{}).data||{}).labels)||[];
      const ds = ((((this.config||{}).data||{}).datasets)||[])[0]||{};
      const data = (ds.data||[]).map(v=>Number(v)||0);
      const pad={l:42,r:18,t:18,b:30};
      const chartW=width-pad.l-pad.r, chartH=height-pad.t-pad.b;
      const max=Math.max(1,...data), min=0;
      // bg
      ctx.fillStyle='rgba(15,23,42,0.0)'; ctx.fillRect(0,0,width,height);
      // grid
      ctx.strokeStyle='rgba(148,163,184,0.12)'; ctx.lineWidth=1;
      ctx.fillStyle='#94a3b8'; ctx.font='12px sans-serif';
      const steps=4;
      for(let i=0;i<=steps;i++){
        const y=pad.t + (chartH/steps)*i;
        ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(width-pad.r,y); ctx.stroke();
        const val=Math.round(max - (max/steps)*i);
        ctx.fillText(String(val), 6, y+4);
      }
      // x labels
      labels.forEach((lab,i)=>{ const x=pad.l + (chartW*Math.max(0,i))/Math.max(1,labels.length-1); ctx.fillText(String(lab).slice(0,3), x-10, height-8); });
      // area
      if(data.length){
        const pts=data.map((v,i)=>({x:pad.l + (chartW*Math.max(0,i))/Math.max(1,data.length-1), y:pad.t + chartH - ((v-min)/(max-min||1))*chartH}));
        ctx.beginPath(); pts.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
        ctx.lineTo(pts[pts.length-1].x,pad.t+chartH); ctx.lineTo(pts[0].x,pad.t+chartH); ctx.closePath();
        ctx.fillStyle='rgba(139,92,246,0.18)'; ctx.fill();
        ctx.beginPath(); pts.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
        ctx.strokeStyle='#8b5cf6'; ctx.lineWidth=2.5; ctx.stroke();
        ctx.fillStyle='#22d3ee'; pts.forEach(p=>{ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill();});
      }
    }
  }
  window.Chart = ChartLite;
})();
