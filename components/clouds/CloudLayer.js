'use client';

/**
 * CloudShape — single CSS cloud made of overlapping rounded divs
 */
export function CloudShape({
  width = 280,
  color = 'rgba(255,255,255,0.92)',
  blur  = 6,
  opacity = 0.88,
  style = {},
}) {
  const h = Math.round(width * 0.42);
  const s = {
    position: 'absolute',
    background: color,
    borderRadius: '50%',
  };

  return (
    <div
      className="cloud-shape"
      style={{
        width:  `${width}px`,
        height: `${h + Math.round(width * 0.38)}px`,
        filter: `blur(${blur}px)`,
        opacity,
        ...style,
      }}
    >
      {/* base body */}
      <div style={{ ...s, bottom: 0, left: '8%', width: '84%', height: `${h}px` }} />
      {/* left puff */}
      <div style={{ ...s, bottom: `${Math.round(h * 0.4)}px`, left: '4%', width: `${Math.round(width * 0.38)}px`, height: `${Math.round(width * 0.38)}px` }} />
      {/* center puff */}
      <div style={{ ...s, bottom: `${Math.round(h * 0.45)}px`, left: '28%', width: `${Math.round(width * 0.46)}px`, height: `${Math.round(width * 0.44)}px` }} />
      {/* right puff */}
      <div style={{ ...s, bottom: `${Math.round(h * 0.32)}px`, right: '6%', width: `${Math.round(width * 0.34)}px`, height: `${Math.round(width * 0.34)}px` }} />
    </div>
  );
}

/**
 * CloudLayer — renders a band of clouds at a given depth.
 * Each animation wrapper is position:absolute with full dimensions so that
 * percentage-based left/top on CloudShape resolve against the CloudLayer's
 * actual size (not a 0-height wrapper).
 */
const DEPTH = {
  far: {
    clouds: [
      { width: 860,  opacity: 0.78, blur: 7,  color: 'rgba(255,255,255,0.95)',    style: { left: '-6%',  top: '2%'  } },
      { width: 980,  opacity: 0.74, blur: 9,  color: 'rgba(255,246,210,0.90)',    style: { left: '27%', top: '-5%' } },
      { width: 780,  opacity: 0.76, blur: 6,  color: 'rgba(255,255,255,0.94)',    style: { left: '59%', top: '4%'  } },
      { width: 900,  opacity: 0.72, blur: 8,  color: 'rgba(255,243,195,0.90)',    style: { left: '77%', top: '-2%' } },
    ],
    animDurations: [18, 22, 16, 20],
    animNames:     ['cloudDrift1', 'cloudDrift3', 'cloudDrift2', 'cloudDrift4'],
  },
  mid: {
    clouds: [
      { width: 560,  opacity: 0.91, blur: 4,  color: 'rgba(255,255,255,0.98)',    style: { left: '-2%',  top: '10%' } },
      { width: 640,  opacity: 0.87, blur: 4,  color: 'rgba(255,253,245,0.97)',    style: { left: '19%', top: '2%'  } },
      { width: 510,  opacity: 0.93, blur: 2,  color: 'rgba(255,255,255,0.99)',    style: { left: '43%', top: '14%' } },
      { width: 720,  opacity: 0.85, blur: 5,  color: 'rgba(255,250,235,0.96)',    style: { left: '62%', top: '3%'  } },
      { width: 490,  opacity: 0.89, blur: 3,  color: 'rgba(255,255,255,0.97)',    style: { left: '84%', top: '10%' } },
    ],
    animDurations: [14, 17, 12, 15, 13],
    animNames:     ['cloudDrift2', 'cloudDrift1', 'cloudDrift4', 'cloudDrift3', 'cloudDrift1'],
  },
  near: {
    clouds: [
      { width: 380,  opacity: 0.97, blur: 1,  color: 'rgba(255,255,255,1.00)',    style: { left: '4%',  top: '20%' } },
      { width: 440,  opacity: 0.95, blur: 1,  color: 'rgba(255,255,255,0.99)',    style: { left: '22%', top: '7%'  } },
      { width: 350,  opacity: 0.98, blur: 0,  color: 'rgba(255,255,255,1.00)',    style: { left: '48%', top: '22%' } },
      { width: 480,  opacity: 0.94, blur: 1,  color: 'rgba(255,255,255,0.99)',    style: { left: '67%', top: '5%'  } },
      { width: 360,  opacity: 0.96, blur: 1,  color: 'rgba(255,255,255,1.00)',    style: { left: '84%', top: '19%' } },
      { width: 300,  opacity: 0.98, blur: 0,  color: 'rgba(255,255,255,1.00)',    style: { left: '92%', top: '29%' } },
    ],
    animDurations: [10, 12, 9, 11, 9, 11],
    animNames:     ['cloudDrift3', 'cloudDrift1', 'cloudDrift2', 'cloudDrift4', 'cloudDrift3', 'cloudDrift2'],
  },
};

export default function CloudLayer({ depth = 'mid', className = '', style = {} }) {
  const cfg = DEPTH[depth];

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={style}
      aria-hidden="true"
    >
      {cfg.clouds.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            animation: `${cfg.animNames[i]} ${cfg.animDurations[i]}s ease-in-out infinite`,
            animationDelay: `${i * -8}s`,
          }}
        >
          <CloudShape {...c} />
        </div>
      ))}
    </div>
  );
}

