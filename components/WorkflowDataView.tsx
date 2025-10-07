import React from 'react';
import { WorkflowData, DAG, DAGRun, DAGRunStatus } from '../types';
import { LoaderIcon } from './icons/LoaderIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ClockIcon } from './icons/ClockIcon';

const DataCard: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => (
    <div className="mt-3 border border-layer-3 rounded-lg bg-layer-2/50 overflow-hidden font-sans">
        <div className="p-2 bg-layer-2 border-b border-layer-3 text-xs font-mono">
            <span className="text-secondary">{title}</span>
        </div>
        <div className="p-3">
            {children}
        </div>
    </div>
);

const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
};

const StatusIcon: React.FC<{ status: DAGRunStatus }> = ({ status }) => {
    switch (status) {
        case 'success':
            return <CheckCircleIcon className="text-success" />;
        case 'failed':
            return <XCircleIcon className="text-danger" />;
        case 'running':
            return <LoaderIcon className="text-primary" />;
        case 'scheduled':
            return <ClockIcon className="text-secondary" />;
        default:
            return null;
    }
};

const DAGRunView: React.FC<{ run: DAGRun }> = ({ run }) => (
    <div className="flex items-center justify-between text-xs font-mono p-1 bg-layer-2 rounded-md">
        <div className="flex items-center space-x-2">
            <StatusIcon status={run.status} />
            <span className="capitalize">{run.status}</span>
        </div>
        <span className="text-gray-400">{formatTimeAgo(run.startTime)}</span>
    </div>
);

const DAGView: React.FC<{ dag: DAG }> = ({ dag }) => (
    <div className="border-b border-layer-3 last:border-b-0 py-3">
        <h4 className="font-bold text-lg text-primary font-mono">{dag.name}</h4>
        <div className="text-xs text-gray-400 font-mono mt-1">
            <p>Schedule: <span className="text-secondary">{dag.schedule}</span></p>
            <p>Tasks: <span className="text-secondary">{dag.tasks.length}</span></p>
        </div>
        <div className="mt-2">
            <h5 className="text-sm font-semibold text-secondary mb-1">Recent Runs:</h5>
            {dag.runs.length > 0 ? (
                 <div className="space-y-1">
                    {dag.runs.slice().reverse().map(run => <DAGRunView key={run.id} run={run} />)}
                 </div>
            ) : (
                <p className="text-xs text-gray-500 font-mono italic">No runs yet.</p>
            )}
        </div>
    </div>
);

const WorkflowDataView: React.FC<{ data: WorkflowData }> = ({ data }) => {
    return (
        <DataCard title="Workflow Automation Status">
            {data.dags.length > 0 ? (
                <div className="space-y-2">
                    {data.dags.map(dag => <DAGView key={dag.id} dag={dag} />)}
                </div>
            ) : (
                <p className="text-secondary italic text-sm">No DAGs defined, Captain.</p>
            )}
        </DataCard>
    );
};

export default WorkflowDataView;
