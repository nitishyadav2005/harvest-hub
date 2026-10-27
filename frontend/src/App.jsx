
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FieldsCrops from "./pages/FieldsCrops";
import ProtectedRoute from "./components/ProtectedRoute";
import CropPlanning from "./pages/CropPlanning";
import Operations from "./pages/Operations";
import Equipment from "./pages/Equipment";
import Finance from "./pages/Finance";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/fields-crops"
                        element={<FieldsCrops />}
                    />

                    <Route
                        path="/crop-planning"
                        element={<CropPlanning />}
                    />

                    <Route
                        path="/operations"
                        element={<Operations />}
                    />

                    <Route
                        path="/equipment"
                        element={<Equipment />}
                    />
                    <Route
                        path="/finance"
                        element={<Finance />}
                    />
                </Route>

                <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                />
                <Route
                    path="/equipment"
                    element={<Equipment />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
