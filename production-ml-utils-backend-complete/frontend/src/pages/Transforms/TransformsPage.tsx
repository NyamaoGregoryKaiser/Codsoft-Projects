import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  Button,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  Alert,
  AlertIcon,
  Select,
} from '@chakra-ui/react';
import { api } from '../../utils/api';
import { TransformData, TransformationResponse, PredictionRequest, PredictionResponse } from '../../types/transform';
import { MLModel } from '../../types/model';

const TransformsPage = () => {
  const toast = useToast();
  const [inputData, setInputData] = useState('[[1.0, 10.0], [2.0, 20.0], [3.0, 30.0]]');
  const [featureNames, setFeatureNames] = useState('["feature_a", "feature_b"]');
  const [outputData, setOutputData] = useState<string | null>(null);
  const [transformError, setTransformError] = useState<string | null>(null);
  const [transformLoading, setTransformLoading] = useState(false);

  const [predictionModelId, setPredictionModelId] = useState('');
  const [predictionInput, setPredictionInput] = useState('{"feature1": 5.2, "feature2": 88}');
  const [predictionOutput, setPredictionOutput] = useState<string | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [models, setModels] = useState<MLModel[]>([]); // For model dropdown

  const parseInput = (): TransformData => {
    let featuresArray: number[][] = [];
    let namesArray: string[] = [];

    try {
      featuresArray = JSON.parse(inputData);
      if (!Array.isArray(featuresArray) || !featuresArray.every(row => Array.isArray(row) && row.every(val => typeof val === 'number'))) {
        throw new Error('Features must be a 2D array of numbers.');
      }
    } catch (e: any) {
      throw new Error(`Invalid Features JSON: ${e.message}`);
    }

    if (featureNames) {
      try {
        namesArray = JSON.parse(featureNames);
        if (!Array.isArray(namesArray) || !namesArray.every(name => typeof name === 'string')) {
          throw new Error('Feature names must be an array of strings.');
        }
        if (featuresArray.length > 0 && namesArray.length !== featuresArray[0].length) {
          throw new Error('Number of feature names must match number of features (columns).');
        }
      } catch (e: any) {
        throw new Error(`Invalid Feature Names JSON: ${e.message}`);
      }
    }

    return { features: featuresArray, feature_names: namesArray.length ? namesArray : undefined };
  };

  const handleTransform = async (endpoint: string) => {
    setTransformLoading(true);
    setTransformError(null);
    setOutputData(null);
    try {
      const parsedInput = parseInput();
      const response = await api.post<TransformationResponse>(`/transforms/${endpoint}`, parsedInput);
      if (response.data.status === 'success') {
        setOutputData(JSON.stringify(response.data.data, null, 2));
        toast({
          title: 'Transformation Successful',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        setTransformError(response.data.status);
      }
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.message || 'Transformation failed.';
      setTransformError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTransformLoading(false);
    }
  };

  const fetchModelsForPrediction = async () => {
    try {
      const response = await api.get<{ status: string; data: MLModel[] }>('/models');
      if (response.data.status === 'success') {
        setModels(response.data.data.filter(m => m.status === 'deployed' || m.status === 'ready'));
      }
    } catch (err) {
      console.error("Failed to fetch models for prediction:", err);
      // Don't toast a critical error here, just log
    }
  };

  React.useEffect(() => {
    fetchModelsForPrediction();
  }, []);


  const handlePredict = async () => {
    setPredictionLoading(true);
    setPredictionError(null);
    setPredictionOutput(null);

    if (!predictionModelId) {
      setPredictionError('Please select a model for prediction.');
      setPredictionLoading(false);
      return;
    }

    let parsedPredictionInput: PredictionRequest = {};
    try {
      parsedPredictionInput = JSON.parse(predictionInput);
      if (typeof parsedPredictionInput !== 'object' || Array.isArray(parsedPredictionInput)) {
        throw new Error('Prediction input must be a JSON object.');
      }
    } catch (e: any) {
      setPredictionError(`Invalid Prediction Input JSON: ${e.message}`);
      setPredictionLoading(false);
      return;
    }

    try {
      const response = await api.post<PredictionResponse>(`/predict/${predictionModelId}`, parsedPredictionInput);
      if (response.data.status === 'success') {
        setPredictionOutput(JSON.stringify(response.data.data, null, 2));
        toast({
          title: 'Prediction Successful',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        setPredictionError(response.data.status);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Prediction failed.';
      setPredictionError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setPredictionLoading(false);
    }
  };

  return (
    <Box p={8} maxW="5xl" mx="auto" bg="white" borderRadius="lg" boxShadow="md" mt={8}>
      <Heading as="h2" size="xl" mb={6} color="brand.700">ML Utilities</Heading>
      <Text mb={6}>
        Experiment with data transformations and mock model predictions.
      </Text>

      <Tabs isFitted variant="enclosed" colorScheme="brand">
        <TabList>
          <Tab>Data Transformations</Tab>
          <Tab>Mock Prediction</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading as="h3" size="lg" color="brand.600">Apply Data Transformations</Heading>
              <Text>Input your data as a JSON 2D array of numbers. Optionally, provide feature names.</Text>

              <FormControl isRequired>
                <FormLabel>Input Features (JSON 2D Array)</FormLabel>
                <Textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="[[1.0, 2.0], [3.0, 4.0]]"
                  fontFamily="monospace"
                  minH="150px"
                  isInvalid={(() => { try { JSON.parse(inputData); return false; } catch (e) { return true; } })()}
                />
                {(() => { try { JSON.parse(inputData); return null; } catch (e) { return <Text color="red.500" fontSize="sm">Invalid JSON format</Text>; } })()}
              </FormControl>

              <FormControl>
                <FormLabel>Feature Names (JSON Array of Strings, optional)</FormLabel>
                <Textarea
                  value={featureNames}
                  onChange={(e) => setFeatureNames(e.target.value)}
                  placeholder='["feature1", "feature2"]'
                  fontFamily="monospace"
                  minH="80px"
                  isInvalid={(() => { try { if (!featureNames) return false; JSON.parse(featureNames); return false; } catch (e) { return true; } })()}
                />
                {(() => { try { if (!featureNames) return null; JSON.parse(featureNames); return null; } catch (e) { return <Text color="red.500" fontSize="sm">Invalid JSON format</Text>; } })()}
              </FormControl>

              <Text fontSize="md" fontWeight="bold">Select a Transformation:</Text>
              <Button
                colorScheme="brand"
                onClick={() => handleTransform('standard_scaler')}
                isLoading={transformLoading}
                loadingText="Applying"
                mr={4}
              >
                Apply StandardScaler
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => handleTransform('minmax_scaler')}
                isLoading={transformLoading}
                loadingText="Applying"
              >
                Apply MinMaxScaler
              </Button>

              {transformError && (
                <Alert status="error" mt={4}>
                  <AlertIcon />
                  {transformError}
                </Alert>
              )}

              {outputData && (
                <Box mt={6}>
                  <Heading as="h4" size="md" mb={2}>Transformed Output</Heading>
                  <Code p={4} w="full" overflowX="auto" borderRadius="md">
                    <pre>{outputData}</pre>
                  </Code>
                </Box>
              )}
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading as="h3" size="lg" color="brand.600">Mock Model Prediction</Heading>
              <Text>Select a registered model and provide input features as a JSON object to get a mock prediction.</Text>

              <FormControl isRequired>
                <FormLabel>Select Model</FormLabel>
                <Select
                  placeholder="Select a deployed/ready model"
                  value={predictionModelId}
                  onChange={(e) => setPredictionModelId(e.target.value)}
                >
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} (v{model.version}) - {model.status.toUpperCase()}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Input Features (JSON Object)</FormLabel>
                <Textarea
                  value={predictionInput}
                  onChange={(e) => setPredictionInput(e.target.value)}
                  placeholder='{"age": 30, "salary": 50000, "is_customer": true}'
                  fontFamily="monospace"
                  minH="150px"
                  isInvalid={(() => { try { JSON.parse(predictionInput); return false; } catch (e) { return true; } })()}
                />
                {(() => { try { JSON.parse(predictionInput); return null; } catch (e) { return <Text color="red.500" fontSize="sm">Invalid JSON format</Text>; } })()}
              </FormControl>

              <Button
                colorScheme="teal"
                onClick={handlePredict}
                isLoading={predictionLoading}
                loadingText="Predicting"
              >
                Get Mock Prediction
              </Button>

              {predictionError && (
                <Alert status="error" mt={4}>
                  <AlertIcon />
                  {predictionError}
                </Alert>
              )}

              {predictionOutput && (
                <Box mt={6}>
                  <Heading as="h4" size="md" mb={2}>Prediction Result</Heading>
                  <Code p={4} w="full" overflowX="auto" borderRadius="md">
                    <pre>{predictionOutput}</pre>
                  </Code>
                </Box>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default TransformsPage;
```