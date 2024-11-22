import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]); // Filtered items to display
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    price: 0,
    description: ''
  });
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // For search input
  const [filterCategory, setFilterCategory] = useState(''); // For category filter
  const [error, setError] = useState(null);

  // Fetch items from the backend API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/items');
        const data = await response.json();
        setItems(data);
        setFilteredItems(data); // Initialize filtered items
      } catch (err) {
        setError('Error fetching items');
      }
    };

    fetchItems();
  }, []);

  // Update filtered items whenever search or filter inputs change
  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = items.filter((item) => {
      const matchesName = item.name.toLowerCase().includes(lowercasedQuery);
      const matchesCategory = filterCategory ? item.category === filterCategory : true;
      return matchesName && matchesCategory;
    });
    setFilteredItems(filtered);
  }, [searchQuery, filterCategory, items]);

  // Handle input changes in the form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle category filter input
  const handleFilterChange = (e) => {
    setFilterCategory(e.target.value);
  };

  return (
    <div className="App">
      <div className="items-list">
        <h1>Digitplus Inventory</h1>

        {/* Error message */}
        {error && <p className="error">{error}</p>}

        {/* Search and Filter */}
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <select value={filterCategory} onChange={handleFilterChange}>
            <option value="">All Categories</option>
            {Array.from(new Set(items.map((item) => item.category))).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Display filtered items in a table */}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr
                  key={item._id}
                  onClick={() => setSelectedItem(item)}
                  className={selectedItem && selectedItem._id === item._id ? 'selected' : ''}
                >
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.quantity}</td>
                  <td>₦{item.price}</td>
                  <td>{item.description}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No items match your search</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Item Form */}
      <div className="add-item-form">
        <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
        <form>
          <div>
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Category:</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Quantity:</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Price:</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>
          <button type="submit">{editingItem ? 'Update Item' : 'Add Item'}</button>
        </form>
      </div>
    </div>
  );
};

export default App;