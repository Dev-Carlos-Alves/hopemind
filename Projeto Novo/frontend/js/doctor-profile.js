document.addEventListener('DOMContentLoaded', async () => {
    const profileContainer = document.getElementById('profile-content');
    
    // 1. Get Doctor ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('id');

    if (!doctorId) {
        profileContainer.innerHTML = '<div class="card" style="text-align: center; padding: 3rem;"><h3 style="color: var(--color-error)">Psicólogo não encontrado.</h3></div>';
        return;
    }

    try {
        // Since there is no standalone GET /api/psicologo/:id API route explicitly defined in the MVP backend scope,
        // we mock the data structure here adhering to the final structural requirement.
        // In production, this would be `const res = await fetch('/api/psicologos/' + doctorId);`

        const mockDoctorData = {
            nome: "Dr(a). Maria Silva",
            especialidade: "Psicologia Clínica Cognitivo-Comportamental",
            crp: "123456/SP",
            linkContato: "5511999999999",
            foto: "assets/images/default_avatar.png",
            bio: "Sou uma profissional focada em ajudar meus pacientes a encontrar clareza mental, superar quadros de ansiedade e construir relacionamentos mais saudáveis. Trabalhamos juntos em um ambiente completamente livre de julgamentos, desenvolvendo ferramentas práticas para o dia a dia.",
            tags: ["Ansiedade", "TCC", "Depressão", "Autoconhecimento", "Relacionamentos"]
        };

        renderProfile(mockDoctorData);

    } catch (err) {
        profileContainer.innerHTML = `<div class="card" style="text-align: center; color: var(--color-error); padding: 3rem;">Erro ao carregar perfil: ${err.message}</div>`;
    }

    function renderProfile(doc) {
        const cleanNumber = doc.linkContato ? doc.linkContato.replace(/\D/g, '') : '';
        const message = encodeURIComponent(`Olá, ${doc.nome}. Acessei o seu perfil na plataforma HopeMind e gostaria de entender como funciona o agendamento de consultas.`);
        const waLink = cleanNumber ? `https://wa.me/${cleanNumber}?text=${message}` : '#';

        let tagsHtml = '';
        if (doc.tags && doc.tags.length > 0) {
            tagsHtml = doc.tags.map(tag => `<span class="tag-pill">${tag}</span>`).join('');
        }

        profileContainer.innerHTML = `
            <a href="javascript:history.back()" style="color: var(--color-accent-1); text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 2rem;">
                &larr; Voltar para Resultados
            </a>
            
            <div class="card">
                <div class="profile-header">
                    <img src="/${doc.foto}" alt="${doc.nome}" class="profile-photo" onerror="this.src='https://placehold.co/160x160/D8F2E2/3F9A43?text=Doc'">
                    
                    <div class="profile-info">
                        <h1>${doc.nome}</h1>
                        <div class="spec">${doc.especialidade}</div>
                        <div class="crp">CRP: ${doc.crp}</div>
                        
                        <div style="margin-top: 1.5rem;">
                            ${tagsHtml}
                        </div>
                    </div>
                </div>

                <div class="bio-section">
                    <h3 style="color: var(--color-text-main); margin-bottom: 1rem;">Sobre a profissional</h3>
                    <p>${doc.bio || 'Biografia não informada pelo profissional.'}</p>
                </div>

                <div style="text-align: center;">
                    <a href="${waLink}" target="_blank" class="btn btn-whatsapp" ${!cleanNumber ? 'style="pointer-events:none; opacity:0.6"' : ''}>
                        📱 Iniciar Agendamento no WhatsApp
                    </a>
                </div>
            </div>
        `;
    }
});
