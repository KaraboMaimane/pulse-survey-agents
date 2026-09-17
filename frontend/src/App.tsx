import { LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPicker } from './components/LoginPicker';
import { MemberSurveyView } from './components/MemberSurveyView';
import { ManagerSummaryView } from './components/ManagerSummaryView';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function AppShell() {
  const { identity, logout } = useAuth();

  if (!identity) {
    return <LoginPicker />;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">{identity.userName}</span>
            <span className="text-sm text-muted-foreground">· {identity.organizationName}</span>
            <Badge variant={identity.role === 'manager' ? 'default' : 'secondary'}>{identity.role}</Badge>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-3.5" />
            Switch user
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {identity.role === 'manager' ? <ManagerSummaryView identity={identity} /> : <MemberSurveyView identity={identity} />}
      </main>
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
