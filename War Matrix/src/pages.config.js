import Dashboard from './pages/Dashboard';
import CurrentWars from './pages/CurrentWars';
import PastWars from './pages/PastWars';
import FutureWars from './pages/FutureWars';
import ConflictSimulator from './pages/ConflictSimulator';
import StrategyHub from './pages/StrategyHub';
import RealTimeDataHub from './pages/RealTimeDataHub';
import Help from './pages/Help';
import AlertsManagement from './pages/AlertsManagement';
import Settings from './pages/Settings';
import UserProfile from './pages/UserProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "CurrentWars": CurrentWars,
    "PastWars": PastWars,
    "FutureWars": FutureWars,
    "ConflictSimulator": ConflictSimulator,
    "StrategyHub": StrategyHub,
    "RealTimeDataHub": RealTimeDataHub,
    "Help": Help,
    "AlertsManagement": AlertsManagement,
    "Settings": Settings,
    "UserProfile": UserProfile,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};