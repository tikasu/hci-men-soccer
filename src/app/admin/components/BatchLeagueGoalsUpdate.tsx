import { useState, useRef } from 'react';
import { updatePlayer } from '@/lib/services/teamService';
import { Player } from '@/lib/types';
import { useTeams } from '@/lib/hooks/useTeams';

interface BatchLeagueGoalsUpdateProps {
  players: Player[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface PlayerGoalUpdate {
  playerId: string;
  playerName: string;
  teamName: string;
  currentGoals: number;
  newGoals: number;
}

export default function BatchLeagueGoalsUpdate({ players, onSuccess, onCancel }: BatchLeagueGoalsUpdateProps) {
  const { data: teams } = useTeams();
  const [goalsText, setGoalsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewUpdates, setPreviewUpdates] = useState<PlayerGoalUpdate[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateGoalData = (playerName: string, goals: number, lineNumber: number): string | null => {
    if (isNaN(goals) || goals < 0) {
      return `Line ${lineNumber}: Invalid goal count for ${playerName}`;
    }
    
    // Find player by name instead of ID
    const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (!player) {
      return `Line ${lineNumber}: Player "${playerName}" not found`;
    }
    
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setGoalsText(content);
    };
    reader.readAsText(file);
  };

  const downloadSampleTemplate = () => {
    // Create sample data with just player name and goals
    const sampleData = players.slice(0, 5).map(player => 
      `${player.name},${player.stats.goals}`
    ).join('\n');
    
    const header = "Player Name,Goals\n";
    const content = header + sampleData;
    
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'player_goals_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generatePlayerList = () => {
    // Generate a list of all players with their current goals
    const playerList = players.map(player => 
      `${player.name},${player.stats.goals}`
    ).join('\n');
    
    setGoalsText(playerList);
  };

  const handlePreview = () => {
    setValidationErrors([]);
    setPreviewUpdates([]);
    
    if (!goalsText.trim()) {
      setValidationErrors(['Please enter player goals data']);
      return;
    }
    
    const lines = goalsText.trim().split('\n');
    const updates: PlayerGoalUpdate[] = [];
    const errors: string[] = [];
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const parts = line.split(',').map(part => part.trim());
      
      if (parts.length !== 2) {
        errors.push(`Line ${lineNumber}: Invalid format. Expected "Player Name,Goals"`);
        return;
      }
      
      const [playerName, goalsStr] = parts;
      const newGoals = parseInt(goalsStr, 10);
      
      const validationError = validateGoalData(playerName, newGoals, lineNumber);
      
      if (validationError) {
        errors.push(validationError);
      } else {
        const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
        if (player) {
          const team = teams?.find(t => t.id === player.teamId);
          updates.push({
            playerId: player.id,
            playerName,
            teamName: team?.name || 'Unknown Team',
            currentGoals: player.stats.goals,
            newGoals
          });
        }
      }
    });
    
    setValidationErrors(errors);
    setPreviewUpdates(updates);
    setShowPreview(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showPreview) {
      handlePreview();
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      setTotalCount(previewUpdates.length);
      let successfulUpdates = 0;
      
      // Process each player update
      for (const update of previewUpdates) {
        const player = players.find(p => p.id === update.playerId);
        if (!player) continue;
        
        // Update the player's goals
        await updatePlayer(update.playerId, {
          ...player,
          stats: {
            ...player.stats,
            goals: update.newGoals
          }
        });
        
        successfulUpdates++;
        setSuccessCount(successfulUpdates);
      }
      
      // Call the success callback after all players are updated
      onSuccess();
    } catch (err) {
      console.error('Error updating player goals:', err);
      setError('Failed to update player goals. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Instructions</h2>
      <p className="mb-2">Enter player goals data in the format: <code className="bg-gray-100 px-2 py-1 rounded">Player Name,Goals</code></p>
      <p className="mb-2">Example:</p>
      <pre className="bg-gray-100 p-2 rounded mb-4">
        John Smith,5<br />
        Jane Doe,3
      </pre>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={downloadSampleTemplate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Download Template
        </button>
        <button
          type="button"
          onClick={generatePlayerList}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Generate Player List
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {validationErrors.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Validation Errors:</strong>
          <ul className="list-disc ml-5 mt-2">
            {validationErrors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}
      
      {isSubmitting && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">
            Updating player goals... {successCount} of {totalCount} completed
          </span>
        </div>
      )}
      
      {showPreview ? (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Preview Changes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Player Name</th>
                  <th className="py-3 px-6 text-left">Team</th>
                  <th className="py-3 px-6 text-center">Current Goals</th>
                  <th className="py-3 px-6 text-center">New Goals</th>
                  <th className="py-3 px-6 text-center">Change</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {previewUpdates.map((update, index) => {
                  const change = update.newGoals - update.currentGoals;
                  return (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left">{update.playerName}</td>
                      <td className="py-3 px-6 text-left">{update.teamName}</td>
                      <td className="py-3 px-6 text-center">{update.currentGoals}</td>
                      <td className="py-3 px-6 text-center">{update.newGoals}</td>
                      <td className={`py-3 px-6 text-center ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : ''}`}>
                        {change > 0 ? `+${change}` : change}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="goalsText" className="block text-sm font-medium text-gray-700">
                Enter Player Goals (one per line)
              </label>
              <div className="flex space-x-3">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Upload CSV/TXT File
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Format: Player Name, Goals<br />
              Example: John Doe, 5<br />
              Note: You can paste data directly from a spreadsheet
            </div>
            <textarea
              id="goalsText"
              value={goalsText}
              onChange={(e) => setGoalsText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              rows={10}
              placeholder="Player Name, Goals"
            />
          </div>
        </form>
      )}
      
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          {goalsText && !showPreview ? `${goalsText.split('\n').filter(line => line.trim()).length} players entered` : ''}
          {showPreview ? `${previewUpdates.length} players will be updated` : ''}
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          {showPreview && (
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Back to Edit
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800"
            disabled={isSubmitting || (!showPreview && !goalsText.trim()) || (showPreview && previewUpdates.length === 0)}
          >
            {isSubmitting ? 'Updating Goals...' : showPreview ? 'Confirm Updates' : 'Preview Updates'}
          </button>
        </div>
      </div>
    </div>
  );
} 