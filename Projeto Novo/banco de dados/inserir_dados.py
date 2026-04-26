import pymysql
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv(dotenv_path="../.env")

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "dev_hope")
DB_PASSWORD = os.getenv("DB_PASSWORD", "projetofn")
DB_NAME = "hopemind"

def inserir_dados():
    try:
        print("[INSERIR DADOS] Conectando ao banco de dados...")
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset='utf8mb4'
        )
        cursor = conn.cursor()
        
        print("[INSERIR DADOS] Populando as tabelas (Tags, Perguntas, Psicólogo)...")

        # 1. Tags Expandidas
        tags = [
            # Modalidade
            'Online', 'Presencial', 'Híbrido',
            # Gênero
            'Homem', 'Mulher', 'LGBTQIAP+', 'Indiferente',
            # Especialidades/Focos
            'Ansiedade', 'Depressão', 'TCC', 'Relacionamentos', 
            'Estresse', 'Autoconhecimento', 'Burnout', 'TDAH', 
            'Psicanálise', 'Humanista'
        ]
        for tag in tags:
            cursor.execute("INSERT IGNORE INTO Tag (Nome_Tag) VALUES (%s)", (tag,))
        
        cursor.execute("SELECT ID_Tag, Nome_Tag FROM Tag")
        tag_map = {row[1]: row[0] for row in cursor.fetchall()}

        # 2. Perguntas com Publico_Alvo
        cursor.execute("SELECT COUNT(*) FROM Pergunta_Triagem")
        if cursor.fetchone()[0] == 0:
            
            # --- PERGUNTAS PARA AMBOS ---
            cursor.execute("INSERT INTO Pergunta_Triagem (Texto_Pergunta, Tipo, Publico_Alvo) VALUES (%s, %s, %s)", 
                           ('Qual formato de atendimento você prefere/oferece?', 'multipla_escolha', 'Ambos'))
            q_mod_id = cursor.lastrowid
            
            for texto, tag_nome in [('100% Online', 'Online'), ('Presencial em Consultório', 'Presencial'), ('Híbrido (Ambos)', 'Híbrido')]:
                cursor.execute("INSERT INTO Opcao_Resposta (ID_Pergunta, Texto_Opcao, ID_Tag) VALUES (%s, %s, %s)", (q_mod_id, texto, tag_map[tag_nome]))

            # --- PERGUNTAS PARA PACIENTE ---
            cursor.execute("INSERT INTO Pergunta_Triagem (Texto_Pergunta, Tipo, Publico_Alvo) VALUES (%s, %s, %s)", 
                           ('Você tem alguma preferência sobre o perfil do profissional?', 'multipla_escolha', 'Paciente'))
            q_pref_pac = cursor.lastrowid
            
            for texto, tag_nome in [('Prefiro Psicóloga (Mulher)', 'Mulher'), ('Prefiro Psicólogo (Homem)', 'Homem'), ('Profissionais LGBTQIAP+ Friendly', 'LGBTQIAP+'), ('Não tenho preferência', 'Indiferente')]:
                cursor.execute("INSERT INTO Opcao_Resposta (ID_Pergunta, Texto_Opcao, ID_Tag) VALUES (%s, %s, %s)", (q_pref_pac, texto, tag_map[tag_nome]))

            cursor.execute("INSERT INTO Pergunta_Triagem (Texto_Pergunta, Tipo, Publico_Alvo) VALUES (%s, %s, %s)", 
                           ('Qual é o foco principal que você deseja trabalhar na terapia?', 'multipla_escolha', 'Paciente'))
            q_foco_pac = cursor.lastrowid
            
            for texto, tag_nome in [
                ('Tenho me sentido muito ansioso(a) ou com medo constante.', 'Ansiedade'),
                ('Sinto tristeza profunda e falta de energia.', 'Depressão'),
                ('Esgotamento extremo relacionado ao trabalho.', 'Burnout'),
                ('Dificuldade de foco e atenção no dia a dia.', 'TDAH'),
                ('Problemas no relacionamento amoroso ou familiar.', 'Relacionamentos')
            ]:
                cursor.execute("INSERT INTO Opcao_Resposta (ID_Pergunta, Texto_Opcao, ID_Tag) VALUES (%s, %s, %s)", (q_foco_pac, texto, tag_map[tag_nome]))

            # --- PERGUNTAS PARA PSICOLOGO ---
            cursor.execute("INSERT INTO Pergunta_Triagem (Texto_Pergunta, Tipo, Publico_Alvo) VALUES (%s, %s, %s)", 
                           ('Como você se identifica para o filtro de pacientes?', 'multipla_escolha', 'Psicologo'))
            q_pref_psi = cursor.lastrowid
            
            for texto, tag_nome in [('Mulher', 'Mulher'), ('Homem', 'Homem'), ('LGBTQIAP+ Friendly', 'LGBTQIAP+'), ('Não desejo especificar', 'Indiferente')]:
                cursor.execute("INSERT INTO Opcao_Resposta (ID_Pergunta, Texto_Opcao, ID_Tag) VALUES (%s, %s, %s)", (q_pref_psi, texto, tag_map[tag_nome]))

            cursor.execute("INSERT INTO Pergunta_Triagem (Texto_Pergunta, Tipo, Publico_Alvo) VALUES (%s, %s, %s)", 
                           ('Quais são os principais casos que você atende com expertise?', 'multipla_escolha', 'Psicologo'))
            q_foco_psi = cursor.lastrowid
            
            for texto, tag_nome in [
                ('Transtornos de Ansiedade e Pânico', 'Ansiedade'),
                ('Depressão e Transtornos de Humor', 'Depressão'),
                ('Burnout e Estresse Ocupacional', 'Burnout'),
                ('TDAH e Neurodivergências', 'TDAH'),
                ('Terapia de Casais e Família', 'Relacionamentos')
            ]:
                cursor.execute("INSERT INTO Opcao_Resposta (ID_Pergunta, Texto_Opcao, ID_Tag) VALUES (%s, %s, %s)", (q_foco_psi, texto, tag_map[tag_nome]))

        # 3. Psicólogo (Admin Test)
        cursor.execute("SELECT COUNT(*) FROM Usuario WHERE Email = 'rafael@hopemind.com'")
        if cursor.fetchone()[0] == 0:
            hashed_senha = generate_password_hash('123456', method='pbkdf2:sha256')
            cursor.execute("INSERT INTO Usuario (CPF, Nome, Email, Senha, Telefone, Data_Nascimento, Genero, Tipo_Usuario) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", 
                           ('12345678900', 'Dr. Rafael Silva', 'rafael@hopemind.com', hashed_senha, '(11) 99999-9999', '1985-10-20', 'Homem', 'Psicologo'))
            u_id = cursor.lastrowid

            bio = "Especialista em TCC com foco em ansiedade. Experiência de mais de 10 anos auxiliando pacientes a superar medos."
            cursor.execute("INSERT INTO Psicologo (ID_Usuario, CRP, Especialidade, Abordagem_Terapeutica, Biografia, Valor_Sessao, Link_Contato) VALUES (%s, %s, %s, %s, %s, %s, %s)", 
                           (u_id, '123456', 'Psicologia Cognitivo-Comportamental', 'TCC', bio, 150.00, '5511999999999'))
            psi_id = cursor.lastrowid

            cursor.execute("INSERT IGNORE INTO Psicologo_Tag (ID_Psicologo, ID_Tag) VALUES (%s, %s)", (psi_id, tag_map['Ansiedade']))
            cursor.execute("INSERT IGNORE INTO Psicologo_Tag (ID_Psicologo, ID_Tag) VALUES (%s, %s)", (psi_id, tag_map['TCC']))
            cursor.execute("INSERT IGNORE INTO Psicologo_Tag (ID_Psicologo, ID_Tag) VALUES (%s, %s)", (psi_id, tag_map['Homem']))
            cursor.execute("INSERT IGNORE INTO Psicologo_Tag (ID_Psicologo, ID_Tag) VALUES (%s, %s)", (psi_id, tag_map['Online']))

        conn.commit()
        print("[INSERIR DADOS] Tags e Perguntas Robustas foram inseridas com SUCESSO!")

    except pymysql.MySQLError as e:
        print(f"[ERRO NO BANCO] {e}")
    finally:
        if 'conn' in locals() and conn.open:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    inserir_dados()
