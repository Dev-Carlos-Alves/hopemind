import pymysql
import os
import random
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv(dotenv_path="../.env")

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "dev_hope")
DB_PASSWORD = os.getenv("DB_PASSWORD", "projetofn")
DB_NAME = "hopemind"

def gerar_pacientes():
    try:
        print("[GERADOR PACIENTES] Conectando ao banco de dados...")
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset='utf8mb4'
        )
        cursor = conn.cursor()

        cursor.execute("SELECT ID_Tag, Nome_Tag FROM Tag")
        tag_map = {row[1]: row[0] for row in cursor.fetchall()}

        cursor.execute("""
            SELECT o.ID_Pergunta, o.ID_Opcao, o.ID_Tag 
            FROM Opcao_Resposta o
            JOIN Pergunta_Triagem p ON o.ID_Pergunta = p.ID_Pergunta
            WHERE p.Publico_Alvo IN ('Ambos', 'Paciente')
        """)
        opcoes_db = cursor.fetchall()

        tags_modalidade = ['Online', 'Presencial', 'Híbrido']
        tags_genero = ['Homem', 'Mulher', 'LGBTQIAP+', 'Indiferente']
        tags_focos = ['Ansiedade', 'Depressão', 'TCC', 'Relacionamentos', 'Estresse', 'Autoconhecimento', 'Burnout', 'TDAH', 'Psicanálise', 'Humanista']

        nomes = ["Pedro Silva", "Maria Eduarda", "Thiago Costa", "Camila Martins", "Jorge Ferreira", "Luiza Gomes", "Rafael Sousa", "Amanda Torres", "Felipe Almeida", "Letícia Cardoso", "Bruno Rocha", "Isabela Nogueira", "Diego Teixeira", "Patrícia Dias", "Marcelo Vieira"]

        print("[GERADOR PACIENTES] Injetando 15 Pacientes Fictícios...")

        for i in range(1, 16):
            nome = random.choice(nomes) + f" {i}"
            email = f"paciente{i}@teste.com"
            senha = "123"
            hashed_senha = generate_password_hash(senha, method='pbkdf2:sha256')
            cpf = f"111222333{i:02d}"
            telefone = f"1198888{i:04d}"
            
            nascimento = f"199{random.randint(0, 9)}-0{random.randint(1, 9)}-15"
            gen_usuario = random.choice(tags_genero)
            
            cursor.execute("INSERT INTO Usuario (CPF, Nome, Email, Senha, Telefone, Data_Nascimento, Genero, Tipo_Usuario) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", 
                           (cpf, nome, email, hashed_senha, telefone, nascimento, gen_usuario, 'Paciente'))
            u_id = cursor.lastrowid
            
            queixa = "Sintomas de ansiedade e dificuldade de foco no trabalho."
            
            cursor.execute("INSERT INTO Paciente (ID_Usuario, Queixa_Principal) VALUES (%s, %s)", 
                           (u_id, queixa))
            pac_id = cursor.lastrowid
            
            mod = random.choice(tags_modalidade)
            gen = random.choice(tags_genero)
            foco = random.choice(tags_focos)
            
            pac_tags = [mod, gen, foco]
            pac_tag_ids = [tag_map[t] for t in pac_tags if t in tag_map]
            
            for tag_id in pac_tag_ids:
                cursor.execute("INSERT IGNORE INTO Paciente_Tag (ID_Paciente, ID_Tag) VALUES (%s, %s)", (pac_id, tag_id))
            
            for q_id, opt_id, t_id in opcoes_db:
                if t_id in pac_tag_ids:
                    cursor.execute("INSERT INTO Resposta_Paciente (ID_Paciente, ID_Pergunta, ID_Opcao) VALUES (%s, %s, %s)", 
                                   (pac_id, q_id, opt_id))
                    
        conn.commit()
        print("[GERADOR PACIENTES] 15 Pacientes inseridos, tagueados e com triagem pronta!")

    except pymysql.MySQLError as e:
        print(f"[ERRO NO BANCO] {e}")
    finally:
        if 'conn' in locals() and conn.open:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    gerar_pacientes()
