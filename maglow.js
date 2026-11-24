/* My Archive login background — the white → blue gradient whose deep blue travels up-down, left-right, diagonally, with the Material Media motif on top:
   a grid of small outline shapes (circle · tall rectangle · diamond) that a diagonal wave sweeps across,
   the same motion as the loop film (software_loop): behind the front the shapes grow in, the old ones
   shrink away ahead of the next front, and each sweep brings the next shape. Drawn in a tiny WebGL shader;
   if WebGL is missing the CSS gradient stays. */
(() => {
  const box = document.querySelector(".ma-glow");
  if (!box) return;
  const cv = document.createElement("canvas");
  const gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: false });
  if (!gl) return;
  box.appendChild(cv);

  const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const fs = `
precision highp float;
uniform vec2 r; uniform float t; uniform float px;   // px = device pixels per CSS pixel
vec3 pal(float x){
  vec3 c0=vec3(1.0),c1=vec3(.79,.86,.98),c2=vec3(.56,.71,.96),c3=vec3(.35,.56,.95),c4=vec3(.18,.42,.95);
  x=clamp(x,0.,1.);
  if(x<.30) return mix(c0,c1,x/.30);
  if(x<.58) return mix(c1,c2,(x-.30)/.28);
  if(x<.80) return mix(c2,c3,(x-.58)/.22);
  return mix(c3,c4,(x-.80)/.20);
}
// gradient along axis a (0 = vertical, 1 = horizontal, 2 = diagonal);
// u 0→1: the blue end slides from bottom/right to top/left and back (ease in-out)
float grad(float a,float u,vec2 uv){
  float x = a<.5 ? uv.y : a<1.5 ? uv.x : (uv.x+uv.y)*.5;
  float k=.5-.5*cos(6.2831853*u);
  return mix(x,1.-x,k);
}
float ring(vec2 q,float s,float w){return abs(length(q)-s)-w;}
float box(vec2 q,vec2 b,float w){vec2 d=abs(q)-b;return abs(length(max(d,0.))+min(max(d.x,d.y),0.))-w;}
float dia(vec2 q,float s,float w){return abs((abs(q.x)+abs(q.y))-s)*.7071-w;}
void main(){
  vec2 fc=gl_FragCoord.xy; fc.y=r.y-fc.y;
  vec2 uv=fc/r;
  // background: the deep blue travels — once up and down, once left and right, once along the diagonal
  // (each a there-and-back), then again. Neighbouring segments cross-fade so nothing jumps.
  float SEG=14.;                                   // seconds per direction
  float sg=t/SEG, si=floor(sg), u=fract(sg);
  float base=mix(grad(mod(si-1.,3.),1.,uv), grad(mod(si,3.),u,uv), smoothstep(0.,.18,u));
  vec3 bg=pal(smoothstep(.0,1.,base));

  // motif grid (in CSS px)
  // whole cells only: the grid is stretched a hair so it ends exactly on both edges (left/right, top/bottom)
  vec2 n=max(floor(r/(26.*px)+.5),vec2(1.));
  vec2 cv=r/n;
  float cell=min(cv.x,cv.y);
  vec2 id=min(floor(fc/cv),n-1.), q=fc-(id+.5)*cv;
  vec2 c=(id+.5)*cv/r;                         // cell centre 0..1
  float d=dot(c,normalize(vec2(1.,.55)))*1.15;   // distance along the sweep direction
  float period=6.5;                              // seconds per sweep
  float ph=t/period-d;
  float k=floor(ph), p=fract(ph);
  float grow=smoothstep(.0,.38,p), fade=1.-smoothstep(.72,1.,p);
  float sz=grow*fade;
  float shape=mod(k,3.);
  float w=.6*px, R=cell*.30*sz;
  float sd = shape<.5 ? ring(q,R,w) : shape<1.5 ? box(q,vec2(R*.55,R*1.05),w) : dia(q,R*1.1,w);
  float a=(1.-smoothstep(-.6*px,.6*px,sd))*step(.04,sz);
  // white lines on the blue side, soft blue lines on the white side
  float lum=dot(bg,vec3(.3,.59,.11));
  vec3 lc=mix(vec3(1.),vec3(.18,.42,.95),smoothstep(.80,.97,lum));
  float op=mix(.75,.35,smoothstep(.80,.97,lum));
  vec3 col=mix(bg,lc,a*op);
  gl_FragColor=vec4(col,1.);
}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return; }
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(pr, "r"), uT = gl.getUniformLocation(pr, "t"), uPx = gl.getUniformLocation(pr, "px");

  const DPR = Math.min(window.devicePixelRatio || 1, 2);   // crisp lines
  const size = () => {
    const w = Math.max(1, Math.round(box.clientWidth * DPR)), h = Math.max(1, Math.round(box.clientHeight * DPR));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
  };
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t0 = performance.now();
  const draw = (now) => {
    size();
    gl.uniform2f(uR, cv.width, cv.height);
    gl.uniform1f(uPx, DPR);
    gl.uniform1f(uT, (now - t0) / 1000 + 20);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!still) requestAnimationFrame(draw);
  };
  requestAnimationFrame((n) => { draw(n); box.classList.add("is-gl"); });
})();
