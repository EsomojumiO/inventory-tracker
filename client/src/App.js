import React, { useState, useEffect } from 'react';
import './App.css'; // Make sure this CSS file exists

const App = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    price: 0,
    description: ''
  });
  const [error, setError] = useState(null);

  // Fetch items from the backend API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/items'); // Backend API endpoint
        if (!response.ok) throw new Error('Failed to fetch'); // Handle non-200 responses
        const data = await response.json();
        setItems(data); // Set fetched items in state
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Error fetching items'); // Display error to user
      }
    };

    fetchItems(); // Fetch items on component mount
  }, []);

  // Handle input changes in the form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newItem = {
        name: formData.name,
        category: formData.category,
        quantity: parseInt(formData.quantity, 10),
        price: parseFloat(formData.price),
        description: formData.description
    };

    try {
        const response = await fetch('http://localhost:5000/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newItem)
        });

        // Check if the response was successful (status code 201)
        if (response.ok) {
            const addedItem = await response.json();
            setItems([...items, addedItem]); // Add the new item to the list
            setFormData({
                name: '',
                category: '',
                quantity: 0,
                price: 0,
                description: ''
            });
            setError(null); // Reset error message
        } else {
            const errorData = await response.json();
            setError(errorData.message || 'Error adding item');
        }
    } catch (err) {
        console.error('Error adding item:', err);
        setError('Error adding item');
    }
};

  return (
    <div className="App">
      <h1>Inventory Tracker</h1>

      {/* Error message */}
      {error && <p className="error">{error}</p>}

      {/* Display existing items */}
      <div className="items-list">
        <h2>Items</h2>
        <ul>
          {items.length > 0 ? (
            items.map((item) => (
              <li key={item._id}>
                <strong>{item.name}</strong> - {item.category} - {item.quantity} pcs - ₦{item.price}
                <p>{item.description}</p>
              </li>
            ))
          ) : (
            <p>No items available</p>
          )}
        </ul>
      </div>

      {/* Form to add new item */}
      <div className="add-item-form">
        <h2>Add New Item</h2>
        <form onSubmit={handleSubmit}>
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
          <button type="submit">Add Item</button>
        </form>
      </div>
    </div>
  );
};

export default App;