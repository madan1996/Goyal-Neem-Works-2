
import React from 'react';
import { 
  Loader2, CheckCircle, AlertCircle, X, Activity, Clock 
} from 'lucide-react';
import { SystemTask } from '../types';

interface TaskCenterProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: SystemTask[];
  onClearTask: (id: string) => void;
}

export const TaskCenter: React.FC<TaskCenterProps> = ({ isOpen, onClose, tasks, onClearTask }) => {
  if (!isOpen) return null;

  const activeTasks = tasks.filter(t => t.status === 'processing' || t.status === 'queued');
  const historyTasks = tasks.filter(t => t.status !== 'processing' && t.status !== 'queued');

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-16 right-4 sm:right-20 z-50 w-96 bg-white rounded-xl shadow-2xl border border-earth-200 flex flex-col max-h-[80vh] animate-in slide-in-from-top-2 fade-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-earth-100 bg-earth-50 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-herb-600" />
                <h3 className="font-bold text-earth-900">System Tasks</h3>
                {activeTasks.length > 0 && (
                    <span className="bg-herb-100 text-herb-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {activeTasks.length} Active
                    </span>
                )}
            </div>
            <button onClick={onClose} className="text-earth-400 hover:text-earth-600">
                <X className="h-4 w-4" />
            </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {tasks.length === 0 ? (
                <div className="text-center py-10 text-earth-400">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No recent activity</p>
                </div>
            ) : (
                <>
                    {/* Active Section */}
                    {activeTasks.map(task => (
                        <div key={task.id} className="bg-white border border-herb-100 p-3 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-sm text-earth-800">{task.name}</span>
                                <span className="text-[10px] text-herb-600 bg-herb-50 px-2 py-0.5 rounded animate-pulse">
                                    Running
                                </span>
                            </div>
                            <div className="w-full bg-earth-100 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div 
                                    className="bg-herb-500 h-1.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${task.progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-earth-500">{task.details || 'Processing...'}</p>
                        </div>
                    ))}

                    {activeTasks.length > 0 && historyTasks.length > 0 && (
                        <div className="h-px bg-earth-100 my-2" />
                    )}

                    {/* History Section */}
                    {historyTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 hover:bg-earth-50 rounded-lg group">
                            {task.status === 'completed' ? (
                                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-earth-700 truncate">{task.name}</p>
                                <p className="text-[10px] text-earth-400">
                                    {new Date(task.startTime).toLocaleTimeString()} • {task.status}
                                </p>
                            </div>
                            <button 
                                onClick={() => onClearTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-earth-400 hover:text-red-500 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </>
            )}
        </div>
      </div>
    </>
  );
};
