-- Triggers and helper functions (separate file)

-- Function to retry sending notifications (example)
create or replace function fn_mark_notification_sent(notification_id uuid, ok boolean, err_text text) returns void language plpgsql as $$
begin
  if ok then
    update notificaciones set estado = 'enviado', intentos = intentos + 1, error_text = null, updated_at = now() where id = notification_id;
  else
    update notificaciones set estado = 'error', intentos = intentos + 1, error_text = err_text, updated_at = now() where id = notification_id;
  end if;
end;
$$;

-- Function to enqueue a notification manually
create or replace function fn_enqueue_notification(destinatario text, cc text, asunto text, cuerpo_html text, cuerpo_text text, tipo text, referencia uuid) returns uuid language plpgsql as $$
declare
  nid uuid;
begin
  insert into notificaciones(destinatario, cc, asunto, cuerpo_html, cuerpo_text, tipo, referencia_id) values (destinatario, cc, asunto, cuerpo_html, cuerpo_text, tipo, referencia) returning id into nid;
  return nid;
end;
$$;
