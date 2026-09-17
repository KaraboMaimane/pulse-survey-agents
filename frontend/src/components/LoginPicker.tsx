import { useEffect, useState } from 'react';
import { Building2, Waves } from 'lucide-react';
import { api, ApiError } from '../api/client';
import type { Identity } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const ORG_ACCENTS = [
  { icon: 'bg-gradient-to-br from-violet-500 to-fuchsia-500', ring: 'hover:border-violet-300' },
  { icon: 'bg-gradient-to-br from-sky-500 to-cyan-400', ring: 'hover:border-sky-300' },
  { icon: 'bg-gradient-to-br from-amber-500 to-orange-400', ring: 'hover:border-amber-300' },
];

export function LoginPicker() {
  const { login } = useAuth();
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .listIdentities()
      .then(setIdentities)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Could not reach the API');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-fuchsia-500 text-white shadow-lg shadow-primary/30">
          <Waves className="size-6" />
        </div>
        <h1 className="bg-gradient-to-r from-primary via-fuchsia-500 to-sky-500 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
          Pulse Surveys
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Local dev only — pick a seeded user to sign in as. No password needed.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load users</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading &&
        !error &&
        Object.entries(groupByOrganization(identities)).map(([organizationName, orgIdentities], index) => {
          const accent = ORG_ACCENTS[index % ORG_ACCENTS.length];
          return (
            <Card key={organizationName} className={`transition-colors ${accent.ring}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className={`flex size-7 items-center justify-center rounded-lg text-white ${accent.icon}`}>
                    <Building2 className="size-4" />
                  </span>
                  {organizationName}
                </CardTitle>
                <CardDescription>{orgIdentities.length} seeded users</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {orgIdentities.map((identity) => (
                  <Button
                    key={identity.userId}
                    type="button"
                    variant="outline"
                    className="h-auto flex-col items-start gap-1.5 py-2 hover:border-primary/40 hover:bg-accent"
                    onClick={() => login(identity)}
                  >
                    <span className="font-medium">{identity.userName}</span>
                    <Badge
                      className={
                        identity.role === 'manager'
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      }
                    >
                      {identity.role}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}

function groupByOrganization(identities: Identity[]): Record<string, Identity[]> {
  return identities.reduce<Record<string, Identity[]>>((groups, identity) => {
    const key = identity.organizationName;
    groups[key] = groups[key] ? [...groups[key], identity] : [identity];
    return groups;
  }, {});
}
