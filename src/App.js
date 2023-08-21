import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./loginPage"
import Success from './successPage'

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/test" element={<h1>Test Route</h1>} />
                <Route path="/dashboard" element={<Success/>} />
                <Route path="/*" element={<Navigate to="" replace />} />
            </Routes>
        </Router>
    )
}

export default App;