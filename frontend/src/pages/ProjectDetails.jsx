import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', assigned_to_email: '', status: 'todo', priority: 'medium' });
  const [memberForm, setMemberForm] = useState({ user_email: '', role: 'member' });

  const isProjectAdmin = members.some(m => m.user.id === user.id && m.role_in_project === 'admin');

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, membersRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/members`),
        api.get(`/tasks`, { params: { project_id: id } })
      ]);
      setProject(projectRes.data);
      setMembers(membersRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Failed to fetch project details', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/tasks`, {
        ...taskForm,
        project_id: parseInt(id),
        due_date: new Date(taskForm.due_date).toISOString()
      });
      setTasks([...tasks, data]);
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', due_date: '', assigned_to_email: '', status: 'todo', priority: 'medium' });
      toast.success('Task created successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, memberForm);
      fetchProjectData(); 
      setShowMemberModal(false);
      setMemberForm({ user_email: '', role: 'member' });
      toast.success('Member added successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add member');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toast.success('Task updated');
    } catch (error) {
      toast.error('Failed to update task status');
      fetchProjectData(); // Revert on failure
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;
    
    // Check permission instantly
    const task = tasks.find(t => t.id === taskId);
    if (!isProjectAdmin && task.assigned_to !== user.id) {
      toast.error("You can only move tasks assigned to you");
      return;
    }

    // Optimistic UI update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    // API Call
    handleUpdateTaskStatus(taskId, newStatus);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!project) return <div className="text-center mt-20">Project not found</div>;

  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const columns = {
    todo: { name: 'To Do', items: filteredTasks.filter(t => t.status === 'todo') },
    in_progress: { name: 'In Progress', items: filteredTasks.filter(t => t.status === 'in_progress') },
    done: { name: 'Done', items: filteredTasks.filter(t => t.status === 'done') }
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 overflow-hidden flex flex-col">
        <div className="px-4 py-6 sm:px-0 flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6 flex-shrink-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="mt-2 text-gray-600">{project.description}</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                {isProjectAdmin && (
                  <button
                    onClick={() => setShowMemberModal(true)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Add Member
                  </button>
                )}
                {isProjectAdmin && (
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 transition-colors"
                  >
                    Create Task
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 flex-shrink-0">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto">
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-6 h-full pb-4">
                  {Object.entries(columns).map(([columnId, column]) => (
                    <div key={columnId} className="flex flex-col bg-gray-100 rounded-xl w-80 min-w-[320px] max-h-full">
                      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-200/50 rounded-t-xl">
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-sm">{column.name}</h2>
                        <span className="bg-white text-gray-500 text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                          {column.items.length}
                        </span>
                      </div>
                      
                      <Droppable droppableId={columnId}>
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`flex-1 p-4 overflow-y-auto min-h-[150px] transition-colors ${
                              snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            {column.items.map((task, index) => (
                              <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white p-4 rounded-lg shadow-sm mb-4 border border-gray-200 group transition-all ${
                                      snapshot.isDragging ? 'shadow-lg ring-2 ring-primary ring-opacity-50 scale-[1.02]' : 'hover:shadow-md hover:border-blue-300'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <h3 className="font-semibold text-gray-900 leading-tight pr-2">{task.title}</h3>
                                      {task.priority && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${priorityColors[task.priority]}`}>
                                          {task.priority}
                                        </span>
                                      )}
                                    </div>
                                    {task.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{task.description}</p>}
                                    
                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                                      <div className={`flex items-center text-xs px-2 py-1 rounded-md font-medium ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-500'}`}>
                                        <span className={`w-2 h-2 rounded-full mr-2 ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`}></span>
                                        {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </div>
                                      
                                      <div className="flex items-center space-x-2">
                                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold ring-2 ring-white" title={task.assignee_name}>
                                          {task.assignee_name ? task.assignee_name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        {isProjectAdmin && (
                                          <button 
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1"
                                            title="Delete Task"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              </DragDropContext>
            </div>

            {/* Team Members Sidebar */}
            <div className="w-72 flex-shrink-0">
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl h-full flex flex-col">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Team ({members.length})
                  </h2>
                </div>
                <div className="overflow-y-auto flex-1 p-2">
                  <ul className="space-y-1">
                    {members.map((member) => (
                      <li key={member.id} className="p-3 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {member.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-medium text-gray-900 truncate">{member.user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                          </div>
                        </div>
                        {member.role_in_project === 'admin' && (
                          <span className="flex-shrink-0 inline-block w-2 h-2 bg-purple-500 rounded-full" title="Admin"></span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals remain mostly the same, updated with new styling */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" required className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="What needs to be done?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm resize-none" rows="3"
                    value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} placeholder="Add more details..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="datetime-local" required className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                  <select required className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    value={taskForm.assigned_to_email} onChange={e => setTaskForm({...taskForm, assigned_to_email: e.target.value})}>
                    <option value="" disabled>Select a team member</option>
                    {members.map(m => (
                      <option key={m.id} value={m.user.email}>{m.user.name} ({m.user.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="low">Low Priority 🟢</option>
                    <option value="medium">Medium Priority 🟡</option>
                    <option value="high">High Priority 🔴</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-primary border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add Team Member</h2>
            <form onSubmit={handleAddMember}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                  <input type="email" required className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    value={memberForm.user_email} onChange={e => setMemberForm({...memberForm, user_email: e.target.value})} placeholder="colleague@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})}>
                    <option value="member">Member (Can only edit assigned tasks)</option>
                    <option value="admin">Admin (Can manage team and tasks)</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setShowMemberModal(false)} className="flex-1 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-primary border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
