
const ALERT_KEY = 'cambo_telegram_alert_settings_v1';
const helperTemplate = (cfg)=>`// ===== CAMBO MINI Telegram Smart Alert Helper =====
const BOT_TOKEN = '${cfg.botToken || 'YOUR_BOT_TOKEN'}';
const TELEGRAM_CHAT_ID = '${cfg.chatId || 'YOUR_CHAT_ID'}';
const DAILY_SUMMARY_TIME = '${cfg.dailySummaryTime || '18:30'}';
const ALERT_PRIORITY = '${cfg.priorityRule || 'High'}';
const ALERT_RULES = ${JSON.stringify({ newOrder: cfg.notifyNewOrder, highPriority: cfg.notifyHighPriority, delivered: cfg.notifyDelivered, dailySummary: cfg.notifyDailySummary }, null, 2)};

function shouldNotifyTelegram(order, eventType) {
  const priorityList = String(ALERT_PRIORITY).split(',');
  if (eventType === 'new' && ALERT_RULES.newOrder) return true;
  if (eventType === 'update' && ALERT_RULES.delivered && String(order.status || '') === 'Delivered') return true;
  if (ALERT_RULES.highPriority && priorityList.indexOf(String(order.priority || 'Medium')) > -1) return true;
  return false;
}

function buildTelegramAlert(order, eventType) {
  var products = (order.products || []).map(function(p, i){ return (i + 1) + '. ' + p.name + ' x ' + p.qty; }).join('\n');
  return [
    '🧾 CAMBO MINI ALERT',
    'Event: ' + eventType,
    'Priority: ' + (order.priority || 'Medium'),
    'Customer: ' + (order.customer || '-'),
    'Phone: ' + (order.phone || '-'),
    'Delivery: ' + (order.deliveryName || '-'),
    'Status: ' + (order.status || '-'),
    'Total: $' + (order.grandTotal || order.total || '-'),
    'Products:\n' + products
  ].join('\n');
}

function sendTelegramMessage(text) {
  var url = 'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage';
  UrlFetchApp.fetch(url, { method: 'post', payload: { chat_id: TELEGRAM_CHAT_ID, text: text } });
}
`;
function loadSettings(){ try{return JSON.parse(localStorage.getItem(ALERT_KEY) || '{}');}catch{return {};}}
function saveSettings(){ const cfg = { chatId: document.getElementById('tgChatId').value.trim(), botToken: document.getElementById('tgBotToken').value.trim(), dailySummaryTime: document.getElementById('dailySummaryTime').value, priorityRule: document.getElementById('priorityRule').value, notifyNewOrder: document.getElementById('notifyNewOrder').checked, notifyHighPriority: document.getElementById('notifyHighPriority').checked, notifyDelivered: document.getElementById('notifyDelivered').checked, notifyDailySummary: document.getElementById('notifyDailySummary').checked }; localStorage.setItem(ALERT_KEY, JSON.stringify(cfg)); document.getElementById('appsScriptHelper').value = helperTemplate(cfg); }
document.addEventListener('DOMContentLoaded', ()=>{ const cfg = loadSettings(); document.getElementById('tgChatId').value = cfg.chatId || ''; document.getElementById('tgBotToken').value = cfg.botToken || ''; document.getElementById('dailySummaryTime').value = cfg.dailySummaryTime || '18:30'; document.getElementById('priorityRule').value = cfg.priorityRule || 'High'; document.getElementById('notifyNewOrder').checked = cfg.notifyNewOrder !== false; document.getElementById('notifyHighPriority').checked = cfg.notifyHighPriority !== false; document.getElementById('notifyDelivered').checked = !!cfg.notifyDelivered; document.getElementById('notifyDailySummary').checked = cfg.notifyDailySummary !== false; saveSettings(); document.getElementById('saveAlertSettings').addEventListener('click', saveSettings); document.getElementById('copyAppsScriptHelper').addEventListener('click', async ()=>{ saveSettings(); try{ await navigator.clipboard.writeText(document.getElementById('appsScriptHelper').value); }catch{} }); });
