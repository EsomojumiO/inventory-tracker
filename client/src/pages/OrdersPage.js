import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { 
    Table, 
    Button, 
    Space, 
    Tag, 
    Input, 
    Select, 
    Pagination,
    message 
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        sortField: 'createdAt',
        sortOrder: 'desc'
    });

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await api.get('/orders', {
                params: {
                    page: pagination.current,
                    limit: pagination.pageSize,
                    search: filters.search,
                    status: filters.status,
                    sortField: filters.sortField,
                    sortOrder: filters.sortOrder
                }
            });

            if (response.data && response.data.orders) {
                setOrders(response.data.orders);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0
                }));
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError(error.response?.data?.message || 'Unable to fetch orders. Please try again later.');
            message.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [pagination.current, pagination.pageSize, filters]);

    const handleSearch = (value) => {
        setFilters(prev => ({ ...prev, search: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleStatusFilter = (value) => {
        setFilters(prev => ({ ...prev, status: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleTableChange = (pagination, filters, sorter) => {
        setPagination(pagination);
        if (sorter.field && sorter.order) {
            setFilters(prev => ({
                ...prev,
                sortField: sorter.field,
                sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc'
            }));
        }
    };

    const columns = [
        {
            title: 'Order Number',
            dataIndex: 'orderNumber',
            key: 'orderNumber',
            sorter: true
        },
        {
            title: 'Customer',
            dataIndex: ['customer', 'name'],
            key: 'customer'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={
                    status === 'PENDING' ? 'gold' :
                    status === 'PROCESSING' ? 'blue' :
                    status === 'SHIPPED' ? 'cyan' :
                    status === 'DELIVERED' ? 'green' :
                    'red'
                }>
                    {status}
                </Tag>
            )
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            render: (total) => `$${total.toFixed(2)}`,
            sorter: true
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: true
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={() => handleViewOrder(record._id)}>
                        View
                    </Button>
                    <Button type="link" onClick={() => handleEditOrder(record._id)}>
                        Edit
                    </Button>
                </Space>
            )
        }
    ];

    const handleViewOrder = (orderId) => {
        // Implement view order logic
        console.log('View order:', orderId);
    };

    const handleEditOrder = (orderId) => {
        // Implement edit order logic
        console.log('Edit order:', orderId);
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <Space>
                    <Input
                        placeholder="Search orders"
                        prefix={<SearchOutlined />}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ width: 200 }}
                    />
                    <Select
                        placeholder="Filter by status"
                        style={{ width: 150 }}
                        onChange={handleStatusFilter}
                        allowClear
                    >
                        <Option value="PENDING">Pending</Option>
                        <Option value="PROCESSING">Processing</Option>
                        <Option value="SHIPPED">Shipped</Option>
                        <Option value="DELIVERED">Delivered</Option>
                        <Option value="CANCELLED">Cancelled</Option>
                    </Select>
                </Space>
                <Button type="primary" onClick={() => console.log('Create new order')}>
                    Create Order
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={orders}
                rowKey="_id"
                pagination={pagination}
                loading={loading}
                onChange={handleTableChange}
            />

            {error && (
                <div style={{ color: 'red', marginTop: '16px' }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
