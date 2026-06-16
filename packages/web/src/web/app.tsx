import { Route, Switch } from "wouter";
import { Navbar } from "./components/navbar";
import { ProtectedRoute } from "./components/protected-route";
import IndexPage from "./pages/index";
import CategoryPage from "./pages/category";
import AdminPage from "./pages/admin";
import AdminLoginPage from "./pages/admin-login";
import { RunableBadge } from "@runablehq/website-runtime";
import { useLocation } from "wouter";

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

function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={IndexPage} />
        <Route path="/category/:slug" component={CategoryPage} />
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/admin">
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        </Route>
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <p className="font-display text-2xl text-[#A0A0A0] italic">Page not found.</p>
          </div>
        </Route>
      </Switch>
      <RunableBadge />
    </Layout>
  );
}

export default App;
