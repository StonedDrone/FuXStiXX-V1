import { DAG, DAGRun, DAGTask, DAGRunStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

const WORKFLOW_CACHE_KEY = 'fuxstixx-workflow-dags';

let dags: DAG[] = [];
let schedulerIntervalId: number | null = null;
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

const startDagRun = (dag: DAG): DAGRun => {
     const newRun: DAGRun = {
        id: uuidv4(),
        startTime: new Date().toISOString(),
        status: 'running',
    };

    dag.runs.push(newRun);
    saveDags();
    
    // Simulate execution time
    const executionTime = (Math.random() * 5 + 3) * 1000; // 3-8 seconds
    setTimeout(() => {
        const didSucceed = Math.random() > 0.15; // 85% success rate
        newRun.status = didSucceed ? 'success' : 'failed';
        newRun.endTime = new Date().toISOString();
        saveDags();
    }, executionTime);

    return newRun;
};

export const triggerDag = (name: string): DAGRun | null => {
    const dag = dags.find(d => d.name === name);
    if (!dag) {
        throw new Error(`DAG with name '${name}' not found.`);
    }
    return startDagRun(dag);
};


export const getDags = (): DAG[] => {
    // Return a deep copy to prevent mutation
    return JSON.parse(JSON.stringify(dags));
};

export const clearAllDags = (): void => {
    dags = [];
    saveDags();
};


// --- Scheduler Simulation ---
const checkSchedules = () => {
    // This is a very simplified scheduler simulation.
    // It just randomly triggers a DAG every so often to simulate a schedule.
    // A real implementation would parse cron strings.
    
    // Every 30 seconds, 20% chance to trigger a random, non-running DAG
    if (Math.random() < 0.20) {
        const eligibleDags = dags.filter(dag => {
            const lastRun = dag.runs[dag.runs.length - 1];
            return !lastRun || lastRun.status !== 'running';
        });

        if (eligibleDags.length > 0) {
            const dagToRun = eligibleDags[Math.floor(Math.random() * eligibleDags.length)];
            console.log(`Scheduler: Auto-triggering DAG '${dagToRun.name}'`);
            startDagRun(dagToRun);
        }
    }
};

export const initializeScheduler = (updateCallback: (dags: DAG[]) => void): void => {
    onDagsUpdate = updateCallback;
    loadDags();
    if (schedulerIntervalId) {
        clearInterval(schedulerIntervalId);
    }
    // Check schedules every 30 seconds
    schedulerIntervalId = window.setInterval(checkSchedules, 30000);
    console.log("Workflow scheduler initialized.");
};

// Initial load when the service is imported
loadDags();
