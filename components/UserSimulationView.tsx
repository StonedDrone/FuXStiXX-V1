import React from 'react';
import { UserSimulationData, UserJourneyStep } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { MinusCircleIcon } from './icons/MinusCircleIcon';

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

const OutcomeIcon: React.FC<{ outcome: UserJourneyStep['outcome'] }> = ({ outcome }) => {
    switch (outcome) {
        case 'success':
            return <CheckCircleIcon className="text-success flex-shrink-0" />;
        case 'failure':
            return <XCircleIcon className="text-danger flex-shrink-0" />;
        case 'neutral':
            return <MinusCircleIcon className="text-secondary flex-shrink-0" />;
        default:
            return null;
    }
};

const UserSimulationView: React.FC<{ data: UserSimulationData }> = ({ data }) => {
    return (
        <DataCard title={`User Simulation: ${data.goal}`}>
            <div className="mb-3 p-2 bg-base rounded-md">
                <p className="text-sm font-semibold text-primary">Persona: <span className="font-normal text-secondary">{data.persona}</span></p>
            </div>

            <div className="relative border-l-2 border-layer-3 ml-2 pl-6 space-y-4">
                {data.journey.map((step, index) => (
                    <div key={index} className="relative">
                        <div className="absolute -left-[34px] top-1 bg-layer-1 rounded-full p-1">
                            <OutcomeIcon outcome={step.outcome} />
                        </div>
                        <p className="font-semibold text-secondary">{step.action}</p>
                        <p className="text-xs text-gray-400">{step.description}</p>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-layer-3">
                <p className="text-xs text-gray-400 font-mono mb-1">Analysis Summary:</p>
                <p className="text-sm text-secondary italic">{data.summary}</p>
            </div>
        </DataCard>
    );
};

export default UserSimulationView;