import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./loginPage"
import Success from './successPage'

function App() {
    return (
        <Router basename="/lang">
            <Routes>
                <Route path="/lang" element={<Login />} />
                <Route path="/lang/success" element={<Success/>} />
                <Route path="*" element={<Navigate to="/lang" replace />} />
            </Routes>
        </Router>
    )
}

export default App;