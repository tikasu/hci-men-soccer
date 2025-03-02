import React from 'react';
import { PlayoffMatch } from '@/lib/types';
import Link from 'next/link';

interface PlayoffBracketProps {
  matches: PlayoffMatch[];
}

const PlayoffBracket: React.FC<PlayoffBracketProps> = ({ matches }) => {
  // Group matches by round
  const quarterfinals = matches.filter(match => match.round === 'quarterfinal')
    .sort((a, b) => a.matchNumber - b.matchNumber);
  const semifinals = matches.filter(match => match.round === 'semifinal')
    .sort((a, b) => a.matchNumber - b.matchNumber);
  const final = matches.find(match => match.round === 'final');

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    
    const [datePart, timePart] = dateString.split('T');
    const date = new Date(`${datePart}T${timePart || '00:00'}`);
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderMatchCard = (match: PlayoffMatch) => {
    const homeWinner = match.isCompleted && match.homeScore !== undefined && match.homeScore !== null && 
                      match.awayScore !== undefined && match.awayScore !== null && 
                      match.homeScore > match.awayScore;
    const awayWinner = match.isCompleted && match.homeScore !== undefined && match.homeScore !== null && 
                      match.awayScore !== undefined && match.awayScore !== null && 
                      match.awayScore > match.homeScore;
    
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden border-l-4 border-green-500 w-full">
        <div className="p-3">
          <div className="text-xs font-medium text-gray-500 mb-1">
            {match.date ? formatDate(match.date) : 'Date TBD'} {match.location ? `• ${match.location}` : ''}
          </div>
          
          <div className="flex flex-col">
            <div className={`flex justify-between items-center py-1 px-2 rounded ${homeWinner ? 'bg-green-100' : ''}`}>
              <div className="font-medium truncate mr-2">
                {match.homeTeamId ? (
                  <Link href={`/teams/${match.homeTeamId}`} className="hover:text-green-700">
                    {match.homeTeamName}
                  </Link>
                ) : (
                  <span className="text-gray-500">{match.homeTeamName}</span>
                )}
              </div>
              <div className={`font-bold ${
                match.isCompleted && match.homeScore !== undefined && match.homeScore !== null && match.awayScore !== undefined && match.awayScore !== null
                  ? match.homeScore > match.awayScore
                    ? 'text-green-600'
                    : match.homeScore < match.awayScore
                      ? 'text-red-600'
                      : 'text-gray-800'
                  : ''
              }`}>{match.homeScore !== undefined && match.homeScore !== null ? match.homeScore : '-'}</div>
            </div>
            
            <div className={`flex justify-between items-center py-1 px-2 rounded ${awayWinner ? 'bg-green-100' : ''}`}>
              <div className="font-medium truncate mr-2">
                {match.awayTeamId ? (
                  <Link href={`/teams/${match.awayTeamId}`} className="hover:text-green-700">
                    {match.awayTeamName}
                  </Link>
                ) : (
                  <span className="text-gray-500">{match.awayTeamName}</span>
                )}
              </div>
              <div className={`font-bold ${
                match.isCompleted && match.homeScore !== undefined && match.homeScore !== null && match.awayScore !== undefined && match.awayScore !== null
                  ? match.awayScore > match.homeScore
                    ? 'text-green-600'
                    : match.awayScore < match.homeScore
                      ? 'text-red-600'
                      : 'text-gray-800'
                  : ''
              }`}>{match.awayScore !== undefined && match.awayScore !== null ? match.awayScore : '-'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="w-full p-4">
        <div className="grid grid-cols-4 gap-4">
          {/* Quarterfinals Column */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-center text-green-800">Quarterfinals</h3>
            <div className="flex flex-col justify-between h-[500px]">
              {/* First two quarterfinals */}
              <div className="space-y-4">
                {quarterfinals.slice(0, 2).map(match => (
                  <div key={match.id} className="px-1">
                    {renderMatchCard(match)}
                  </div>
                ))}
              </div>
              
              {/* Last two quarterfinals */}
              <div className="space-y-4">
                {quarterfinals.slice(2, 4).map(match => (
                  <div key={match.id} className="px-1">
                    {renderMatchCard(match)}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Semifinals Column */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-center text-green-800">Semifinals</h3>
            <div className="flex flex-col justify-between h-[500px]">
              {/* First semifinal - aligned with first two quarterfinals */}
              <div className="flex items-center h-[200px] px-1">
                {semifinals.length > 0 && renderMatchCard(semifinals[0])}
              </div>
              
              {/* Second semifinal - aligned with last two quarterfinals */}
              <div className="flex items-center h-[200px] px-1">
                {semifinals.length > 1 && renderMatchCard(semifinals[1])}
              </div>
            </div>
          </div>
          
          {/* Final Column */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-center text-green-800">Championship</h3>
            <div className="flex items-center justify-center h-[500px] px-1">
              {final && renderMatchCard(final)}
            </div>
          </div>
          
          {/* Champion Column */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-center text-green-800">Champion</h3>
            <div className="flex items-center justify-center h-[500px] px-1">
              {final && final.isCompleted && final.homeScore !== undefined && final.homeScore !== null && final.awayScore !== undefined && final.awayScore !== null ? (
                <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 text-center w-full">
                  <div className="text-xl font-bold text-green-800">
                    {final.homeScore > final.awayScore ? final.homeTeamName : final.awayTeamName}
                  </div>
                  <div className="text-sm text-green-600 mt-1">League Champion</div>
                </div>
              ) : (
                <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center w-full">
                  <div className="text-xl font-bold text-gray-500">TBD</div>
                  <div className="text-sm text-gray-500 mt-1">League Champion</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayoffBracket; 