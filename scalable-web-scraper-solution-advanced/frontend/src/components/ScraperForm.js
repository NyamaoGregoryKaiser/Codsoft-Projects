import React, { useState, useEffect } from 'react';
import api from '../api';

const ScraperForm = ({ scraper, onScraperSubmitted, onCancelEdit, currentUser }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startUrl, setStartUrl] = useState('');
  const [itemSelector, setItemSelector] = useState('');
  const [fieldInputs, setFieldInputs] = useState([{ name: '', selector: '' }]);
  const [nextPageSelector, setNextPageSelector] = useState('');
  const [formError, setFormError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (scraper) {
      setName(scraper.name);
      setDescription(scraper.description || '');
      setStartUrl(scraper.start_url);
      setItemSelector(scraper.parsing_rules.item_selector || '');
      setNextPageSelector(scraper.parsing_rules.next_page_selector || '');
      
      const fields = scraper.parsing_rules.fields || {};
      const initialFields = Object.keys(fields).map(key => ({
        name: key,
        selector: fields[key]
      }));
      setFieldInputs(initialFields.length > 0 ? initialFields : [{ name: '', selector: '' }]);
    } else {
      resetForm();
    }
  }, [scraper]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setStartUrl('');
    setItemSelector('');
    setFieldInputs([{ name: '', selector: '' }]);
    setNextPageSelector('');
    setFormError(null);
    setIsLoading(false);
  };

  const handleFieldChange = (index, event) => {
    const values = [...fieldInputs];
    values[index][event.target.name] = event.target.value;
    setFieldInputs(values);
  };

  const addField = () => {
    setFieldInputs([...fieldInputs, { name: '', selector: '' }]);
  };

  const removeField = (index) => {
    const values = [...fieldInputs];
    values.splice(index, 1);
    setFieldInputs(values);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    const fields = fieldInputs.reduce((acc, field) => {
      if (field.name && field.selector) {
        acc[field.name] = field.selector;
      }
      return acc;
    }, {});

    if (Object.keys(fields).length === 0) {
      setFormError("At least one field name and selector is required.");
      setIsLoading(false);
      return;
    }

    const payload = {
      name,
      description,
      start_url: startUrl,
      parsing_rules: {
        item_selector: itemSelector,
        fields: fields,
        next_page_selector: nextPageSelector || null,
      },
    };

    try {
      if (scraper) {
        await api.put(`/scrapers/${scraper.id}`, payload);
      } else {
        await api.post('/scrapers/', payload);
      }
      onScraperSubmitted();
      resetForm();
    } catch (err) {
      console.error("Error submitting scraper:", err);
      setFormError(err.response?.data?.detail || "Failed to save scraper. Please check your inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  const isEditable = !scraper || scraper.owner_id === currentUser?.id || currentUser?.role === 'admin';

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
      {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
      {!isEditable && (
        <p className="text-orange-500 mb-4">You can only view this scraper, not edit it.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Scraper Name:
          </label>
          <input
            type="text"
            id="name"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={!isEditable || isLoading}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startUrl">
            Start URL:
          </label>
          <input
            type="url"
            id="startUrl"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={startUrl}
            onChange={(e) => setStartUrl(e.target.value)}
            required
            disabled={!isEditable || isLoading}
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
          Description:
        </label>
        <textarea
          id="description"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          rows="3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!isEditable || isLoading}
        ></textarea>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-4 text-gray-700">Parsing Rules</h3>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="itemSelector">
          Item Selector (CSS):
        </label>
        <input
          type="text"
          id="itemSelector"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={itemSelector}
          onChange={(e) => setItemSelector(e.target.value)}
          placeholder="e.g., .product-card"
          required
          disabled={!isEditable || isLoading}
        />
        <p className="text-gray-600 text-xs mt-1">CSS selector for the main container of each item to be scraped.</p>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Fields to Extract:</label>
        {fieldInputs.map((field, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              name="name"
              placeholder="Field Name (e.g., title)"
              className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-1/3"
              value={field.name}
              onChange={(e) => handleFieldChange(index, e)}
              required
              disabled={!isEditable || isLoading}
            />
            <input
              type="text"
              name="selector"
              placeholder="CSS Selector (e.g., h2.product-title)"
              className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
              value={field.selector}
              onChange={(e) => handleFieldChange(index, e)}
              required
              disabled={!isEditable || isLoading}
            />
            {isEditable && !isLoading && fieldInputs.length > 1 && (
              <button
                type="button"
                onClick={() => removeField(index)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                -
              </button>
            )}
          </div>
        ))}
        {isEditable && !isLoading && (
          <button
            type="button"
            onClick={addField}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm mt-2"
          >
            Add Field
          </button>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nextPageSelector">
          Next Page Selector (Optional CSS):
        </label>
        <input
          type="text"
          id="nextPageSelector"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={nextPageSelector}
          onChange={(e) => setNextPageSelector(e.target.value)}
          placeholder="e.g., .pagination a.next"
          disabled={!isEditable || isLoading}
        />
        <p className="text-gray-600 text-xs mt-1">CSS selector for the "Next" button/link for pagination.</p>
      </div>

      <div className="flex justify-end space-x-4">
        {scraper && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        {isEditable && (
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : scraper ? 'Update Scraper' : 'Create Scraper'}
          </button>
        )}
      </div>
    </form>
  );
};

export default ScraperForm;