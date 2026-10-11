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
import AdminSettings from './pages/AdminSettings';
import AssetLocations from './pages/AssetLocations';
import Automation from './pages/Automation';
import CommunicationHub from './pages/CommunicationHub';
import CrewAssignments from './pages/CrewAssignments';
import CrewDirectory from './pages/CrewDirectory';
import CrewFinder from './pages/CrewFinder';
import CrewMemberDetail from './pages/CrewMemberDetail';
import CrewMembers from './pages/CrewMembers';
import CueDocs from './pages/CueDocs';
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import EquipmentScheduling from './pages/EquipmentScheduling';
import Incidents from './pages/Incidents';
import Knowledge from './pages/Knowledge';
import Maintenance from './pages/Maintenance';
import Messages from './pages/Messages';
import MyAssignments from './pages/MyAssignments';
import NotificationSettings from './pages/NotificationSettings';
import Procedures from './pages/Procedures';
import ProductionCalendar from './pages/ProductionCalendar';
import ProductionDashboard from './pages/ProductionDashboard';
import ProductionDetail from './pages/ProductionDetail';
import ProductionTemplates from './pages/ProductionTemplates';
import Productions from './pages/Productions';
import ProductionsDashboard from './pages/ProductionsDashboard';
import Reports from './pages/Reports';
import Tasks from './pages/Tasks';
import Venues from './pages/Venues';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminSettings": AdminSettings,
    "AssetLocations": AssetLocations,
    "Automation": Automation,
    "CommunicationHub": CommunicationHub,
    "CrewAssignments": CrewAssignments,
    "CrewDirectory": CrewDirectory,
    "CrewFinder": CrewFinder,
    "CrewMemberDetail": CrewMemberDetail,
    "CrewMembers": CrewMembers,
    "CueDocs": CueDocs,
    "Dashboard": Dashboard,
    "Equipment": Equipment,
    "EquipmentScheduling": EquipmentScheduling,
    "Incidents": Incidents,
    "Knowledge": Knowledge,
    "Maintenance": Maintenance,
    "Messages": Messages,
    "MyAssignments": MyAssignments,
    "NotificationSettings": NotificationSettings,
    "Procedures": Procedures,
    "ProductionCalendar": ProductionCalendar,
    "ProductionDashboard": ProductionDashboard,
    "ProductionDetail": ProductionDetail,
    "ProductionTemplates": ProductionTemplates,
    "Productions": Productions,
    "ProductionsDashboard": ProductionsDashboard,
    "Reports": Reports,
    "Tasks": Tasks,
    "Venues": Venues,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};