import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { api, ApiError } from '../api/client';
import type { Identity } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

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
        <h1 className="text-2xl font-semibold tracking-tight">Pulse Surveys</h1>
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
        Object.entries(groupByOrganization(identities)).map(([organizationName, orgIdentities]) => (
          <Card key={organizationName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
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
                  className="h-auto flex-col items-start gap-1 py-2"
                  onClick={() => login(identity)}
                >
                  <span className="font-medium">{identity.userName}</span>
                  <Badge variant={identity.role === 'manager' ? 'default' : 'secondary'}>{identity.role}</Badge>
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
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
