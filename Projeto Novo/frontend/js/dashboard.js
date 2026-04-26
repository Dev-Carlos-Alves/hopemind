document.addEventListener('DOMContentLoaded', async () => {
    const matchesGrid = document.getElementById('matches-grid');
    const errorBox = document.getElementById('error-message');

    // 1. Session check
    const userDataStr = localStorage.getItem('hopemind_user');
    if (!userDataStr) {
        window.location.href = '/views/login.html';
        return;
    }
    const user = JSON.parse(userDataStr);
    const pacienteId = user.idUsuario || user.ID_Usuario;

    function showError(msg) {
        errorBox.textContent = msg;
        errorBox.classList.remove('hidden');
    }

    // 2. Fetch API Data
    try {
        const res = await fetch(`/api/matches/${pacienteId}`);
        if (!res.ok) throw new Error('Não foi possível carregar a lista de matches.');
        
        const matches = await res.json();

        if (!matches || matches.length === 0) {
            matchesGrid.innerHTML = `
                <div class="card" style="text-align: center; grid-column: 1 / -1; padding: 4rem;">
                    <h3 style="color: var(--color-text-muted);">Ainda não temos matches perfeitos calculados.</h3>
                    <p style="color: #999; margin-top: 1rem;">Isso acontece quando não encontramos tags em comum. Nossa rede está crescendo diariamente.</p>
                </div>
            `;
            return;
        }

        renderMatches(matches);

    } catch (err) {
        showError(err.message);
        matchesGrid.innerHTML = '';
    }

    // 3. Render Cards
    function renderMatches(matches) {
        matchesGrid.innerHTML = '';
        
        matches.forEach(doc => {
            const card = document.createElement('div');
            card.className = 'card match-card';
            
            // Dynamic Action Formulator
            const cleanNumber = doc.linkContato ? doc.linkContato.replace(/\D/g, '') : '';
            const message = encodeURIComponent(`Olá, Dr(a) ${doc.nome}. Vi seu perfil no HopeMind e gostaria de verificar disponibilidade para agendar uma consulta.`);
            const waLink = cleanNumber ? `https://wa.me/${cleanNumber}?text=${message}` : '#';

            card.innerHTML = `
                <div class="badge-match">${doc.matchPercentage || 0}% Match</div>
                
                <img src="/${doc.foto || 'assets/images/default_avatar.png'}" 
                     alt="Dr. ${doc.nome}" 
                     class="match-photo" 
                     onerror="this.src='https://placehold.co/110x110/D8F2E2/3F9A43?text=Doc'">
                
                <h3 class="doc-name">${doc.nome}</h3>
                <div class="doc-spec">${doc.especialidade || 'Clínica Geral'}</div>
                <div class="doc-crp">CRP: ${doc.crp}</div>
                
                <div style="width: 100%; margin-top: auto;">
                    <a href="${waLink}" target="_blank" class="btn btn-whatsapp" ${!cleanNumber ? 'style="pointer-events:none; opacity:0.6"' : ''}>
                        📱 Agendar via WhatsApp
                    </a>
                    <a href="/views/doctor-profile.html?id=${doc.idPsicologo || doc.ID_Psicologo}" class="btn btn-profile">
                        Ver Perfil Completo
                    </a>
                </div>
            `;
            matchesGrid.appendChild(card);
        });
    }
});
