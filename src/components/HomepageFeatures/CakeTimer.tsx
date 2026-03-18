import React, { useState, useEffect } from 'react';

// This is like a Java Interface - defining what 'Props' our component needs
interface TimerProps {
  seconds: number;
  cakeName: string;
}

export default function CakeTimer({ seconds, cakeName }: TimerProps): React.JSX.Element {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  return (
    <div style={{ border: '1px solid #3578e5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
      <h3>{cakeName} Baking Monitor</h3>
      <p>Time Remaining: <strong>{timeLeft} seconds</strong></p>
      <button onClick={() => setIsActive(!isActive)}>
        {isActive ? 'Pause Oven' : 'Start Baking'}
      </button>
      {timeLeft === 0 && <p style={{ color: 'green', fontWeight: 'bold' }}>Ding! Cake is ready!</p>}
    </div>
  );
}