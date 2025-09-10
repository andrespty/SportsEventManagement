import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import {Box,Button} from "@chakra-ui/react";
import { Dashboard } from './pages/Dashboard/Dashboard';
import { PrivateRoute } from './components/PrivateRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PublicRoute } from './components/PublicRoute';
import EventInvitePage from './pages/EventInvitePage';
import { ToastProvider } from './context/ToastContext';
import { EventsProvider } from './context/EventsContext';
import EventLayout from './pages/Event/EventLayout';
import { EventProvider } from './context/EventContext';
import EventInfo from './pages/Event/InfoSettings/EventInfo';
import EventMatches from './pages/Event/EventMatches';
import EventStandings from './pages/Event/Standings/EventStandings';
import EventSchedules from './pages/Event/Schedules/EventSchedules';
// WHEN TOKEN EXPIRES, LOG OUT AND NAVIGATE TO LOGIN


const App: React.FC = () => {
  return (
      <AuthProvider>
      <ToastProvider>
      <EventsProvider>
        <Router>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/events/:eventId"
              element={
                <PrivateRoute>
                  <EventProvider>
                    <EventLayout />
                  </EventProvider>
                </PrivateRoute>
              }
            >
              <Route index element={<EventMatches />} />
              <Route path='info' element={<EventInfo />} />
              <Route path='schedule' element={<EventSchedules />} />
              <Route path='standings' element={<EventStandings />} />
            </Route>

            <Route
              path="/events/invite/:event_token"
              element={
                // <PublicRoute>
                  <EventInvitePage />
                // </PublicRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </EventsProvider>
      </ToastProvider>
      </AuthProvider>
  );
};
export default App;