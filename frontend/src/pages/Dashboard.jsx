import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent-tasks')
        ]);
        setStats(statsRes.data);
        setRecentTasks(tasksRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  const pieData = {
    labels: ['To Do', 'In Progress', 'Done'],
    datasets: [
      {
        data: [stats?.pending_tasks || 0, stats?.in_progress_tasks || 0, stats?.completed_tasks || 0],
        backgroundColor: ['#FCD34D', '#3B82F6', '#10B981'],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: ['Total', 'To Do', 'In Progress', 'Done', 'Overdue'],
    datasets: [
      {
        label: 'Tasks',
        data: [
          stats?.total_tasks || 0,
          stats?.pending_tasks || 0,
          stats?.in_progress_tasks || 0,
          stats?.completed_tasks || 0,
          stats?.overdue_tasks || 0
        ],
        backgroundColor: ['#6B7280', '#FCD34D', '#3B82F6', '#10B981', '#EF4444'],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome back, {user?.name}!</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            <StatCard title="Total Tasks" value={stats?.total_tasks} color="bg-gray-100" />
            <StatCard title="Pending" value={stats?.pending_tasks} color="bg-yellow-100 text-yellow-800" />
            <StatCard title="In Progress" value={stats?.in_progress_tasks} color="bg-blue-100 text-blue-800" />
            <StatCard title="Completed" value={stats?.completed_tasks} color="bg-green-100 text-green-800" />
            <StatCard title="Overdue" value={stats?.overdue_tasks} color="bg-red-100 text-red-800" />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Task Distribution</h3>
              <div className="h-64 flex justify-center">
                <Pie data={pieData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Task Overview</h3>
              <div className="h-64">
                <Bar data={barData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Tasks</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {recentTasks.length === 0 ? (
                <li className="px-4 py-4 sm:px-6 text-gray-500 text-center">No tasks assigned to you.</li>
              ) : (
                recentTasks.map((task) => (
                  <li key={task.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary truncate">{task.title}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`overflow-hidden rounded-lg shadow-sm border border-gray-200 ${color.includes('bg-') ? color : 'bg-white'}`}>
      <div className="p-5">
        <dt className="text-sm font-medium truncate">{title}</dt>
        <dd className="mt-1 text-3xl font-semibold">{value || 0}</dd>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const colors = {
    todo: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
  };
  
  return (
    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
    </p>
  );
}
