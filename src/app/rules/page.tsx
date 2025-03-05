export default function RulesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-700 mb-6">HCI Soccer League Rules</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">General Rules</h2>
        <p className="text-gray-700 mb-4">
          Welcome to the HCI Soccer League. This page outlines the rules and regulations that govern our league.
          All players and teams are expected to adhere to these rules to ensure fair play and sportsmanship.
        </p>
        
        <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Match Format</h3>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Matches consist of two 20-minute halves with a 5-minute halftime break.</li>
          <li>Teams must field a minimum of 6 players to start a match.</li>
          <li>Substitutions are allowed at any time during the match.</li>
        </ul>
        
        <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Scoring System</h3>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>3 points are awarded for a win</li>
          <li>1 point is awarded for a draw</li>
          <li>0 points are awarded for a loss</li>
          <li>Teams are ranked by total points, with tiebreakers determined by head-to-head results and goal difference.</li>
        </ul>
        
        <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Disciplinary Procedures</h3>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Yellow cards result in a caution. Two yellow cards in a single match result in a red card.</li>
          <li>Red cards result in immediate ejection from the current match and a minimum one-match suspension.</li>
          <li>Serious misconduct may result in additional disciplinary action as determined by the league committee.</li>
        </ul>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">League Structure</h2>
        <p className="text-gray-700 mb-4">
          The HCI Soccer League operates on a seasonal basis.
          Each team plays against every other team in their division once during the regular season.
        </p>
        
        <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Playoffs</h3>
        <p className="text-gray-700 mb-4">
          The top eight teams will qualify for the playoffs. The playoffs consist of quarter-finals, semi-finals, and a final match.
          In case of a draw in playoff matches, straight to penalty shootout.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
          <p className="text-blue-700">
            <strong>Note:</strong> These rules are subject to change at the discretion of the league committee.
            Any changes will be communicated to all team representatives in advance.
          </p>
        </div>
      </div>
    </div>
  );
} 