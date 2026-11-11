import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Target,
  FileCheck2,
  BookOpen,
  Route,
  Users2,
  CheckCircle,
  ShieldCheck,
  Activity,
  Compass,
  UserPlus,
  Award,
  Video,
  TrendingUp,
} from 'lucide-react';

export const Sidebar = () => {
  const { user, isAdmin, isManager, isEmployee, isMentor } = useAuth();

  const employeeLinks = [
    { to: '/dashboard', label: 'My Readiness', icon: LayoutDashboard },
    { to: '/skill-gaps', label: 'Skill Gap Radar', icon: Target },
    { to: '/live-classes', label: 'Live Classes', icon: Video },
    { to: '/courses', label: 'Recommended Courses', icon: BookOpen },
    { to: '/course-discovery', label: 'Course Discovery & Compare', icon: Compass },
    { to: '/my-course-requests', label: 'My Course Requests', icon: FileCheck2 },
    { to: '/learning-path', label: 'Learning Roadmap', icon: Route },
    { to: '/my-certificates', label: 'My Certificates', icon: Award },
    { to: '/mentorship', label: 'Peer Mentorship', icon: Users2 },
  ];

  const mentorLinks = [
    { to: '/dashboard', label: 'Mentor Hub', icon: LayoutDashboard },
    { to: '/live-classes', label: 'Live Classes', icon: Video },
    { to: '/course-discovery', label: 'Explore & Compare Courses', icon: Compass },
    { to: '/courses', label: 'Course Catalog', icon: BookOpen },
  ];

  const managerLinks = [
    { to: '/dashboard', label: 'Department Overview', icon: LayoutDashboard },
    { to: '/live-classes', label: 'Live Classes', icon: Video },
    { to: '/manager/employees', label: 'Employee Provisioning', icon: UserPlus },
    { to: '/manager/team-skill-matrix', label: 'Team Skill Gap Matrix', icon: Target },
    { to: '/manager/course-approvals', label: 'Course Approvals Queue', icon: BookOpen },
    { to: '/team-readiness', label: 'Team Skill Coverage', icon: Activity },
    { to: '/mentor-approvals', label: 'Mentor Approvals', icon: CheckCircle },
    { to: '/team-pathways', label: 'Team Learning Paths', icon: Route },
    { to: '/course-discovery', label: 'Explore Courses', icon: Compass },
  ];

  const adminLinks = [
    { to: '/dashboard', label: 'Platform Metrics', icon: LayoutDashboard },
    { to: '/admin/employee-performance', label: 'Employee Performance', icon: TrendingUp },
    { to: '/admin/users', label: 'User Directory & RBAC', icon: ShieldCheck },
    { to: '/admin/catalogs', label: 'Course Catalogs', icon: BookOpen },
  ];

  const links = isAdmin ? adminLinks : isManager ? managerLinks : isMentor ? mentorLinks : employeeLinks;

  return (
    <aside
      style={{
        width: '260px',
        borderRight: '1px solid var(--border-subtle)',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem 1rem',
        minHeight: 'calc(100vh - 4.25rem)',
      }}
    >
      <div>
        <div style={{ padding: '0 0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
            {user?.activeRole || user?.role} Workspace
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.7rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: isActive
                    ? 'rgba(79, 70, 229, 0.08)'
                    : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  transition: 'all var(--transition-fast)',
                })}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
