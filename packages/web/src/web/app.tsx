import { Route, Switch } from "wouter";
import { Navbar } from "./components/navbar";
import { ProtectedRoute } from "./components/protected-route";
import IndexPage from "./pages/index";
import CategoryPage from "./pages/category";
import ContactPage from "./pages/contact";
import AvailabilityPage from "./pages/availability";
import AdminPage from "./pages/admin";
import AdminLoginPage from "./pages/admin-login";
import { RunableBadge } from "@runablehq/website-runtime";
import { useLocation } from "wouter";
import { useEffect } from "react";

function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");
  return (
    <>
      {!isAdmin && <Navbar />}
      {children}
    </>
  );
}

const AFFILIATE_URL = "https://runable.com/?via=george-neill";

function App() {
  useEffect(() => {
    const badge = document.querySelector("a[data-runable-badge]") as HTMLAnchorElement | null;
    if (badge) badge.href = AFFILIATE_URL;
  }, []);

  return (
    <Layout>
      <Switch>
        <Route path="/" component={IndexPage} />
        <Route path="/category/:slug" component={CategoryPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/availability" component={AvailabilityPage} />
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/admin">
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        </Route>
        <Route>
          <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
            <p className="font-display text-2xl text-[#5A5A5A] italic">Page not found.</p>
          </div>
        </Route>
      </Switch>
      <RunableBadge />
    </Layout>
  );
}

export default App;
