import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Alert,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

const BulkUploadDialog = ({ open, onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv') {
        setError('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const rows = text.split('\\n');
        const headers = rows[0].split(',');
        
        const products = rows.slice(1)
          .filter(row => row.trim())
          .map(row => {
            const values = row.split(',');
            const product = {};
            headers.forEach((header, index) => {
              const value = values[index]?.trim();
              switch (header.trim().toLowerCase()) {
                case 'price':
                case 'quantity':
                case 'minstocklevel':
                  product[header.trim()] = Number(value) || 0;
                  break;
                case 'tags':
                  product[header.trim()] = value ? value.split(';').map(tag => tag.trim()) : [];
                  break;
                default:
                  product[header.trim()] = value || '';
              }
            });
            return product;
          });

        onUpload(products);
        setFile(null);
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Error processing file. Please check the format and try again.');
      setUploading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Please upload a CSV file');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bulk Upload Products</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            bgcolor: 'background.default',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            hidden
            accept=".csv"
            onChange={handleFileSelect}
            ref={fileInputRef}
          />
          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drop CSV file here or click to upload
          </Typography>
          <Typography variant="body2" color="text.secondary">
            File should contain headers: name, description, price, quantity, category, sku, supplier, tags
          </Typography>
        </Box>

        {file && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Selected file: {file.name}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {uploading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          color="primary"
          disabled={!file || uploading}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkUploadDialog;
