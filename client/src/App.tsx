import { Routes, Route } from "react-router-dom";
import { useAuthInit } from "./hooks/useAuthInit";
import Navigation from "./components/Navigation";
import AddLocation from "./pages/AddLocation";
import EditLocation from "./pages/EditLocation";
import LocationsList from "./pages/LocationsList";
import MapPage from "./pages/MapPage";
import AdminPage from "./pages/AdminPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import "./App.css";

function App() {
  useAuthInit();

  return (
    <div className="app">
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/" element={<MapPage />} />

        {/* Админские маршруты */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/locations"
          element={
            <>
              <ProtectedRoute>
                <Navigation />
                <main className="main-content">
                  <LocationsList />
                </main>
              </ProtectedRoute>
            </>
          }
        />
        <Route
          path="/admin/add"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Navigation />
                <main className="main-content">
                  <AddLocation />
                </main>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Navigation />
                <main className="main-content">
                  <EditLocation />
                </main>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
