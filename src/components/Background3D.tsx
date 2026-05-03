import { useEffect, useRef } from 'react';

interface Background3DProps {
  pathname?: string;
}

const PALETTES: Record<string, { magic: [number,number,number][]; fire: [number,number,number][] }> = {
  default: {
    magic: [[0.1, 0.8, 0.4], [0.2, 0.6, 0.3], [0.0, 1.0, 0.5]],
    fire:  [[0.1, 0.9, 0.3], [0.3, 0.7, 0.2], [0.0, 0.6, 0.4]],
  },
  legal: {
    magic: [[0.4, 0.45, 0.55], [0.3, 0.35, 0.45], [0.5, 0.55, 0.65]],
    fire:  [[0.5, 0.5, 0.55], [0.4, 0.4, 0.5], [0.55, 0.6, 0.7]],
  },
};

function getPalette(pathname: string) {
  if (pathname.includes('legal')) return PALETTES.legal;
  return PALETTES.default;
}

const Background3D = ({ pathname = '/' }: Background3DProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteRef = useRef(PALETTES.default);
  const targetPaletteRef = useRef(PALETTES.default);

  // Update target palette when pathname changes
  useEffect(() => {
    targetPaletteRef.current = getPalette(pathname);
  }, [pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true });
    if (!gl) return;

    const particleCount = 600;
    const particles = new Float32Array(particleCount * 7);

    function resetParticle(i: number, randomY: boolean = false) {
      const idx = i * 7;
      particles[idx] = (Math.random() * 2 - 1);
      particles[idx + 1] = randomY ? (Math.random() * 2 - 1) : -1.2;
      particles[idx + 2] = Math.random() * 0.5 + 0.3;

      const type = Math.random();
      if (type > 0.7) {
        particles[idx + 3] = 0.2; particles[idx + 4] = 0.9; particles[idx + 5] = 1.0;
      } else if (type > 0.3) {
        particles[idx + 3] = 0.1; particles[idx + 4] = 0.4; particles[idx + 5] = 1.0;
      } else {
        particles[idx + 3] = 0.6; particles[idx + 4] = 0.1; particles[idx + 5] = 1.0;
      }

      particles[idx + 6] = Math.random() * 0.8;
    }

    for (let i = 0; i < particleCount; i++) resetParticle(i, true);

    const vsSource = `
      attribute vec2 a_position;
      attribute float a_speed;
      attribute vec3 a_color;
      attribute float a_alpha;
      varying vec3 v_color;
      varying float v_alpha;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        float sizeMod = max(0.2, (1.2 - a_position.y) * 0.5);
        gl_PointSize = (3.5 + a_speed * 9.0) * sizeMod;
        v_color = a_color;
        v_alpha = a_alpha;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec3 v_color;
      varying float v_alpha;
      void main() {
        float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
        if (dist > 0.5) discard;
        float glow = pow(1.0 - (dist * 2.0), 2.5);
        gl_FragColor = vec4(v_color, v_alpha * glow);
      }
    `;

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const stride = 7 * 4;

    const locs = {
      pos: gl.getAttribLocation(program, 'a_position'),
      speed: gl.getAttribLocation(program, 'a_speed'),
      color: gl.getAttribLocation(program, 'a_color'),
      alpha: gl.getAttribLocation(program, 'a_alpha')
    };

    gl.enableVertexAttribArray(locs.pos);
    gl.vertexAttribPointer(locs.pos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(locs.speed);
    gl.vertexAttribPointer(locs.speed, 1, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(locs.color);
    gl.vertexAttribPointer(locs.color, 3, gl.FLOAT, false, stride, 12);
    gl.enableVertexAttribArray(locs.alpha);
    gl.vertexAttribPointer(locs.alpha, 1, gl.FLOAT, false, stride, 24);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    let animationFrame: number;
    let time = 0;

    // Lerp helper for smooth palette transition
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const render = () => {
      time += 0.008;
      const globalShift = (Math.sin(time * 0.4) + 1) / 2;

      // Smooth palette interpolation
      const target = targetPaletteRef.current;
      const current = paletteRef.current;
      const lerpSpeed = 0.02;

      const lerpedPalette = {
        magic: current.magic.map((c, ci) =>
          c.map((v, vi) => lerp(v, target.magic[ci][vi], lerpSpeed)) as [number, number, number]
        ) as [number,number,number][],
        fire: current.fire.map((c, ci) =>
          c.map((v, vi) => lerp(v, target.fire[ci][vi], lerpSpeed)) as [number, number, number]
        ) as [number,number,number][],
      };
      paletteRef.current = lerpedPalette;

      gl.clearColor(0.005 + 0.01 * globalShift, 0.002, 0.015 - 0.01 * globalShift, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 7;
        const speed = particles[idx + 2];
        const py = particles[idx + 1];

        particles[idx + 1] += 0.002 * speed + 0.001;
        particles[idx] += Math.sin(time * 1.5 + i + py * 2.0) * 0.0015;

        const localShift = Math.max(0, Math.min(1, globalShift + Math.sin(time + i * 0.1 + py * 2.0) * 0.2));

        const colorIdx = i % 3;
        const mc = lerpedPalette.magic[colorIdx];
        const fc = lerpedPalette.fire[colorIdx];

        particles[idx + 3] = mc[0] + (fc[0] - mc[0]) * localShift;
        particles[idx + 4] = mc[1] + (fc[1] - mc[1]) * localShift;
        particles[idx + 5] = mc[2] + (fc[2] - mc[2]) * localShift;

        let alpha = 1.0;
        if (py > 0.3) alpha = 1.0 - ((py - 0.3) * 1.1);
        particles[idx + 6] = Math.max(0, alpha * (0.6 + Math.sin(time * 3.0 + i) * 0.2));

        if (py > 1.0 || particles[idx + 6] <= 0.0) {
          resetParticle(i);
        }
      }

      gl.bufferData(gl.ARRAY_BUFFER, particles, gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.POINTS, 0, particleCount);
      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ filter: 'var(--canvas-filter)' }}
    />
  );
};

export default Background3D;
