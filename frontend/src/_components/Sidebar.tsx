import React from 'react';
import '../App.css';
import { NavLink, useLocation } from 'react-router-dom';
 
// Define the type for menu items
export type MenuItem = {
    title: string;
    path: string;
};
 
const SidebarMenu: React.FC<{ menuItems: MenuItem[] }> = ({ menuItems }) => {
    const location = useLocation();

    return (
        <nav className="sidebar-menu">
            <div className='sidebar-header'>
                <h2>Froggywallet</h2>
            </div>
            <ul>
                {menuItems.map((item, index) => { 
                    const isActive = location.pathname.startsWith(item.path);

                    return (
                        <li key={index} className={isActive ? 'active' : ''}>
                            <NavLink 
                                to={item.path}
                                style={{ 
                                    display: 'block', 
                                    width: '100%', 
                                    height: '100%', 
                                    padding: '10px', 
                                    textDecoration: 'none',
                                    color: 'inherit'
                                }}
                            >
                                {item.title}
                            </NavLink>
                        </li>
                )})}
            </ul>
        </nav>
    );
};
 
export default SidebarMenu;