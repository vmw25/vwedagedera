// One small, self-contained WebGL scene. Native page scrolling is untouched.
const host = typeof document === 'undefined' ? null : document.querySelector('[data-heart-scene]');
if (host) initialiseHeart(host).catch(() => { host.dataset.heartState = 'fallback'; });

export function proximityFalloff(dx, dy) { return Math.exp(-(dx * dx + dy * dy) / 0.22); }
export function damp(current, target, dt) { return current + (target - current) * (1 - Math.exp(-dt * 5)); }
export function rotationAt(seconds) { return (seconds * Math.PI * 2 / 150) % (Math.PI * 2); }

async function initialiseHeart(host) {
  const canvas = host.querySelector('canvas');
  // Keep the last frame off-screen or when the browser recomposites a background
  // tab. This avoids a cleared canvas without running extra animation frames.
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power', depth: true, preserveDrawingBuffer: true });
  if (!gl) throw new Error('Static fallback');
  const response = await fetch(host.dataset.meshUrl, { cache: 'force-cache' });
  if (!response.ok) throw new Error('Mesh unavailable');
  const binary = await response.arrayBuffer(), header = new DataView(binary);
  if (header.getUint32(0, true) !== 0x54485756 || header.getUint32(4, true) !== 1) throw new Error('Invalid mesh');
  const vertexCount = header.getUint32(8, true), faceCount = header.getUint32(12, true), lineCount = header.getUint32(16, true);
  const vertices = new Float32Array(binary, 24, vertexCount * 6);
  const faceOffset = 24 + vertexCount * 24;
  const faces = new Uint16Array(binary, faceOffset, faceCount);
  const lines = new Uint16Array(binary, faceOffset + faceCount * 2, lineCount);

  const vertexSource = `
    attribute vec3 aPosition; attribute vec3 aNormal;
    uniform vec3 uRotation; uniform vec2 uPointer; uniform vec2 uScale;
    uniform float uHover; uniform float uTime;
    varying float vLight;
    vec3 rotate(vec3 p) {
      float c=cos(uRotation.y),s=sin(uRotation.y); p=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);
      c=cos(uRotation.x);s=sin(uRotation.x); p=vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);
      c=cos(uRotation.z);s=sin(uRotation.z); return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);
    }
    void main(){
      vec3 p=rotate(aPosition),n=rotate(aNormal);
      float d=length(p.xy-uPointer);
      float near=exp(-d*d/0.22)*uHover;
      p+=n*near*0.095;
      p.xy+=(p.xy-uPointer)*near*0.035;
      p.y+=sin(uTime*0.55)*0.025;
      float perspective=5.8/(5.8-p.z);
      gl_Position=vec4(p.x*uScale.x*perspective,p.y*uScale.y*perspective,-p.z*0.12,1.0);
      vLight=clamp(n.z*0.5+0.5,0.0,1.0);
    }`;
  const fragmentSource = `precision mediump float; uniform float uPass; uniform vec3 uBackground; uniform vec3 uInk; varying float vLight;
    void main(){ if(uPass<0.5){gl_FragColor=vec4(uBackground,1.0);}else{gl_FragColor=vec4(uInk,0.22+0.58*vLight);} }`;
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexSource)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentSource)); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Scene unavailable');
  gl.useProgram(program);
  const data = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, data); gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  for (const [name, offset] of [['aPosition', 0], ['aNormal', 12]]) {
    const loc = gl.getAttribLocation(program, name); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 24, offset);
  }
  function indexBuffer(values) { const b = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, values, gl.STATIC_DRAW); return b; }
  const faceBuffer = indexBuffer(faces), lineBuffer = indexBuffer(lines);
  const uniforms = Object.fromEntries(['uRotation','uPointer','uScale','uHover','uTime','uPass','uBackground','uInk'].map(n => [n, gl.getUniformLocation(program, n)]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  let visible = true, modalOpen = false, lost = false, frame = 0, last = 0, elapsed = 0;
  let pointer = [0, 0], targetPointer = [0, 0], rotation = [0, 0], targetRotation = [0, 0], hover = 0, targetHover = 0;
  let scale = [1, 1], rect = host.getBoundingClientRect();
  function resize() {
    rect = host.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    // A 3.4-unit heart occupies 85% of the scene's height, centred in real 3D.
    const pixelsPerUnit = rect.height * 0.25;
    scale = [pixelsPerUnit * 2 / rect.width, pixelsPerUnit * 2 / rect.height];
    requestFrame();
  }
  function updateColours() {
    const light = document.documentElement.dataset.theme === 'light';
    gl.uniform3f(uniforms.uBackground, ...(light ? [0.955,0.955,0.94] : [0.0314,0.0353,0.0392]));
    gl.uniform3f(uniforms.uInk, ...(light ? [0.15,0.16,0.17] : [0.84,0.85,0.88]));
    requestFrame();
  }
  function draw(now) {
    frame = 0;
    if (lost || !visible || modalOpen || document.hidden) { last = 0; return; }
    const dt = Math.min((now - (last || now)) / 1000, 0.05); last = now;
    elapsed += dt * (reduced.matches ? 0.4 : 1);
    const interactive = finePointer.matches;
    hover = damp(hover, interactive ? targetHover : 0, dt);
    for (let i = 0; i < 2; i++) {
      rotation[i] = damp(rotation[i], interactive ? targetRotation[i] : 0, dt);
      pointer[i] = damp(pointer[i], targetPointer[i], dt);
    }
    const turn = rotationAt(elapsed);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform3f(uniforms.uRotation, -0.06 + rotation[1] * 0.08, -0.24 + turn + rotation[0] * 0.12, -0.12);
    gl.uniform2f(uniforms.uPointer, pointer[0], pointer[1]); gl.uniform2f(uniforms.uScale, scale[0], scale[1]);
    gl.uniform1f(uniforms.uHover, hover); gl.uniform1f(uniforms.uTime, reduced.matches ? 0 : elapsed);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.depthFunc(gl.LESS);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1);
    gl.uniform1f(uniforms.uPass, 0); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faceBuffer); gl.drawElements(gl.TRIANGLES, faceCount, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.POLYGON_OFFSET_FILL); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthFunc(gl.LEQUAL); gl.depthMask(false); gl.uniform1f(uniforms.uPass, 1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuffer); gl.drawElements(gl.LINES, lineCount, gl.UNSIGNED_SHORT, 0);
    gl.depthMask(true); gl.disable(gl.BLEND);
    if (host.dataset.heartState !== 'ready') host.dataset.heartState = 'ready';
    requestFrame();
  }
  function requestFrame() { if (!frame && visible && !modalOpen && !document.hidden && !lost) frame = requestAnimationFrame(draw); }
  host.addEventListener('pointermove', e => {
    if (!finePointer.matches) return;
    rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (e.clientX - rect.left) / rect.width * 2 - 1, y = 1 - (e.clientY - rect.top) / rect.height * 2;
    targetPointer = [x / scale[0], y / scale[1]];
    targetRotation = [Math.max(-1,Math.min(1,x)), Math.max(-1,Math.min(1,y))]; targetHover = 1;
  }, { passive: true });
  host.addEventListener('pointerleave', () => { targetRotation = [0,0]; targetHover = 0; }, { passive: true });
  host.addEventListener('pointerenter', () => { rect = host.getBoundingClientRect(); }, { passive: true });
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { rect = host.getBoundingClientRect(); last = 0; requestFrame(); }
    else if (frame) { cancelAnimationFrame(frame); frame = 0; }
  }); observer.observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { last=0; requestFrame(); } else if(frame){cancelAnimationFrame(frame);frame=0;} });
  reduced.addEventListener('change', requestFrame);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  new MutationObserver(updateColours).observe(document.documentElement, { attributes:true,attributeFilter:['data-theme'] });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost=true; if(frame)cancelAnimationFrame(frame);frame=0;host.dataset.heartState='fallback'; });
  const dialogs = [...document.querySelectorAll('dialog')];
  const modalObserver = new MutationObserver(() => {
    modalOpen = dialogs.some(dialog => dialog.open);
    if (modalOpen && frame) { cancelAnimationFrame(frame); frame=0; }
    else if (!modalOpen) { last=0; requestFrame(); }
  });
  dialogs.forEach(dialog => modalObserver.observe(dialog, { attributes:true, attributeFilter:['open'] }));
  updateColours(); resize();
}
