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
import Colonies from './pages/Colonies';
import Combat from './pages/Combat';
import Dashboard from './pages/Dashboard';
import Diplomacy from './pages/Diplomacy';
import Factions from './pages/Factions';
import Fleet from './pages/Fleet';
import Fleets from './pages/Fleets';
import Infrastructure from './pages/Infrastructure';
import Market from './pages/Market';
import Research from './pages/Research';
import ShipDesigner from './pages/ShipDesigner';
import Threats from './pages/Threats';
import TradeRoutes from './pages/TradeRoutes';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Colonies": Colonies,
    "Combat": Combat,
    "Dashboard": Dashboard,
    "Diplomacy": Diplomacy,
    "Factions": Factions,
    "Fleet": Fleet,
    "Fleets": Fleets,
    "Infrastructure": Infrastructure,
    "Market": Market,
    "Research": Research,
    "ShipDesigner": ShipDesigner,
    "Threats": Threats,
    "TradeRoutes": TradeRoutes,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};