"use client";

import { useEffect, useState } from 'react';
import ProjectEditDialog from './ProjectEditDialog';
import type { Project } from '@/lib/db';

export default function ProjectEditDialogManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  useEffect(() => {
    const handleOpenEditProject = (event: CustomEvent) => {
      const projectData = event.detail;
      setCurrentProject({
        id: projectData.id,
        name: projectData.name,
        location: projectData.location,
        description: projectData.description,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        status: projectData.status,
        clientName: projectData.clientName,
        budget: projectData.budget,
        linkedOwnerEmail: projectData.linkedOwnerEmail,
        engineer: '',
        overallProgress: 0,
        photos: [],
        comments: [],
        timelineTasks: [],
        quantitySummary: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setIsDialogOpen(true);
    };

    window.addEventListener('open-edit-project', handleOpenEditProject as EventListener);

    return () => {
      window.removeEventListener('open-edit-project', handleOpenEditProject as EventListener);
    };
  }, []);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentProject(null);
  };

  const handleProjectUpdated = () => {
    // Emit a custom event to notify that project was updated
    window.dispatchEvent(new CustomEvent('project-updated'));
    handleCloseDialog();
  };

  return (
    <ProjectEditDialog
      isOpen={isDialogOpen}
      onClose={handleCloseDialog}
      onProjectUpdated={handleProjectUpdated}
      project={currentProject}
    />
  );
}
