import { useState, useEffect } from 'react';

interface ActiveProject {
  id: string;
  namaProject: string;
  cabang: string;
}

export const useActiveProject = () => {
  const [activeProject, setActiveProject] = useState<ActiveProject | null>(null);

  useEffect(() => {
    const savedProject = localStorage.getItem('activeProject');
    if (savedProject) {
      try {
        const project = JSON.parse(savedProject);
        setActiveProject(project);
      } catch {
        console.error('Failed to parse active project');
      }
    }
  }, []);

  const setActiveProjectId = (project: ActiveProject) => {
    setActiveProject(project);
    localStorage.setItem('activeProject', JSON.stringify(project));
  };

  const clearActiveProject = () => {
    setActiveProject(null);
    localStorage.removeItem('activeProject');
  };

  // Helper untuk mendapatkan project_id yang akan dikirim ke backend
  const getProjectId = (): string | null => {
    return activeProject?.id || null;
  };

  return {
    activeProject,
    setActiveProject: setActiveProjectId,
    clearActiveProject,
    getProjectId,
  };
};

export default useActiveProject;
