import React, { useState, useEffect } from 'react';
import { DiscipleshipStep, PathwayProgress, PathwayOverview, Member, Role } from '../types';
import { discipleshipApi } from '../api';
import { dbDiscipleshipStepToFrontend, dbPathwayProgressToFrontend } from '../innovationMapper';

interface DiscipleshipViewProps {
  activeRole: Role;
  members: Member[];
  currentMemberId?: string;
}

export default function DiscipleshipView({ activeRole, members, currentMemberId }: DiscipleshipViewProps) {
  const [steps, setSteps] = useState<DiscipleshipStep[]>([]);
  const [overview, setOverview] = useState<PathwayOverview[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentMemberId || '');
  const [progress, setProgress] = useState<PathwayProgress[]>([]);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [showAddStep, setShowAddStep] = useState(false);

  const isLeader = ['Super Admin', 'Pastor', 'Church Administrator', 'Department Leader'].includes(activeRole);
  const isMember = activeRole === 'Member';

  const loadSteps = async () => {
    const data = await discipleshipApi.getSteps();
    setSteps(data.map(dbDiscipleshipStepToFrontend));
  };

  const loadOverview = async () => {
    if (!isLeader) return;
    const data = await discipleshipApi.getOverview();
    setOverview(data.map((r: any) => ({
      id: r.id,
      name: `${r.first_name} ${r.last_name}`.trim(),
      completed: r.completed,
      total: r.total,
    })));
  };

  const loadProgress = async (memberId: string) => {
    if (!memberId) return;
    const dbId = parseInt(memberId.replace('M-', ''), 10);
    const data = await discipleshipApi.getProgress(dbId);
    setProgress(data.map(dbPathwayProgressToFrontend));
  };

  useEffect(() => {
    loadSteps().catch(console.error);
    loadOverview().catch(console.error);
    if (currentMemberId) setSelectedMemberId(currentMemberId);
  }, []);

  useEffect(() => {
    if (selectedMemberId) loadProgress(selectedMemberId).catch(console.error);
  }, [selectedMemberId]);

  const getStepStatus = (stepId: string): PathwayProgress['status'] => {
    return progress.find(p => p.stepId === stepId)?.status || 'Pending';
  };

  const handleToggleStep = async (step: DiscipleshipStep) => {
    if (!selectedMemberId) return;
    const current = getStepStatus(step.id);
    const next: PathwayProgress['status'] = current === 'Completed' ? 'Pending' : current === 'Pending' ? 'In Progress' : 'Completed';
    const dbMemberId = parseInt(selectedMemberId.replace('M-', ''), 10);
    await discipleshipApi.updateProgress({
      member_id: dbMemberId,
      step_id: parseInt(step.id, 10),
      status: next,
    });
    await loadProgress(selectedMemberId);
    if (isLeader) await loadOverview();
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle) return;
    await discipleshipApi.createStep({ title: newStepTitle, sort_order: steps.length + 1 });
    setNewStepTitle('');
    setShowAddStep(false);
    await loadSteps();
  };

  const completedCount = steps.filter(s => getStepStatus(s.id) === 'Completed').length;
  const progressPercent = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-violet-50 to-white p-6 rounded-2xl border border-violet-100">
        <h3 className="text-lg font-bold text-slate-800">
          <i className="bi bi-signpost-split text-violet-600 mr-2"></i>Discipleship Pathway
        </h3>
        <p className="text-sm text-slate-500 mt-1">Guide new converts from salvation to active ministry — track progress step by step.</p>
      </div>

      {isLeader && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm uppercase text-slate-600">Select Member</h4>
              {isLeader && (
                <button type="button" onClick={() => setShowAddStep(true)} className="text-xs text-violet-600 font-bold hover:underline">+ Add Step</button>
              )}
            </div>
            <select
              value={selectedMemberId}
              onChange={e => setSelectedMemberId(e.target.value)}
              className="input-elegant w-full"
            >
              <option value="">Choose a member...</option>
              {members.filter(m => m.membershipStatus === 'Active').map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            {overview.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <h5 className="text-[10px] font-bold uppercase text-slate-400">Church Overview</h5>
                {overview.slice(0, 6).map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelectedMemberId(`M-${o.id}`)}
                    className="w-full flex items-center gap-2 text-left p-2 rounded-lg hover:bg-violet-50 text-xs"
                  >
                    <div className="flex-1 font-medium truncate">{o.name}</div>
                    <div className="text-violet-600 font-bold">{o.completed}/{o.total}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {!selectedMemberId ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
                Select a member to view or update their discipleship progress
              </div>
            ) : (
              <PathwaySteps
                steps={steps}
                getStepStatus={getStepStatus}
                onToggle={handleToggleStep}
                completedCount={completedCount}
                progressPercent={progressPercent}
                canEdit={isLeader}
              />
            )}
          </div>
        </div>
      )}

      {isMember && currentMemberId && (
        <PathwaySteps
          steps={steps}
          getStepStatus={getStepStatus}
          onToggle={handleToggleStep}
          completedCount={completedCount}
          progressPercent={progressPercent}
          canEdit={false}
        />
      )}

      {showAddStep && (
        <div className="modal-backdrop">
          <div className="modal-content p-6 space-y-3 max-w-sm">
            <h3 className="font-bold">Add Pathway Step</h3>
            <form onSubmit={handleAddStep} className="space-y-3">
              <input required value={newStepTitle} onChange={e => setNewStepTitle(e.target.value)} placeholder="Step title" className="input-elegant w-full" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddStep(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PathwaySteps({
  steps, getStepStatus, onToggle, completedCount, progressPercent, canEdit,
}: {
  steps: DiscipleshipStep[];
  getStepStatus: (id: string) => PathwayProgress['status'];
  onToggle: (step: DiscipleshipStep) => void;
  completedCount: number;
  progressPercent: number;
  canEdit: boolean;
}) {
  const statusIcon = (status: PathwayProgress['status']) => {
    if (status === 'Completed') return 'bi-check-circle-fill text-emerald-500';
    if (status === 'In Progress') return 'bi-arrow-repeat text-amber-500';
    return 'bi-circle text-slate-300';
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-slate-800">{completedCount} of {steps.length} steps complete</div>
          <div className="text-xs text-slate-400">Discipleship journey progress</div>
        </div>
        <div className="text-2xl font-bold text-violet-600">{progressPercent}%</div>
      </div>
      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.id);
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => canEdit && onToggle(step)}
              disabled={!canEdit}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                status === 'Completed' ? 'bg-emerald-50 border-emerald-200' :
                status === 'In Progress' ? 'bg-amber-50 border-amber-200' :
                'bg-slate-50 border-slate-200 hover:border-violet-200'
              } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center shrink-0 text-sm font-bold text-violet-600">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800">{step.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{step.description}</div>
              </div>
              <i className={`bi ${statusIcon(status)} text-xl shrink-0`}></i>
            </button>
          );
        })}
      </div>
      {canEdit && <p className="text-[10px] text-slate-400 text-center">Click a step to cycle: Pending → In Progress → Completed</p>}
    </div>
  );
}
