import React, { useState } from 'react';
import { GiPuzzle } from 'react-icons/gi';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [riddle, setRiddle] = useState('');
  const [answer, setAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateRiddle = async () => {
    if (!prompt) {
      alert("Please enter a theme or topic for the riddle!");
      return;
    }

    setIsLoading(true);
    setRiddle('');
    setAnswer('');
    setShowAnswer(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/generate-riddle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('Server error');

      const data = await response.json();
      setRiddle(data.riddle);
      setAnswer(data.answer);
    } catch (error) {
      console.error("Failed to fetch riddle:", error);
      alert("Oops! Something went wrong while generating a riddle.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white flex flex-col items-center p-6">
      <div className="w-full max-w-3xl mx-auto">
        <header className="text-center my-8">
          <h1 className="text-5xl font-bold text-yellow-400 flex items-center justify-center gap-3">
            <GiPuzzle className="animate-spin-slow" />
            AI Riddle & Puzzle Creator
          </h1>
          <p className="text-lg mt-2 text-gray-300">
            Enter a theme, and I’ll craft a fun riddle for you!
          </p>
        </header>

        <main>
          <div className="bg-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-md border border-yellow-400/30">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: animals, space, friendship"
                className="w-full p-4 rounded-xl bg-black/50 text-yellow-300 placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
            </div>

            <button
              onClick={handleGenerateRiddle}
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 text-xl font-bold bg-yellow-400 text-black py-4 rounded-xl hover:bg-yellow-500 transition-transform transform hover:scale-105 disabled:bg-gray-500"
            >
              {isLoading ? (
                <>
                  <span>Thinking...</span>
                  <GiPuzzle className="animate-spin" />
                </>
              ) : (
                <>
                  <span>Generate Riddle</span>
                  <GiPuzzle />
                </>
              )}
            </button>
          </div>

          {riddle && (
            <div className="mt-8 bg-white/10 p-8 rounded-2xl shadow-2xl text-yellow-200 leading-relaxed">
              <h2 className="text-3xl font-bold text-center mb-4 text-yellow-300">Here’s your riddle!</h2>
              <p className="text-lg whitespace-pre-wrap">{riddle}</p>

              {!showAnswer && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="px-6 py-3 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition"
                  >
                    Show Answer
                  </button>
                </div>
              )}

              {showAnswer && (
                <div className="mt-6 text-center">
                  <h3 className="text-2xl font-semibold text-green-400">Answer:</h3>
                  <p className="text-lg mt-2">{answer}</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
