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

  function shader(gl,type,src){
    const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||"shader compile failed");
    return s;
  }
  function program(gl){
    const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,VERT));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,FRAG));gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p)||"program link failed");
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
  function rotateY(a){
    const c=Math.cos(a),s=Math.sin(a);
    return new Float32Array([c,0,s,0,0,1,0,0,-s,0,c,0,0,0,0,1]);
  }
  function rotateX(a){
    const c=Math.cos(a),s=Math.sin(a);
    return new Float32Array([1,0,0,0,0,c,-s,0,0,s,c,0,0,0,0,1]);
  }
  function translate(z){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,z,1]);}
  function address(index){
    let n=index,l=n%12;n=Math.floor(n/12);const r=n%12;n=Math.floor(n/12);const p=n%12;n=Math.floor(n/12);const d=n%12;
    return [d,p,r,l];
  }
  function point(index){
    const [d,p,r,l]=address(index);
    const angle=(p/12)*Math.PI*2+d*(Math.PI/72);
    const radius=.35+r*.058+d*.005;
    const z=(l-5.5)*.095+(d-5.5)*.018;
    const fold=.07*Math.sin((d+l)*Math.PI/6);
    return [Math.cos(angle)*(radius+fold),Math.sin(angle)*(radius+fold),z];
  }
  function allPoints(){
    const a=new Float32Array(20736*3);
    for(let i=0;i<20736;i++){const p=point(i);a[i*3]=p[0];a[i*3+1]=p[1];a[i*3+2]=p[2];}
    return a;
  }

  window.mountOmegaField=(canvas,getSnapshot)=>{
    const gl=canvas.getContext("webgl2",{antialias:true,alpha:true});
    if(!gl){canvas.replaceWith(Object.assign(document.createElement("div"),{className:"boundary",textContent:"WebGL2 unavailable; canonical state remains available through the proof/UI surfaces."}));return null;}
    const p=program(gl);const loc=gl.getAttribLocation(p,"a_position"),mvp=gl.getUniformLocation(p,"u_mvp"),color=gl.getUniformLocation(p,"u_color"),pointSize=gl.getUniformLocation(p,"u_point");
    const all=allPoints(),buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,all,gl.STATIC_DRAW);
    const active=gl.createBuffer();
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.enable(gl.DEPTH_TEST);
    let stopped=false;
    function draw(t){
      if(stopped)return;
      const ratio=window.devicePixelRatio||1,w=Math.max(1,Math.floor(canvas.clientWidth*ratio)),h=Math.max(1,Math.floor(canvas.clientHeight*ratio));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(p);
      const snap=getSnapshot?.(),phase=(snap?.state?.address?.[1]||1)-1,q=snap?.state?.metrics?.contradiction||0;
      const projection=perspective(Math.PI/3,w/h,.1,20),view=mul(translate(-3.0),mul(rotateX(-.52+.08*q),rotateY(phase*Math.PI/6+t*.000025))),matrix=mul(projection,view);
      gl.uniformMatrix4fv(mvp,false,matrix);gl.enableVertexAttribArray(loc);
      gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);gl.uniform4f(color,.48,.59,.74,.38);gl.uniform1f(pointSize,ratio*1.45);gl.drawArrays(gl.POINTS,0,20736);
      if(snap?.state?.index0!=null){const v=new Float32Array(point(snap.state.index0));gl.bindBuffer(gl.ARRAY_BUFFER,active);gl.bufferData(gl.ARRAY_BUFFER,v,gl.DYNAMIC_DRAW);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);gl.uniform4f(color,.86,.72,.42,1);gl.uniform1f(pointSize,ratio*9);gl.drawArrays(gl.POINTS,0,1);}
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
    return {stop(){stopped=true},kind:"OMEGA_20736_WEBGL_PROJECTION",authority:"derived view only"};
  };
})();
