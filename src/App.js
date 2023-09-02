import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./loginPage"
import Success from './successPage'
import SubmitField from './submitField'

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<Success/>} />
                <Route path="/test" element={<SubmitField/>} />
                <Route path="/*" element={<Navigate to="" replace />} />
            </Routes>
        </Router>
    )
}

export default App;