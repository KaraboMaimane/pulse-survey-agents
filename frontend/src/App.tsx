import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPicker } from './components/LoginPicker';
import { MemberSurveyView } from './components/MemberSurveyView';
import { ManagerSummaryView } from './components/ManagerSummaryView';

function AppShell() {
  const { identity, logout } = useAuth();

  if (!identity) {
    return <LoginPicker />;
  }

  return (
    <div>
      <header className="app-header">
        <div>
          <strong>{identity.userName}</strong> · {identity.organizationName} · {identity.role}
        </div>
        <button type="button" onClick={logout}>
          Switch user
        </button>
      </header>

      <main>{identity.role === 'manager' ? <ManagerSummaryView identity={identity} /> : <MemberSurveyView identity={identity} />}</main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
