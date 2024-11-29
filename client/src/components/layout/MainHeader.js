import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Button,
    Menu,
    MenuItem,
    Box,
    Badge,
    useTheme,
    useMediaQuery,
    Tooltip
} from '@mui/material';
import {
    StorefrontOutlined,
    Inventory2Outlined,
    PeopleOutlineOutlined,
    PointOfSale,
    ShoppingCartOutlined,
    PaymentsOutlined,
    ReceiptOutlined,
    LocalOfferOutlined,
    CategoryOutlined,
    LocalShippingOutlined,
    NotificationsOutlined,
    AssessmentOutlined,
    PersonOutlineOutlined,
    CardMembershipOutlined,
    SupportOutlined,
    Settings,
    Menu as MenuIcon
} from '@mui/icons-material';
import logo from '../../assets/logo.svg';

const MainHeader = () => {
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [posMenu, setPosMenu] = useState(null);
    const [inventoryMenu, setInventoryMenu] = useState(null);
    const [crmMenu, setCrmMenu] = useState(null);
    const [settingsMenu, setSettingsMenu] = useState(null);

    // Core navigation items with enhanced structure
    const coreNavItems = [
        {
            label: 'POS',
            icon: <StorefrontOutlined />,
            hasSubmenu: true,
            onClick: (event) => setPosMenu(event.currentTarget),
            current: location.pathname.startsWith('/pos'),
            items: [
                {
                    label: 'Sales Terminal',
                    icon: <PointOfSale />,
                    path: '/pos/sales-terminal'
                },
                { 
                    label: 'Orders',
                    path: '/orders',
                    icon: <ShoppingCartOutlined />
                },
                { 
                    label: 'Payments',
                    path: '/pos/payments',
                    icon: <PaymentsOutlined />
                },
                { 
                    label: 'Receipts',
                    path: '/pos/receipts',
                    icon: <ReceiptOutlined />
                },
                { 
                    label: 'Discounts & Promotions',
                    path: '/pos/promotions',
                    icon: <LocalOfferOutlined />
                }
            ]
        },
        {
            label: 'Inventory',
            icon: <Inventory2Outlined />,
            hasSubmenu: true,
            onClick: (event) => setInventoryMenu(event.currentTarget),
            current: location.pathname.startsWith('/inventory')
        },
        {
            label: 'CRM',
            icon: <PeopleOutlineOutlined />,
            hasSubmenu: true,
            onClick: (event) => setCrmMenu(event.currentTarget),
            current: location.pathname.startsWith('/crm')
        }
    ];

    // POS submenu items
    const posItems = [
        { 
            label: 'Sales Terminal',
            path: '/pos/sales-terminal',
            icon: <PointOfSale />
        },
        { 
            label: 'Orders',
            path: '/orders',
            icon: <ShoppingCartOutlined />
        },
        { 
            label: 'Payments',
            path: '/pos/payments',
            icon: <PaymentsOutlined />
        },
        { 
            label: 'Receipts',
            path: '/pos/receipts',
            icon: <ReceiptOutlined />
        },
        { 
            label: 'Discounts & Promotions',
            path: '/pos/promotions',
            icon: <LocalOfferOutlined />
        }
    ];

    // Inventory submenu items
    const inventoryItems = [
        { 
            label: 'Products',
            path: '/inventory/products',
            icon: <CategoryOutlined />
        },
        { 
            label: 'Stock Management',
            path: '/inventory/stock',
            icon: <LocalShippingOutlined />
        },
        { 
            label: 'Reorder Management',
            path: '/inventory/reorder',
            icon: <NotificationsOutlined />
        },
        { 
            label: 'Suppliers',
            path: '/inventory/suppliers',
            icon: <LocalShippingOutlined />
        },
        { 
            label: 'Reports',
            path: '/inventory/reports',
            icon: <AssessmentOutlined />
        }
    ];

    // CRM submenu items
    const crmItems = [
        { 
            label: 'Customer Profiles',
            path: '/crm/customers',
            icon: <PersonOutlineOutlined />
        },
        { 
            label: 'Customer Orders',
            path: '/orders',
            icon: <ShoppingCartOutlined />
        },
        { 
            label: 'Loyalty Programs',
            path: '/crm/loyalty',
            icon: <CardMembershipOutlined />
        },
        { 
            label: 'Feedback & Support',
            path: '/crm/feedback',
            icon: <SupportOutlined />
        },
        { 
            label: 'Reports',
            path: '/crm/reports',
            icon: <AssessmentOutlined />
        }
    ];

    const renderMenu = (items, anchorEl, handleClose) => (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
                sx: {
                    mt: 1,
                    '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        '&:hover': {
                            backgroundColor: theme.palette.action.hover
                        }
                    }
                }
            }}
        >
            {items.map((item) => (
                <MenuItem
                    key={item.path}
                    component={Link}
                    to={item.path}
                    onClick={handleClose}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    {item.icon}
                    <Typography>{item.label}</Typography>
                </MenuItem>
            ))}
        </Menu>
    );

    return (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
            <Toolbar>
                {isMobile && (
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                )}

                {/* Logo and Title */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mr: 4,
                    textDecoration: 'none',
                    color: 'inherit'
                }} 
                component={Link} 
                to="/"
                >
                    <img
                        src={logo}
                        alt="Retail Master"
                        style={{
                            height: '40px',
                            width: 'auto',
                            marginRight: theme.spacing(2)
                        }}
                    />
                    <Typography variant="h6" component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        Retail Master
                    </Typography>
                </Box>

                {/* Navigation Items */}
                {!isMobile && (
                    <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
                        {coreNavItems.map((item) => (
                            <Tooltip key={item.label} title={`Access ${item.label} features`}>
                                <Button
                                    color="inherit"
                                    onClick={item.onClick}
                                    startIcon={item.icon}
                                    sx={{
                                        borderBottom: item.current ? '2px solid white' : 'none',
                                        borderRadius: 1,
                                        px: 2
                                    }}
                                >
                                    {item.label}
                                </Button>
                            </Tooltip>
                        ))}
                    </Box>
                )}

                {/* Right-side items */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton color="inherit">
                        <Badge badgeContent={4} color="error">
                            <NotificationsOutlined />
                        </Badge>
                    </IconButton>
                    <IconButton
                        color="inherit"
                        onClick={(event) => setSettingsMenu(event.currentTarget)}
                    >
                        <Settings />
                    </IconButton>
                </Box>

                {/* Dropdown Menus */}
                {renderMenu(posItems, posMenu, () => setPosMenu(null))}
                {renderMenu(inventoryItems, inventoryMenu, () => setInventoryMenu(null))}
                {renderMenu(crmItems, crmMenu, () => setCrmMenu(null))}
            </Toolbar>
        </AppBar>
    );
};

export default MainHeader;
