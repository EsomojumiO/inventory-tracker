import React, { useState, useEffect } from 'react';
import { Box, IconButton, TextField, Tooltip } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

const BarcodeScanner = ({ onScan }) => {
  const [barcode, setBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let keypressTimeout;

    const handleKeypress = (e) => {
      if (isScanning) {
        // Clear timeout on each keypress
        if (keypressTimeout) clearTimeout(keypressTimeout);

        // If it's a valid character, add it to the barcode
        if (e.key.length === 1 || e.key === 'Enter') {
          if (e.key === 'Enter') {
            // Barcode scan complete
            if (barcode) {
              onScan(barcode);
              setBarcode('');
            }
          } else {
            setBarcode(prev => prev + e.key);
          }

          // Set timeout to reset barcode if no keypresses within 100ms
          keypressTimeout = setTimeout(() => {
            setBarcode('');
          }, 100);
        }
      }
    };

    window.addEventListener('keypress', handleKeypress);

    return () => {
      window.removeEventListener('keypress', handleKeypress);
      if (keypressTimeout) clearTimeout(keypressTimeout);
    };
  }, [barcode, isScanning, onScan]);

  const toggleScanning = () => {
    setIsScanning(!isScanning);
    setBarcode('');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TextField
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        placeholder="Scan or enter barcode"
        size="small"
        fullWidth
        disabled={!isScanning}
      />
      <Tooltip title={isScanning ? "Stop Scanning" : "Start Scanning"}>
        <IconButton 
          onClick={toggleScanning}
          color={isScanning ? "primary" : "default"}
        >
          <QrCodeScannerIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default BarcodeScanner;
