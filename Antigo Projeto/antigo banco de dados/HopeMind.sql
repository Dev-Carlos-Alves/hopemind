
--CREATE DATABASE HopeMind; 
--USE HopeMind;

-- Criacao das tabelas com base no nosso Modelo Logico

--CREATE TABLE Usuario (  id_Usuario      INTEGER IDENTITY (1000,1) PRIMARY KEY,
--                        CPF             CHAR(11) NOT NULL UNIQUE,
--                        Nome            VARCHAR(200) NOT NULL,
--                        Tipo_Usuario    CHAR(2) NOT NULL,
--                        Senha           VARCHAR(255) NOT NULL,
--                        Nascimento      DATE NOT NULL,
--                        Telefone        CHAR(15),
--                        Email           VARCHAR(150) NOT NULL UNIQUE );

--CREATE TABLE Paciente ( id_Paciente     INTEGER IDENTITY (1000,1) PRIMARY KEY,
--                        id_Usuario      INT NOT NULL,
--                        Numero_SUS      VARCHAR(15),
--                        Queixa          VARCHAR(240),                  
--                        CONSTRAINT fk_paciente_usuario FOREIGN KEY (id_Usuario) 
--                        REFERENCES Usuario (id_Usuario) ON DELETE CASCADE );

--CREATE TABLE Psicologo  ( id_Psicologo          INTEGER IDENTITY (1000,1) PRIMARY KEY,
--                          id_Usuario            INT NOT NULL,
--                          CRP                   CHAR(7) NOT NULL UNIQUE,
--                          Data_Registro         DATE NOT NULL,
--                          Biografia             VARCHAR(500),
--                          Abordagem_Terapeutica VARCHAR(240),
--                          Status_Validacao      CHAR(1) DEFAULT 'P',
--                          CONSTRAINT fk_psicologo_usuario FOREIGN KEY (id_Usuario) 
--                          REFERENCES Usuario (id_Usuario) ON DELETE CASCADE );

--CREATE TABLE Mensagem_Chat ( id_Mensagem            INTEGER IDENTITY (1000,1) PRIMARY KEY,
--                             id_Remetente           INT NOT NULL,
--                             id_Destinatario        INT NOT NULL,
--                             Data_Hora              DATETIME DEFAULT CURRENT_TIMESTAMP,
--                             Mensagem           VARCHAR(240) NOT NULL,
--                             CONSTRAINT fk_msg_remetente FOREIGN KEY (id_Remetente) REFERENCES Usuario(id_Usuario),
--                             CONSTRAINT fk_msg_destinatario FOREIGN KEY (id_Destinatario) REFERENCES Usuario(id_Usuario) );

--CREATE TABLE Sessao (   id_Sessao                     INTEGER IDENTITY (1000,1) PRIMARY KEY,
--                        id_Psicologo                  INT NOT NULL,
--                        id_Paciente                   INT NOT NULL,
--                        Data_Hora                     DATETIME NOT NULL,
--                        Avaliacao                     INT,
--                        Status CHAR(1) DEFAULT 'A',
--                        CONSTRAINT fk_sessao_psico FOREIGN KEY (id_Psicologo) REFERENCES Psicologo(id_Psicologo),
--                        CONSTRAINT fk_sessao_paciente FOREIGN KEY (id_Paciente) REFERENCES Paciente(id_Paciente) );

--CREATE TABLE Triagem_IA ( id_Triagem    INTEGER IDENTITY (1000,1) PRIMARY KEY,
--                          Data_Hora     DATETIME DEFAULT CURRENT_TIMESTAMP,
--                          Resultado     VARCHAR(250)                        );

--CREATE TABLE Questao_IA ( id_Questao      INTEGER IDENTITY (1000,1) PRIMARY KEY,
--                          id_Triagem      INT NOT NULL,
--                          Questao         VARCHAR(250) NOT NULL,
--                          CONSTRAINT fk_questao_triagem FOREIGN KEY (id_Triagem) REFERENCES Triagem_IA(id_Triagem) );

--CREATE TABLE Responde ( id_Paciente         INT NOT NULL,
--                        id_Questao          INT NOT NULL,
--                        Resposta            VARCHAR(250) NOT NULL,
--                        PRIMARY KEY (id_Paciente, id_Questao),
--                        CONSTRAINT fk_resp_paciente FOREIGN KEY (id_Paciente) REFERENCES Paciente(id_Paciente),
--                        CONSTRAINT fk_resp_questao FOREIGN KEY (id_Questao) REFERENCES Questao_IA(id_Questao)  );

-- Inserindo dados ficticios para analise do Banco de Dados

