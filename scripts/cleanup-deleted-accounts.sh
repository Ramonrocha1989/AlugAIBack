#!/bin/bash

# Script manual para deletar contas expiradas (executar manualmente ou via cron externo)

echo "=== Limpeza de Contas Expiradas ==="
echo ""

# SQL para deletar contas marcadas há mais de 30 dias
SQL="
DO \$\$
DECLARE
    user_record RECORD;
    deleted_count INT := 0;
BEGIN
    FOR user_record IN 
        SELECT id, email 
        FROM users 
        WHERE status = 'DELETED' 
        AND deleted_at <= NOW() - INTERVAL '30 days'
    LOOP
        -- Deletar dados relacionados
        DELETE FROM proposals WHERE sender_id = user_record.id OR receiver_id = user_record.id;
        DELETE FROM notifications WHERE user_id = user_record.id;
        DELETE FROM reviews WHERE reviewer_id = user_record.id OR reviewed_user_id = user_record.id;
        DELETE FROM favorites WHERE user_id = user_record.id;
        DELETE FROM machines WHERE owner_id = user_record.id;
        DELETE FROM delete_tokens WHERE user_id = user_record.id;
        DELETE FROM refresh_tokens WHERE user_id = user_record.id;
        DELETE FROM password_reset_tokens WHERE user_id = user_record.id;
        DELETE FROM email_verification_tokens WHERE user_id = user_record.id;
        DELETE FROM users WHERE id = user_record.id;
        
        deleted_count := deleted_count + 1;
        RAISE NOTICE 'Conta % excluída permanentemente', user_record.email;
    END LOOP;
    
    RAISE NOTICE 'Total de contas excluídas: %', deleted_count;
END \$\$;
"

npx prisma db execute --stdin <<< "$SQL"

echo ""
echo "✅ Limpeza concluída"
