import { Navigate } from 'react-router-dom';
import LandingView from '~/components/Landing';
import { AuthContextProvider, useAuthContext } from '~/hooks/AuthContext';

export function LandingGate() {
  const { isAuthenticated, isAuthReady } = useAuthContext();

  if (isAuthReady && isAuthenticated) {
    return <Navigate to="/c/new" replace={true} />;
  }

  return <LandingView />;
}

export default function LandingRoute() {
  return (
    <AuthContextProvider authConfig={{ loginRedirect: '/login', optional: true }}>
      <LandingGate />
    </AuthContextProvider>
  );
}
