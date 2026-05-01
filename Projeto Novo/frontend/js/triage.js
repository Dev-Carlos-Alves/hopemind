document.addEventListener('DOMContentLoaded', async () => {
    const questionsContainer = document.getElementById('questions-container');
    const triageForm = document.getElementById('triage-form');
    const submitBtn = document.getElementById('submit-triage');
    const errorBox = document.getElementById('error-message');

    // 1. Validate Session
    const userDataStr = localStorage.getItem('hopemind_user');
    const token = localStorage.getItem('hopemind_token');
    if (!userDataStr || !token) {
        window.location.href = '/views/login.html';
        return;
    }
    const user = JSON.parse(userDataStr);

    function showError(msg) {
        errorBox.textContent = msg;
        errorBox.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 2. Fetch Questions
    try {
        const res = await fetch(`/api/triage/questions?tipo=${user.tipo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Falha de conexão com o servidor ou sessão expirada.');
        
        const questions = await res.json();
        
        if (!questions || questions.length === 0) {
            questionsContainer.innerHTML = '<p style="text-align:center;">Nenhuma pergunta disponível para o seu perfil no momento.</p>';
            return;
        }

        renderQuestions(questions);
    } catch (err) {
        showError(err.message);
        questionsContainer.innerHTML = '';
    }

    // 3. Render Form
    function renderQuestions(questions) {
        questionsContainer.innerHTML = '';
        
        questions.forEach((q, index) => {
            const block = document.createElement('div');
            block.className = 'question-block';
            
            let optionsHtml = '';
            q.opcoes.forEach(opt => {
                const inputType = q.Tipo === 'multipla_escolha' ? 'radio' : 'radio';
                optionsHtml += `
                    <label class="option-label">
                        <input type="${inputType}" name="q_${q.ID_Pergunta}" value="${opt.ID_Opcao}">
                        ${opt.texto}
                    </label>
                `;
            });

            block.innerHTML = `
                <div class="question-title">${index + 1}. ${q.Texto_Pergunta}</div>
                <div class="options-group">
                    ${optionsHtml}
                </div>
            `;
            questionsContainer.appendChild(block);
        });

        submitBtn.style.display = 'block';
    }

    // 4. Handle Submission
    triageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.classList.add('hidden');

        const respostas = [];
        const questionBlocks = document.querySelectorAll('.question-block');
        let allAnswered = true;

        questionBlocks.forEach(block => {
            const inputs = block.querySelectorAll('input');
            const questionId = inputs[0].name.split('_')[1];
            
            const checked = Array.from(inputs).find(input => input.checked);
            
            if (checked) {
                respostas.push({
                    idPergunta: parseInt(questionId),
                    idOpcao: parseInt(checked.value)
                });
            } else {
                allAnswered = false;
            }
        });

        if (!allAnswered) {
            return showError('Atenção: Por favor, responda a todas as perguntas antes de continuar.');
        }

        try {
            submitBtn.textContent = 'Salvando Preferências...';
            submitBtn.classList.add('btn-disabled');
            submitBtn.disabled = true;

            const res = await fetch('/api/triage/submit', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    idEspecifico: user.tipo === 'Paciente' ? user.ID_Paciente : user.ID_Psicologo,
                    tipo: user.tipo,
                    respostas
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao processar as respostas.');

            window.location.href = '/views/home.html';

        } catch (err) {
            showError(err.message);
            submitBtn.textContent = 'Finalizar e Ver Resultados';
            submitBtn.classList.remove('btn-disabled');
            submitBtn.disabled = false;
        }
    });
});
