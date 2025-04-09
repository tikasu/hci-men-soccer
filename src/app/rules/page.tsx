'use client';

import { useState } from 'react';

export default function RulesPage() {
  const [activeSection, setActiveSection] = useState<'field' | 'futsal' | 'league'>('field');

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeSection === 'field'
              ? 'text-green-700 border-b-2 border-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveSection('field')}
        >
          Field Rules
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeSection === 'futsal'
              ? 'text-green-700 border-b-2 border-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveSection('futsal')}
        >
          Futsal Laws
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeSection === 'league'
              ? 'text-green-700 border-b-2 border-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveSection('league')}
        >
          League Rules
        </button>
      </div>

      {/* Field Rules Section */}
      {activeSection === 'field' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Field Rules</h2>
          <p className="text-gray-700 mb-4">
            Each team member is responsible for the actions and behavior of their teammates, coaches, spectators 
            and managers. Everyone involved in soccer at HCI Sports & Fitness is expected to adhere to the Core 
            Values of the program:
          </p>
          <p className="text-lg font-semibold text-green-700 text-center mb-6">
            Respect, Responsibility, Selflessness, Discipline, and Leadership
          </p>
          
          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Before Playing</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Enter through/check in at the front entrance (south side of building 3) before every match</li>
                <li>A signed waiver is required to participate in any soccer activities</li>
                <li>Teams may or may not have time to warm up on the field- No use of a ball to warm up outside of the field</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Equipment and Attire</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Flat-soled or rubber cleats shall be worn on the field- No cleats allowed on the tile or basketball court</li>
                <li>Shinguards covered by socks are recommended, but not mandatory</li>
                <li>Jewelry must be removed or wrapped prior to participation at the referee's discretion</li>
                <li>Protective equipment may be worn if it is generally soft and deemed safe by a staff member or referee</li>
                <li>Field players shall wear the same color, but different than that of the opposing team. Goalkeepers shall wear a contrasting color to all field players and referees</li>
                <li>Players with inappropriate or offensive attire will be asked to change</li>
                <li>All goals should be anchored appropriately during play</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">General Rules</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>No smoking, chewing tobacco, gum, or sunflower seeds allowed</li>
                <li>No spitting on the turf or in the field area</li>
                <li>No food or beverages on the turf</li>
                <li>No fighting or offensive language- Appropriate disciplinary action will be taken accordingly</li>
                <li>Aggressive behavior or verbal abuse toward referees will not be tolerated. It will be an immediate blue card</li>
                <li>No sliding on the turf is allowed</li>
                <li>Only registered players, coaches, and officials are allowed in the bench area</li>
              </ul>
            </section>
          </div>

          <p className="text-lg font-semibold text-green-700 text-center mt-8">
            LEAVE THE FACILITY IN A BETTER PLACE THAN IT STARTED
          </p>
        </div>
      )}

      {/* Futsal Laws Section */}
      {activeSection === 'futsal' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">FUTSAL LAWS OF THE GAME</h2>
          <p className="text-gray-700 italic mb-6">U.S. FUTSAL [Adapted for HCI Soccer]</p>

          <div className="space-y-8">
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW I - THE PLAYING FIELD</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Futsal (1/3 field)- 17x25 yard fields</li>
                <li>Full Field- 25x60 yards</li>
              </ul>
              
              <div className="my-6">
                <img 
                  src="/field-diagram.png" 
                  alt="HCI Soccer Field Diagram showing three 17x25 yard futsal fields and one 25x60 yard full field"
                  className="w-full max-w-3xl mx-auto rounded-lg shadow-md"
                />
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW II - The Ball</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>U5-8- Size 3</li>
                <li>U9-12- Size 4 futsal</li>
                <li>Full field- Size 5</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW III - Number of Players</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>1/3 Field- 5v5 (including GK) or 4v4 (no GK)</li>
                <li>Full Field- 6v6 or 7v7 (including GK)</li>
                <li>Minimum Number of Players to Start Match: 2 less than required; one of whom shall be a goalkeeper</li>
                <li>Minimum Number of Players to Finish Match: 3 less than maximum amount on the field</li>
                <li>Substitution Limit: None</li>
                <li>Substitution Method: "Flying substitution" (all players come and go, except GK). The subbed player, must be completely off the field before the subbing player participates</li>
                <li>All players must be on the appropriate team roster or guest list (See Guest Player Rules)</li>
                <li>Coed League- "Up 5 Rule"- If a team is up 5 or more goals, a player may be added. When the deficit is back to 4, a player must step off. For Coed, the player can be male or female</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW IV - Players' Equipment</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Usual Equipment: Shirts of the same color, shorts, socks, protective shin-guards and footwear with rubber soles or cleats (on turf only)</li>
                <li>No exposed jewelry or piercings</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW V - Main Referee</h3>
              <p className="text-gray-700 mb-2">Duties:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Enforce the laws, apply the advantage rule, keep a record of all incidents before, during and after game</li>
                <li>Stop game when deemed necessary</li>
                <li>Caution or expel players guilty of misconduct, violent conduct or other ungentlemanly behavior</li>
                <li>Allow no others to enter the pitch</li>
                <li>Stop game to have injured players removed</li>
                <li>Signal for game to be restarted after every stoppage</li>
                <li>Decide that the ball meets the stipulated requirements</li>
                <li>Keeping track of the 2-minute punishment period for a blue card or after a player has been sent off</li>
                <li>Ensuring that substitutions are carried out properly and keeping track of the 1-minute time-out</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW VI - Timekeeper (May also be main referee)</h3>
              <p className="text-gray-700 mb-2">Duties:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Start game clock after kick-off, stop it when necessary</li>
                <li>Indicate end of first half and match with some sort of sound</li>
                <li>Record time-outs</li>
                <li>Record players cautioned and sent off, and other information relevant to the game</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW VII - Duration of the Game</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Duration: Two equal periods of 20 minutes; Running clock when ball is out of play; Time can be prolonged only to take a penalty kick. Playoff games may be 15 min halves</li>
                <li>Stoppages: The clock will not stop at any time unless the referee deems it appropriate i.e. injury or long delay</li>
                <li>Time-outs: 1 per team per half (1 minute duration); none in extra time. May only be taken during a dead ball by the team in possession of the ball</li>
                <li>Half-time: Maximum of 5 minutes</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW VIII - The Start of Play</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Procedure: Coin toss (if desired) followed by kickoff; opposing team waits outside center circle</li>
                <li>Ball deemed in play once it has been touched</li>
                <li>The kicker shall not touch ball before someone else touches it</li>
                <li>Ensuing kick-offs taken after goals scored and at start of second half</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW IX - Ball in and out of Play</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Ball out of play: When it has wholly crossed the goal line or touchline; when the game has been stopped by a referee; when the ball hits the ceiling (restart: kick-in at the touchline closest to where the ball touched the ceiling)</li>
                <li>Lines: Touchlines and goal lines are considered inside the playing area</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW X - Method of Scoring</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>When the whole of the ball has passed over the goal line, between the goal posts and under the crossbar (except by illegal means)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW XI - Fouls and Misconduct</h3>
              <p className="text-gray-700 mb-2">Indirect free kick: awarded when a player intentionally commits any of the following offenses (penalty kick awarded when infringement takes place in penalty area)</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Kicking or attempting to kick an opponent</li>
                <li>Tripping an opponent</li>
                <li>Jumping at an opponent</li>
                <li>Charging an opponent in a violent or dangerous manner</li>
                <li>Charging an opponent from behind</li>
                <li>Striking, attempting to strike, or spitting at an opponent</li>
                <li>Holding an opponent</li>
                <li>Pushing an opponent</li>
                <li>Sliding at an opponent (i.e., sliding tackle). This includes goalkeepers outside of the box</li>
                <li>Handling the ball (except goalkeeper)</li>
                <li>Subbing to gain an advantage when the ball is by the bench of the subbing team</li>
                <li>A goalkeeper slides outside of the goal arc- If momentum takes them out, it is a foul</li>
              </ul>
              
              <p className="text-gray-700 mt-4 mb-2">Indirect free kick continued: awarded when any of the following offenses is committed (When infringement is inside the penalty area, kick is taken from the penalty spot with the defending team allowed to set up):</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Dangerous play (e.g. attempting to kick ball held by goalkeeper)</li>
                <li>Obstruction</li>
                <li>Charging the goalkeeper in the penalty area</li>
                <li>Goalkeeper picks up or touches a backpass with his hands</li>
                <li>Goalkeeper holds the ball for 5 seconds or longer</li>
              </ul>
              
              <p className="text-gray-700 mt-4 mb-2">Players shall be cautioned (i.e., shown blue card) when:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>A substituting player enters the pitch from an incorrect position or before the player he is substituting has entirely left the pitch</li>
                <li>Player jumping over the walls to leave or enter the field</li>
                <li>Player persistently or cynically infringes the Laws of the Game</li>
                <li>Player shows dissent with any decision of the referee; aggressive behavior or verbal abuse included</li>
                <li>Player is guilty of ungentlemanly conduct</li>
                <li>Player commits a denial of a goal scoring opportunity infringement- A penalty kick is also given</li>
                <li>Persistently fouling an opponent or for overly aggressive play</li>
                <li>Becoming hostile with teammates, opponents, referees, or spectators</li>
              </ul>
              
              <p className="text-gray-700 mt-4 mb-2">The above blue-card offenses are punishable by an indirect free kick taken from the point of infringement.</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>A penalty kick will be awarded if the foul is deemed a denial of a goal-scoring opportunity i.e. handball to block a goal, tripping a player after beating the last man</li>
                <li>A penalty kick will be awarded if the foul is by the goalkeeper outside of the penalty area</li>
              </ul>
              
              <p className="text-gray-700 mt-4 mb-2">Players shall be sent off (i.e., shown the red card) for:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Serious foul play</li>
                <li>Violent conduct</li>
                <li>Foul or abusive language</li>
                <li>Second instance of cautionable offense (i.e., second blue card)</li>
              </ul>
              
              <p className="text-gray-700 mt-4 mb-2">Indirect free kicks (or penalty kicks) accompany the expulsion for (a), (b), and (d) (from the penalty spot when the infringement takes place in the penalty area).</p>
              <p className="text-gray-700 mb-2">Indirect free kick for (c), even if it takes place in the penalty area.</p>
              
              <p className="text-gray-700 mt-4 mb-2">Rules of Expulsion:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>The player sent off (shown a red card) is out for the rest of the game and must leave the bench area</li>
                <li>The team of the player sent off can substitute for that player after 2 minutes of playing time or after the opposing team scores – which ever comes first</li>
                <li>The 2-minute punishment shall be kept by the main referee or assistant</li>
                <li>The substitute cannot come on until the ball is out of play or he has the referee's consent</li>
                <li>Players may be suspended for additional games by HCI at the discretion of the Referee, Director, or Staff members</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW XII - Free Kick</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Types: All free kicks shall be indirect</li>
                <li>Wall: At least 5 meters (5.47 yards) away until the ball is in play</li>
                <li>Ball in Play: After it has traveled the distance of its own circumference</li>
                <li>Time Limit: Kick must be taken within 5 seconds</li>
                <li>Restriction: Kicker cannot touch the ball again until it has been touched by another player</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW XIII - Penalty Kick and Dribble-Up Penalty Attempt</h3>
              <p className="text-gray-700 mb-2">Penalty Kick to be taken from the penalty mark (from center dot for 1/3 fields) for the following:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Foul or inside the penalty area</li>
                <li>Denial of a goal by illegal use of the hands inside the penalty area</li>
              </ul>
              
              <p className="text-gray-700 mt-4 mb-2">Dribble-Up Penalty Attempt to be taken from the 2nd closest futsal sideline to the goal line for the following:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Foul denying a clear goal scoring opportunity outside the penalty area</li>
                <li>Foul outside the penalty area by a goalkeeper</li>
                <li>Last Man Rule- Any foul committed by the last defender between the attacker and the goal</li>
              </ul>
              
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li>All players must be behind the futsal sideline until the ball is played</li>
                <li>Penalty Kick- The kicker shall not play the ball a second time until it has been touched by another player</li>
                <li>Dribble-Up Attempt- The kicker has 5 seconds to pass the entirety of the ball past the goal line for a goal. If the forward progress of the ball is stopped by the goalkeeper before 5 seconds, the attempt is over</li>
              </ul>

              <div className="my-6">
                <img 
                  src="/last-man-rule.png" 
                  alt="Four diagrams showing examples of Last Man Rule situations in soccer"
                  className="w-full max-w-3xl mx-auto rounded-lg shadow-md"
                />
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW XIV - Kick-in</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>To be taken in place of the throw-in. All kick-ins are indirect (cannot be scored without being touched by another player before crossing the goal line)</li>
                <li>The ball shall be placed on the touch line and completely still before kicking</li>
                <li>The kicker's foot not kicking the ball must be outside or on the touchline; if it crosses the touchline all of the way onto the pitch, the kick-in is given to the opposing team</li>
                <li>The kick-in must be taken within 5 seconds after being set; if it is not, the kick-in is given to the opposing team</li>
                <li>The kicker cannot play the ball a second time until it has been played by another player; infringement of this rule entails an indirect free kick to the opposing team from the point of infringement</li>
                <li>Players on opposing team must be at least 5m (5.47 yards) away</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW XV - Goal Clearance</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>To be taken in place of goal kick</li>
                <li>From inside the penalty area, the goalkeeper may throw, roll, or kick the ball from the ground into play. No punting</li>
                <li>The ball is not in play until it has left the goalkeeper's hands either by throwing or placing it at their feet to kick it</li>
                <li>The 5 second rule is still in effect. If the goalkeeper does not put the ball into play within 5 seconds, possession is given to the other team at the nearest futsal sideline</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">LAW XVI - Corner Kick</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Ball placed within a yard of the corner (no corner-kick arc). If ball is misplaced, the corner kick is taken over</li>
                <li>Must be taken within 5 seconds; failure to do so entails indirect free kick to the opposing team from the corner mark</li>
                <li>The kicker cannot play the ball a second time until it has been played by another player; infringement of this rule results in an indirect free kick to the opposing team from the point of infringement</li>
                <li>Players on opposing team must be at least 5 m away from point of the corner kick</li>
                <li>Corner Kicks are indirect. Cannot score goal directly from a corner kick unless the ball hits another player before crossing the goal line</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Annex 1 - Penalty Kick Shoot-out</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Penalty shoot-outs used only for playoff or championship matches</li>
                <li>Main referee decides the goal to be used</li>
                <li>Coin tossed (or other fair method) to decide order</li>
                <li>Five kicks to be taken by 5 different players selected from the suited players. Captain of each team announces these 5 to the main referee before the kicks are taken</li>
                <li>If two teams are still tied after 5 kicks, the additional kicks will be taken on a sudden-death basis by the rest of the players who have not kicked yet</li>
                <li>Both teams will shoot through the total number of players of the team with the least amount of players before a player is eligible to shoot again</li>
                <li>Players sent off during the match are not eligible to take these kicks</li>
                <li>Any eligible player may change places with his goalkeeper</li>
                <li>While the penalty shoot-out is in progress, players will remain on the opposite half of the pitch</li>
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* League Rules Section */}
      {activeSection === 'league' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">League Rules</h2>

          <div className="space-y-8">
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">League Scoring</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Win = 3 points</li>
                <li>Draw = 1 point</li>
                <li>Loss = 0 points</li>
                <li>Forfeit score = 3-0</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">League Tiebreakers</h3>
              <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                <li>Points</li>
                <li>Head to Head</li>
                <li>Goal difference</li>
                <li>Lowest goals against</li>
                <li>Highest goals scored</li>
                <li>Coin Flip</li>
              </ol>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Co-Ed League Rostering Rules</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Full team registration covers up to 12 players on a roster. Players may be added to the roster (up to 12) until week 5 of the season</li>
                <li>A minimum of 4 Males and 2 Females + 1 Goalkeeper of either gender on the field</li>
                <li>No more than 4 male outfield players may be on the field at a time. If a team only has 1 female, they must play with 5 outfield players (4 males, 1 female)</li>
                <li>A female player may replace a male player on the field (2 males, 4 females)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Guest Players (Men's 30+ League)</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>1 guest player is able to be used if a team has no subs available (5 field players and a goalkeeper)</li>
                <li>Guest players may not be from other teams for the Men's 30+ League</li>
                <li>Guest players must check in at the front desk and have a waiver on file</li>
                <li>Unregistered players will be charged a $15 league drop in fee. Players that play in other HCI Soccer Leagues are allowed to play at no additional cost</li>
                <li>Send the names of your guest players to the Soccer Director or League Coordinator before they participate</li>
                <li>Guest players will not be allowed to play in finals or playoff matches</li>
                <li>GUEST GOALKEEPER RULE: A team may only use a guest goalkeeper for 3 weeks of the regular season. A guest goalkeeper is not eligible to play during playoff weeks</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Game Rescheduling and Forfeits</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>(Men's 30+ League) Game reschedules will not be allowed. If a team cannot play their scheduled game they will be given a forfeit loss. A scrimmage game for all available players will be played at the original scheduled game time</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Playoff Game Scheduling</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>The #1 Seed (or highest remaining seed after Quarterfinal matches) may choose to play in whichever Semifinal match they prefer. Captain must notify Soccer Director or League Coordinator of their decision within 48 hours of Quarterfinal matches</li>
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
} 