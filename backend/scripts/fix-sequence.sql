DO $$
DECLARE
    rec RECORD;
    table_name TEXT;
    seq_name TEXT;  -- Nome da sequence
    max_id BIGINT;
    setval_query TEXT;
BEGIN
    -- Loop através de todas as sequences no schema public
    FOR rec IN
        SELECT sequence_schema,
               sequence_name AS seq_name,
               REPLACE(sequence_name,  '_id_seq', '') AS table_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    LOOP
        -- Atribuir valores
        seq_name := rec.seq_name;
        table_name := rec.table_name;

        -- Bloco para tratar erros ao tentar acessar a tabela ou a coluna 'id'
        BEGIN
            -- Tenta obter o valor máximo do campo 'id'
            EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM %I.%I', rec.sequence_schema, table_name) INTO max_id;

            -- Verifica se o valor de max_id é 0 ou nulo, e define para 1 se necessário
            IF max_id = 0 THEN
                max_id := 1;
            END IF;

            -- Constrói a string do comando setval com 'id_serial'
            setval_query := format('SELECT setval(''%I.%I'', %s)', rec.sequence_schema, seq_name, max_id);

            -- Executa o comando setval
            EXECUTE setval_query;

            -- Mostrar o comando setval na tela com schema qualificado
            RAISE NOTICE 'SELECT setval(''%s'', %s);', format('%I.%I', rec.sequence_schema, seq_name), max_id;
        END;
    END LOOP;
END $$;
