import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import Home from "./pages/Home";
import Join from "./pages/Join";
import Party from "./pages/Party";
import Results from "./pages/Results";

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join/:code?" element={<Join />} />
          <Route path="/party/:code" element={<Party />} />
          <Route path="/results/:partyId" element={<Results />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
