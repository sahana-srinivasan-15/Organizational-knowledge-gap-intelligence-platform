import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If token exists, verify current user
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authApi.getCurrentUser();
          if (res?.data) {
            const u = res.data;
            const storedActiveRole = localStorage.getItem('activeRole');
            const mappedUser = {
              id: u.userId || u.id,
              userId: u.userId || u.id,
              email: u.email,
              fullName: u.fullName,
              role: u.role,
              activeRole: storedActiveRole || u.activeRole || u.role,
              departmentId: u.departmentId,
              departmentName: u.departmentName,
              department: u.department || (u.departmentId || u.departmentName ? {
                id: u.departmentId,
                name: u.departmentName,
                code: u.departmentName?.toLowerCase().includes('eng') ? 'ENG' : (u.departmentName ? u.departmentName.slice(0, 4).toUpperCase() : ''),
              } : null),
              employeeProfile: u.employeeProfile,
              mentorOptIn: Boolean(
                u.employeeProfile?.mentorOptIn ??
                (localStorage.getItem(`mentorOptIn_${u.userId || u.id}`) === 'true')
              ),
            };
            setUser(mappedUser);
            localStorage.setItem('user', JSON.stringify(mappedUser));
          }
        } catch (error) {
          console.warn('Session verification failed, logging out');
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const updateMentorOptIn = (optIn) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        mentorOptIn: Boolean(optIn),
        employeeProfile: prev.employeeProfile
          ? { ...prev.employeeProfile, mentorOptIn: Boolean(optIn) }
          : prev.employeeProfile,
      };
      localStorage.setItem('user', JSON.stringify(updated));
      if (prev.id) {
        localStorage.setItem(`mentorOptIn_${prev.id}`, String(Boolean(optIn)));
      }
      return updated;
    });
  };

  const switchActiveRole = (newRole) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, activeRole: newRole };
      localStorage.setItem('user', JSON.stringify(updated));
      localStorage.setItem('activeRole', newRole);
      return updated;
    });
  };

  const login = async (email, password, selectedRole = null) => {
    const res = await authApi.login(email, password);
    const authData = res?.data;
    const authToken = authData?.accessToken || authData?.token;

    if (authToken) {
      const uId = authData.userId || authData.id;
      const storedMentorOptIn = localStorage.getItem(`mentorOptIn_${uId}`) === 'true';

      // Validate selected role against permissions
      let effectiveActiveRole = selectedRole || authData.role;
      if (selectedRole === 'MANAGER') {
        if (authData.role !== 'MANAGER' && authData.role !== 'ADMIN') {
          throw new Error('Account does not have Manager privileges. Please select Employee or Mentor role.');
        }
        effectiveActiveRole = 'MANAGER';
      } else if (selectedRole === 'ADMIN') {
        if (authData.role !== 'ADMIN') {
          throw new Error('Account does not have Administrator privileges. Please select your assigned role.');
        }
        effectiveActiveRole = 'ADMIN';
      } else if (selectedRole === 'MENTOR') {
        effectiveActiveRole = 'MENTOR';
      } else if (selectedRole === 'EMPLOYEE') {
        effectiveActiveRole = 'EMPLOYEE';
      }

      const userData = {
        id: uId,
        userId: uId,
        email: authData.email,
        fullName: authData.fullName,
        role: authData.role,
        activeRole: effectiveActiveRole,
        departmentId: authData.departmentId,
        departmentName: authData.departmentName,
        mentorOptIn: storedMentorOptIn,
        department: authData.department || (authData.departmentId || authData.departmentName ? {
          id: authData.departmentId,
          name: authData.departmentName,
          code: authData.departmentName?.toLowerCase().includes('eng') ? 'ENG' : (authData.departmentName ? authData.departmentName.slice(0, 4).toUpperCase() : ''),
        } : null),
      };

      setToken(authToken);
      setUser(userData);

      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('activeRole', effectiveActiveRole);

      // Asynchronously fetch profile to ensure mentorOptIn is completely up-to-date
      if (authData.role === 'EMPLOYEE' && typeof authApi.getEmployeeProfile === 'function') {
        authApi.getEmployeeProfile().then((profRes) => {
          if (profRes?.data?.mentorOptIn !== undefined) {
            updateMentorOptIn(profRes.data.mentorOptIn);
          }
        }).catch(() => {});
      }

      return userData;
    } else {
      const errMsg = res?.success === false
        ? (res?.message || 'Login failed')
        : 'Authentication failed: missing access token in server response';
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeRole');
  };

  const effectiveRole = user?.activeRole || user?.role;

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    updateMentorOptIn,
    switchActiveRole,
    activeRole: effectiveRole,
    isAdmin: effectiveRole === 'ADMIN',
    isManager: effectiveRole === 'MANAGER',
    isEmployee: effectiveRole === 'EMPLOYEE',
    isMentor: effectiveRole === 'MENTOR',
    isPeerMentor: Boolean((user?.role === 'EMPLOYEE' || effectiveRole === 'EMPLOYEE') && (user?.mentorOptIn || user?.employeeProfile?.mentorOptIn)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
