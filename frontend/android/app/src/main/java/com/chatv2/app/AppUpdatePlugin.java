package com.chatv2.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ret.put("value", getContext().getPackageManager().canRequestPackageInstalls());
        } else {
            ret.put("value", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String apkUrl = call.getString("url");
        if (apkUrl == null || apkUrl.isEmpty()) {
            call.reject("URL do APK não informada");
            return;
        }

        executor.execute(() -> {
            try {
                Context context = getContext();
                URL url = new URL(apkUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(60000);
                connection.setInstanceFollowRedirects(true);
                connection.connect();

                int responseCode = connection.getResponseCode();
                if (responseCode == HttpURLConnection.HTTP_MOVED_PERM ||
                    responseCode == HttpURLConnection.HTTP_MOVED_TEMP ||
                    responseCode == 307 || responseCode == 308) {
                    String newUrl = connection.getHeaderField("Location");
                    connection.disconnect();
                    url = new URL(newUrl);
                    connection = (HttpURLConnection) url.openConnection();
                    connection.setRequestMethod("GET");
                    connection.setConnectTimeout(15000);
                    connection.setReadTimeout(60000);
                    connection.connect();
                    responseCode = connection.getResponseCode();
                }

                if (responseCode != HttpURLConnection.HTTP_OK) {
                    call.reject("Erro ao baixar APK: Código HTTP " + responseCode);
                    return;
                }

                long fileLength = connection.getContentLengthLong();

                File cacheDir = context.getExternalCacheDir() != null ? context.getExternalCacheDir() : context.getCacheDir();
                File outputFile = new File(cacheDir, "chatv2-update.apk");
                if (outputFile.exists()) {
                    outputFile.delete();
                }

                InputStream input = connection.getInputStream();
                FileOutputStream output = new FileOutputStream(outputFile);

                byte[] data = new byte[16384];
                long total = 0;
                int count;
                long lastNotifyTime = 0;

                while ((count = input.read(data)) != -1) {
                    total += count;
                    output.write(data, 0, count);

                    long now = System.currentTimeMillis();
                    if (fileLength > 0 && (now - lastNotifyTime > 120)) {
                        lastNotifyTime = now;
                        int percent = (int) (total * 100 / fileLength);
                        JSObject progress = new JSObject();
                        progress.put("percent", percent);
                        progress.put("bytesDownloaded", total);
                        progress.put("totalBytes", fileLength);
                        notifyListeners("downloadProgress", progress);
                    }
                }

                output.flush();
                output.close();
                input.close();

                JSObject finalProgress = new JSObject();
                finalProgress.put("percent", 100);
                finalProgress.put("bytesDownloaded", total);
                finalProgress.put("totalBytes", total);
                notifyListeners("downloadProgress", finalProgress);

                // Trigger Package Installer
                Uri apkUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    outputFile
                );

                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                context.startActivity(installIntent);

                JSObject res = new JSObject();
                res.put("success", true);
                call.resolve(res);

            } catch (Exception e) {
                e.printStackTrace();
                call.reject("Erro no download da atualização: " + e.getMessage());
            }
        });
    }
}
