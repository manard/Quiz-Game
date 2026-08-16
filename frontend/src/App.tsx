import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/teacher/Dashboard";
import StartScreen from "./pages/game/StartScreen";
import GameForm from "./pages/teacher/GameForm";
import QuestionPairEditor from "./pages/teacher/QuestionPairEditor";
import PlayerSetup from "./pages/game/PlayerSetup";
import Instructions from "./pages/game/Instructions";
import PlayerIntro from "./pages/game/PlayerIntro";
import QuestionScreen from "./pages/game/QuestionScreen";
import PlayerHandoff from "./pages/game/PlayerHandoff";
import FinalResults from "./pages/game/FinalResults";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/teacher" replace />} />
      <Route path="/teacher" element={<Dashboard />} />
      <Route path="/game/:quizId" element={<StartScreen />} />
      <Route path="/teacher/new" element={<GameForm />} />
      <Route
        path="/teacher/quiz/:quizId/questions"
        element={<QuestionPairEditor />}
/>
      <Route path="/game/:quizId/players" element={<PlayerSetup />} />
      <Route path="/game/:quizId/instructions" element={<Instructions />} />
      <Route
  path="/game/:quizId/start-session"
  element={<PlayerIntro />}
/>
<Route
  path="/game/session/:sessionId/player/:playerSlot"
  element={<QuestionScreen />}
/>
<Route
  path="/game/session/:sessionId/handoff/:nextSlot"
  element={<PlayerHandoff />}
/>
<Route
  path="/game/session/:sessionId/results"
  element={<FinalResults />}
/>
  </Routes>
  );
}

export default App;