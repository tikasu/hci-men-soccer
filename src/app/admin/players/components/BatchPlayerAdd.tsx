import { useState, useRef } from 'react';
import { addPlayerToTeam } from '@/lib/services/teamService';
import { PlayerStats } from '@/lib/types';

interface BatchPlayerAddProps {
  teamId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface BatchPlayerData {
  name: string;
  position: string;
  number: string;
}

// Valid positions that match the single player add form
const VALID_POSITIONS = ['Goalkeeper', 'Fieldplayer'];

export default function BatchPlayerAdd({ teamId, onSuccess, onCancel }: BatchPlayerAddProps) {
  const [playersText, setPlayersText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validatePlayerData = (data: BatchPlayerData, lineNumber: number): string | null => {
    if (!data.name) {
      return `Line ${lineNumber}: Name is required`;
    }
    
    if (!data.position) {
      return `Line ${lineNumber}: Position is required`;
    }
    
    if (!VALID_POSITIONS.includes(data.position)) {
      return `Line ${lineNumber}: Invalid position "${data.position}". Valid positions are: ${VALID_POSITIONS.join(', ')}`;
    }
    
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPlayersText(content);
    };
    reader.readAsText(file);
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      'John Doe, Fieldplayer, 10',
      'Jane Smith, Fieldplayer, 9',
      'Alex Johnson, Fieldplayer, 5',
      'Mike Williams, Goalkeeper, 1',
      'Sarah Brown, Fieldplayer, 8'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'players_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);
    setIsSubmitting(true);
    
    try {
      // Parse the text input into player data
      const lines = playersText.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length === 0) {
        setError('Please enter at least one player');
        setIsSubmitting(false);
        return;
      }
      
      // Validate all lines first
      const errors: string[] = [];
      const validPlayers: BatchPlayerData[] = [];
      
      lines.forEach((line, index) => {
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length < 2) {
          errors.push(`Line ${index + 1}: Invalid format. Expected "Name, Position, Number (optional)"`);
          return;
        }
        
        const playerData: BatchPlayerData = {
          name: parts[0],
          position: parts[1],
          number: parts.length > 2 ? parts[2] : ''
        };
        
        const validationError = validatePlayerData(playerData, index + 1);
        if (validationError) {
          errors.push(validationError);
        } else {
          validPlayers.push(playerData);
        }
      });
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        setIsSubmitting(false);
        return;
      }
      
      // All data is valid, proceed with adding players
      setTotalCount(validPlayers.length);
      let successfulAdds = 0;
      
      // Process each valid player
      for (const playerData of validPlayers) {
        // Default stats for new players
        const defaultStats: PlayerStats = {
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          gamesPlayed: 0
        };
        
        // Add the player to the team
        await addPlayerToTeam(teamId, {
          name: playerData.name,
          position: playerData.position,
          number: playerData.number,
          teamId: teamId,
          stats: defaultStats
        });
        
        successfulAdds++;
        setSuccessCount(successfulAdds);
      }
      
      // Call the success callback after all players are added
      onSuccess();
    } catch (err) {
      console.error('Error adding players:', err);
      setError('Failed to add players. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Add Multiple Players</h2>
      
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
            Adding players... {successCount} of {totalCount} completed
          </span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="playersText" className="block text-sm font-medium text-gray-700">
              Enter Players (one per line)
            </label>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="text-sm text-green-600 hover:text-green-800"
              >
                Download Template
              </button>
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
            Format: Name, Position, Number (optional)<br />
            Example: John Doe, Fieldplayer, 10<br />
            Valid positions: {VALID_POSITIONS.join(', ')}
          </div>
          <textarea
            id="playersText"
            value={playersText}
            onChange={(e) => setPlayersText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            rows={10}
            placeholder="John Doe, Fieldplayer, 10
Jane Smith, Fieldplayer, 9
Mike Williams, Goalkeeper, 1"
          />
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            {playersText ? `${playersText.split('\n').filter(line => line.trim()).length} players entered` : 'No players entered'}
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
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800"
              disabled={isSubmitting || !playersText.trim()}
            >
              {isSubmitting ? 'Adding Players...' : 'Add Players'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 