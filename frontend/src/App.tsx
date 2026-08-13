import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { BookOpen, FileText } from "lucide-react";
import QuestionBankPage from "./pages/QuestionBankPage";
import GenerateExamPage from "./pages/GenerateExamPage";

function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? "bg-[#2E5339] text-white" : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg text-[#2E5339]">
          <BookOpen size={22} />
          ExamGen
        </div>
        <div className="flex gap-2">
          <NavLink to="/" end className={linkClass}>
            <BookOpen size={16} /> Question Bank
          </NavLink>
          <NavLink to="/generate" className={linkClass}>
            <FileText size={16} /> Generate Exam
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<QuestionBankPage />} />
            <Route path="/generate" element={<GenerateExamPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
