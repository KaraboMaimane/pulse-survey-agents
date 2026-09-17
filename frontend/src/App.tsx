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

  const isManager = identity.role === 'manager';

  return (
    <div className="min-h-screen">
      <div className="h-1.5 bg-gradient-to-r from-primary via-fuchsia-500 to-sky-400" />
      <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm ${
                isManager
                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-500'
              }`}
            >
              {initials(identity.userName)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium leading-none">{identity.userName}</span>
                <Badge
                  className={
                    isManager
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  }
                >
                  {identity.role}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">{identity.organizationName}</span>
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-3.5" />
            Switch user
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {isManager ? <ManagerSummaryView identity={identity} /> : <MemberSurveyView identity={identity} />}
      </main>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

