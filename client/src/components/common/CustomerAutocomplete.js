import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useCustomer } from '../../context/CustomerContext';
import debounce from 'lodash/debounce';

const CustomerAutocomplete = ({ 
    value, 
    onChange,
    error,
    helperText,
    required = false,
    label = "Select Customer",
    fullWidth = true,
    disabled = false
}) => {
    const { customers, loading, searchCustomers } = useCustomer();
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOptions(customers);
    }, [customers]);

    // Debounce search to avoid too many API calls
    const debouncedSearch = React.useMemo(
        () => debounce(async (query) => {
            if (query) {
                const results = await searchCustomers(query);
                setOptions(results);
            } else {
                setOptions(customers);
            }
        }, 300),
        [customers, searchCustomers]
    );

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const handleInputChange = (event, newInputValue) => {
        setInputValue(newInputValue);
        debouncedSearch(newInputValue);
    };

    const getOptionLabel = (option) => {
        if (!option) return '';
        return `${option.firstName} ${option.lastName}${option.phone ? ` - ${option.phone}` : ''}`;
    };

    return (
        <Autocomplete
            value={value}
            onChange={onChange}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            options={options}
            getOptionLabel={getOptionLabel}
            loading={loading}
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            fullWidth={fullWidth}
            disabled={disabled}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    required={required}
                    error={error}
                    helperText={helperText}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                />
            )}
        />
    );
};

export default CustomerAutocomplete;
