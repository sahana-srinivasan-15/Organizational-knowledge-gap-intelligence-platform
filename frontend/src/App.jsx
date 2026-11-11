import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoadingSkeleton from './components/common/LoadingSkeleton';

// Pages
import LoginPage from './pages/LoginPage';
import WelcomePage from './pages/WelcomePage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';
import PublicTransparencyPortal from './pages/PublicTransparencyPortal';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import SkillGapPage from './pages/employee/SkillGapPage';
import AssessmentCatalogPage from './pages/employee/AssessmentCatalogPage';
import AssessmentQuizPage from './pages/employee/AssessmentQuizPage';
import CourseRecommendationsPage from './pages/employee/CourseRecommendationsPage';
import LearningPathPage from './pages/employee/LearningPathPage';
import MentorshipPage from './pages/employee/MentorshipPage';
import CourseDiscoveryPage from './pages/employee/CourseDiscoveryPage';
import MyCourseRequestsPage from './pages/employee/MyCourseRequestsPage';
import MyCertificatesPage from './pages/employee/MyCertificatesPage';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import EmployeeManagementPage from './pages/manager/EmployeeManagementPage';
import TeamReadinessPage from './pages/manager/TeamReadinessPage';
import MentorApprovalPage from './pages/manager/MentorApprovalPage';
import TeamPathwaysPage from './pages/manager/TeamPathwaysPage';
import CourseApprovalManagementPage from './pages/manager/CourseApprovalManagementPage';
import TeamSkillGapMatrixPage from './pages/manager/TeamSkillGapMatrixPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import CatalogsPage from './pages/admin/CatalogsPage';
import EmployeePerformancePage from './pages/admin/EmployeePerformancePage';

// Mentor Pages
import MentorDashboard from './pages/mentor/MentorDashboard';

// Live Classes Page
import LiveClassesPage from './pages/LiveClassesPage';

// Protected Route Guard
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const effectiveRole = user?.activeRole || user?.role;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ width: '320px', textAlign: 'center' }}>
          <LoadingSkeleton height="35px" lines={2} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(effectiveRole) && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Role-tailored root dashboard router
const RoleDashboardRouter = () => {
  const { user } = useAuth();
  const effectiveRole = user?.activeRole || user?.role;

  switch (effectiveRole) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    case 'MENTOR':
      return <MentorDashboard />;
    case 'EMPLOYEE':
    default:
      return <EmployeeDashboard />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Home Page: Public Transparency Portal */}
          <Route path="/" element={<PublicTransparencyPortal />} />
          <Route path="/portal" element={<PublicTransparencyPortal />} />
          <Route path="/transparency" element={<PublicTransparencyPortal />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Welcome Transition Splash Screen (Protected, Standalone) */}
          <Route
            path="/welcome"
            element={
              <ProtectedRoute>
                <WelcomePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Application Workspace */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Default Dashboard Router */}
            <Route path="dashboard" element={<RoleDashboardRouter />} />

            {/* Employee Accessible Routes */}
            <Route path="live-classes" element={<LiveClassesPage />} />
            <Route path="skill-gaps" element={<SkillGapPage />} />
            <Route path="assessments" element={<AssessmentCatalogPage />} />
            <Route
              path="assessments/:id/take"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                  <AssessmentQuizPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="assessments/course/:courseId/take"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                  <AssessmentQuizPage />
                </ProtectedRoute>
              }
            />
            <Route path="courses" element={<CourseRecommendationsPage />} />
            <Route path="course-discovery" element={<CourseDiscoveryPage />} />
            <Route
              path="my-course-requests"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN']}>
                  <MyCourseRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route path="learning-path" element={<LearningPathPage />} />
            <Route
              path="my-certificates"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN']}>
                  <MyCertificatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="mentorship"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                  <MentorshipPage />
                </ProtectedRoute>
              }
            />

            {/* Manager Accessible Routes */}
            <Route
              path="team-readiness"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <TeamReadinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="mentor-approvals"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <MentorApprovalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="team-pathways"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <TeamPathwaysPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="manager/employees"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <EmployeeManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="manager/course-approvals"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <CourseApprovalManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="manager/team-skill-matrix"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <TeamSkillGapMatrixPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Accessible Routes */}
            <Route
              path="admin/employee-performance"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <EmployeePerformancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/catalogs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <CatalogsPage />
                </ProtectedRoute>
              }
            />

            {/* Mentor Accessible Routes (Accessible to MENTOR, ADMIN, and peer-mentoring EMPLOYEEs) */}
            <Route
              path="mentor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN', 'EMPLOYEE']}>
                  <MentorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="mentor"
              element={<Navigate to="/mentor/dashboard" replace />}
            />
            <Route
              path="mentor-dashboard"
              element={<Navigate to="/mentor/dashboard" replace />}
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
