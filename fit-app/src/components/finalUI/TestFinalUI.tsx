import React from 'react';

const TestFinalUI: React.FC = () => {
  return (
    <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center py-20">FinalUI Component Test</h1>
        <p className="text-center text-xl">If you can see this, the component is working!</p>
        <div className="text-center mt-8">
          <button 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg"
            onClick={() => alert('Button click works!')}
          >
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestFinalUI;


