```javascript
import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import TextInput from './TextInput';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SCHEDULER_CRON_EXAMPLES, SELECTOR_TYPES } from '../utils/constants';

const ScraperForm = ({ initialValues, onSubmit, isSubmitting }) => {
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    start_url: Yup.string().url('Must be a valid URL').required('Start URL is required'),
    description: Yup.string(),
    schedule_cron: Yup.string().matches(
      /^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})$/,
      {
        message: 'Invalid CRON string format. Examples: "0 0 * * *" for daily, "0 */6 * * *" for every 6 hours.',
        excludeEmptyString: true
      }
    ),
    headless: Yup.boolean().required('Headless setting is required'),
    use_proxy: Yup.boolean().required('Use Proxy setting is required'),
    use_user_agent: Yup.boolean().required('Use User Agent setting is required'),
    is_active: Yup.boolean().required('Active status is required'),
    selectors: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required('Field name is required'),
        selector: Yup.string().required('CSS Selector is required'),
        type: Yup.string().oneOf(SELECTOR_TYPES.map(t => t.value)).required('Type is required'),
        attribute: Yup.string().when('type', {
          is: 'attribute',
          then: (schema) => schema.required('Attribute name is required for "attribute" type'),
          otherwise: (schema) => schema.nullable(),
        }),
        fields: Yup.array().when('type', {
          is: 'list',
          then: (schema) => Yup.array().of(
            Yup.object().shape({
              name: Yup.string().required('Sub-field name is required'),
              selector: Yup.string(), // Can be empty if it refers to the list item itself
              type: Yup.string().oneOf(SELECTOR_TYPES.filter(t => t.value !== 'list').map(t => t.value)).required('Sub-field type is required'),
              attribute: Yup.string().when('type', {
                is: 'attribute',
                then: (schema) => schema.required('Attribute name is required for "attribute" type'),
                otherwise: (schema) => schema.nullable(),
              }),
            })
          ).min(1, 'At least one field is required for "list" type'),
          otherwise: (schema) => schema.nullable(),
        }),
      })
    ).min(1, 'At least one selector is required'),
  });

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ values, handleChange, handleBlur, errors, touched, setFieldValue }) => (
        <Form className="space-y-6">
          <TextInput label="Scraper Name" name="name" placeholder="e.g., Product Page Scraper" />
          <TextInput label="Start URL" name="start_url" placeholder="e.g., https://example.com/products" type="url" />
          <TextInput label="Description" name="description" type="textarea" rows="3" placeholder="A brief description of what this scraper does..." />

          <div className="mb-4">
            <label htmlFor="schedule_cron" className="block text-sm font-medium text-gray-700">
              Schedule (CRON String - UTC)
            </label>
            <div className="mt-1">
              <TextInput name="schedule_cron" placeholder="e.g., 0 0 * * * (daily at midnight UTC)" />
              <p className="text-xs text-gray-500 mt-1">
                Examples: {SCHEDULER_CRON_EXAMPLES.join(', ')}
              </p>
              <ErrorMessage name="schedule_cron" component="div" className="mt-1 text-sm text-red-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <Field
                id="headless"
                name="headless"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="headless" className="ml-2 block text-sm text-gray-900">
                Run Headless (no browser UI)
              </label>
              <ErrorMessage name="headless" component="div" className="ml-2 text-sm text-red-600" />
            </div>

            <div className="flex items-center">
              <Field
                id="use_proxy"
                name="use_proxy"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="use_proxy" className="ml-2 block text-sm text-gray-900">
                Use Proxy
              </label>
              <ErrorMessage name="use_proxy" component="div" className="ml-2 text-sm text-red-600" />
            </div>

            <div className="flex items-center">
              <Field
                id="use_user_agent"
                name="use_user_agent"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="use_user_agent" className="ml-2 block text-sm text-gray-900">
                Use Random User Agent
              </label>
              <ErrorMessage name="use_user_agent" component="div" className="ml-2 text-sm text-red-600" />
            </div>
          </div>

          <div className="flex items-center">
            <Field
              id="is_active"
              name="is_active"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Scraper is Active
            </label>
            <ErrorMessage name="is_active" component="div" className="ml-2 text-sm text-red-600" />
          </div>

          <h3 className="text-lg font-medium leading-6 text-gray-900 border-t pt-6 mt-6">Selectors</h3>
          <FieldArray name="selectors">
            {({ push, remove }) => (
              <div>
                {values.selectors.length > 0 &&
                  values.selectors.map((selector, index) => (
                    <div key={index} className="border border-gray-200 p-4 rounded-md mb-4 relative">
                      <h4 className="font-semibold text-gray-800 mb-2">Selector {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-4 right-4 text-red-600 hover:text-red-800 focus:outline-none"
                      >
                        <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      </button>

                      <TextInput label="Field Name" name={`selectors.${index}.name`} placeholder="e.g., product_title" />
                      <TextInput label="CSS Selector" name={`selectors.${index}.selector`} placeholder="e.g., .product h1" />

                      <div className="mb-4">
                        <label htmlFor={`selectors.${index}.type`} className="block text-sm font-medium text-gray-700">
                          Extraction Type
                        </label>
                        <Field
                          as="select"
                          id={`selectors.${index}.type`}
                          name={`selectors.${index}.type`}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          {SELECTOR_TYPES.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Field>
                        <ErrorMessage name={`selectors.${index}.type`} component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      {selector.type === 'attribute' && (
                        <TextInput label="Attribute Name" name={`selectors.${index}.attribute`} placeholder="e.g., href, src, alt" />
                      )}

                      {selector.type === 'list' && (
                        <div className="border border-indigo-200 p-3 rounded-md mt-4 bg-indigo-50">
                          <h5 className="font-semibold text-indigo-700 mb-2">List Fields</h5>
                          <FieldArray name={`selectors.${index}.fields`}>
                            {({ push: pushField, remove: removeField }) => (
                              <div>
                                {selector.fields && selector.fields.length > 0 &&
                                  selector.fields.map((field, fieldIndex) => (
                                    <div key={fieldIndex} className="border border-indigo-300 p-3 rounded-md mb-2 relative bg-white">
                                      <h6 className="font-medium text-indigo-800 mb-1">Sub-Field {fieldIndex + 1}</h6>
                                      <button
                                        type="button"
                                        onClick={() => removeField(fieldIndex)}
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 focus:outline-none"
                                      >
                                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                      </button>
                                      <TextInput label="Sub-Field Name" name={`selectors.${index}.fields.${fieldIndex}.name`} placeholder="e.g., item_name" />
                                      <TextInput label="Sub-Field CSS Selector (relative to list item)" name={`selectors.${index}.fields.${fieldIndex}.selector`} placeholder="e.g., .item-title (leave empty to select self)" />
                                      <div className="mb-4">
                                        <label htmlFor={`selectors.${index}.fields.${fieldIndex}.type`} className="block text-sm font-medium text-gray-700">
                                          Sub-Field Type
                                        </label>
                                        <Field
                                          as="select"
                                          id={`selectors.${index}.fields.${fieldIndex}.type`}
                                          name={`selectors.${index}.fields.${fieldIndex}.type`}
                                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        >
                                          {SELECTOR_TYPES.filter(t => t.value !== 'list').map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                          ))}
                                        </Field>
                                        <ErrorMessage name={`selectors.${index}.fields.${fieldIndex}.type`} component="div" className="mt-1 text-sm text-red-600" />
                                      </div>
                                      {field.type === 'attribute' && (
                                        <TextInput label="Attribute Name" name={`selectors.${index}.fields.${fieldIndex}.attribute`} placeholder="e.g., src" />
                                      )}
                                    </div>
                                  ))}
                                <button
                                  type="button"
                                  onClick={() => pushField({ name: '', selector: '', type: 'text', attribute: '' })}
                                  className="mt-3 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                  Add Sub-Field
                                </button>
                                <ErrorMessage name={`selectors.${index}.fields`} component="div" className="mt-2 text-sm text-red-600" />
                              </div>
                            )}
                          </FieldArray>
                        </div>
                      )}
                    </div>
                  ))}
                <button
                  type="button"
                  onClick={() => push({ name: '', selector: '', type: 'text', attribute: '', fields: [] })}
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add Selector
                </button>
                <ErrorMessage name="selectors" component="div" className="mt-2 text-sm text-red-600" />
              </div>
            )}
          </FieldArray>

          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {isSubmitting ? 'Saving...' : 'Save Scraper'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default ScraperForm;
```