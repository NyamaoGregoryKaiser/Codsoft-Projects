import React, { useState } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Textarea,
  Select,
  useToast,
  Flex,
  Text,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { CreateModelPayload, MLModel } from '../../types/model';

const ModelUploadPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [modelPath, setModelPath] = useState('');
  const [status, setStatus] = useState<MLModel['status']>('draft');
  const [metadata, setMetadata] = useState(''); // JSON string
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (jsonError) {
        toast({
          title: 'Invalid Metadata',
          description: 'Please ensure metadata is valid JSON.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }
    }

    const payload: CreateModelPayload = {
      name,
      description,
      version,
      model_path: modelPath,
      status,
      metadata: parsedMetadata,
    };

    try {
      const response = await api.post<{ status: string; data: MLModel }>('/models', payload);
      if (response.data.status === 'success') {
        toast({
          title: 'Model Uploaded',
          description: `Model "${name}" has been successfully registered.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate(`/models/${response.data.data.id}`); // Redirect to new model's detail page
      } else {
        throw new Error(response.data.status);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to upload model.';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={8} maxW="xl" mx="auto" bg="white" borderRadius="lg" boxShadow="md" mt={8}>
      <Heading as="h2" size="xl" mb={6} color="brand.700">Upload New ML Model</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Model Name</FormLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Churn Prediction V2" />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Description</FormLabel>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the model's purpose and capabilities." />
          </FormControl>
          <FormControl>
            <FormLabel>Version</FormLabel>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g., 1.0.0" />
          </FormControl>
          <FormControl>
            <FormLabel>Model Path (e.g., S3 URL, local path)</FormLabel>
            <Input value={modelPath} onChange={(e) => setModelPath(e.target.value)} placeholder="s3://my-bucket/models/churn_v2.pkl" />
          </FormControl>
          <FormControl>
            <FormLabel>Status</FormLabel>
            <Select value={status} onChange={(e) => setStatus(e.target.value as MLModel['status'])}>
              <option value="draft">Draft</option>
              <option value="training">Training</option>
              <option value="ready">Ready</option>
              <option value="deployed">Deployed</option>
              <option value="archived">Archived</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Metadata (JSON)</FormLabel>
            <Textarea
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              placeholder='{"accuracy": 0.85, "framework": "PyTorch"}'
              fontFamily="monospace"
              minH="150px"
              isInvalid={
                (() => {
                    try {
                        if (metadata.trim() === '') return false;
                        JSON.parse(metadata);
                        return false;
                    } catch (e) {
                        return true;
                    }
                })()
              }
            />
            {
                (() => {
                    try {
                        if (metadata.trim() === '') return null;
                        JSON.parse(metadata);
                        return null;
                    } catch (e) {
                        return <Text color="red.500" fontSize="sm">Invalid JSON format</Text>;
                    }
                })()
            }
          </FormControl>
          <Flex width="full" justify="space-between">
            <Button variant="outline" onClick={() => navigate('/models')}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="brand" isLoading={isLoading} loadingText="Uploading">
              Register Model
            </Button>
          </Flex>
        </VStack>
      </form>
    </Box>
  );
};

export default ModelUploadPage;
```