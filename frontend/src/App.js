import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepag from "./Homepag";        // default landing page
import Homepage from "./Homepage";      // full homepage after Get Started
import ComparisonPage from "./ComparisonPage";
import Thred from "./Thred";
import Chatbot from "./chatbot";
import Table from "./table";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepag />} />
        <Route path="/dashboard" element={<Homepage />} />
        <Route path="/compare" element={<ComparisonPage />} />
        <Route path="/3d-profile" element={<Thred />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/table" element={<Table />} />
      </Routes>
    </Router>
  );
}

export default App;
