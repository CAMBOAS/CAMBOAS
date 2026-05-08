(function(){
  function base64ToBytes(base64){ const bin=atob(base64); const bytes=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); return bytes; }
  function jpegFromCanvas(canvas, quality){ return canvas.toDataURL('image/jpeg', quality || 0.92); }
  function saveBlob(blob, filename){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},100); }
  function buildSimplePdfFromJpegDataUrl(dataUrl, widthMm, heightMm){
    const base64 = dataUrl.split(',')[1];
    const imgBytes = base64ToBytes(base64);
    const imgW = widthMm * 72 / 25.4;
    const imgH = heightMm * 72 / 25.4;
    const objects=[];
    function addObject(str){ objects.push(str); return objects.length; }
    const catalogId = addObject('<< /Type /Catalog /Pages 2 0 R >>');
    const pagesId = addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    const pageId = addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${imgW.toFixed(2)} ${imgH.toFixed(2)}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`);
    const content = `q\n${imgW.toFixed(2)} 0 0 ${imgH.toFixed(2)} 0 0 cm\n/Im0 Do\nQ`;
    const contentId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const imageHeader = `<< /Type /XObject /Subtype /Image /Width ${1} /Height ${1} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>`;
    objects[4] = imageHeader + `\nstream\n`; // placeholder, binary later
    // Build PDF binary
    const chunks=[]; const encoder = new TextEncoder();
    chunks.push(encoder.encode('%PDF-1.3\n'));
    const offsets=[0]; let pos=8;
    for(let i=0;i<objects.length;i++){
      offsets.push(pos);
      const header = `${i+1} 0 obj\n`;
      chunks.push(encoder.encode(header)); pos += header.length;
      if(i===4){
        const prefix = imageHeader + `\nstream\n`;
        chunks.push(encoder.encode(prefix)); pos += prefix.length;
        chunks.push(imgBytes); pos += imgBytes.length;
        const suffix = '\nendstream\nendobj\n';
        chunks.push(encoder.encode(suffix)); pos += suffix.length;
      } else {
        const body = objects[i] + '\nendobj\n';
        chunks.push(encoder.encode(body)); pos += body.length;
      }
    }
    const xrefStart = pos;
    let xref = `xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
    for(let i=1;i<offsets.length;i++) xref += String(offsets[i]).padStart(10,'0') + ' 00000 n \n';
    const trailer = `trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    chunks.push(encoder.encode(xref)); chunks.push(encoder.encode(trailer));
    return new Blob(chunks, {type:'application/pdf'});
  }
  window.downloadCanvasAsPdf = function(canvas, filename, widthMm){
    widthMm = widthMm || 80;
    const ratio = canvas.height / canvas.width;
    const heightMm = Math.max(40, widthMm * ratio);
    const jpeg = jpegFromCanvas(canvas, 0.92);
    const blob = buildSimplePdfFromJpegDataUrl(jpeg, widthMm, heightMm);
    saveBlob(blob, filename);
  };
  window.downloadCanvasAsImage = function(canvas, filename){ saveBlob(new Blob([base64ToBytes(canvas.toDataURL('image/png').split(',')[1])],{type:'image/png'}), filename); };
})();
