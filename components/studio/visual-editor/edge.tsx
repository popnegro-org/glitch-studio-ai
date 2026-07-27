import React from 'react';

const Edge = () => {
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <line x1="0" y1="0" x2="100" y2="100" stroke="black" />
    </svg>
  );
};

export default Edge;
