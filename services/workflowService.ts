import { DAG, DAGRun, DAGTask, DAGRunStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

const WORKFLOW_CACHE_KEY = 'fuxstixx-workflow-dags';

let dags: DAG[] = [];
let onDagsUpdate: ((dags: DAG[]) => void) | null = null;

// --- Helper Functions ---
const loadDags = (): void => {
    try {
        const savedDags = localStorage.getItem(WORKFLOW_CACHE_KEY);
        dags = savedDags ? JSON.parse(savedDags) : [];
    } catch (error) {
        console.error("Failed to load DAGs from localStorage", error);
        dags = [];
    }
};

const saveDags = (): void => {
    try {
        // Prune old runs to keep storage manageable, keep latest 5
        const prunedDags = dags.map(dag => ({
            ...dag,
            runs: dag.runs.slice(-5)
        }));
        localStorage.setItem(WORKFLOW_CACHE_KEY, JSON.stringify(prunedDags));
        if (onDagsUpdate) {
            onDagsUpdate(getDags());
        }
    } catch (error) {
        console.error("Failed to save DAGs to localStorage", error);
    }
};

// --- Core Service Functions ---
export const defineDag = (name: string, schedule: string, tasks: string[]): DAG => {
    const newDag: DAG = {
        id: uuidv4(),
        name,
        schedule,
        tasks: tasks.map(desc => ({ id: uuidv4(), description: desc })),
        runs: [],
        isPaused: false,
    };
    dags.push(newDag);
    saveDags();
    return newDag;
};

const executeDagRun = (dag: DAG): DAGRun => {
     const newRun: DAGRun = {
        id: uuidv4(),
        startTime: new Date().toISOString(),
        status: 'running',
    };
    dag.runs.push(newRun);

    // Direct execution: determine outcome immediately
    const didSucceed = Math.random() > 0.15; // 85% success rate for real-world uncertainty
    newRun.status = didSucceed ? 'success' : 'failed';
    newRun.endTime = new Date().toISOString();
    
    saveDags();
    return newRun;
};

export const triggerDag = (name: string): DAGRun | null => {
    const dag = dags.find(d => d.name === name);
    if (!dag) {
        throw new Error(`DAG with name '${name}' not found.`);
    }
    return executeDagRun(dag);
};


export const getDags = (): DAG[] => {
    // Return a deep copy to prevent mutation
    return JSON.parse(JSON.stringify(dags));
};

export const clearAllDags = (): void => {
    dags = [];
    saveDags();
};


// --- Scheduler Simulation (Now Disabled) ---
export const initializeScheduler = (updateCallback: (dags: DAG[]) => void): void => {
    onDagsUpdate = updateCallback;
    loadDags();
    console.log("Workflow service initialized. Automatic scheduler is offline per direct execution protocol.");
};

// Initial load when the service is imported
loadDags();