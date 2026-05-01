<<<<<<< HEAD
# HopeMind - Plataforma de Saúde Mental (PWA)

## 1. Sobre o Projeto

**Descrição da aplicação (HopeMind):** 
O HopeMind é uma plataforma web inovadora voltada para a saúde mental. A aplicação visa conectar pacientes que buscam apoio psicológico com profissionais (psicólogos) qualificados. O sistema possui fluxos de cadastro, triagem inteligente de perfil (match) e agendamento de sessões, garantindo que o paciente encontre o psicólogo mais adequado para suas necessidades.

**Objetivo da aplicação:** 
Proporcionar um ambiente seguro, acolhedor e acessível para o cuidado com a saúde mental. O HopeMind busca facilitar a conexão entre pacientes e psicólogos através de uma interface intuitiva e um sistema de inteligência que analisa queixas, abordagens terapêuticas e especialidades, recomendando as melhores combinações.

**Tecnologias utilizadas:**
*   **Frontend:** HTML5, CSS3, JavaScript (ES6+).
*   **Backend:** Python com o framework Flask.
*   **Banco de Dados:** MySQL (com PyMySQL).
*   **Autenticação:** JWT (JSON Web Tokens) e criptografia de senhas com Werkzeug.
*   **PWA:** Service Workers e Web App Manifest.

---

## 2. Conceitos de PWA (Explique o que é)

**Uma PWA (Progressive Web App)** é uma aplicação web construída com tecnologias modernas que oferece aos usuários uma experiência muito semelhante à de um aplicativo nativo (como os de celular instalados via loja de aplicativos), mas acessada diretamente pelo navegador de internet.

**Principais características:**

*   **Instalável:** Através das configurações no `manifest.json`, o navegador reconhece a aplicação como um "App" e permite que o usuário a instale. Assim, ela ganha um ícone na tela inicial do celular ou do computador e abre em uma janela limpa, sem a barra de endereços, parecendo um app nativo.
*   **Offline (Service Worker):** A plataforma foi configurada com um script de interceptação de rede que faz cache das páginas principais (telas de login, dashboard e recursos estáticos). Isso permite que o paciente carregue a interface do sistema rapidamente, mesmo em conexões lentas ou se estiver temporariamente offline.
*   **Responsividade:** O layout se adapta dinamicamente a diferentes resoluções e tamanhos de tela (mobile, tablets e desktop).
*   **manifest.json:** É o arquivo de configuração da PWA. Ele fornece ao navegador meta-informações importantes como o nome do app (HopeMind), a cor da barra superior (theme color), a rota inicial e os ícones em diferentes resoluções.
*   **Service Worker:** É um JavaScript que roda em background (segundo plano). Ele atua como um "gerenciador de tráfego" entre a aplicação e a internet. No HopeMind, o Service Worker avalia se o usuário está offline: se estiver buscando a API e a rede falhar, ele devolve uma mensagem de erro controlada; se estiver buscando arquivos visuais (CSS/JS/HTML), ele devolve os arquivos salvos em cache.

---

## 3. Como rodar o projeto localmente

Como o HopeMind é construído com um backend em Python (Flask) e usa funcionalidades PWA, você precisará rodar o servidor da API em vez de apenas o Live Server.

**Exemplo de como rodar com servidor local:**

1. Certifique-se de ter o Python instalado.
2. Na pasta do projeto (onde está o `app.py`), crie o ambiente virtual e instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
3. Inicie o servidor Python/Flask rodando o comando:
   ```bash
   python app.py
   ```
4. Acesse no navegador: `http://localhost:3000` (ou a porta que o Flask iniciar). O frontend será servido automaticamente através do próprio backend, e as rotas PWA funcionarão perfeitamente.

---

## 4. Como fazer o deploy

Abaixo está o passo a passo caso você queira fazer o deploy apenas da parte **Frontend** (as telas) da aplicação de forma rápida usando o **Netlify**:

*   **Upload do projeto:**
    1. Acesse o [Netlify Drop](https://app.netlify.com/drop).
    2. Pegue a pasta `frontend` do projeto (onde estão o `index.html`, `manifest.json`, pastas `css` e `views`) no seu computador.
    3. Arraste e solte essa pasta na área indicada na tela do Netlify.
*   **Configuração:**
    1. O Netlify publicará os arquivos visuais na hora e fornecerá um link aleatório.
    2. No painel do Netlify, clique em "Site settings" -> "Domain management".
    3. Clique em "Options" e depois "Edit site name" para colocar um nome amigável (por exemplo, `hopemind-app`).
*   **Link final da aplicação:**
    👉 **[Insira o link gerado pelo Netlify aqui]**

*(Observação técnica: Como o sistema completo depende de Python/Flask e Banco de Dados MySQL, o deploy real da API exigiria o uso de servidores como Render ou Heroku. Porém, para fins de entrega do Front e PWA, as etapas visuais podem ser publicadas no Netlify Drop conforme detalhado acima).*
=======
# hopemind
app de encontros de pacientes inteligentes
>>>>>>> 135491d5e6e90d269ab7d83b4e9aa6b9b79703be
