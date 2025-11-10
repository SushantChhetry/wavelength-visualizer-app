import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Visualizer } from './pages/Visualizer';
import { About } from './pages/About';
import './style.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Visualizer />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
