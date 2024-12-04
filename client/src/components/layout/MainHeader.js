import React, { useState } from 'react';
import {
    AppBar,
    Box,
    Toolbar,
    IconButton,
    Typography,
    Menu,
    Container,
    Avatar,
    Tooltip,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    Inventory2 as InventoryIcon,
    Assessment as AssessmentIcon,
    ShoppingCart as SalesIcon,
    People as CustomersIcon,
    LocalShipping as SuppliersIcon,
    PointOfSale as POSIcon,
    Receipt as ReceiptIcon,
    LocalOffer as PromotionsIcon,
    Description as OrdersIcon,
    Group as UsersIcon,
    Settings as SettingsIcon,
    Menu as MenuIcon,
    Business as BusinessIcon,
    Logout as LogoutIcon,
    AccountBalance as AccountingIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo.svg';

const menuItems = [
    {
        text: 'Inventory',
        icon: <InventoryIcon />,
        items: [
            { text: 'Products', path: '/inventory/products' },
            { text: 'Stock Management', path: '/inventory/stock' },
            { text: 'Reorder Management', path: '/inventory/reorder' },
            { text: 'Reports', path: '/inventory/reports', icon: <AssessmentIcon /> },
        ]
    },
    {
        text: 'Sales',
        icon: <SalesIcon />,
        items: [
            { text: 'Sales Overview', path: '/sales' },
            { text: 'Sales History', path: '/sales/history' },
        ]
    },
    {
        text: 'POS',
        icon: <POSIcon />,
        items: [
            { text: 'Sales Terminal', path: '/pos' },
            { text: 'Receipts', path: '/pos/receipts', icon: <ReceiptIcon /> },
            { text: 'Discounts & Promotions', path: '/pos/promotions', icon: <PromotionsIcon /> },
        ]
    },
    {
        text: 'Orders',
        icon: <OrdersIcon />,
        items: [
            { text: 'Orders List', path: '/orders' },
            { text: 'Documents', path: '/orders/documents' },
        ]
    },
    {
        text: 'Accounting',
        icon: <AccountingIcon />,
        path: '/accounting'
    },
    {
        text: 'Customers',
        icon: <CustomersIcon />,
        path: '/customers'
    },
    {
        text: 'Suppliers',
        icon: <SuppliersIcon />,
        path: '/suppliers'
    },
    {
        text: 'Users',
        icon: <UsersIcon />,
        path: '/users'
    },
    {
        text: 'Settings',
        icon: <SettingsIcon />,
        path: '/settings'
    },
];

const MainHeader = () => {
    const [anchorElNav, setAnchorElNav] = useState(null);
    const [anchorElUser, setAnchorElUser] = useState(null);
    const [anchorElSubMenu, setAnchorElSubMenu] = useState(null);
    const [selectedMainMenu, setSelectedMainMenu] = useState(null);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget);
    };

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleOpenSubMenu = (event, menuItem) => {
        setAnchorElSubMenu(event.currentTarget);
        setSelectedMainMenu(menuItem);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleCloseSubMenu = () => {
        setAnchorElSubMenu(null);
        setSelectedMainMenu(null);
    };

    const handleMenuClick = (path) => {
        navigate(path);
        handleCloseNavMenu();
        handleCloseSubMenu();
    };

    const handleLogout = () => {
        logout();
        handleCloseUserMenu();
    };

    return (
        <AppBar position="static" sx={{ mb: 2 }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ minHeight: { xs: 80, md: 88 } }}>
                    {/* Logo and Brand - Desktop */}
                    <Box 
                        component="div"
                        onClick={() => handleMenuClick('/')}
                        sx={{ 
                            display: { xs: 'none', md: 'flex' }, 
                            alignItems: 'center',
                            mr: 4,
                            cursor: 'pointer',
                            '&:hover': {
                                opacity: 0.9
                            }
                        }}
                    >
                        <img src={logo} alt="RetailMaster Logo" style={{ height: '45px', marginRight: '16px' }} />
                        <Typography
                            variant="h5"
                            noWrap
                            sx={{
                                fontWeight: 700,
                                color: 'inherit',
                                textDecoration: 'none',
                            }}
                        >
                            RetailMaster
                        </Typography>
                    </Box>

                    {/* Mobile Menu */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            aria-label="menu"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit"
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            open={Boolean(anchorElNav)}
                            onClose={handleCloseNavMenu}
                            sx={{
                                display: { xs: 'block', md: 'none' },
                                '& .MuiPaper-root': {
                                    width: '85%',
                                    maxWidth: '320px',
                                    mt: 1.5
                                }
                            }}
                        >
                            {menuItems.map((item) => (
                                <MenuItem
                                    key={item.text}
                                    onClick={item.items ? 
                                        (event) => handleOpenSubMenu(event, item) :
                                        () => handleMenuClick(item.path)
                                    }
                                    sx={{ py: 1.5 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={item.text}
                                        primaryTypographyProps={{
                                            variant: 'body1',
                                            fontWeight: 500
                                        }}
                                    />
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>

                    {/* Logo and Brand - Mobile */}
                    <Box 
                        component="div"
                        onClick={() => handleMenuClick('/')}
                        sx={{ 
                            display: { xs: 'flex', md: 'none' }, 
                            alignItems: 'center',
                            flexGrow: 1,
                            cursor: 'pointer',
                            '&:hover': {
                                opacity: 0.9
                            }
                        }}
                    >
                        <img src={logo} alt="RetailMaster Logo" style={{ height: '40px', marginRight: '12px' }} />
                        <Typography
                            variant="h6"
                            noWrap
                            sx={{
                                fontWeight: 700,
                                color: 'inherit',
                                textDecoration: 'none',
                            }}
                        >
                            RetailMaster
                        </Typography>
                    </Box>

                    {/* Desktop Menu */}
                    <Box sx={{ 
                        flexGrow: 1, 
                        display: { xs: 'none', md: 'flex' },
                        justifyContent: 'center',
                        gap: 3
                    }}>
                        {menuItems.map((item) => (
                            <Box
                                key={item.text}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        '& .MuiIconButton-root': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '& .MuiTypography-root': {
                                            opacity: 1
                                        }
                                    }
                                }}
                            >
                                <IconButton
                                    onClick={item.items ? 
                                        (event) => handleOpenSubMenu(event, item) :
                                        () => handleMenuClick(item.path)
                                    }
                                    sx={{ 
                                        color: 'white',
                                        transition: 'background-color 0.2s',
                                        p: 1.5
                                    }}
                                >
                                    {item.icon}
                                </IconButton>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'white',
                                        opacity: 0.85,
                                        transition: 'opacity 0.2s',
                                        fontSize: '0.75rem',
                                        mt: 0.5
                                    }}
                                >
                                    {item.text}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Submenu */}
                    <Menu
                        anchorEl={anchorElSubMenu}
                        open={Boolean(anchorElSubMenu)}
                        onClose={handleCloseSubMenu}
                        sx={{
                            '& .MuiPaper-root': {
                                width: '280px',
                                mt: 1.5,
                                boxShadow: 2
                            }
                        }}
                    >
                        {selectedMainMenu?.items?.map((subItem) => (
                            <MenuItem
                                key={subItem.text}
                                onClick={() => handleMenuClick(subItem.path)}
                                sx={{ 
                                    py: 1.5,
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {subItem.icon || selectedMainMenu.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={subItem.text}
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        fontWeight: 500
                                    }}
                                />
                            </MenuItem>
                        ))}
                    </Menu>

                    {/* User Menu */}
                    <Box sx={{ ml: { xs: 2, md: 4 } }}>
                        <Tooltip title="Account settings">
                            <IconButton 
                                onClick={handleOpenUserMenu} 
                                sx={{ 
                                    p: 0,
                                    border: '2px solid rgba(255, 255, 255, 0.2)',
                                    '&:hover': {
                                        border: '2px solid rgba(255, 255, 255, 0.3)'
                                    }
                                }}
                            >
                                <Avatar 
                                    alt="User" 
                                    sx={{ 
                                        width: 36, 
                                        height: 36,
                                        bgcolor: 'primary.dark'
                                    }} 
                                />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            sx={{
                                mt: '45px',
                                '& .MuiPaper-root': {
                                    width: '220px',
                                    boxShadow: 2
                                }
                            }}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                        >
                            <MenuItem 
                                onClick={() => handleMenuClick('/profile')}
                                sx={{ py: 1.5 }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <BusinessIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary="Business Profile"
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        fontWeight: 500
                                    }}
                                />
                            </MenuItem>
                            <MenuItem 
                                onClick={handleLogout}
                                sx={{ py: 1.5 }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <LogoutIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary="Logout"
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        fontWeight: 500
                                    }}
                                />
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default MainHeader;
