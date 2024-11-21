import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    price: 0,
    description: ''
  });
  const [editingItem, setEditingItem] = useState(null); // Store the item being edited
  const [error, setError] = useState(null);

  // Fetch items from the backend API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/items');
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError('Error fetching items');
      }
    };

    fetchItems();
  }, []);

  // Handle input changes in the form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
// Function to delete item
const deleteItem = async (id) => {
  try {
      const response = await fetch(`http://localhost:5000/api/items/delete/${id}`, {
          method: 'DELETE',
      });

      if (response.ok) {
          // Remove the deleted item from the UI
          setItems(items.filter(item => item._id !== id));
      } else {
          setError('Error deleting item');
      }
  } catch (err) {
      setError('Error deleting item');
  }
};
  // Handle form submission for adding or editing item
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
      let response;
      if (editingItem) {
        // Edit the existing item
        response = await fetch(`http://localhost:5000/api/items/${editingItem._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newItem)
        });
      } else {
        // Add a new item
        response = await fetch('http://localhost:5000/api/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newItem)
        });
      }

      if (response.ok) {
        const updatedItem = await response.json();
        if (editingItem) {
          // Update the items list with the updated item
          setItems(items.map(item => item._id === updatedItem._id ? updatedItem : item));
        } else {
          // Add the new item to the list
          setItems([...items, updatedItem]);
        }
        setFormData({
          name: '',
          category: '',
          quantity: 0,
          price: 0,
          description: ''
        });
        setEditingItem(null); // Reset editing state
        setError(null); // Clear any errors
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error adding/updating item');
      }
    } catch (err) {
      console.error('Error submitting item:', err);
      setError('Error adding/updating item');
    }
  };

  // Handle editing an item
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
      description: item.description
    });
  };

  return (
    <div className="App">
      <h1>Digitplus Inventory Software</h1>

      {/* Error message */}
      {error && <p className="error">{error}</p>}

      {/* Display existing items */}
      <div className="items-list">
        <h2>Inventoty List</h2>
        <ul>
          {items.length > 0 ? (
            items.map((item) => (
              <li key={item._id}>
                <strong>{item.name}</strong> - {item.category} - {item.quantity} pcs - ₦{item.price.toFixed(2)}
                <p>{item.description}</p>
                <button onClick={() => handleEdit(item)}>Edit</button>
                <button onClick={() => deleteItem(item._id)}>Delete</button>
              </li>
            ))
          ) : (
            <p>No items available</p>
          )}
        </ul>
      </div>

      {/* Form to add/edit item */}
      <div className="add-item-form">
        <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
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
          <button type="submit">{editingItem ? 'Update Item' : 'Add Item'}</button>
        </form>
      </div>
    </div>
  );
};

export default App;