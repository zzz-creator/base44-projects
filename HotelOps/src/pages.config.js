/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminLogin from './pages/AdminLogin';
import Analytics from './pages/Analytics';
import CheckIn from './pages/CheckIn';
import ConferenceRoomAdmin from './pages/ConferenceRoomAdmin';
import Dashboard from './pages/Dashboard';
import ElevatorControl from './pages/ElevatorControl';
import EmergencyControl from './pages/EmergencyControl';
import GuestKiosk from './pages/GuestKiosk';
import Home from './pages/Home';
import LoyaltyAdmin from './pages/LoyaltyAdmin';
import MarketingAdmin from './pages/MarketingAdmin';
import MessageCenter from './pages/MessageCenter';
import ParkingManagement from './pages/ParkingManagement';
import RoomServiceAdmin from './pages/RoomServiceAdmin';
import Settings from './pages/Settings';
import StaffPortal from './pages/StaffPortal';
import SystemConfig from './pages/SystemConfig';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminLogin": AdminLogin,
    "Analytics": Analytics,
    "CheckIn": CheckIn,
    "ConferenceRoomAdmin": ConferenceRoomAdmin,
    "Dashboard": Dashboard,
    "ElevatorControl": ElevatorControl,
    "EmergencyControl": EmergencyControl,
    "GuestKiosk": GuestKiosk,
    "Home": Home,
    "LoyaltyAdmin": LoyaltyAdmin,
    "MarketingAdmin": MarketingAdmin,
    "MessageCenter": MessageCenter,
    "ParkingManagement": ParkingManagement,
    "RoomServiceAdmin": RoomServiceAdmin,
    "Settings": Settings,
    "StaffPortal": StaffPortal,
    "SystemConfig": SystemConfig,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};