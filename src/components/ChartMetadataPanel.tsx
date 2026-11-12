import { useState } from 'react';
import { FORMAT_OPTIONS, MTT_STAGE_OPTIONS, SITUATION_OPTIONS, getHeroPositions, getTableTypes } from '@/lib/chartOptions';
import type { ChartMetadata, Workspace } from '@/types/chart';

interface ChartMetadataPanelProps { workspace: Workspace; onUpdate: (patch: Partial<ChartMetadata>) => void }

export default function ChartMetadataPanel({ workspace, onUpdate }: ChartMetadataPanelProps) {
  const [opponentDraft, setOpponentDraft] = useState(workspace.opponent);
  const [extraSeatsDraft, setExtraSeatsDraft] = useState(workspace.extraSeats);
  const [stagePopupOpen, setStagePopupOpen] = useState(false);
  const tableTypes = getTableTypes(workspace.format);
  const heroPositions = getHeroPositions(workspace.tableType);

  const commitText = (key: 'opponent' | 'extraSeats', draft: string) => {
    const value = key === 'opponent' ? draft.trim() || 'none' : draft.trim();
    if (value !== workspace[key]) onUpdate({ [key]: value });
  };

  const chooseFormat = (format: string) => {
    onUpdate({ format, tableType: '', heroPosition: '', situation: '', mttStage: '' });
    setStagePopupOpen(format === 'mtt');
  };

  return (
    <div className="panel">
      <h2>1. Chart Metadata</h2>
      <p className="hint">Set the title details shared by every stack depth in this chart.</p>

      <label htmlFor="format-select">Format</label>
      <select id="format-select" value={workspace.format} onChange={(event) => chooseFormat(event.target.value)}>
        <option value="">Select Format</option>
        {FORMAT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>

      {workspace.format === 'mtt' && (
        <div className="mt-2 rounded-lg border border-slate-600 p-3">
          <div className="text-sm text-slate-300">Tournament stage</div>
          <div className="font-semibold">{MTT_STAGE_OPTIONS.find((option) => option.value === workspace.mttStage)?.label ?? 'Not selected'}</div>
          <button type="button" className="secondary mt-2" onClick={() => setStagePopupOpen(true)}>Choose stage</button>
        </div>
      )}

      <label htmlFor="table-type-select">Table Type</label>
      <select id="table-type-select" value={workspace.tableType} disabled={!tableTypes.length} onChange={(event) => onUpdate({ tableType: event.target.value, heroPosition: '', situation: '' })}>
        <option value="">Select Table Type</option>
        {tableTypes.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>

      <label htmlFor="hero-select">Hero Position</label>
      <select id="hero-select" value={workspace.heroPosition} disabled={!heroPositions.length} onChange={(event) => onUpdate({ heroPosition: event.target.value, situation: '' })}>
        <option value="">Select Hero</option>
        {heroPositions.map((position) => <option key={position} value={position}>{position}</option>)}
      </select>

      <label htmlFor="situation-select">Situation</label>
      <select id="situation-select" value={workspace.situation} disabled={!workspace.heroPosition} onChange={(event) => onUpdate({ situation: event.target.value })}>
        <option value="">Select Situation</option>
        {SITUATION_OPTIONS.map((situation) => <option key={situation} value={situation}>{situation}</option>)}
      </select>

      <label htmlFor="opponent-input">Opponent</label>
      <input id="opponent-input" type="text" value={opponentDraft} onChange={(event) => setOpponentDraft(event.target.value)} onBlur={() => commitText('opponent', opponentDraft)} />

      <label htmlFor="extra-seats-input">Extra Seats (comma separated)</label>
      <input id="extra-seats-input" type="text" value={extraSeatsDraft} onChange={(event) => setExtraSeatsDraft(event.target.value)} onBlur={() => commitText('extraSeats', extraSeatsDraft)} />

      {stagePopupOpen && (
        <div className="modal-backdrop" role="presentation">
          <div className="stage-modal" role="dialog" aria-modal="true" aria-labelledby="stage-modal-title">
            <h2 id="stage-modal-title">Choose Tournament Stage</h2>
            <p className="hint">This stage will be added to every stack depth in the combined MTT chart.</p>
            <div className="flex flex-col gap-2">
              {MTT_STAGE_OPTIONS.map((option) => (
                <button key={option.value} type="button" className={workspace.mttStage === option.value ? 'stage-option selected' : 'stage-option'} onClick={() => { onUpdate({ mttStage: option.value }); setStagePopupOpen(false); }}>
                  {option.label}
                </button>
              ))}
            </div>
            <button type="button" className="secondary mt-4 w-full" onClick={() => setStagePopupOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
