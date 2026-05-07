import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import CreateProjectModal from '../components/CreateProjectModal';
import { FolderIcon, UserGroupIcon } from '@heroicons/react/24/outline';

import { useAuth } from '../contexts/AuthContext';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (newProject) => {
    setProjects([...projects, newProject]);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
              >
                New Project
              </button>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any projects yet.</p>
              {user?.role === 'admin' && (
                <div className="mt-6">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    New Project
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md cursor-pointer transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                        <FolderIcon className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          Created {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">Click to view members and tasks</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
