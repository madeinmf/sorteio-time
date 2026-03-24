document.addEventListener('DOMContentLoaded', () => {
    const playersListEl = document.getElementById('players-list');
    const btnAddPlayer = document.getElementById('add-player');
    const btnClearAll = document.getElementById('clear-all');
    const btnSortTeams = document.getElementById('sort-teams');
    const resultsSection = document.getElementById('results-section');
    const teamsContainer = document.getElementById('teams-container');
    const reservesContainer = document.getElementById('reserves-container');
    const reservesList = document.getElementById('reserves-list');
    
    // Settings configuration
    let numTeams = 2;
    let playersPerTeam = 5;
    
    const btnSettings = document.getElementById('btn-settings');
    const modalSettings = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('close-settings');
    const btnSaveSettings = document.getElementById('save-settings');
    const inputNumTeams = document.getElementById('input-num-teams');
    const inputPlayersPerTeam = document.getElementById('input-players-per-team');
    const badgeConfig = document.getElementById('badge-config');
    
    btnSettings.addEventListener('click', () => {
        inputNumTeams.value = numTeams;
        inputPlayersPerTeam.value = playersPerTeam;
        modalSettings.classList.remove('hidden');
    });
    btnCloseSettings.addEventListener('click', () => modalSettings.classList.add('hidden'));
    btnSaveSettings.addEventListener('click', () => {
        numTeams = parseInt(inputNumTeams.value) || 2;
        playersPerTeam = parseInt(inputPlayersPerTeam.value) || 5;
        badgeConfig.textContent = `${numTeams} Times de ${playersPerTeam}`;
        modalSettings.classList.add('hidden');
    });

    // Initial slots configuration
    const initialPlayersCount = 12; // Start with 12 slots for a good default
    
    // Initialize with empty slots
    for(let i=0; i<initialPlayersCount; i++) {
        addPlayerInput();
    }
    
    // Add new player input row
    btnAddPlayer.addEventListener('click', () => {
        addPlayerInput();
        // Scroll slightly to not lose context
        const lastInput = playersListEl.lastElementChild;
        if(lastInput) {
            lastInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    
    // Clear all players
    btnClearAll.addEventListener('click', () => {
        const inputs = document.querySelectorAll('.player-input-group input');
        inputs.forEach(input => input.value = '');
        resultsSection.classList.add('hidden');
    });
    
    // Create new player input
    function addPlayerInput(name = '', category = 'A') {
        const div = document.createElement('div');
        div.className = 'player-input-group';
        
        div.innerHTML = `
            <div class="player-input-top">
                <div class="index-circle">1</div>
                <div class="input-wrapper">
                    <input type="text" placeholder="Nome do Jogador" value="${name}">
                </div>
                <button class="btn-remove" title="Remover">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <select class="category-select">
                <option value="A" ${category === 'A' ? 'selected' : ''}>Categoria A (Craque)</option>
                <option value="B" ${category === 'B' ? 'selected' : ''}>Categoria B (Esforçado)</option>
                <option value="C" ${category === 'C' ? 'selected' : ''}>Categoria C (Perna de pau)</option>
            </select>
        `;
        
        div.querySelector('.btn-remove').addEventListener('click', () => {
            div.remove();
            updatePlayerIndexes();
        });
        
        playersListEl.appendChild(div);
        updatePlayerIndexes();
    }
    
    function updatePlayerIndexes() {
        const groups = document.querySelectorAll('.player-input-group');
        groups.forEach((group, index) => {
            group.querySelector('.index-circle').textContent = index + 1;
        });
    }
    
    // Sorting Algorithm
    btnSortTeams.addEventListener('click', () => {
        // Collect players
        const playerGroups = document.querySelectorAll('.player-input-group');
        let players = [];
        
        playerGroups.forEach(group => {
            const name = group.querySelector('input').value.trim();
            const category = group.querySelector('select').value;
            
            if(name) {
                players.push({ name, category, id: Math.random() });
            }
        });
        
        if (players.length < 2) {
            alert('Adicione os nomes de pelo menos 2 jogadores para sortear os times.');
            return;
        }

        // Shuffle within categories to ensure randomness but keep balance
        const categorized = { A: [], B: [], C: [] };
        players.forEach(p => {
            if (categorized[p.category]) categorized[p.category].push(p);
            else categorized[p.category] = [p]; // Fallback
        });
        
        ['A', 'B', 'C'].forEach(cat => {
            categorized[cat] = shuffleArray(categorized[cat]);
        });
        
        // Final sorted array of players, starting from best to worst category
        const sortedPlayers = [...categorized['A'], ...categorized['B'], ...categorized['C']];
        
        // Distribute to Teams alternately to keep balance
        const teams = Array.from({ length: numTeams }, () => []);
        const reserves = [];
        
        let currentTeamIndex = 0;
        for (let i = 0; i < sortedPlayers.length; i++) {
            const p = sortedPlayers[i];
            
            let added = false;
            let startIndex = currentTeamIndex;
            do {
                if (teams[currentTeamIndex].length < playersPerTeam) {
                    teams[currentTeamIndex].push(p);
                    added = true;
                    currentTeamIndex = (currentTeamIndex + 1) % numTeams;
                    break;
                }
                currentTeamIndex = (currentTeamIndex + 1) % numTeams;
            } while (currentTeamIndex !== startIndex);
            
            if (!added) {
                reserves.push(p);
            }
        }
        
        renderResults(teams, reserves);
    });
    
    function shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }
    
    function renderResults(teams, reserves) {
        teamsContainer.innerHTML = '';
        
        // Render Teams
        teams.forEach((team, index) => {
            if (team.length > 0) {
                teamsContainer.appendChild(createTeamCard(`Time ${index + 1}`, team));
            }
        });
        
        // Render Reserves
        if (reserves.length > 0) {
            reservesContainer.classList.remove('hidden');
            reservesList.innerHTML = '';
            reserves.forEach(p => reservesList.appendChild(createPlayerItem(p)));
        } else {
            reservesContainer.classList.add('hidden');
        }
        
        // Show result section
        resultsSection.classList.remove('hidden');
        
        // Scroll to results seamlessly
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
    
    function createTeamCard(teamName, players) {
        const card = document.createElement('div');
        card.className = 'team-card';
        
        const header = document.createElement('div');
        header.className = 'team-header';
        
        const counts = { A:0, B:0, C:0 };
        players.forEach(p => counts[p.category]++);
        let statsStr = Object.entries(counts).filter(([_, c]) => c > 0).map(([cat, c]) => `${c}${cat}`).join(' · ');
        
        header.innerHTML = `
            <h4>${teamName}</h4>
            <span class="team-stats">${players.length} Jogadores (${statsStr})</span>
        `;
        
        const list = document.createElement('ul');
        list.className = 'team-list';
        
        players.forEach(p => {
            list.appendChild(createPlayerItem(p));
        });
        
        card.appendChild(header);
        card.appendChild(list);
        
        return card;
    }
    
    function createPlayerItem(player) {
        const li = document.createElement('li');
        const initials = player.name.substring(0, 2).toUpperCase();
        
        li.innerHTML = `
            <div class="player-info">
                <div class="avatar">${initials}</div>
                <span class="player-name">${player.name}</span>
            </div>
            <span class="cat-badge ${player.category}">Cat ${player.category}</span>
        `;
        return li;
    }
});
