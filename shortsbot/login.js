'use strict';
(() => {
  const form = document.getElementById('login-form');
  const username = document.getElementById('username');
  const password = document.getElementById('password');
  const submit = document.getElementById('submit');
  const message = document.getElementById('message');
  const frame = document.getElementById('dashboard');
  const toggle = document.getElementById('toggle-password');
  let expiry;
  const bytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  function lock() {
    clearTimeout(expiry);
    frame.removeAttribute('srcdoc');
    frame.src = 'about:blank';
    document.getElementById('workspace').hidden = true;
    document.getElementById('gate').hidden = false;
    document.body.classList.remove('unlocked');
    password.value = '';
    password.type = 'password';
    toggle.textContent = 'Mostrar';
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', 'Mostrar senha');
    message.textContent = 'Painel bloqueado. Entre para continuar.';
    password.focus();
  }
  document.getElementById('logout').addEventListener('click', lock);
  toggle.addEventListener('click', () => {
    const visible = password.type === 'password';
    password.type = visible ? 'text' : 'password';
    toggle.textContent = visible ? 'Ocultar' : 'Mostrar';
    toggle.setAttribute('aria-pressed', String(visible));
    toggle.setAttribute('aria-label', visible ? 'Ocultar senha' : 'Mostrar senha');
  });
  // Nenhuma senha/chave é guardada em cookies, localStorage ou sessionStorage.
  window.addEventListener('pagehide', () => { frame.removeAttribute('srcdoc'); password.value = ''; });
  window.addEventListener('pageshow', event => { if (event.persisted) lock(); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    if (!window.isSecureContext || !window.crypto?.subtle) {
      message.textContent = 'Abra o endereço HTTPS em um navegador atualizado.';
      return;
    }
    submit.disabled = true;
    message.textContent = 'Desbloqueando com segurança…';
    let secret = password.value;
    password.value = '';
    try {
      const response = await fetch('sealed.json', {cache:'no-store', credentials:'omit', redirect:'error'});
      if (!response.ok) throw new Error('network');
      const sealed = await response.json();
      if (sealed.version !== 1 || sealed.cipher !== 'AES-256-GCM' || sealed.kdf !== 'PBKDF2-SHA256' || sealed.iterations !== 600000) throw new Error('format');
      const encoder = new TextEncoder();
      const material = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveKey']);
      secret = '';
      const key = await crypto.subtle.deriveKey({name:'PBKDF2', salt:bytes(sealed.salt), iterations:sealed.iterations, hash:'SHA-256'}, material, {name:'AES-GCM', length:256}, false, ['decrypt']);
      const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv:bytes(sealed.iv), additionalData:encoder.encode('shortsbot:audience:v1:' + username.value), tagLength:128}, key, bytes(sealed.ciphertext));
      const html = new TextDecoder('utf-8', {fatal:true}).decode(plain);
      if (!html.startsWith('<!doctype html>')) throw new Error('format');
      frame.removeAttribute('src');
      frame.srcdoc = html;
      document.getElementById('gate').hidden = true;
      document.getElementById('workspace').hidden = false;
      document.body.classList.add('unlocked');
      message.textContent = '';
      expiry = setTimeout(lock, 30 * 60 * 1000);
    } catch (error) {
      message.textContent = error.name === 'OperationError' ? 'Usuário ou senha incorretos.' : 'Não foi possível abrir o painel. Confira a conexão e tente novamente.';
    } finally {
      secret = '';
      password.value = '';
      submit.disabled = false;
    }
  });
})();
