(() => {
  const VERT = `#version 300 es
  precision highp float;
  in vec3 a_position;
  uniform mat4 u_mvp;
  uniform float u_point;
  void main(){
    gl_Position=u_mvp*vec4(a_position,1.0);
    gl_PointSize=u_point*(1.0+0.45*(1.0-gl_Position.z));
  }`;
  const FRAG = `#version 300 es
  precision highp float;
  uniform vec4 u_color;
  out vec4 outColor;
  void main(){
    vec2 p=gl_PointCoord-vec2(.5);
    float d=dot(p,p);
    if(d>.25) discard;
    float a=smoothstep(.25,.05,d);
    outColor=vec4(u_color.rgb,u_color.a*a);
  }`;

  const POINT_COUNT=20736;
  const MOBILE_QUERY="(max-width: 800px)";
  const REDUCED_QUERY="(prefers-reduced-motion: reduce)";

  function shader(gl,type,src){
    const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const detail=gl.getShaderInfoLog(s)||"shader compile failed";gl.deleteShader(s);throw new Error(detail)}
    return s;
  }
  function program(gl){
    const p=gl.createProgram(),vs=shader(gl,gl.VERTEX_SHADER,VERT),fs=shader(gl,gl.FRAGMENT_SHADER,FRAG);
    gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const detail=gl.getProgramInfoLog(p)||"program link failed";gl.deleteProgram(p);throw new Error(detail)}
    return p;
  }
  function mul(a,b){
    const o=new Float32Array(16);
    for(let r=0;r<4;r++)for(let c=0;c<4;c++)o[c+r*4]=a[r*4]*b[c]+a[r*4+1]*b[c+4]+a[r*4+2]*b[c+8]+a[r*4+3]*b[c+12];
    return o;
  }
  function perspective(fov,aspect,near,far){
    const f=1/Math.tan(fov/2),nf=1/(near-far);
    return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);
  }
  function rotateY(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,s,0,0,1,0,0,-s,0,c,0,0,0,0,1]);}
  function rotateX(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,-s,0,0,s,c,0,0,0,0,1]);}
  function translate(z){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,z,1]);}
  function address(index){let n=index,l=n%12;n=Math.floor(n/12);const r=n%12;n=Math.floor(n/12);const p=n%12;n=Math.floor(n/12);const d=n%12;return[d,p,r,l];}
  function point(index){
    const[d,p,r,l]=address(index),angle=(p/12)*Math.PI*2+d*(Math.PI/72),radius=.35+r*.058+d*.005,z=(l-5.5)*.095+(d-5.5)*.018,fold=.07*Math.sin((d+l)*Math.PI/6);
    return[Math.cos(angle)*(radius+fold),Math.sin(angle)*(radius+fold),z];
  }
  function allPoints(){
    const a=new Float32Array(POINT_COUNT*3);
    for(let i=0;i<POINT_COUNT;i++){const p=point(i);a[i*3]=p[0];a[i*3+1]=p[1];a[i*3+2]=p[2]}
    return a;
  }
  function clampRatio(){
    const raw=window.devicePixelRatio||1;
    const mobile=window.matchMedia?.(MOBILE_QUERY).matches;
    return Math.min(raw,mobile?1.5:2);
  }
  function stateIdentity(snap){
    return String(snap?.state?.digest||snap?.state?.canonical_digest||snap?.state?.index0??"unknown");
  }

  window.mountOmegaField=(canvas,getSnapshot)=>{
    const gl=canvas.getContext("webgl2",{antialias:true,alpha:true,depth:true,powerPreference:"high-performance",preserveDrawingBuffer:false});
    if(!gl){canvas.replaceWith(Object.assign(document.createElement("div"),{className:"boundary",textContent:"WebGL2 unavailable; canonical state remains available through the proof/UI surfaces."}));return null}
    const p=program(gl),loc=gl.getAttribLocation(p,"a_position"),mvp=gl.getUniformLocation(p,"u_mvp"),color=gl.getUniformLocation(p,"u_color"),pointSize=gl.getUniformLocation(p,"u_point");
    const all=allPoints(),buf=gl.createBuffer(),active=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,all,gl.STATIC_DRAW);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.enable(gl.DEPTH_TEST);

    let stopped=false,visible=true,pageVisible=!document.hidden,raf=0,lastDraw=0,lastActive=-1,lastState="unknown",frames=0,totalFrameMs=0,lastTelemetry=performance.now(),width=1,height=1,ratio=1;
    const reduced=()=>Boolean(window.matchMedia?.(REDUCED_QUERY).matches);
    const targetInterval=()=>reduced()?250:(window.matchMedia?.(MOBILE_QUERY).matches?33.333:16.667);
    function resize(){
      ratio=clampRatio();
      width=Math.max(1,Math.floor(canvas.clientWidth*ratio));height=Math.max(1,Math.floor(canvas.clientHeight*ratio));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height)}
    }
    const resizeObserver=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;
    resizeObserver?.observe(canvas);resize();
    const intersectionObserver=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)schedule()}, {rootMargin:"120px"}):null;
    intersectionObserver?.observe(canvas);
    const onVisibility=()=>{pageVisible=!document.hidden;if(pageVisible)schedule()};
    document.addEventListener("visibilitychange",onVisibility,{passive:true});
    const onContextLost=e=>{e.preventDefault();stopped=true;cancelAnimationFrame(raf);canvas.dataset.renderState="context-lost"};
    canvas.addEventListener("webglcontextlost",onContextLost,false);

    function publishTelemetry(now,snap,frameMs){
      frames++;totalFrameMs+=frameMs;
      if(now-lastTelemetry<2000)return;
      const detail={schema:"omega.render.telemetry.v1",kind:"OMEGA_20736_WEBGL_PROJECTION",state_identity:stateIdentity(snap),point_count:POINT_COUNT,dpr:ratio,viewport:[width,height],average_frame_ms:frames?+(totalFrameMs/frames).toFixed(2):0,target_interval_ms:+targetInterval().toFixed(2),visible,page_visible:pageVisible,reduced_motion:reduced(),authority:"derived view only",hardware_execution_verified:false};
      canvas.dataset.renderState="live";window.dispatchEvent(new CustomEvent("omega-render-telemetry",{detail}));frames=0;totalFrameMs=0;lastTelemetry=now;
    }
    function draw(now){
      raf=0;if(stopped||!visible||!pageVisible)return;
      const interval=targetInterval();if(now-lastDraw<interval){schedule();return}
      const started=performance.now();lastDraw=now;resize();
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(p);
      const snap=getSnapshot?.(),phase=(snap?.state?.address?.[1]||1)-1,q=snap?.state?.metrics?.contradiction||0,identity=stateIdentity(snap);
      const spin=reduced()?0:now*.000025,projection=perspective(Math.PI/3,width/height,.1,20),view=mul(translate(-3.0),mul(rotateX(-.52+.08*q),rotateY(phase*Math.PI/6+spin))),matrix=mul(projection,view);
      gl.uniformMatrix4fv(mvp,false,matrix);gl.enableVertexAttribArray(loc);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);gl.uniform4f(color,.48,.59,.74,.38);gl.uniform1f(pointSize,ratio*1.45);gl.drawArrays(gl.POINTS,0,POINT_COUNT);
      const activeIndex=Number.isInteger(snap?.state?.index0)?snap.state.index0:-1;
      if(activeIndex>=0&&activeIndex<POINT_COUNT){
        if(activeIndex!==lastActive){gl.bindBuffer(gl.ARRAY_BUFFER,active);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(point(activeIndex)),gl.DYNAMIC_DRAW);lastActive=activeIndex}
        else gl.bindBuffer(gl.ARRAY_BUFFER,active);
        gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);gl.uniform4f(color,.86,.72,.42,1);gl.uniform1f(pointSize,ratio*9);gl.drawArrays(gl.POINTS,0,1);
      }
      lastState=identity;publishTelemetry(now,snap,performance.now()-started);schedule();
    }
    function schedule(){if(!stopped&&visible&&pageVisible&&!raf)raf=requestAnimationFrame(draw)}
    schedule();
    return{
      stop(){stopped=true;cancelAnimationFrame(raf);resizeObserver?.disconnect();intersectionObserver?.disconnect();document.removeEventListener("visibilitychange",onVisibility);canvas.removeEventListener("webglcontextlost",onContextLost);gl.deleteBuffer(buf);gl.deleteBuffer(active);gl.deleteProgram(p)},
      renderNow(){if(!stopped){lastDraw=0;schedule()}},
      metrics(){return{kind:"OMEGA_20736_WEBGL_PROJECTION",point_count:POINT_COUNT,state_identity:lastState,dpr:ratio,visible,page_visible:pageVisible,reduced_motion:reduced(),authority:"derived view only",hardware_execution_verified:false}},
      kind:"OMEGA_20736_WEBGL_PROJECTION",authority:"derived view only",hardware_execution_verified:false
    };
  };
})();

import("/design-system.js").catch(()=>{document.documentElement.dataset.omegaDesign="BASE_FALLBACK"});
