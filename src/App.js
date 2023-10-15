import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from "./homePage"
import Login from "./loginPage"
import Success from './successPage'

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login/>} />
                <Route path="/dashboard" element={<Success/>} />
                {/* <Route path="/*" element={<Navigate to="" replace />} /> */}
            </Routes>
        </Router>
    )
}

export default App;