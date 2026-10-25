import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import ARNavigation from "./pages/ARNavigation";
import Account from "./pages/Account";
import Assistant from "./pages/Assistant";
import AdminDashboard from "./pages/AdminDashboard";
import CampusContentManager from "./pages/CampusContentManager";
import Destinations from "./pages/Destinations";
import GraphEditor from "./pages/GraphEditor";
import History from "./pages/History";
import Home from "./pages/Home";
import MapNavigation from "./pages/MapNavigation";
import SharedRoute from "./pages/SharedRoute";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/destinations"} component={Destinations} />
      <Route path={"/map"} component={MapNavigation} />
      <Route path={"/ar"} component={ARNavigation} />
      <Route path={"/history"} component={History} />
      <Route path={"/account"} component={Account} />
      <Route path={"/assistant"} component={Assistant} />
      <Route path={"/shared/:token"} component={SharedRoute} />
      <Route path={"/admin/graph"} component={GraphEditor} />
      <Route path={"/admin/content"} component={CampusContentManager} />
      <Route path={"/admin/:rest*"} component={AdminDashboard} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
