(function (global) {
  const CopyReceipt = {
    async copy(data = {}) {
      const normalized = normalizeData(data);
      const text = buildCopyText(normalized);

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return { mode: "clipboard", text };
      }

      fallbackCopy(text);
      return { mode: "fallback", text };
    },

    buildText(data = {}) {
      return buildCopyText(normalizeData(data));
    }
  };

  function normalizeData(data) {
    const items = Array.isArray(data.items) ? data.items : [];
    const deliveryFee = Math.max(0, Number(data.deliveryFee || 0));
    const subtotal = Number(data.subtotal || items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0));
    const grandTotal = Number(data.grandTotal || subtotal + deliveryFee);

    return {
      title: data.title || "វិក័យប័ត្រ",
      date: data.date || "-",
      customer: data.customer || "-",
      phone: data.phone || "-",
      address: data.address || "-",
      deliveryName: data.deliveryName || "-",
      note: data.note || "-",
      page: data.page || "-",
      closeBy: data.closeBy || "-",
      payment: data.payment || "-",
      receiptNo: data.receiptNo || "",
      servicePhone: data.servicePhone || "015 58 68 78 / 089 58 68 78",
      items,
      subtotal,
      deliveryFee,
      grandTotal,
      grandRiel: Number(data.grandRiel || Math.round(grandTotal * 4100))
    };
  }

  function formatDisplayMoney(num) {
    const n = Number(num || 0);
    return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
  }

function buildCopyText(data) {
  const lines = [];
  const separator = "................................................";

  // Header
  lines.push(`🧾 ${data.title} 📅 ${data.date}`);
  lines.push(separator);

  // Customer Info
  lines.push(`👤 ឈ្មោះ:\t${data.customer}`);
  lines.push(`📞 លេខទូរសព្ទ:\t${data.phone}`);
  lines.push(`📍 ទីតាំង:\t${data.address}`);
  lines.push(`🚚 អ្នកដឹកជញ្ជូន:\t${data.deliveryName}`);
  lines.push(`📝 Note:\t\t${data.note}`);
  lines.push(separator);

  // Product Section (FIX: add missing line here)
  lines.push("📦 ផលិតផល:");
  lines.push(separator);

  data.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.product}`);
    lines.push(`   ចំនួន ${item.qty} ឈុត x ${formatDisplayMoney(item.price)}      = ${formatDisplayMoney(item.subtotal)}`);
  });

  // Summary
  lines.push(separator);
  lines.push(`💵 សរុបទំនិញ: ${formatDisplayMoney(data.subtotal)}`);
  lines.push(`🚛 សេវាដឹក: ${data.deliveryFee === 0 ? "ហ្វ្រីដឹក" : formatDisplayMoney(data.deliveryFee)}`);
  lines.push(`💳 ការទូទាត់: ${data.payment}`);
  lines.push(`💰 តម្លៃសរុប: ${formatDisplayMoney(data.grandTotal)}`);
  lines.push(`🇰🇭 ប្រាក់រៀល: ${Number(data.grandRiel || 0).toLocaleString()}៛`);

  // Footer
  lines.push(separator);
  lines.push(`📄 Page: ${data.page} | CloseBy: ${data.closeBy}`);
  lines.push(`☎️ លេខបម្រើអតិថិជន: ${data.servicePhone}`);
  lines.push(separator);

  return lines.join("\n");
}

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = document.execCommand("copy");
    textarea.remove();
    if (!ok) throw new Error("Copy failed.");
  }

  global.CopyReceipt = CopyReceipt;
})(window);
