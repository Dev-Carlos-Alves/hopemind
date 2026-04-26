import pymysql
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "dev_hope")
DB_PASSWORD = os.getenv("DB_PASSWORD", "projetofn")
DB_NAME = "hopemind"

def criar_banco():
    try:
        print("[CRIAR BANCO] Conectando ao MariaDB...")
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            charset='utf8mb4'
        )
        cursor = conn.cursor()
        
        print(f"[CRIAR BANCO] Recriando banco de dados '{DB_NAME}' com a nova arquitetura...")
        cursor.execute(f"DROP DATABASE IF EXISTS {DB_NAME}")
        cursor.execute(f"CREATE DATABASE {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        cursor.execute(f"USE {DB_NAME}")

        queries = [
            """
            CREATE TABLE Usuario (
                ID_Usuario INT AUTO_INCREMENT PRIMARY KEY,
                CPF VARCHAR(14) UNIQUE,
                Nome VARCHAR(255) NOT NULL,
                Email VARCHAR(255) NOT NULL UNIQUE,
                Senha VARCHAR(255) NOT NULL,
                Telefone VARCHAR(20),
                Data_Nascimento DATE,
                Genero VARCHAR(50),
                Tipo_Usuario ENUM('Paciente', 'Psicologo', 'Admin') NOT NULL,
                Data_Cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE Paciente (
                ID_Paciente INT AUTO_INCREMENT PRIMARY KEY,
                ID_Usuario INT NOT NULL,
                Queixa_Principal TEXT,
                FOREIGN KEY (ID_Usuario) REFERENCES Usuario(ID_Usuario) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE Psicologo (
                ID_Psicologo INT AUTO_INCREMENT PRIMARY KEY,
                ID_Usuario INT NOT NULL,
                CRP VARCHAR(50) NOT NULL UNIQUE,
                Especialidade VARCHAR(255),
                Abordagem_Terapeutica VARCHAR(255),
                Biografia TEXT,
                Valor_Sessao DECIMAL(10, 2),
                Link_Contato VARCHAR(255) NOT NULL,
                FOREIGN KEY (ID_Usuario) REFERENCES Usuario(ID_Usuario) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE Sessao (
                ID_Sessao INT AUTO_INCREMENT PRIMARY KEY,
                ID_Psicologo INT NOT NULL,
                ID_Paciente INT NOT NULL,
                Data_Hora DATETIME NOT NULL,
                Avaliacao INT CHECK (Avaliacao BETWEEN 1 AND 5),
                Status ENUM('A', 'C', 'R') DEFAULT 'A',
                FOREIGN KEY (ID_Psicologo) REFERENCES Psicologo(ID_Psicologo) ON DELETE CASCADE,
                FOREIGN KEY (ID_Paciente) REFERENCES Paciente(ID_Paciente) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE Tag (
                ID_Tag INT AUTO_INCREMENT PRIMARY KEY,
                Nome_Tag VARCHAR(100) NOT NULL UNIQUE
            )
            """,
            """
            CREATE TABLE Pergunta_Triagem (
                ID_Pergunta INT AUTO_INCREMENT PRIMARY KEY,
                Texto_Pergunta TEXT NOT NULL,
                Tipo VARCHAR(50) DEFAULT 'multipla_escolha',
                Publico_Alvo ENUM('Ambos', 'Paciente', 'Psicologo') DEFAULT 'Ambos'
            )
            """,
            """
            CREATE TABLE Opcao_Resposta (
                ID_Opcao INT AUTO_INCREMENT PRIMARY KEY,
                ID_Pergunta INT NOT NULL,
                Texto_Opcao VARCHAR(255) NOT NULL,
                ID_Tag INT,
                Peso INT DEFAULT 1,
                FOREIGN KEY (ID_Pergunta) REFERENCES Pergunta_Triagem(ID_Pergunta) ON DELETE CASCADE,
                FOREIGN KEY (ID_Tag) REFERENCES Tag(ID_Tag) ON DELETE SET NULL
            )
            """,
            """
            CREATE TABLE Resposta_Paciente (
                ID_Resposta INT AUTO_INCREMENT PRIMARY KEY,
                ID_Paciente INT NOT NULL,
                ID_Pergunta INT NOT NULL,
                ID_Opcao INT NOT NULL,
                Data_Resposta DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ID_Paciente) REFERENCES Paciente(ID_Paciente) ON DELETE CASCADE,
                FOREIGN KEY (ID_Pergunta) REFERENCES Pergunta_Triagem(ID_Pergunta) ON DELETE CASCADE,
                FOREIGN KEY (ID_Opcao) REFERENCES Opcao_Resposta(ID_Opcao) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE Resposta_Psicologo (
                ID_Resposta INT AUTO_INCREMENT PRIMARY KEY,
                ID_Psicologo INT NOT NULL,
                ID_Pergunta INT NOT NULL,
                ID_Opcao INT NOT NULL,
                Data_Resposta DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ID_Psicologo) REFERENCES Psicologo(ID_Psicologo) ON DELETE CASCADE,
                FOREIGN KEY (ID_Pergunta) REFERENCES Pergunta_Triagem(ID_Pergunta) ON DELETE CASCADE,
                FOREIGN KEY (ID_Opcao) REFERENCES Opcao_Resposta(ID_Opcao) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE Psicologo_Tag (
                ID_Psicologo INT NOT NULL,
                ID_Tag INT NOT NULL,
                PRIMARY KEY (ID_Psicologo, ID_Tag),
                FOREIGN KEY (ID_Psicologo) REFERENCES Psicologo(ID_Psicologo) ON DELETE CASCADE,
                FOREIGN KEY (ID_Tag) REFERENCES Tag(ID_Tag) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE Paciente_Tag (
                ID_Paciente INT NOT NULL,
                ID_Tag INT NOT NULL,
                PRIMARY KEY (ID_Paciente, ID_Tag),
                FOREIGN KEY (ID_Paciente) REFERENCES Paciente(ID_Paciente) ON DELETE CASCADE,
                FOREIGN KEY (ID_Tag) REFERENCES Tag(ID_Tag) ON DELETE CASCADE
            )
            """
        ]

        for q in queries:
            cursor.execute(q)

        print("[CRIAR BANCO] Tabelas criadas com sucesso. Aplicando automações...")
        
        cursor.execute("CREATE INDEX idx_Usuario_Nome ON Usuario (Nome)")

        cursor.execute("DROP FUNCTION IF EXISTS fn_CalcularIdade")
        fn_idade = """
        CREATE FUNCTION fn_CalcularIdade(DataNascimento DATE) RETURNS INT
        DETERMINISTIC
        BEGIN
            DECLARE Idade INT;
            SET Idade = TIMESTAMPDIFF(YEAR, DataNascimento, CURDATE());
            RETURN Idade;
        END
        """
        cursor.execute(fn_idade)

        cursor.execute("DROP TRIGGER IF EXISTS trg_EvitarSessaoPassada_Insert")
        trg_insert = """
        CREATE TRIGGER trg_EvitarSessaoPassada_Insert
        BEFORE INSERT ON Sessao
        FOR EACH ROW
        BEGIN
            IF NEW.Data_Hora < NOW() THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Erro: Nao e permitido agendar sessoes para datas passadas.';
            END IF;
        END;
        """
        cursor.execute(trg_insert)

        cursor.execute("DROP TRIGGER IF EXISTS trg_EvitarSessaoPassada_Update")
        trg_update = """
        CREATE TRIGGER trg_EvitarSessaoPassada_Update
        BEFORE UPDATE ON Sessao
        FOR EACH ROW
        BEGIN
            IF NEW.Data_Hora < NOW() THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Erro: Nao e permitido alterar sessoes para datas passadas.';
            END IF;
        END;
        """
        cursor.execute(trg_update)

        cursor.execute("DROP PROCEDURE IF EXISTS sp_AgendarSessao")
        sp_agendar = """
        CREATE PROCEDURE sp_AgendarSessao(
            IN p_id_Psicologo INT,
            IN p_id_Paciente INT,
            IN p_Data_Hora DATETIME
        )
        BEGIN
            DECLARE EXIT HANDLER FOR SQLEXCEPTION
            BEGIN
                ROLLBACK;
                RESIGNAL;
            END;

            START TRANSACTION;
            
            INSERT INTO Sessao (ID_Psicologo, ID_Paciente, Data_Hora, Status)
            VALUES (p_id_Psicologo, p_id_Paciente, p_Data_Hora, 'A');
            
            COMMIT;
        END;
        """
        cursor.execute(sp_agendar)

        conn.commit()
        print("[CRIAR BANCO] Banco de dados totalmente inicializado com arquitetura legada (MariaDB) com SUCESSO!")

    except pymysql.MySQLError as e:
        print(f"[ERRO NO BANCO] {e}")
    finally:
        if 'conn' in locals() and conn.open:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    criar_banco()