--INSERT INTO Usuario (CPF, Nome, Tipo_Usuario, Senha, Nascimento, Telefone, Email) VALUES 
--					('11111111111', 'Ana Clara Silva', 'PA', 'senhaHash1', '10/05/1995', '(11) 99999-1111', 'ana.clara@email.com'),
--					('22222222222', 'Bruno Souza', 'PA', 'senhaHash2', '20/08/1988', '(21) 98888-2222', 'bruno.souza@email.com'),
--					('33333333333', 'Carla Dias', 'PA', 'senhaHash3', '15/01/2000', '(31) 97777-3333', 'carla.dias@email.com'),
--					('44444444444', 'Dr. Davi Mendes', 'PS', 'senhaHash4', '25/03/1980', '(11) 96666-4444', 'davi.psi@email.com'),
--					('55555555555', 'Dra. Elena Costa', 'PS', 'senhaHash5', '30/11/1975', '(41) 95555-5555', 'elena.psi@email.com'),
--					('66666666666', 'Dr. Fabio Lima', 'PS', 'senhaHash6', '07/07/1982', '(51) 94444-6666', 'fabio.psi@email.com');


--SELECT * FROM Usuario;

--INSERT INTO Paciente (id_Usuario, Numero_SUS, Queixa) VALUES 
--					 (1000, '898000111222001', 'Ansiedade excessiva e dificuldade para dormir.'),
--					 (1001, '754000222333002', 'Sentimento de tristeza constante e falta de ânimo.'),
--					 (1002, '123000444555003', 'Estresse pós-traumático devido a acidente.');

--SELECT * FROM Paciente;

--INSERT INTO Psicologo (id_Usuario, CRP, Data_Registro, Biografia, Abordagem_Terapeutica, Status_Validacao) VALUES 
--					  (1003, '06/1234', '20/02/2010', 'Especialista em TCC com foco em ansiedade.', 'Terapia Cognitivo-Comportamental', 'A'),
--					  (1004, '08/5678', '15/06/2005', 'Foco em psicanálise e desenvolvimento humano.', 'Psicanálise', 'A'),
--					  (1005, '12/9012', '10/09/2012', 'Experiência com psicologia hospitalar e luto.', 'Humanista', 'A');


--SELECT * FROM Psicologo;


--INSERT INTO Mensagem_Chat (id_Remetente, id_Destinatario, Mensagem, Data_Hora) VALUES 
--						  (1000, 1003, 'Olá Dr. Davi, gostaria de saber se tem horário para amanhã.', '28/11/2025 12:00:00'),
--						  (1003, 1000, 'Olá Ana! Tenho sim, às 14h. Pode ser?', '28/11/2025 12:05:00'),
--						  (1000, 1003, 'Pode sim, confirmado. Obrigada!', '28/11/2025 12:08:00'),
--						  (1001, 1004, 'Dra. Elena, precisei remarcar nossa sessão.', '29/11/2025 12:10:00');


--SELECT * FROM Mensagem_Chat;


--INSERT INTO Sessao (id_Psicologo, id_Paciente, Data_Hora, Avaliacao, Status) VALUES 
--				   (1000, 1000, '01/12/2025 14:30:00',NULL, 'A'), 
--				   (1001, 1001, '01/12/2025 15:30:00', 5, 'C'),   
--				   (1002, 1002, '01/12/2025 16:30:00', NULL, 'A'); 

--SELECT * FROM Sessao;

--INSERT INTO Triagem_IA  (Resultado, Data_Hora) VALUES 
--						('Protocolo Ansiedade Leve', '2025-10-01 10:00:00'),
--						('Protocolo Depressão Moderada', '2025-10-05 11:30:00'),
--						('Protocolo Estresse Ocupacional', '2025-10-10 09:00:00');

--SELECT * FROM Triagem_IA;

--INSERT INTO Questao_IA  (id_Triagem, Questao) VALUES 
--						(1000, 'Com que frequência você se sente nervoso ou ansioso?'),
--						(1000, 'Você tem tido dificuldades para dormir recentemente?'),
--						(1001, 'Você sente pouco interesse ou prazer em fazer as coisas?');

--SELECT * FROM Questao_IA;

--INSERT INTO Responde	(id_Paciente, id_Questao, Resposta) VALUES 
--						(1000, 1000, 'Quase todos os dias'),
--						(1000, 1001, 'Sim, demoro a pegar no sono'),
--						(1001, 1002, 'Vários dias na semana');

--SELECT * FROM Responde;


-- Consultas

-- 1. Relatório Detalhado de Sessões (Quem atendeu quem?)

