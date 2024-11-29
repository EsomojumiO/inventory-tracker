const config = {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
    tokenKey: 'inventory_tracker_token',
    refreshTokenKey: 'inventory_tracker_refresh_token',
    defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

export default config;
