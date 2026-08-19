import React, { useEffect, useRef } from 'react';
import { drawBeachball, axisMarkers } from '../lib/beachball.js';

/**
 * Renders the focal mechanism from the published moment tensor and overlays the
 * principal stress axes. The P axis must land in a white quadrant and the T
 * axis in a shaded one, which doubles as a check that the maths is right.
 */
export default function Beachball({ momentTensor, size = 190 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawBeachball(canvasRef.current, momentTensor.tensor, { size });
    }
  }, [momentTensor, size]);

  const markers = axisMarkers(momentTensor.axes);
  const radius = size / 2 - 1.5;

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}>
      <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '50%' }} />
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {markers.map((m) => {
          const cx = size / 2 + m.x * radius;
          const cy = size / 2 - m.y * radius;
          const isP = m.key === 'P';
          const isN = m.key === 'N';
          return (
            <g key={m.key} opacity={isN ? 0.6 : 1}>
              <circle cx={cx} cy={cy} r="8" fill="rgba(10,14,19,0.6)" stroke="#e8eef6" strokeWidth="1" />
              <text
                x={cx}
                y={cy + 3.6}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={isP ? '#e8eef6' : isN ? '#94a8bd' : '#ffb3b3'}
                fontFamily="ui-monospace, monospace"
              >
                {m.key}
              </text>
            </g>
          );
        })}
        {/* North tick */}
        <text x={size / 2} y={11} textAnchor="middle" fontSize="9" fill="#62778d" fontWeight="700">
          N
        </text>
      </svg>
    </div>
  );
}
