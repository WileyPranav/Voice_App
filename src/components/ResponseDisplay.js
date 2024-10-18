import React from 'react';

function ResponseDisplay({ transcript, response }) {
  return (
    <div>
      <h3>You said:</h3>
      <p>{transcript}</p>
      <h3>Assistant response:</h3>
      <p>{response}</p>
    </div>
  );
}

export default ResponseDisplay;
