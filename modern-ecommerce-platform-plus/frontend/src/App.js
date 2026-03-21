import React from 'react';
import AppRoutes from './routes/AppRoutes';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

function App() {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

export default App;