import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Identity } from '../api/types';
import { useAuth } from '../auth/AuthContext';

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

  if (isLoading) {
    return <p>Loading seeded users…</p>;
  }

  if (error) {
    return <p role="alert">Failed to load users: {error}</p>;
  }

  const identitiesByOrganization = groupByOrganization(identities);

  return (
    <div>
      <h1>Pulse Surveys — sign in</h1>
      <p>Local dev only: pick a seeded user to act as.</p>
      {Object.entries(identitiesByOrganization).map(([organizationName, orgIdentities]) => (
        <section key={organizationName}>
          <h2>{organizationName}</h2>
          <ul className="identity-list">
            {orgIdentities.map((identity) => (
              <li key={identity.userId}>
                <button type="button" onClick={() => login(identity)}>
                  {identity.userName} <span className="role-badge">{identity.role}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
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
