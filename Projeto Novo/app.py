import os
import pymysql
import jwt
import datetime
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'super_secret_hopemind_key_2026')

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = "hopemind"

def get_db_connection():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        
        if not token:
            return jsonify({'error': 'Token de autenticação é obrigatório!'}), 401
            
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data['user_id']
        except Exception as e:
            return jsonify({'error': 'Token inválido ou expirado!'}), 401
            
        return f(current_user_id, *args, **kwargs)
    return decorated

# --------- ARQUIVOS ESTÁTICOS (FRONTEND) ---------
@app.route('/')
def index():
    return app.send_static_file('views/login.html')

@app.route('/<path:path>')
def static_files(path):
    return app.send_static_file(path)


# --------- ROTAS DA API ---------

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    
    # Global
    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')
    tipo = data.get('tipo_usuario')
    cpf = data.get('cpf')
    telefone = data.get('telefone')
    data_nascimento = data.get('data_nascimento')
    genero = data.get('genero')
    
    # Psicologo
    crp = data.get('crp')
    link_contato = data.get('link_contato')
    especialidade = data.get('especialidade')
    abordagem = data.get('abordagem_terapeutica')
    biografia = data.get('biografia')
    valor_sessao = data.get('valor_sessao')
    
    if not all([nome, email, senha, tipo, cpf, telefone, data_nascimento, genero]):
        return jsonify({"error": "Preencha todos os campos obrigatórios globais."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Insert Usuario with hashed password
            hashed_password = generate_password_hash(senha, method='pbkdf2:sha256')
            cursor.execute("INSERT INTO Usuario (Nome, Email, Senha, Tipo_Usuario, CPF, Telefone, Data_Nascimento, Genero) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", 
                           (nome, email, hashed_password, tipo, cpf, telefone, data_nascimento, genero))
            user_id = cursor.lastrowid
            
            if tipo == 'Paciente':
                queixa_principal = data.get('queixa_principal')
                cursor.execute("INSERT INTO Paciente (ID_Usuario, Queixa_Principal) VALUES (%s, %s)", 
                               (user_id, queixa_principal))
            elif tipo == 'Psicologo':
                valor = valor_sessao if valor_sessao else 0.00
                cursor.execute("INSERT INTO Psicologo (ID_Usuario, CRP, Link_Contato, Especialidade, Abordagem_Terapeutica, Biografia, Valor_Sessao) VALUES (%s, %s, %s, %s, %s, %s, %s)", 
                               (user_id, crp, link_contato, especialidade, abordagem, biografia, valor))
        conn.commit()
        return jsonify({"message": "Registrado com sucesso", "idUsuario": user_id}), 201
    except pymysql.err.IntegrityError:
        return jsonify({"error": "E-mail ou CPF já cadastrados."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    senha = data.get('senha')
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM Usuario WHERE Email = %s", (email,))
            user = cursor.fetchone()
            
            if not user or not check_password_hash(user['Senha'], senha):
                return jsonify({"error": "Credenciais inválidas."}), 401
            
            role_data = {}
            has_triage = False
            if user['Tipo_Usuario'] == 'Paciente':
                cursor.execute("SELECT * FROM Paciente WHERE ID_Usuario = %s", (user['ID_Usuario'],))
                role_data = cursor.fetchone() or {}
                if role_data:
                    cursor.execute("SELECT 1 FROM Resposta_Paciente WHERE ID_Paciente = %s LIMIT 1", (role_data['ID_Paciente'],))
                    if cursor.fetchone():
                        has_triage = True
            elif user['Tipo_Usuario'] == 'Psicologo':
                cursor.execute("SELECT * FROM Psicologo WHERE ID_Usuario = %s", (user['ID_Usuario'],))
                role_data = cursor.fetchone() or {}
                if role_data:
                    cursor.execute("SELECT 1 FROM Resposta_Psicologo WHERE ID_Psicologo = %s LIMIT 1", (role_data['ID_Psicologo'],))
                    if cursor.fetchone():
                        has_triage = True
            
            user_dict = {
                "idUsuario": user['ID_Usuario'],
                "ID_Paciente": role_data.get('ID_Paciente'),
                "ID_Psicologo": role_data.get('ID_Psicologo'),
                "nome": user['Nome'],
                "tipo": user['Tipo_Usuario'],
                "has_triage": has_triage
            }
            
            # Generate JWT
            token = jwt.encode({
                'user_id': user['ID_Usuario'],
                'role': user['Tipo_Usuario'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm="HS256")
            
            return jsonify({"message": "Login realizado", "token": token, "user": user_dict})
    finally:
        conn.close()

@app.route('/api/triage/questions', methods=['GET'])
@token_required
def get_questions(current_user_id):
    tipo = request.args.get('tipo', 'Ambos')
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if tipo == 'Ambos':
                cursor.execute("SELECT * FROM Pergunta_Triagem")
            else:
                cursor.execute("SELECT * FROM Pergunta_Triagem WHERE Publico_Alvo = 'Ambos' OR Publico_Alvo = %s", (tipo,))
            
            perguntas = cursor.fetchall()
            
            cursor.execute("SELECT * FROM Opcao_Resposta")
            opcoes = cursor.fetchall()
            
            for p in perguntas:
                p['opcoes'] = [o for o in opcoes if o['ID_Pergunta'] == p['ID_Pergunta']]
                
            return jsonify(perguntas)
    finally:
        conn.close()

@app.route('/api/triage/submit', methods=['POST'])
@token_required
def submit_triage(current_user_id):
    data = request.json
    id_especifico = data.get('idEspecifico') # pode ser ID_Paciente ou ID_Psicologo
    tipo = data.get('tipo') # 'Paciente' ou 'Psicologo'
    respostas = data.get('respostas')
    
    if not id_especifico or not respostas or not tipo:
        return jsonify({"error": "Dados inválidos."}), 400
        
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            needed_tags = set()
            for r in respostas:
                # Save answer log
                if tipo == 'Paciente':
                    cursor.execute("INSERT INTO Resposta_Paciente (ID_Paciente, ID_Pergunta, ID_Opcao) VALUES (%s, %s, %s)",
                                   (id_especifico, r['idPergunta'], r['idOpcao']))
                elif tipo == 'Psicologo':
                    cursor.execute("INSERT INTO Resposta_Psicologo (ID_Psicologo, ID_Pergunta, ID_Opcao) VALUES (%s, %s, %s)",
                                   (id_especifico, r['idPergunta'], r['idOpcao']))
                
                cursor.execute("SELECT ID_Tag FROM Opcao_Resposta WHERE ID_Opcao = %s", (r['idOpcao'],))
                opt = cursor.fetchone()
                if opt and opt['ID_Tag']:
                    needed_tags.add(opt['ID_Tag'])
                    
            for tag_id in needed_tags:
                if tipo == 'Paciente':
                    cursor.execute("INSERT IGNORE INTO Paciente_Tag (ID_Paciente, ID_Tag) VALUES (%s, %s)", (id_especifico, tag_id))
                elif tipo == 'Psicologo':
                    cursor.execute("INSERT IGNORE INTO Psicologo_Tag (ID_Psicologo, ID_Tag) VALUES (%s, %s)", (id_especifico, tag_id))
                
        conn.commit()
        return jsonify({"message": "Triagem enviada.", "tags": list(needed_tags)})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/matches/<int:paciente_id>', methods=['GET'])
@token_required
def get_matches(current_user_id, paciente_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT ID_Tag FROM Paciente_Tag WHERE ID_Paciente = %s", (paciente_id,))
            p_tags = [row['ID_Tag'] for row in cursor.fetchall()]
            
            if not p_tags:
                return jsonify([])
                
            cursor.execute("""
                SELECT p.ID_Psicologo as idPsicologo, u.Nome as nome, p.Especialidade as especialidade, 
                       p.CRP as crp, p.Link_Contato as linkContato 
                FROM Psicologo p 
                JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
            """)
            psis = cursor.fetchall()
            
            cursor.execute("SELECT * FROM Psicologo_Tag")
            psi_tags_rows = cursor.fetchall()
            
            psi_tags_map = {}
            for row in psi_tags_rows:
                if row['ID_Psicologo'] not in psi_tags_map:
                    psi_tags_map[row['ID_Psicologo']] = []
                psi_tags_map[row['ID_Psicologo']].append(row['ID_Tag'])
                
            matches = []
            total_needs = len(p_tags)
            
            for psi in psis:
                p_tags_set = set(p_tags)
                psi_tags_set = set(psi_tags_map.get(psi['idPsicologo'], []))
                
                intersection = p_tags_set.intersection(psi_tags_set)
                match_pct = (len(intersection) / total_needs) * 100
                
                psi['matchPercentage'] = round(match_pct)
                psi['foto'] = 'assets/images/perfil-rafael.png'
                matches.append(psi)
                
            matches.sort(key=lambda x: x['matchPercentage'], reverse=True)
            return jsonify(matches)
            
    finally:
        conn.close()

@app.route('/api/sessoes/agendar', methods=['POST'])
@token_required
def agendar_sessao(current_user_id):
    data = request.json
    id_psi = data.get('idPsicologo')
    id_pac = data.get('idPaciente')
    data_hora = data.get('dataHora')
    
    if not all([id_psi, id_pac, data_hora]):
        return jsonify({"error": "Dados inválidos."}), 400
        
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Chama a stored procedure criada no banco
            cursor.execute("CALL sp_AgendarSessao(%s, %s, %s)", (id_psi, id_pac, data_hora))
        conn.commit()
        return jsonify({"message": "Agendado com sucesso"}), 201
    except pymysql.MySQLError as e:
        conn.rollback()
        # Tratamento do Trigger de data passada que lança código 45000
        if 'Nao e permitido' in str(e):
            return jsonify({"error": "Não é permitido agendar sessões no passado."}), 400
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=True)
