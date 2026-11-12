import React, { useEffect, useMemo, useState } from 'react';

export type FocusClockMode = 'analog' | 'digital';

interface FocusClockDisplayProps {
  mode: FocusClockMode;
  showSeconds: boolean;
  progress: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

export const FocusClockDisplay: React.FC<FocusClockDisplayProps> = ({ mode, showSeconds, progress }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    let interval: number | null = null;
    const timeout = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 1000);
    }, 1000 - (Date.now() % 1000));
    return () => {
      window.clearTimeout(timeout);
      if (interval !== null) window.clearInterval(interval);
    };
  }, []);

  const time = useMemo(() => ({
    hours: now.getHours() % 12,
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
    digitalHours: pad(now.getHours()),
    digitalMinutes: pad(now.getMinutes()),
    digitalSeconds: pad(now.getSeconds()),
  }), [now]);

  const hourAngle = (time.hours + time.minutes / 60) * 30;
  const minuteAngle = (time.minutes + time.seconds / 60) * 6;
  const secondAngle = time.seconds * 6;
  const radius = 174;
  const circumference = 2 * Math.PI * radius;

  if (mode === 'digital') {
    return (
      <div className="focus-digital-clock" aria-label={`Current time ${time.digitalHours}:${time.digitalMinutes}${showSeconds ? `:${time.digitalSeconds}` : ''}`}>
        <span>{time.digitalHours}</span>
        <i aria-hidden="true">:</i>
        <span>{time.digitalMinutes}</span>
        {showSeconds && <><i aria-hidden="true">:</i><span className="focus-digital-seconds">{time.digitalSeconds}</span></>}
      </div>
    );
  }

  return (
    <div className="focus-analog-clock" role="img" aria-label={`Analog clock showing ${time.digitalHours}:${time.digitalMinutes}:${time.digitalSeconds}`}>
      <svg className="focus-clock-svg" viewBox="0 0 400 400" aria-hidden="true">
        <circle className="focus-clock-progress-track" cx="200" cy="200" r={radius} />
        <circle
          className="focus-clock-progress"
          cx="200"
          cy="200"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, progress)))}
        />
        <circle className="focus-clock-face" cx="200" cy="200" r="160" />
        {Array.from({ length: 60 }, (_, index) => {
          const angle = (index * 6 - 90) * Math.PI / 180;
          const major = index % 5 === 0;
          const inner = major ? 139 : 149;
          const x1 = 200 + inner * Math.cos(angle);
          const y1 = 200 + inner * Math.sin(angle);
          const x2 = 200 + 153 * Math.cos(angle);
          const y2 = 200 + 153 * Math.sin(angle);
          return <line key={index} className={`focus-clock-tick${major ? ' is-major' : ''}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        <text className="focus-clock-number" x="200" y="94">12</text>
        <text className="focus-clock-number" x="306" y="207">3</text>
        <text className="focus-clock-number" x="200" y="320">6</text>
        <text className="focus-clock-number" x="94" y="207">9</text>
        <g className="focus-clock-hand" style={{ transform: `rotate(${hourAngle}deg)` }}>
          <line className="focus-clock-hour-hand" x1="200" y1="204" x2="200" y2="151" />
        </g>
        <g className="focus-clock-hand" style={{ transform: `rotate(${minuteAngle}deg)` }}>
          <line className="focus-clock-minute-hand" x1="200" y1="207" x2="200" y2="112" />
        </g>
        <g className="focus-clock-hand" style={{ transform: `rotate(${secondAngle}deg)` }}>
          <line className="focus-clock-second-hand" x1="200" y1="222" x2="200" y2="88" />
        </g>
        <circle className="focus-clock-hub" cx="200" cy="200" r="7" />
      </svg>
    </div>
  );
};

export default FocusClockDisplay;
