#include "AppConfig.h"
#include <fstream>
#include <iostream> // For error logging
#include "utils/Logger.h" // Custom logger

Json::Value AppConfig::root;
std::mutex AppConfig::configMutex;
bool AppConfig::loaded = false;

bool AppConfig::parseFile(const std::string& filePath, Json::Value& outRoot) {
    std::ifstream file(filePath, std::ifstream::binary);
    if (!file.is_open()) {
        std::cerr << "ERROR: Could not open config file: " << filePath << std::endl;
        LOG_ERROR("Could not open config file: {}", filePath);
        return false;
    }

    Json::CharReaderBuilder readerBuilder;
    std::string errs;
    bool parsingSuccessful = Json::parseFromStream(readerBuilder, file, &outRoot, &errs);
    if (!parsingSuccessful) {
        std::cerr << "ERROR: Failed to parse config file " << filePath << ": " << errs << std::endl;
        LOG_ERROR("Failed to parse config file {}: {}", filePath, errs);
        return false;
    }
    return true;
}

void AppConfig::loadConfig(const std::string& filePath, bool overrideExisting) {
    std::lock_guard<std::mutex> lock(configMutex);

    Json::Value newRoot;
    if (!parseFile(filePath, newRoot)) {
        // If file can't be parsed, and it's the first load, then it's a critical error
        if (!loaded) {
            exit(EXIT_FAILURE); // Terminate if initial config fails
        }
        return; // For subsequent loads/overrides, just log and continue
    }

    if (!loaded || overrideExisting) {
        root = newRoot;
        loaded = true;
    } else {
        // Merge newRoot into existing root (deep merge for hierarchical configs)
        for (Json::Value::const_iterator it = newRoot.begin(); it != newRoot.end(); ++it) {
            const std::string key = it.name();
            if (root.isMember(key) && root[key].isObject() && it->isObject()) {
                // Recursive merge for objects
                for (Json::Value::const_iterator subIt = (*it).begin(); subIt != (*it).end(); ++subIt) {
                    root[key][subIt.name()] = *subIt;
                }
            } else {
                root[key] = *it; // Override or add non-object values
            }
        }
    }
    LOG_INFO("Configuration loaded from {}. Override existing: {}", filePath, overrideExisting);
}

Json::Value& AppConfig::findNode(const std::string& key) {
    std::lock_guard<std::mutex> lock(configMutex);
    Json::Value* current = &root;
    size_t start = 0;
    size_t end = key.find('.');

    while (end != std::string::npos) {
        std::string subKey = key.substr(start, end - start);
        if (!current->isMember(subKey)) {
            return Json::Value::nullSingleton();
        }
        current = &(*current)[subKey];
        start = end + 1;
        end = key.find('.', start);
    }

    std::string lastKey = key.substr(start);
    if (!current->isMember(lastKey)) {
        return Json::Value::nullSingleton();
    }
    return (*current)[lastKey];
}

std::string AppConfig::getString(const std::string& key, const std::string& defaultValue) {
    Json::Value& node = findNode(key);
    if (node.isString()) {
        return node.asString();
    }
    return defaultValue;
}

int AppConfig::getInt(const std::string& key, int defaultValue) {
    Json::Value& node = findNode(key);
    if (node.isInt()) {
        return node.asInt();
    }
    return defaultValue;
}

bool AppConfig::getBool(const std::string& key, bool defaultValue) {
    Json::Value& node = findNode(key);
    if (node.isBool()) {
        return node.asBool();
    }
    return defaultValue;
}

Json::Value AppConfig::getJson(const std::string& key, const Json::Value& defaultValue) {
    Json::Value& node = findNode(key);
    if (!node.isNull()) {
        return node;
    }
    return defaultValue;
}
```