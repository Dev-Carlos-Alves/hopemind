document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const toggleToRegister = document.getElementById('toggle-to-register');
    const toggleToLogin = document.getElementById('toggle-to-login');
    
    const roleSelect = document.getElementById('reg-tipo');
    const psiFields = document.getElementById('psicologo-fields');
    const pacFields = document.getElementById('paciente-fields');
    
    // Psi Elements
    const crpInput = document.getElementById('reg-crp');
    const linkInput = document.getElementById('reg-link');
    const espInput = document.getElementById('reg-especialidade');
    const abordInput = document.getElementById('reg-abordagem');
    const valorInput = document.getElementById('reg-valor');
    const bioInput = document.getElementById('reg-biografia');
    
    // Pac Elements
    const nascInput = document.getElementById('reg-nascimento');
    const queixaInput = document.getElementById('reg-queixa');
    
    const alertBox = document.getElementById('alert-box');

    // --- UI Toggles ---
    toggleToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        formLogin.classList.add('hidden');
        formRegister.classList.remove('hidden');
        hideAlert();
    });

    toggleToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        formRegister.classList.add('hidden');
        formLogin.classList.remove('hidden');
        hideAlert();
    });

    roleSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Psicologo') {
            psiFields.classList.remove('hidden');
            pacFields.classList.add('hidden');
            crpInput.required = true;
            linkInput.required = true;
        } else {
            psiFields.classList.add('hidden');
            pacFields.classList.remove('hidden');
            crpInput.required = false;
            linkInput.required = false;
        }
    });

    // --- Alert System ---
    function showAlert(msg, type = 'error') {
        alertBox.textContent = msg;
        alertBox.className = ''; 
        alertBox.classList.add(type === 'success' ? 'alert-success' : 'alert-error');
        alertBox.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function hideAlert() {
        alertBox.classList.add('hidden');
    }

    // --- Core Logic: Login ---
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();
        
        const email = document.getElementById('login-email').value.trim();
        const senha = document.getElementById('login-senha').value.trim();

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Falha ao realizar login.');
            }

            localStorage.setItem('hopemind_user', JSON.stringify(data.user));
            if (data.token) {
                localStorage.setItem('hopemind_token', data.token);
            }

            if (!data.user.has_triage && data.user.tipo !== 'Admin') {
                window.location.href = '/views/triage.html';
            } else if (data.user.tipo === 'Paciente' || data.user.tipo === 'Psicologo') {
                window.location.href = '/views/home.html';
            } else {
                window.location.href = '/views/admin.html';
            }

        } catch (error) {
            showAlert(error.message, 'error');
        }
    });

    // --- Core Logic: Register ---
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();

        const tipo_usuario = roleSelect.value;
        const cpf = document.getElementById('reg-cpf').value.replace(/\D/g, '');

        if (cpf.length !== 11) {
            return showAlert('O CPF deve ter exatamente 11 números.', 'error');
        }

        const payload = {
            tipo_usuario: tipo_usuario,
            nome: document.getElementById('reg-nome').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            cpf: cpf,
            telefone: document.getElementById('reg-telefone').value.trim(),
            data_nascimento: nascInput.value,
            genero: document.getElementById('reg-genero').value,
            senha: document.getElementById('reg-senha').value.trim()
        };

        if (tipo_usuario === 'Psicologo') {
            payload.crp = crpInput.value.trim();
            payload.link_contato = linkInput.value.trim();
            payload.especialidade = espInput.value.trim();
            payload.abordagem_terapeutica = abordInput.value.trim();
            payload.biografia = bioInput.value.trim();
            payload.valor_sessao = valorInput.value ? parseFloat(valorInput.value) : null;
            
            if (!/^\d+$/.test(payload.crp)) {
                return showAlert('O CRP deve conter exclusivamente números.', 'error');
            }
        } else {
            payload.queixa_principal = queixaInput.value.trim();
        }

        try {
            const btn = formRegister.querySelector('button[type="submit"]');
            btn.textContent = 'Enviando...';
            btn.disabled = true;

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            btn.textContent = 'Finalizar Cadastro';
            btn.disabled = false;

            if (!res.ok) {
                throw new Error(data.error || 'Falha ao registrar.');
            }

            showAlert('Conta criada com sucesso! Faça login para continuar.', 'success');
            
            formRegister.reset();
            formRegister.classList.add('hidden');
            formLogin.classList.remove('hidden');

        } catch (error) {
            showAlert(error.message, 'error');
            const btn = formRegister.querySelector('button[type="submit"]');
            btn.textContent = 'Finalizar Cadastro';
            btn.disabled = false;
        }
    });
});
