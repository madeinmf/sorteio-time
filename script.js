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
    let playersPerTeam = 4;
    
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
        playersPerTeam = parseInt(inputPlayersPerTeam.value) || 4;
        badgeConfig.textContent = `${numTeams} Times de ${playersPerTeam}`;
        modalSettings.classList.add('hidden');
        resultsSection.classList.add('hidden'); // Hide old results when settings change
        
        // Sync number of player input rows
        const requiredSlots = numTeams * playersPerTeam;
        const groups = document.querySelectorAll('.player-input-group');
        const currentSlots = groups.length;
        
        if (currentSlots < requiredSlots) {
            for (let i = currentSlots; i < requiredSlots; i++) {
                addPlayerInput();
            }
        } else if (currentSlots > requiredSlots) {
            let toRemove = currentSlots - requiredSlots;
            for (let i = groups.length - 1; i >= 0 && toRemove > 0; i--) {
                const input = groups[i].querySelector('input');
                if (input && !input.value.trim()) {
                    groups[i].remove();
                    toRemove--;
                }
            }
            updatePlayerIndexes();
        }
    });

    // Initial slots configuration
    const initialPlayersCount = numTeams * playersPerTeam; // Start with exactly config requirement
    
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

        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.classList.remove('hidden');
        resultsSection.classList.add('hidden'); // Clear previous results while loading

        setTimeout(() => {
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
            
            // Distribute to Teams by balancing total "score"
            const teams = Array.from({ length: numTeams }, () => ({
                players: [],
                score: 0
            }));
            const reserves = [];
            
            const categoryScores = { 'A': 3, 'B': 2, 'C': 1 };
            
            for (let i = 0; i < sortedPlayers.length; i++) {
                const p = sortedPlayers[i];
                const pScore = categoryScores[p.category] || 1;
                
                // Find the team with the lowest score that is NOT full
                let targetTeam = null;
                let minScore = Infinity;
                
                for (let j = 0; j < numTeams; j++) {
                    if (teams[j].players.length < playersPerTeam) {
                        if (teams[j].score < minScore) {
                            minScore = teams[j].score;
                            targetTeam = teams[j];
                        }
                    }
                }
                
                if (targetTeam) {
                    targetTeam.players.push(p);
                    targetTeam.score += pScore;
                } else {
                    reserves.push(p);
                }
            }
            
            // Extract just the arrays of players
            const teamArrays = teams.map(t => t.players);
            
            renderResults(teamArrays, reserves);
            loadingOverlay.classList.add('hidden');
        }, 2500); // 2.5 seconds loading animation
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
                teamsContainer.appendChild(createTeamCard(index, team));
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
    
    const humorNames = [
        { name: "Rei Davi", sub: "Time de reis fortes, derrubadores de gigantes" },
        { name: "Arca de Noé", sub: "Tem de tudo um pouco, a maioria é animal" },
        { name: "Sansão", sub: "Cuidado pra não cortar o cabelo e perder a força" },
        { name: "Exército de Gideão", sub: "Meia dúzia de gatos pingados que fazem milagre" },
        { name: "Muralhas de Jericó", sub: "Uma gritaria danada e a defesa cai toda" },
        { name: "Lázaro", sub: "Dizem as más línguas que ressuscita no segundo tempo" },
        { name: "Golias", sub: "Muito tamanho, pouca habilidade com a bola" },
        { name: "Jonas", sub: "Passou 3 dias sumido no campo sem tocar na bola" },
        { name: "Filho Pródigo", sub: "Sempre volta pra defesa depois de tomar goleada" },
        { name: "Mar Vermelho", sub: "A defesa abre toda para o atacante passar" },
        { name: "Torre de Babel", sub: "Ninguém se entende, mas a intenção é boa" },
        { name: "Zaqueu", sub: "Baixinhos que resolvem subir pra cabecear" }
    ];

    function createTeamCard(teamIndex, players) {
        const teamPalette = teamIndex % 5;
        const funnyTeam = humorNames[Math.floor(Math.random() * humorNames.length)];
        
        const card = document.createElement('div');
        card.className = `team-card-styled team-color-${teamPalette}`;
        
        const header = document.createElement('div');
        header.className = 'team-header-styled';
        
        const trophySvg = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>`;

        header.innerHTML = `
            <div class="team-header-info">
                <span class="team-number">TIME 0${teamIndex + 1}</span>
                <h4 class="team-funny-name">${funnyTeam.name}</h4>
            </div>
            <div class="team-trophy">${trophySvg}</div>
        `;
        
        const desc = document.createElement('div');
        desc.className = 'team-desc';
        desc.innerHTML = `<p>${funnyTeam.sub}</p>`;
        
        const list = document.createElement('ul');
        list.className = 'team-list-styled';
        
        players.forEach(p => list.appendChild(createPlayerItem(p)));
        
        card.appendChild(header);
        card.appendChild(desc);
        card.appendChild(list);
        
        return card;
    }
    
    function createPlayerItem(player) {
        const li = document.createElement('li');
        li.className = 'player-pill';
        const userIcon = `<svg class="icon-user" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        
        li.innerHTML = `
            <div class="player-info">
                ${userIcon}
                <span class="player-name">${player.name}</span>
            </div>
            <span class="cat-badge-styled ${player.category}">CAT ${player.category}</span>
        `;
        return li;
    }
});
