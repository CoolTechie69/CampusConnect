import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BackgroundFX from './components/BackgroundFX';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import NewRequest from './pages/NewRequest';
import RequestDetail from './pages/RequestDetail';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Leaderboard from './pages/Leaderboard';
import Chats from './pages/Chats';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <BackgroundFX />
      <Navbar />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <Signup />
            </PublicOnly>
          }
        />
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/requests/new"
          element={
            <Protected>
              <NewRequest />
            </Protected>
          }
        />
        <Route
          path="/requests/:id"
          element={
            <Protected>
              <RequestDetail />
            </Protected>
          }
        />
        <Route
          path="/chats"
          element={
            <Protected>
              <Chats />
            </Protected>
          }
        />
        <Route
          path="/chats/:id"
          element={
            <Protected>
              <Chats />
            </Protected>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <Protected>
              <EditProfile />
            </Protected>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <Protected>
              <Leaderboard />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
