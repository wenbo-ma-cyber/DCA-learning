/* 统一教学播放控制；离屏或减少动态效果时停止，不在后台累加步骤。 */
(function (root) {
  'use strict';
  const players = new Set();
  let motion = true;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function controls(label = '实验') {
    return `<div class="scene-controls" aria-label="${escape(label)}播放控制">
      <div class="scene-buttons"><button type="button" data-play>播放</button><button type="button" data-prev>上一步</button><button type="button" data-next>下一步</button><button type="button" data-reset>重新开始</button></div>
      <label class="scene-seek"><span>${escape(label)}进度</span><input type="range" data-seek min="0" max="1" value="0" step="1"><output data-step-status aria-live="off">第 0 / 1 步</output></label>
      <p class="scene-motion-note" data-motion-note hidden>动态效果已关闭，仍可使用上一步、下一步或进度条查看。</p>
    </div>`;
  }

  function mount(host, options) {
    let maxStep = Math.max(0, Math.floor(options.maxStep || 0));
    let step = Math.max(0, Math.min(maxStep, Math.floor(options.initialStep || 0)));
    let playing = false, timer = 0, disposed = false;
    const interval = Math.max(300, options.interval || 1400);
    const listeners = [];
    const get = selector => host.querySelector(selector);
    const bounds = host.getBoundingClientRect();
    let visible = bounds.bottom > 0 && bounds.top < innerHeight;
    function bind(element, event, handler) {
      if (!element) return;
      element.addEventListener(event, handler);
      listeners.push(() => element.removeEventListener(event, handler));
    }
    function sync() {
      host.dataset.playing = String(playing);
      const play = get('[data-play]'), prev = get('[data-prev]'), next = get('[data-next]');
      if (play) { play.textContent = playing ? '暂停' : step === maxStep && maxStep ? '重播' : '播放'; play.disabled = !motion || maxStep === 0; play.setAttribute('aria-pressed', String(playing)); }
      if (prev) prev.disabled = step === 0;
      if (next) next.disabled = step >= maxStep;
      const seek = get('[data-seek]');
      if (seek) { seek.max = maxStep; seek.value = step; seek.disabled = maxStep === 0; seek.setAttribute('aria-valuetext', `第 ${step} / ${maxStep} 步`); }
      const status = get('[data-step-status]');
      if (status) status.textContent = `第 ${step} / ${maxStep} 步`;
      const note = get('[data-motion-note]');
      if (note) note.hidden = motion;
    }
    function pause() { clearTimeout(timer); timer = 0; playing = false; if (!disposed) sync(); }
    function draw(value) {
      if (disposed) return;
      step = Math.max(0, Math.min(maxStep, Math.floor(value)));
      options.onStep(step);
      sync();
    }
    function schedule() {
      clearTimeout(timer);
      if (!playing || disposed || !motion || !visible || document.hidden) { pause(); return; }
      timer = setTimeout(() => {
        if (!playing || disposed || !motion || !visible || document.hidden) { pause(); return; }
        draw(step + 1);
        if (step >= maxStep) pause(); else schedule();
      }, interval);
    }
    bind(get('[data-play]'), 'click', () => {
      if (playing) { pause(); return; }
      if (!motion || !maxStep) return;
      if (step >= maxStep) draw(0);
      const rect = host.getBoundingClientRect();
      visible = rect.bottom > 0 && rect.top < innerHeight;
      playing = true; sync(); schedule();
    });
    bind(get('[data-prev]'), 'click', () => { pause(); draw(step - 1); });
    bind(get('[data-next]'), 'click', () => { pause(); draw(step + 1); });
    bind(get('[data-reset]'), 'click', () => { pause(); draw(0); });
    bind(get('[data-seek]'), 'input', event => { pause(); draw(Number(event.target.value)); });
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) pause();
    }) : null;
    observer?.observe(host);
    const api = {
      update(config = {}) {
        pause();
        if (config.maxStep !== undefined) maxStep = Math.max(0, Math.floor(config.maxStep));
        draw(config.step === undefined ? step : config.step);
      },
      pause,
      getStep: () => step,
      sync,
      destroy() { if (disposed) return; pause(); disposed = true; observer?.disconnect(); listeners.forEach(remove => remove()); players.delete(api); }
    };
    players.add(api);
    draw(step);
    return api;
  }
  function setMotion(enabled) {
    motion = Boolean(enabled);
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
    players.forEach(player => { if (!motion) player.pause(); player.sync(); });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) players.forEach(player => player.pause()); });
  root.DCAPlayer = { controls, mount, setMotion, destroyAll: () => [...players].forEach(player => player.destroy()) };
})(window);
