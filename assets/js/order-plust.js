(function () {
  const FIELD_MAP = {
    customer: ["customer", "ឈ្មោះអតិថិជន", "ឈ្មោះ", "👤", "name"],
    phone: ["លេខទូរសព្ទ", "លេខទូរស័ព្ទ", "ទូរសព្ទ", "ទូរស័ព្ទ", "📞", "phone", "tel"],
    address: ["ទីតាំង", "អាសយដ្ឋាន", "address", "location", "📍"],
    delivery: ["ដឹកជញ្ជូនតាមរយៈ", "ដឹកជញ្ជូនតាមរយ", "ដឹកជញ្ជូន", "delivery name", "delivery", "🚚"],
    deliveryFee: ["ថ្លៃដឹកជញ្ជូន", "សេវាដឹកជញ្ជូន", "សេវាដឹក", "delivery fee"],
    payment: ["បង់ប្រាក់", "ការទូទាត់", "payment", "💳"],
    note: ["note", "ចំណាំ", "📝"],
    date: ["ថ្ងៃខែឆ្នាំ", "កាលបរិច្ឆេទ", "date"],
    total: ["សរុប", "grand total", "total"],
    pageFooter: ["brand", "page"]
  };

  const PAYMENT_ALIASES = {
    AC: ["ac", "acleda", "អេសុី", "ac bank"],
    ABA: ["aba", "aba bank"],
    Wing: ["wing"],
    Delivery: ["delivery", "cash on delivery", "cod", "ទូទាត់ពេលទទួល", "បង់ពេលទទួល"],
    Other: ["other", "ផ្សេងៗ"]
  };

  const DELIVERY_ALIAS_MAP = [
    ["វីរៈ ប៊ុនថាំ", ["វិរៈប៊ុនថាំ", "វិរៈ ប៊ុនថាំ", "វីរៈប៊ុនថាំ", "វីរៈ ប៊ុនថាំ", "វីរះប៊ុនថាំ", "វីរះ ប៊ុនថាំ", "វិរះប៊ុនថាំ", "វិរះ ប៊ុនថាំ", "vireak", "vireak buntham", "buntham"]],
    ["J&T", ["j&t", "j&t express", "j and t"]],
    ["DRSB", ["drsb"]],
    ["ដឹកខ្លួនឯង", ["free ដឹក", "freeដឹក", "ដឹកខ្លួនឯង", "self delivery", "pickup"]],
    ["ភ្នំពេញ តាធំ", ["តាធំ"]],
    ["ភ្នំពេញ តាតូច", ["តាតូច"]]
  ];

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[៖:|/\\.,+*()[\]{}!@#$%^&_=~`"'<>?-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeCompact(value) {
    return normalizeText(value).replace(/\s+/g, "");
  }

  function compactKh(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[\s៖:|/\\.,+*()[\]{}!@#$%^&_=~`"'<>?-]+/g, "")
      .trim();
  }

  function parseMoney(value) {
    const cleaned = String(value || "").replace(/,/g, "");
    const match = cleaned.match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function hasEl(key) {
    return typeof els !== "undefined" && !!els && !!els[key];
  }

  function buildAliasSet(product) {
    const aliases = new Set([
      product.name,
      product.detail,
      String(product.name || "").replace(/&/g, " និង "),
      String(product.name || "").replace(/&/g, " និង ").replace(/\//g, " "),
      String(product.detail || "").replace(/&/g, " និង "),
      String(product.detail || "").replace(/\//g, " "),
      String(product.name || "").replace(/VIP 5in1/gi, "5in1"),
      String(product.detail || "").replace(/VIP 5in1/gi, "5in1")
    ].filter(Boolean));

    const merged = `${product.name || ""} ${product.detail || ""}`;

    if (/fiber|ហ្វៃប័រ/i.test(merged)) {
      aliases.add("ហ្វៃប័រ");
      aliases.add("ហ្វាយប័រ");
      aliases.add("fiber");
      aliases.add("ហ្វៃប័រផាសសិន");
      aliases.add("ហ្វាយប័រ ផាសសិន");
      aliases.add("ហ្វាយប័រ6ប្រអប់");
      aliases.add("កាហ្វេ+ហ្វាយប័រឈុត6ប្រអប់");
      aliases.add("កាហ្វេ ហ្វាយប័រ ឈុត6ប្រអប់");
    }

    if (/coffee|កាហ្វេ/i.test(merged)) {
      aliases.add("កាហ្វេ");
      aliases.add("កាហ្វេ ccr");
      aliases.add("coffee ccr");
      aliases.add("កាហ្វេសម្រក");
      aliases.add("កាហ្វេ+ហ្វាយប័រ");
      aliases.add("កាហ្វេហ្វាយប័រ");
    }

    if (/sunscreen/i.test(merged)) aliases.add("sunscreen");
    if (/jely/i.test(merged) && /សាប៊ូកក់/i.test(merged)) aliases.add("សាប៊ូកក់ jely");
    if (/cc serum/i.test(merged)) aliases.add("cc serum");

    if (/សាប៊ូដុសខ្លួន/i.test(merged)) {
      aliases.add("សាប៊ូដុសខ្លួន");
      aliases.add("សាប៊ូដុសខ្លួនលាយ");
      aliases.add("body wash ccr");
    }

    return Array.from(aliases)
      .map((alias) => ({ raw: alias, compact: normalizeCompact(alias), khCompact: compactKh(alias), spaced: normalizeText(alias) }))
      .filter((alias) => alias.compact.length >= 2);
  }

  function createUI() {
    const noteSection = document.querySelector('.note-card');
    if (!noteSection || document.getElementById('receiptPasteToggleBtn')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'receipt-paste-tool';
    wrapper.innerHTML = `
      <style>
        .receipt-paste-tool { margin-bottom: 12px; display: grid; gap: 8px; }
        .receipt-paste-toggle-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .receipt-paste-toggle-btn {
          border: 1px solid rgba(139,92,246,.3);
          background: rgba(139,92,246,.12);
          color: #c4b5fd; border-radius: 8px;
          min-height: 34px; padding: 0 14px;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: .15s ease;
          font-family: inherit;
        }
        .receipt-paste-toggle-btn:hover { background: rgba(139,92,246,.22); }
        .receipt-paste-hint { color: rgba(255,255,255,.45); font-size: 11px; line-height: 1.4; }
        [data-theme="light"] .receipt-paste-hint { color: rgba(0,0,0,.4); }
        [data-theme="light"] .receipt-paste-toggle-btn { color: #6d28d9; background: rgba(109,40,217,.08); border-color: rgba(109,40,217,.2); }
        .receipt-paste-box[hidden] { display: none !important; }
        .receipt-paste-box {
          border: 1px solid rgba(148,163,184,.12); background: rgba(148,163,184,.04); border-radius: 10px;
          padding: 10px;
        }
        .receipt-paste-box textarea {
          width: 100%; min-height: 120px; resize: vertical; border: 1px solid rgba(148,163,184,.15);
          border-radius: 8px; background: rgba(255,255,255,.04); color: var(--text,#f1f5f9); padding: 10px 12px;
          outline: none; font: inherit; font-size: 13px; line-height: 1.5;
        }
        [data-theme="light"] .receipt-paste-box textarea { background: #f8fafc; color: #0f172a; }
        .receipt-paste-meta { display: flex; justify-content: space-between; gap: 8px; margin-top: 8px; flex-wrap: wrap; color: rgba(148,163,184,.6); font-size: 11px; }
      </style>
      <div class="receipt-paste-toggle-row">
        <button type="button" id="receiptPasteToggleBtn" class="receipt-paste-toggle-btn">បិទភ្ជាប់វិក្កយបត្រ</button>
        <div class="receipt-paste-hint">បិទភ្ជាប់អត្ថបទវិក្កយបត្រ ដើម្បីឱ្យប្រព័ន្ធបំពេញទិន្នន័យ order_detail ដោយស្វ័យប្រវត្តិ។</div>
      </div>
      <div id="receiptPasteBox" class="receipt-paste-box" hidden>
        <textarea id="receiptPasteTextarea" placeholder="បិទភ្ជាប់អត្ថបទវិក្កយបត្រនៅទីនេះ..."></textarea>
        <div class="receipt-paste-meta">
          <span>គាំទ្រ format ច្រើនប្រភេទ រួមទាំងគំរូ invoice ផ្សេងៗ។</span>
          <span id="receiptPasteStatus">រង់ចាំអត្ថបទ...</span>
        </div>
      </div>
    `;

    noteSection.insertBefore(wrapper, noteSection.firstChild);

    const toggleBtn = document.getElementById('receiptPasteToggleBtn');
    const pasteBox = document.getElementById('receiptPasteBox');
    const textarea = document.getElementById('receiptPasteTextarea');
    const status = document.getElementById('receiptPasteStatus');

    let parseTimer = null;

    toggleBtn.addEventListener('click', () => {
      const isHidden = pasteBox.hasAttribute('hidden');
      if (isHidden) {
        pasteBox.removeAttribute('hidden');
        textarea.focus();
      } else {
        pasteBox.setAttribute('hidden', 'hidden');
      }
    });

    const scheduleParse = () => {
      clearTimeout(parseTimer);
      parseTimer = setTimeout(() => {
        const text = textarea.value.trim();
        if (!text) {
          status.textContent = 'រង់ចាំអត្ថបទ...';
          return;
        }
        try {
          const result = parseAndApplyReceipt(text);
          status.textContent = `បានបំពេញ ${result.fieldsFilled} field • ផលិតផល ${result.productsAdded}`;
          if (typeof toast === 'function') toast(`បានបញ្ចូលវិក្កយបត្រ: field ${result.fieldsFilled}, ផលិតផល ${result.productsAdded}`, 'success');
        } catch (error) {
          console.error(error);
          status.textContent = 'បកស្រាយអត្ថបទមិនបាន';
          if (typeof toast === 'function') toast(error.message || 'បកស្រាយអត្ថបទមិនបាន', 'error');
        }
      }, 180);
    };

    textarea.addEventListener('paste', () => setTimeout(scheduleParse, 20));
    textarea.addEventListener('input', scheduleParse);
  }

  function parseFieldFromText(text, aliases) {
    const lines = splitLines(text);
    for (const line of lines) {
      for (const alias of aliases) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(?:^|\\s)${escaped}\\s*[:៖]?\\s*(.+)$`, 'i');
        const match = line.match(re);
        if (match && match[1]) return cleanValue(match[1]);
      }
    }
    return "";
  }

  function splitLines(text) {
    return String(text || '')
      .split(/\r?\n/)
      .map((line) => String(line || '').replace(/[‐‑‒–—-]{3,}/g, '').trim())
      .filter(Boolean);
  }

  function cleanValue(value) {
    return String(value || '')
      .replace(/^[=|:៖\-\s]+/, '')
      .replace(/[=|\s]+$/, '')
      .trim();
  }

  function normalizeDateValue(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    const slash = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
    if (slash) return `${slash[3]}-${slash[2].padStart(2, '0')}-${slash[1].padStart(2, '0')}`;
    const iso = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
    return '';
  }

  function matchSelectOption(select, value) {
    if (!select || !value) return '';
    const compactNeedle = normalizeCompact(value);
    const khNeedle = compactKh(value);
    let best = '';
    let bestScore = 0;

    Array.from(select.options || []).forEach((option) => {
      const text = option.value || option.textContent || '';
      const compact = normalizeCompact(text);
      const kh = compactKh(text);
      let score = 0;
      if (compact && compact === compactNeedle) score = 100;
      else if (kh && kh === khNeedle) score = 96;
      else if (compactNeedle.includes(compact) || compact.includes(compactNeedle)) score = 60 + Math.min(compact.length, compactNeedle.length);
      else if (khNeedle.includes(kh) || kh.includes(khNeedle)) score = 55 + Math.min(kh.length, khNeedle.length);
      if (score > bestScore) {
        bestScore = score;
        best = option.value;
      }
    });

    return best;
  }

  function splitProvinceAndAddress(addressText) {
    const provinceSelect = hasEl('province') ? els.province : null;
    const raw = cleanValue(addressText);
    if (!raw) return { province: '', addressDetail: '' };

    const optionTexts = provinceSelect ? Array.from(provinceSelect.options).map((opt) => opt.value).filter(Boolean) : [];
    const aliases = [];

    optionTexts.forEach((name) => {
      aliases.push([normalizeCompact(name), name]);
      aliases.push([compactKh(name), name]);
      const stripped = compactKh(name.replace(/^ខេត្ត|^រាជធានី/, ''));
      if (stripped) aliases.push([stripped, name]);
    });
    aliases.push(['ភ្នំពេញ', 'រាជធានីភ្នំពេញ']);
    aliases.push(['pp', 'រាជធានីភ្នំពេញ']);
    aliases.push(['phnompenh', 'រាជធានីភ្នំពេញ']);

    const compactRaw = compactKh(raw);
    let province = '';
    let aliasUsed = '';

    aliases.forEach(([alias, actual]) => {
      if (alias && compactRaw.includes(alias) && alias.length > aliasUsed.length) {
        aliasUsed = alias;
        province = actual;
      }
    });

    let addressDetail = raw;
    if (province) {
      const provinceName = province.replace(/^ខេត្ត|^រាជធានី/, '').trim();
      const patterns = [province, provinceName].filter(Boolean).map((txt) => txt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      addressDetail = raw;
      patterns.forEach((pattern) => {
        addressDetail = addressDetail.replace(new RegExp(pattern, 'gi'), ' ');
      });
      addressDetail = addressDetail.replace(/[()]/g, ' ').replace(/[|,]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    return { province, addressDetail };
  }

  function normalizeDeliveryValue(raw) {
    const compact = compactKh(raw);
    if (!compact) return '';
    for (const [canonical, aliases] of DELIVERY_ALIAS_MAP) {
      if (aliases.some((alias) => compact.includes(compactKh(alias)))) return canonical;
    }
    return cleanValue(raw);
  }

  function setPaymentValue(rawPayment) {
    const value = String(rawPayment || '').trim();
    const compact = normalizeCompact(value);
    let matchedKey = 'Delivery';

    if (compact) {
      matchedKey = 'Other';
      Object.entries(PAYMENT_ALIASES).forEach(([key, aliases]) => {
        if (matchedKey !== 'Other') return;
        if (aliases.some((alias) => compact.includes(normalizeCompact(alias)))) matchedKey = key;
      });
      if (matchedKey === 'Other' && /freeដឹក|freedelivery|cod|cash/.test(compact)) matchedKey = 'Delivery';
    }

    if (hasEl('payment')) els.payment.value = matchedKey;
    if (hasEl('paymentOptions')) {
      els.paymentOptions.querySelectorAll('.payment-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.value === matchedKey);
      });
    }
  }

  function inferCustomer(lines) {
    const firstUseful = lines.find((line) => {
      if (/^\d+[.)]?\s*$/.test(line)) return false;
      if (/^(tel|phone)\s*[:៖]?/i.test(line)) return false;
      if (/^(ទីតាំង|ដឹកជញ្ជូន|សរុប|គិតជាលុយខ្មែរ)/.test(line)) return false;
      if (/^[-=]{3,}$/.test(line)) return false;
      if (/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}$/.test(line)) return false;
      return true;
    });
    if (!firstUseful) return '';
    // Split customer name from phone if on same line e.g. "ស្រីពៅ ស្រីពៅ 012722144"
    const phoneMatch = firstUseful.match(/0\d[\d\s]{6,12}\d/);
    if (phoneMatch) {
      const namePart = firstUseful.slice(0, firstUseful.indexOf(phoneMatch[0])).trim();
      return cleanValue(namePart || firstUseful);
    }
    return cleanValue(firstUseful);
  }

  function inferPhoneFromFirstLine(lines) {
    // Check first useful line for embedded phone number
    const firstUseful = lines.find((line) => {
      if (/^(tel|phone)\s*[:៖]?/i.test(line)) return false;
      if (/^(ទីតាំង|ដឹកជញ្ជូន|សរុប|គិតជាលុយខ្មែរ)/.test(line)) return false;
      if (/^[-=]{3,}$/.test(line)) return false;
      return true;
    });
    if (!firstUseful) return '';
    const m = firstUseful.match(/0\d[\d\s]{6,12}\d/);
    if (!m) return '';
    const norm = m[0].replace(/\s+/g, '');
    const SERVICE = ['015586878','089586878','068585878'];
    if (SERVICE.some(s => norm.indexOf(s) !== -1)) return '';
    return norm;
  }

  // Service phones to exclude from customer phone detection
  const EXCLUDE_PHONES = ['0155868 78','0895868 78','0685858 78',
    '015586878','089586878','068585878',
    '01558 68 78','08958 68 78','06858 58 78',
    '015 58 68 78','089 58 68 78','068 58 58 78'];

  function inferPhone(text, lines) {
    const telLine = lines.find((line) => /^(tel|phone)\s*[:៖]?/i.test(line));
    const source = telLine || text;
    // Find all phone candidates
    const matches = [...source.matchAll(/0\d[\d\s]{6,12}\d/g)];
    for (const m of matches) {
      const normalized = m[0].replace(/\s+/g, '');
      // Skip service phones
      const isService = EXCLUDE_PHONES.some(function(sp){
        return sp.replace(/\s+/g,'') === normalized;
      });
      if (!isService) return normalized;
    }
    return '';
  }

  function inferFooterMeta(lines) {
    const result = { page: '', closeBy: '' };
    // Look for line with | separator before Tel line (e.g. "ហេឡេន CCR | Wick")
    const telIdx = lines.findIndex((line) => /^(tel|phone)\s*[:៖]?/i.test(line));
    // Try line before Tel
    const candidates = telIdx > 0 ? [lines[telIdx - 1], lines[telIdx - 2]] : lines.slice(-5);
    for (const pageLine of candidates) {
      if (!pageLine) continue;
      const cleaned = pageLine.replace(/[=\-]+/g, '').trim();
      if (!cleaned) continue;
      const parts = cleaned.split(/[|]/).map((part) => cleanValue(part)).filter(Boolean);
      if (parts.length >= 2) {
        result.page = parts[0] || '';
        result.closeBy = parts[1] || '';
        return result;
      }
      // Single value — try split by known patterns
      const slashParts = cleaned.split(/\//).map((p) => cleanValue(p)).filter(Boolean);
      if (slashParts.length >= 2) {
        result.page = slashParts[0];
        result.closeBy = slashParts[1];
        return result;
      }
    }
    return result;
  }

  function inferAddress(text, lines) {
    const direct = parseFieldFromText(text, FIELD_MAP.address);
    if (direct) return direct;
    // Match "ទីតាំង : ..." or "ទីតាំង៖..."
    const line = lines.find((item) => /ទីតាំង/.test(item));
    if (line) return cleanValue(line.replace(/^[^:៖]*[:៖]/, '').trim());
    return '';
  }

  function inferDelivery(text, lines) {
    const direct = parseFieldFromText(text, FIELD_MAP.delivery);
    if (direct) return normalizeDeliveryValue(direct);
    const line = lines.find((item) => /ដឹកជញ្ជូន/.test(item));
    if (!line) return '';
    const cleaned = cleanValue(line.replace(/^.*?[:៖]/, ''));
    return normalizeDeliveryValue(cleaned);
  }

  function inferDeliveryFee(text, lines) {
    const feeLine = lines.find((line) => /(សេវាដឹកជញ្ជូន|សេវាដឹក|delivery fee)/i.test(line));
    if (!feeLine) return 0;
    if (/free|freeដឹក|ឥតគិត/i.test(feeLine)) return 0;
    const fee = parseMoney(feeLine);
    return fee != null ? fee : 0;
  }

  function inferPayment(text, delivery) {
    const direct = parseFieldFromText(text, FIELD_MAP.payment);
    if (direct) return direct;
    if (/\bABA\b/i.test(text)) return 'ABA';
    if (/\bAC\b/i.test(text)) return 'AC';
    if (/\bWing\b/i.test(text)) return 'Wing';
    if (!delivery || /free|ដឹកខ្លួនឯង/i.test(delivery)) return 'Delivery';
    return 'Delivery';
  }

  function inferNote(lines) {
    const notes = lines.filter((line) => /^\(.+\)$/.test(line)).map((line) => line.trim());
    return notes.join(' | ');
  }

  function extractParsedData(text) {
    const lines = splitLines(text);
    const footerMeta = inferFooterMeta(lines);
    const parsed = {
      customer: parseFieldFromText(text, FIELD_MAP.customer) || inferCustomer(lines),
      phone: (function(){
        var raw = parseFieldFromText(text, FIELD_MAP.phone) || inferPhone(text, lines) || inferPhoneFromFirstLine(lines);
        if(!raw) return '';
        var norm = raw.replace(/\s+/g,'');
        var SERVICE = ['015586878','089586878','068585878'];
        if(SERVICE.some(function(s){ return norm.indexOf(s) !== -1; })) return '';
        return norm;
      })(),
      address: inferAddress(text, lines),
      delivery: inferDelivery(text, lines),
      payment: inferPayment(text, inferDelivery(text, lines)),
      note: parseFieldFromText(text, FIELD_MAP.note) || inferNote(lines),
      date: parseFieldFromText(text, FIELD_MAP.date),
      receiptNo: (function(){
        // Match "(31)" or "(001)" at end of text
        const m = text.match(/\(\s*(\d+)\s*\)\s*$/);
        return m ? m[1] : '';
      })(),
      deliveryFee: inferDeliveryFee(text, lines),
      page: footerMeta.page,
      closeBy: footerMeta.closeBy
    };
    return parsed;
  }

  function fillBasicFields(parsed) {
    let count = 0;

    if (parsed.customer && hasEl('customer')) {
      els.customer.value = parsed.customer;
      count++;
    }
    if (parsed.phone && hasEl('phone')) {
      els.phone.value = parsed.phone;
      count++;
    }
    if (parsed.address) {
      const mapped = splitProvinceAndAddress(parsed.address);
      if (mapped.province && hasEl('province')) {
        els.province.value = mapped.province;
        count++;
      }
      if (mapped.addressDetail && hasEl('addressDetail')) {
        els.addressDetail.value = mapped.addressDetail;
        count++;
      }
    }
    if (parsed.delivery && hasEl('deliveryName')) {
      const matched = matchSelectOption(els.deliveryName, parsed.delivery) || normalizeDeliveryValue(parsed.delivery);
      if (matched) {
        els.deliveryName.value = matched;
        count++;
      }
    }
    if (parsed.deliveryFee != null && hasEl('deliveryFee')) {
      els.deliveryFee.value = String(parsed.deliveryFee);
      count++;
    }
    if (parsed.payment) {
      setPaymentValue(parsed.payment);
      count++;
    }
    if (parsed.note && hasEl('note')) {
      const existing = String(els.note.value || '').trim();
      els.note.value = existing ? `${existing} | ${parsed.note}` : parsed.note;
      count++;
    }
    const isoDate = normalizeDateValue(parsed.date);
    if (isoDate && hasEl('date')) {
      els.date.value = isoDate;
      count++;
    }
    if (parsed.page && hasEl('page')) {
      const matched = matchSelectOption(els.page, parsed.page);
      if (matched) {
        els.page.value = matched;
        count++;
      }
    }
    if (parsed.closeBy && hasEl('closeBy')) {
      const matched = matchSelectOption(els.closeBy, parsed.closeBy);
      if (matched) {
        els.closeBy.value = matched;
        count++;
      }
    }
    if (parsed.receiptNo) {
      // Set receipt number in form
      var receiptInput = document.getElementById('receiptNo') || document.getElementById('receipt-no') || document.querySelector('[name=receiptNo]');
      if(receiptInput){ receiptInput.value = parsed.receiptNo; count++; }
      // Also try via els
      if(typeof setReceiptNoValue === 'function') setReceiptNoValue(parsed.receiptNo);
    }
    if (typeof renderTable === 'function') renderTable();
    return count;
  }

  function isProductLine(line) {
    if (!line) return false;
    if (!/^\d+\s*[.)]?/.test(line)) return false;
    if (/(សរុប|គិតជាលុយខ្មែរ|សេវាដឹក|tel\s*[:៖]?|phone\s*[:៖]?|ទីតាំង|ដឹកជញ្ជូន)/i.test(line)) return false;
    return true;
  }

  function findBestProductMatch(line, catalog) {
    const compactLine = normalizeCompact(line);
    const khLine = compactKh(line);
    const spacedLine = normalizeText(line);
    let best = null;

    catalog.forEach((entry) => {
      entry.aliases.forEach((alias) => {
        let score = 0;
        if (compactLine === alias.compact || khLine === alias.khCompact) score = 200 + alias.compact.length;
        else if (compactLine.includes(alias.compact)) score = 140 + alias.compact.length;
        else if (khLine.includes(alias.khCompact)) score = 145 + alias.khCompact.length;
        else if (spacedLine.includes(alias.spaced)) score = 120 + alias.spaced.length;
        if (!best || score > best.score) best = score > 0 ? { product: entry.product, score } : best;
      });
    });

    return best;
  }

  function parseProductNumbers(line) {
    const raw = String(line || '');
    let qty = 1;
    let price = null;

    const qtyMatch = raw.match(/(\d+(?:\.\d+)?)\s*ឈុត/i);
    if (qtyMatch) qty = Number(qtyMatch[1]);

    const equalPrice = raw.match(/=\s*\$?\s*(\d+(?:\.\d+)?)\s*\$?/);
    const suffixPrice = raw.match(/(\d+(?:\.\d+)?)\s*\$\s*$/);
    const prefixPrice = raw.match(/\$\s*(\d+(?:\.\d+)?)/);
    price = equalPrice ? Number(equalPrice[1]) : suffixPrice ? Number(suffixPrice[1]) : prefixPrice ? Number(prefixPrice[1]) : null;

    return { qty: qty > 0 ? qty : 1, price };
  }

  function extractProductLines(text) {
    const lines = splitLines(text);
    const catalog = (typeof products !== 'undefined' && Array.isArray(products))
      ? products.map((product) => ({ product, aliases: buildAliasSet(product) }))
      : [];

    const matched = [];

    lines.forEach((line, index) => {
      if (!isProductLine(line)) return;
      const best = findBestProductMatch(line, catalog);
      if (!best) return;
      const parsed = parseProductNumbers(line);
      const entry = {
        product: best.product,
        qty: parsed.qty,
        price: parsed.price != null ? parsed.price : Number(best.product.price || 0),
        discount: 0,
        subtotal: Math.max(0, (parsed.qty || 1) * (parsed.price != null ? parsed.price : Number(best.product.price || 0)))
      };

      const nextLine = lines[index + 1] || '';
      if (/^\(.+\)$/.test(nextLine)) {
        entry.note = nextLine.trim();
      }

      matched.push(entry);
    });

    return matched;
  }

  function applyProducts(parsedProducts) {
    if (!Array.isArray(parsedProducts) || !parsedProducts.length) return 0;
    if (typeof items === 'undefined' || !Array.isArray(items)) return 0;

    items.length = 0;
    let count = 0;
    const extraNotes = [];

    parsedProducts.forEach((entry) => {
      if (!entry || !entry.product) return;
      const qty = Math.max(1, Number(entry.qty || 1));
      const price = Math.max(0, Number(entry.price != null ? entry.price : entry.product.price || 0));
      const discount = Math.max(0, Number(entry.discount || 0));
      items.push({
        rowId: Date.now() + Math.random() + count,
        productId: entry.product.id,
        name: entry.product.name,
        qty,
        price,
        discount,
        subtotal: Math.max(0, qty * price - discount)
      });
      if (entry.note) extraNotes.push(`${entry.product.name}: ${entry.note}`);
      count++;
    });

    if (extraNotes.length && hasEl('note')) {
      const existing = String(els.note.value || '').trim();
      const combined = [...(existing ? [existing] : []), ...extraNotes].join(' | ');
      els.note.value = combined;
    }

    if (typeof renderTable === 'function') renderTable();
    return count;
  }

  function parseAndApplyReceipt(text) {
    if (typeof clearOrderForm === 'function') clearOrderForm();

    const parsed = extractParsedData(text);
    const fieldsFilled = fillBasicFields(parsed);
    const productLines = extractProductLines(text);
    const productsAdded = applyProducts(productLines);

    if (!fieldsFilled && !productsAdded) {
      throw new Error('រកមិនឃើញទិន្នន័យត្រូវគ្នា ក្នុងអត្ថបទដែលបានបិទភ្ជាប់ទេ។');
    }

    return { fieldsFilled, productsAdded };
  }

  onReady(createUI);
})();
