import LandingView from '~/components/Landing';
import { AuthContextProvider } from '~/hooks/AuthContext';

export function LandingGate() {
  return <LandingView />;
}

export default function LandingRoute() {
  return (
    <AuthContextProvider authConfig={{ loginRedirect: '/login', optional: true }}>
      <LandingGate />
    </AuthContextProvider>
  );
}