--SELECT 
--    S.Data_Hora AS Data_Agendada,
--    S.Status,
--    UP.Nome AS Nome_Paciente,    
--    UPSI.Nome AS Nome_Psicologo,
--    PSI.Abordagem_Terapeutica

--FROM Sessao AS S
--INNER JOIN Paciente AS P 
--    ON S.id_Paciente = P.id_Paciente
--INNER JOIN Usuario AS UP 
--    ON P.id_Usuario = UP.id_Usuario
--INNER JOIN Psicologo AS PSI 
--    ON S.id_Psicologo = PSI.id_Psicologo
--INNER JOIN Usuario AS UPSI 
--    ON PSI.id_Usuario = UPSI.id_Usuario;

--2. Relatório de Desempenho dos Psicólogos

--USE HopeMind;
--GO

--SELECT 
--    U.Nome AS Nome_Psicologo,
--    COUNT(S.id_Sessao) AS Total_Sessoes,
--    AVG(CAST(S.Avaliacao AS DECIMAL(10,2))) AS Media_Avaliacao, -- Ajuste para média com vírgula
--    MAX(S.Data_Hora) AS Ultima_Sessao

--FROM Psicologo AS P
--INNER JOIN Usuario AS U 
--    ON P.id_Usuario = U.id_Usuario
--INNER JOIN Sessao AS S 
--    ON P.id_Psicologo = S.id_Psicologo
--GROUP BY U.Nome;
--GO

--3. Histórico e Pontuação de Engajamento do Paciente

--SELECT 
--    U.Nome AS Nome_Paciente,
--    MIN(S.Data_Hora) AS Primeira_Consulta,
--    SUM(S.Avaliacao) AS Soma_Pontos_Doados

--FROM Paciente AS P
--INNER JOIN Usuario AS U 
--    ON P.id_Usuario = U.id_Usuario
--INNER JOIN Sessao AS S 
--    ON P.id_Paciente = S.id_Paciente
--GROUP BY U.Nome;

--Rotinas de Automação 

--1. TRIGGER


--CREATE TRIGGER trg_EvitarSessaoPassada
--ON Sessao
--FOR INSERT, UPDATE
--AS
--BEGIN
--    -- Verifica se a data inserida é menor que a data atual (GETDATE)
--    IF EXISTS (SELECT 1 FROM inserted WHERE Data_Hora < GETDATE())
--    BEGIN
--        -- Cancela a transação
--        ROLLBACK TRANSACTION;
--        -- Emite uma mensagem de erro
--        RAISERROR ('Erro: Não é permitido agendar sessões para datas passadas.', 16, 1);
--    END
--END;
--GO

--2. FUNCTION

--CREATE FUNCTION fn_CalcularIdade (@DataNascimento DATE)
--RETURNS INT
--AS
--BEGIN
--    DECLARE @Idade INT;
    
--    SET @Idade = DATEDIFF(YEAR, @DataNascimento, GETDATE()) - 
--                 CASE 
--                     WHEN DATEADD(YEAR, DATEDIFF(YEAR, @DataNascimento, GETDATE()), @DataNascimento) > GETDATE() 
--                     THEN 1 
--                     ELSE 0 
--                 END;

--    RETURN @Idade;
--END;
--GO

--SELECT Nome, dbo.fn_CalcularIdade(Nascimento) AS Idade_Atual 
--FROM Usuario;
--GO

--3. STORED PROCEDURE

--CREATE PROCEDURE sp_AgendarSessao
--    @id_Psicologo INT,
--    @id_Paciente INT,
--    @Data_Hora DATETIME
--AS
--BEGIN
--    -- Inicia uma transação segura
--    BEGIN TRANSACTION;

--    BEGIN TRY
--        -- Tenta inserir a sessão
--        INSERT INTO Sessao (id_Psicologo, id_Paciente, Data_Hora, Status)
--        VALUES (@id_Psicologo, @id_Paciente, @Data_Hora, 'A');

--        -- Confirma a gravação
--        COMMIT TRANSACTION;
--        PRINT 'Sessão agendada com sucesso!';
--    END TRY
--    BEGIN CATCH
--        -- Se der erro (ex: Trigger de data passada), desfaz tudo
--        ROLLBACK TRANSACTION;
--        PRINT 'Erro ao agendar sessão. Verifique os dados.';
--    END CATCH
--END;
--GO

--4. INDEX

----Criação do Índice de Performance no Nome do Usuário
--CREATE NONCLUSTERED INDEX idx_Usuario_Nome
--ON Usuario (Nome);
--GO