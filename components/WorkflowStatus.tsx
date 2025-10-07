import React from 'react';
import { DAG } from '../types';
import { WorkflowIcon } from './icons/WorkflowIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface WorkflowStatusProps {
  dags: DAG[];
}

const WorkflowStatus: React.FC<WorkflowStatusProps> = ({ dags }) => {
  if (dags.length === 0) {
    return null;
  }

  const runningCount = dags.reduce((count, dag) => {
    const lastRun = dag.runs[dag.runs.length - 1];
    return count + (lastRun?.status === 'running' ? 1 : 0);
  }, 0);
  
  const failedCount = dags.reduce((count, dag) => {
    const lastRun = dag.runs[dag.runs.length - 1];
    return count + (lastRun?.status === 'failed' ? 1 : 0);
  }, 0);

  return (
    <div className="absolute top-4 right-44 flex items-center space-x-4 bg-layer-1/80 backdrop-blur-sm border border-layer-3 rounded-full px-4 py-1.5 text-xs font-mono shadow-lg z-10">
      <div className="flex items-center space-x-2 text-secondary" title="Total Defined DAGs">
        <WorkflowIcon />
        <span>{dags.length} DAGs</span>
      </div>
      <div className="w-px h-4 bg-layer-3"></div>
      <div className="flex items-center space-x-2 text-primary" title="Running DAGs">
        <LoaderIcon />
        <span>{runningCount} Running</span>
      </div>
       <div className={`flex items-center space-x-2 ${failedCount > 0 ? 'text-danger' : 'text-success'}`} title="DAGs with Last Run Failed">
         {failedCount > 0 ? <XCircleIcon /> : <CheckCircleIcon />}
        <span>{failedCount} Failed</span>
      </div>
    </div>
  );
};

export default WorkflowStatus;
