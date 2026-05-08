/**
 * Phone Carrier Detector — CAMBO MINI
 * Desktop: badge next to customer name
 * Mobile:  badge inside phone field
 */
(function(){
'use strict';

var CARRIERS = {
  cellcard: {
    name: 'Cellcard',
    cls:  'carrier-color-cellcard',
    prefixes: ['011','012','014','017','061','076','077','078','085','089','092','095','099']
  },
  smart: {
    name: 'Smart',
    cls:  'carrier-color-smart',
    prefixes: ['010','015','016','069','070','081','086','087','093','096','098']
  },
  metfone: {
    name: 'Metfone',
    cls:  'carrier-color-metfone',
    prefixes: ['031','060','066','067','068','071','088','090','097']
  }
};

// Simple SVG logos as data URIs
var LOGOS = {
  cellcard: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 20"><rect width="56" height="20" rx="3" fill="#d97706"/><text x="28" y="14" text-anchor="middle" font-family="Arial" font-size="9" font-weight="bold" fill="white">CELLCARD</text></svg>'),
  smart:    'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 20"><rect width="44" height="20" rx="3" fill="#00a651"/><text x="22" y="14" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="white">SMART</text></svg>'),
  metfone:  'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 20"><rect width="56" height="20" rx="3" fill="#e30613"/><text x="28" y="14" text-anchor="middle" font-family="Arial" font-size="9" font-weight="bold" fill="white">METFONE</text></svg>')
};

function detectCarrier(phone){
  var clean = phone.replace(/\D/g, '');
  if(clean.length < 3) return null;
  var prefix = clean.slice(0,3);
  for(var key in CARRIERS){
    if(CARRIERS[key].prefixes.indexOf(prefix) >= 0) return {key:key, info:CARRIERS[key]};
  }
  return null;
}

function applyBadge(badgeEl, logoEl, nameEl, carrier, carrierKey){
  badgeEl.classList.remove('show','c-cellcard','c-smart','c-metfone');
  if(!carrier){
    return;
  }
  logoEl.src = LOGOS[carrierKey] || '';
  logoEl.alt = carrier.name;
  nameEl.textContent = carrier.name;
  badgeEl.classList.add('c-'+carrierKey, 'show');
}

function isMobile(){
  return window.innerWidth < 768;
}

function updateBadges(phone){
  var result   = detectCarrier(phone);
  var carrier  = result ? result.info : null;
  var cKey     = result ? result.key  : null;
  var hasPhone = phone.replace(/\D/g,'').length >= 3;
  var mobile   = isMobile();

  // Desktop badge — only show on desktop
  var bdDesk = document.getElementById('carrierBadgeDesktop');
  var lgDesk = document.getElementById('carrierLogoDesktop');
  var nmDesk = document.getElementById('carrierNameDesktop');
  if(bdDesk && lgDesk && nmDesk){
    if(mobile){
      // Always force hide on mobile
      bdDesk.classList.remove('show');
      bdDesk.style.display = 'none';
    } else {
      bdDesk.style.display = '';
      applyBadge(bdDesk, lgDesk, nmDesk, hasPhone ? carrier : null, cKey);
    }
  }

  // Mobile badge — only show on mobile
  var bdMob = document.getElementById('carrierBadgeMobile');
  var lgMob = document.getElementById('carrierLogoMobile');
  var nmMob = document.getElementById('carrierNameMobile');
  if(bdMob && lgMob && nmMob){
    if(!mobile){
      bdMob.classList.remove('show');
      bdMob.style.display = 'none';
    } else {
      bdMob.style.display = '';
      applyBadge(bdMob, lgMob, nmMob, hasPhone ? carrier : null, cKey);
    }
  }
}

document.addEventListener('DOMContentLoaded', function(){
  var phoneInput = document.getElementById('phone');
  if(!phoneInput) return;

  phoneInput.addEventListener('input', function(){
    updateBadges(this.value);
  });

  // Support programmatic value sets
  try{
    var proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(phoneInput, 'value', {
      get: function(){ return proto.get.call(this); },
      set: function(v){ proto.set.call(this, v); updateBadges(v||''); }
    });
  }catch(e){}
});

window.detectCarrier      = detectCarrier;
window.updateCarrierBadge = updateBadges;
})();
