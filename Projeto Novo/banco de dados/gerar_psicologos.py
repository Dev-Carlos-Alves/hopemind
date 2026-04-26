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

def gerar_psicologos():
    try:
        print("[GERADOR] Conectando ao banco de dados...")
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
            WHERE p.Publico_Alvo IN ('Ambos', 'Psicologo')
        """)
        opcoes_db = cursor.fetchall()

        tags_modalidade = ['Online', 'Presencial', 'Híbrido']
        tags_genero = ['Homem', 'Mulher', 'LGBTQIAP+', 'Indiferente']
        tags_focos = ['Ansiedade', 'Depressão', 'TCC', 'Relacionamentos', 'Estresse', 'Autoconhecimento', 'Burnout', 'TDAH', 'Psicanálise', 'Humanista']

        nomes_homens = ["Dr. Carlos Almeida", "Dr. Marcos Silva", "Dr. João Pereira", "Dr. Felipe Costa", "Dr. Rodrigo Santos", "Dr. Lucas Mendes", "Dr. Fernando Oliveira"]
        nomes_mulheres = ["Dra. Ana Clara", "Dra. Beatriz Souza", "Dra. Carolina Dias", "Dra. Mariana Lima", "Dra. Juliana Alves", "Dra. Fernanda Rocha", "Dra. Camila Ribeiro"]

        print("[GERADOR] Injetando 30 Psicólogos Fictícios...")

        for i in range(1, 31):
            is_mulher = random.choice([True, False])
            nome = random.choice(nomes_mulheres) if is_mulher else random.choice(nomes_homens)
            nome += f" {i}" 
            
            email = f"psi{i}@hopemind.com"
            senha = "123"
            hashed_senha = generate_password_hash(senha, method='pbkdf2:sha256')
            cpf = f"00000000{i:03d}"
            telefone = f"1199999{i:04d}"
            nascimento = f"19{random.randint(60, 95)}-0{random.randint(1, 9)}-15"
            gen_usuario = 'Mulher' if is_mulher else 'Homem'
            
            cursor.execute("INSERT INTO Usuario (CPF, Nome, Email, Senha, Telefone, Data_Nascimento, Genero, Tipo_Usuario) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", 
                           (cpf, nome, email, hashed_senha, telefone, nascimento, gen_usuario, 'Psicologo'))
            u_id = cursor.lastrowid
            
            crp = f"1234{i:02d}"
            especialidade = random.choice(["Psicologia Clínica", "Neuropsicologia", "Psicologia Organizacional"])
            abordagem = random.choice(["TCC", "Psicanálise", "Humanista", "Gestalt"])
            bio = f"Profissional com vasta experiência em {abordagem} e foco em acolhimento humanizado."
            valor = random.choice([100.0, 150.0, 200.0, 250.0, 300.0])
            link = f"551199999{i:04d}"
            
            cursor.execute("INSERT INTO Psicologo (ID_Usuario, CRP, Especialidade, Abordagem_Terapeutica, Biografia, Valor_Sessao, Link_Contato) VALUES (%s, %s, %s, %s, %s, %s, %s)", 
                           (u_id, crp, especialidade, abordagem, bio, valor, link))
            psi_id = cursor.lastrowid
            
            mod = random.choice(tags_modalidade)
            gen = 'Mulher' if is_mulher else 'Homem'
            focos = random.sample(tags_focos, random.randint(2, 4))
            
            psi_tags = [mod, gen] + focos
            psi_tag_ids = [tag_map[t] for t in psi_tags if t in tag_map]
            
            for tag_id in psi_tag_ids:
                cursor.execute("INSERT IGNORE INTO Psicologo_Tag (ID_Psicologo, ID_Tag) VALUES (%s, %s)", (psi_id, tag_id))
            
            # Preencher Respostas da Triagem
            for q_id, opt_id, t_id in opcoes_db:
                if t_id in psi_tag_ids:
                    cursor.execute("INSERT INTO Resposta_Psicologo (ID_Psicologo, ID_Pergunta, ID_Opcao) VALUES (%s, %s, %s)", 
                                   (psi_id, q_id, opt_id))
                    
        conn.commit()
        print("[GERADOR] 30 Psicólogos inseridos e tagueados com SUCESSO!")

    except pymysql.MySQLError as e:
        print(f"[ERRO NO BANCO] {e}")
    finally:
        if 'conn' in locals() and conn.open:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    gerar_psicologos()
