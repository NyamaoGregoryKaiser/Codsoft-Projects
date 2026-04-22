import { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Stack,
  Switch,
  Flex,
} from '@chakra-ui/react';
import { CreateProjectData, UpdateProjectData, Project } from '@/lib/types';

interface ProjectFormProps {
  project?: Project; // Optional for editing existing project
  onSubmit: (data: CreateProjectData | UpdateProjectData) => void;
  isLoading: boolean;
}

const ProjectForm = ({ project, onSubmit, isLoading }: ProjectFormProps) => {
  const [formData, setFormData] = useState<CreateProjectData | UpdateProjectData>(
    project ? {
      name: project.name,
      description: project.description || '',
      isCompleted: project.isCompleted,
    } : {
      name: '',
      description: '',
    }
  );

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        isCompleted: project.isCompleted,
      });
    }
  }, [project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form id="project-form" onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <FormControl id="name" isRequired>
          <FormLabel>Project Name</FormLabel>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Website Redesign"
          />
        </FormControl>

        <FormControl id="description">
          <FormLabel>Description</FormLabel>
          <Textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Brief description of the project"
            rows={4}
          />
        </FormControl>

        {project && ( // Only show isCompleted switch for existing projects
          <FormControl display="flex" alignItems="center" id="isCompleted">
            <FormLabel mb="0">
              Mark as Completed
            </FormLabel>
            <Switch
              name="isCompleted"
              isChecked={(formData as UpdateProjectData).isCompleted || false}
              onChange={handleChange}
              colorScheme="green"
            />
          </FormControl>
        )}
      </Stack>
    </form>
  );
};

export default ProjectForm;