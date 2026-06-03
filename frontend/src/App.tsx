import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import Cursor from "./components/Cursor";
import Home from "./pages/Home";
import Join from "./pages/Join";
import Party from "./pages/Party";
import Results from "./pages/Results";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/join/:code?" element={<Join />} />
        <Route path="/party/:code" element={<Party />} />
        <Route path="/results/:partyId" element={<Results />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Cursor />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
