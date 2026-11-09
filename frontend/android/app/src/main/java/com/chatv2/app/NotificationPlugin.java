package com.chatv2.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeNotification")
public class NotificationPlugin extends Plugin {

    private static final String CHANNEL_ID = "chatv2_messages_channel";
    private static final String CHANNEL_NAME = "Mensagens do ChatV2";

    @Override
    public void load() {
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notificações de novas mensagens e atendimentos do ChatV2");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 250, 150, 250});
            channel.setShowBadge(true);

            NotificationManager manager = getContext().getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @PluginMethod
    public void showNotification(PluginCall call) {
        String title = call.getString("title", "ChatV2");
        String body = call.getString("body", "Nova mensagem recebida");
        int ticketId = call.getInt("ticketId", 1);

        Context context = getContext();

        // Intent to bring ChatV2 to foreground when tapped
        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("ticketId", ticketId);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            ticketId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setVibrate(new long[]{0, 250, 150, 250})
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setContentIntent(pendingIntent);

        try {
            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
            notificationManager.notify(ticketId, builder.build());
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (SecurityException se) {
            call.reject("Permissão de notificação não concedida no Android");
        } catch (Exception e) {
            call.reject("Erro ao exibir notificação: " + e.getMessage());
        }
    }
}
