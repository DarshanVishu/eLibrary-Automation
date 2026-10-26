package com.elibrary.config;

import java.io.InputStream;
import java.util.Properties;

public class ConfigReader {
    private static final Properties properties = new Properties();

    static {
        try (InputStream input = ConfigReader.class.getClassLoader().getResourceAsStream("config.properties")) {
            if (input != null) {
                properties.load(input);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static String getProperty(String key) {
        String systemProp = System.getProperty(key);
        if (systemProp != null && !systemProp.trim().isEmpty()) {
            return systemProp.trim();
        }
        return properties.getProperty(key);
    }

    public static String getBrowser() {
        String browser = getProperty("browser");
        return (browser != null && !browser.trim().isEmpty()) ? browser.trim() : "chrome";
    }

    public static String getBaseUrl() {
        return getProperty("baseUrl");
    }

    public static String getApiUrl() {
        String url = getProperty("apiUrl");
        return (url != null) ? url : getBaseUrl();
    }

    public static boolean isHeadless() {
        boolean isLinux = System.getProperty("os.name", "").toLowerCase().contains("linux");
        String headless = getProperty("headless");
        return isLinux || (headless != null && Boolean.parseBoolean(headless));
    }

    public static int getExplicitWait() {
        String wait = getProperty("explicitWait");
        return (wait != null) ? Integer.parseInt(wait) : 10;
    }
}