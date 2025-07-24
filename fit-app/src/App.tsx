import React from 'react';
import './App.css';

const App: React.FC = () => {
  console.log('App component rendering');
  
  return (
    <div style={{ background: 'blue', color: 'white', padding: '20px', fontSize: '24px' }}>
      <h1>React is working!</h1>
      <p>If you see this blue box, React loaded successfully.</p>
    </div>
  );
};

export default App;
