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
        // 1. Check command-line system property first (-Dkey=value)
        String systemProp = System.getProperty(key);
        if (systemProp != null && !systemProp.trim().isEmpty()) {
            return systemProp.trim();
        }
        // 2. Fall back to config.properties
        return properties.getProperty(key);
    }

    public static String getBaseUrl() {
        return getProperty("baseUrl");
    }
}