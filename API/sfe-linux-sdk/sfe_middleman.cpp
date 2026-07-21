#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <fstream>
#include <cstring>
#include <cstdlib>
#include <cctype>
#include <chrono>
#include <thread>
#include <mutex>
#include <algorithm>
#include <cstdint>

#include <dlfcn.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#include "sfe_linux_driver.h"

typedef long long INT_PTR;
typedef long long LONG_PTR;

typedef INT_PTR (*pfp)(INT_PTR FuncNo, LONG_PTR Param1, LONG_PTR Param2, LONG_PTR Param3);

// Official Smackbio SB1001U Constants
#define FP_OPEN                             1
#define FP_CLOSE                            2
#define FP_GETENROLLCOUNT                   5
#define FP_FEATUREGETFROMIMAGE             10
#define FP_SETFPDATA                        11
#define FP_GETFPDATA                        12
#define FP_IDENTIFYFPDATA                   43
#define FP_VERIFYFPDATA                     44

#define FP_SEN_ADJUST                      60
#define FP_SEN_CAPTURE                     61
#define FP_SEN_ISFINGER                    62
#define FP_SEN_GETIMG                      63
#define FP_SEN_GETFEATURE                  64

#define FP_GETLIBVER                        100
#define FP_GETMATCHDATA                     1000

#define SENSOR_EB6048                       4
#define SENSOR_GC0307                       5
#define SENSOR_EB6048_20                    6

#define FEATURE_SIZE                        1404

static const int SENSOR_PROBE_ORDER[] = { 5, 1, 4, 6, 0, 2, 3, 7, 8 };
static const size_t SENSOR_PROBE_COUNT = sizeof(SENSOR_PROBE_ORDER) / sizeof(SENSOR_PROBE_ORDER[0]);

static std::mutex g_sfe_mutex;
static int g_port = 5000;
static SfeLinuxDriver g_nativeDriver;

struct SfeDriverInstance {
    std::string name;
    void* handle;
    pfp fp_func;
};

static std::vector<SfeDriverInstance> g_drivers;

// -----------------------------------------------------------------------------
// Base64 Helpers
// -----------------------------------------------------------------------------
static const std::string BASE64_CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";

static inline bool is_base64(unsigned char c) {
    return (isalnum(c) || (c == '+') || (c == '/'));
}

std::string base64_encode(const unsigned char* buf, unsigned int bufLen) {
    std::string ret;
    int i = 0, j = 0;
    unsigned char char_array_3[3], char_array_4[4];

    while (bufLen--) {
        char_array_3[i++] = *(buf++);
        if (i == 3) {
            char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
            char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
            char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
            char_array_4[3] = char_array_3[2] & 0x3f;

            for (i = 0; (i < 4); i++) ret += BASE64_CHARS[char_array_4[i]];
            i = 0;
        }
    }

    if (i) {
        for (j = i; j < 3; j++) char_array_3[j] = '\0';

        char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
        char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
        char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
        char_array_4[3] = char_array_3[2] & 0x3f;

        for (j = 0; (j < i + 1); j++) ret += BASE64_CHARS[char_array_4[j]];
        while ((i++ < 3)) ret += '=';
    }

    return ret;
}

std::vector<unsigned char> base64_decode(const std::string& encoded_string) {
    int in_len = encoded_string.size();
    int i = 0, j = 0, in_ = 0;
    unsigned char char_array_4[4], char_array_3[3];
    std::vector<unsigned char> ret;

    while (in_len-- && (encoded_string[in_] != '=') && is_base64(encoded_string[in_])) {
        char_array_4[i++] = encoded_string[in_]; in_++;
        if (i == 4) {
            for (i = 0; i < 4; i++)
                char_array_4[i] = BASE64_CHARS.find(char_array_4[i]);

            char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
            char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
            char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];

            for (i = 0; (i < 3); i++) ret.push_back(char_array_3[i]);
            i = 0;
        }
    }

    if (i) {
        for (j = i; j < 4; j++) char_array_4[j] = 0;
        for (j = 0; j < 4; j++) char_array_4[j] = BASE64_CHARS.find(char_array_4[j]);

        char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
        char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
        char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];

        for (j = 0; (j < i - 1); j++) ret.push_back(char_array_3[j]);
    }

    return ret;
}

// -----------------------------------------------------------------------------
// SFE Driver Loaders
// -----------------------------------------------------------------------------
void load_sfe_drivers() {
    g_drivers.clear();
    const std::vector<std::string> libNames = {
        "./sfe_30K.so",
        "./sfe_2K.so",
        "./sfe_1.so",
        "./sfe.so",
        "/home/paschaltjoseph/work/mitz-office/medical.Sys/API/sfe-linux-sdk/sfe_30K.so",
        "/home/paschaltjoseph/work/mitz-office/medical.Sys/API/sfe-linux-sdk/sfe_2K.so",
        "/home/paschaltjoseph/work/mitz-office/medical.Sys/API/sfe-linux-sdk/sfe_1.so",
        "/home/paschaltjoseph/work/mitz-office/medical.Sys/API/sfe-linux-sdk/sfe.so"
    };

    for (const auto& path : libNames) {
        void* handle = dlopen(path.c_str(), RTLD_LAZY);
        if (handle) {
            pfp fp_func = (pfp)dlsym(handle, "fp");
            if (fp_func) {
                g_drivers.push_back({ path, handle, fp_func });
                std::cout << "[SFE Middleman] Loaded library variant: " << path << std::endl;
            } else {
                dlclose(handle);
            }
        }
    }
}

// -----------------------------------------------------------------------------
// Helpers & JSON Utilities
// -----------------------------------------------------------------------------
std::string escape_json(const std::string& str) {
    std::string out;
    for (char c : str) {
        if (c == '"') out += "\\\"";
        else if (c == '\\') out += "\\\\";
        else if (c == '\n') out += " ";
        else if (c == '\r') out += "";
        else if (c == '\t') out += " ";
        else out += c;
    }
    return out;
}

std::string extract_json_value(const std::string& json, const std::string& key) {
    std::string searchKey = "\"" + key + "\"";
    size_t pos = json.find(searchKey);
    if (pos == std::string::npos) return "";

    pos = json.find(':', pos + searchKey.length());
    if (pos == std::string::npos) return "";

    pos++;
    while (pos < json.length() && (json[pos] == ' ' || json[pos] == '\t' || json[pos] == '\r' || json[pos] == '\n')) {
        pos++;
    }

    if (pos >= json.length()) return "";

    if (json[pos] == '"') {
        pos++;
        std::string result;
        while (pos < json.length()) {
            if (json[pos] == '\\' && pos + 1 < json.length()) {
                result += json[pos + 1];
                pos += 2;
            } else if (json[pos] == '"') {
                break;
            } else {
                result += json[pos];
                pos++;
            }
        }
        return result;
    } else {
        size_t endPos = json.find_first_of(",}\r\n \t", pos);
        if (endPos == std::string::npos) endPos = json.length();
        return json.substr(pos, endPos - pos);
    }
}

std::vector<int> build_sensor_probe_order(int requestedSensorType) {
    std::vector<int> sensors;
    sensors.push_back(requestedSensorType);
    for (size_t i = 0; i < SENSOR_PROBE_COUNT; i++) {
        if (std::find(sensors.begin(), sensors.end(), SENSOR_PROBE_ORDER[i]) == sensors.end()) {
            sensors.push_back(SENSOR_PROBE_ORDER[i]);
        }
    }
    return sensors;
}

// -----------------------------------------------------------------------------
// Core Business Logic
// -----------------------------------------------------------------------------
std::string handle_capture_request(int sensorType) {
    std::lock_guard<std::mutex> lock(g_sfe_mutex);
    std::ostringstream diag;

    // 1. Try Native C++ SCSI Driver
    if (g_nativeDriver.findAndOpenDevice()) {
        diag << "native_driver=" << g_nativeDriver.getActiveDevicePath() << ":";
        g_nativeDriver.adjustSensor();

        auto startTime = std::chrono::steady_clock::now();
        while (std::chrono::duration_cast<std::chrono::seconds>(
                   std::chrono::steady_clock::now() - startTime).count() < 10) {
            int capRet = g_nativeDriver.captureFrame();
            int isFinger = g_nativeDriver.isFingerPlaced();
            diag << "cap=" << capRet << ",isFinger=" << isFinger << ";";

            std::vector<unsigned char> templ;
            if (g_nativeDriver.getFeatureTemplate(templ)) {
                g_nativeDriver.closeDevice();
                std::string b64Template = base64_encode(templ.data(), templ.size());
                diag << "extract_success=1404;";
                return "{\"success\":true,\"template\":\"" + b64Template + "\",\"sensorType\":" + std::to_string(sensorType) + ",\"diagnostics\":\"" + escape_json(diag.str()) + "\"}";
            }

            std::this_thread::sleep_for(std::chrono::milliseconds(150));
        }
        g_nativeDriver.closeDevice();
    }

    // 2. Fallback to Library Probing
    std::vector<int> sensors = build_sensor_probe_order(sensorType);
    int brValues[] = { 0, 10, 20, -10, -20 };

    for (const auto& drv : g_drivers) {
        diag << "lib=" << drv.name << ":";
        for (int sType : sensors) {
            diag << "sensor=" << sType << ":";
            for (int br : brValues) {
                INT_PTR openRet = drv.fp_func(FP_OPEN, sType, br, 0);
                diag << "open=" << openRet << "(br=" << br << "),";

                try {
                    drv.fp_func(FP_SEN_ADJUST, 0, 0, 0);

                    auto startTime = std::chrono::steady_clock::now();
                    while (std::chrono::duration_cast<std::chrono::seconds>(
                               std::chrono::steady_clock::now() - startTime).count() < 10) {
                        INT_PTR capRet = drv.fp_func(FP_SEN_CAPTURE, 0, 0, 0);
                        INT_PTR isFingerRet = drv.fp_func(FP_SEN_ISFINGER, 0, 0, 0);
                        diag << "cap=" << capRet << ",isFinger=" << isFingerRet << ";";

                        std::vector<unsigned char> templateBuf(FEATURE_SIZE, 0);
                        INT_PTR extRet = drv.fp_func(FP_SEN_GETFEATURE, (LONG_PTR)templateBuf.data(), 0, 0);
                        if (extRet < 0) {
                            extRet = drv.fp_func(FP_FEATUREGETFROMIMAGE, (LONG_PTR)templateBuf.data(), 0, 0);
                        }
                        if (extRet < 0) {
                            extRet = drv.fp_func(FP_GETFPDATA, (LONG_PTR)templateBuf.data(), 0, 0);
                        }

                        int nonZeroBytes = 0;
                        for (unsigned char b : templateBuf) {
                            if (b != 0) nonZeroBytes++;
                        }

                        if (nonZeroBytes > 0) {
                            drv.fp_func(FP_CLOSE, 0, 0, 0);
                            std::string b64Template = base64_encode(templateBuf.data(), templateBuf.size());
                            diag << "extract=" << extRet << ",nonZeroBytes=" << nonZeroBytes << ";";
                            return "{\"success\":true,\"template\":\"" + b64Template + "\",\"sensorType\":" + std::to_string(sType) + ",\"diagnostics\":\"" + escape_json(diag.str()) + "\"}";
                        }

                        std::this_thread::sleep_for(std::chrono::milliseconds(150));
                    }
                } catch (...) {
                    drv.fp_func(FP_CLOSE, 0, 0, 0);
                }
                drv.fp_func(FP_CLOSE, 0, 0, 0);
            }
        }
    }

    return "{\"success\":false,\"error\":\"Failed to capture fingerprint from scanner. Please place finger firmly on the scanner optical window and try again.\",\"diagnostics\":\"" + escape_json(diag.str()) + "\"}";
}

std::string handle_verify_request(const std::string& templateA_b64, const std::string& templateB_b64) {
    std::lock_guard<std::mutex> lock(g_sfe_mutex);

    if (g_drivers.empty()) {
        return "{\"success\":false,\"error\":\"SFE driver libraries are not available.\"}";
    }

    std::vector<unsigned char> tempA = base64_decode(templateA_b64);
    std::vector<unsigned char> tempB = base64_decode(templateB_b64);

    if (tempA.size() < FEATURE_SIZE || tempB.size() < FEATURE_SIZE) {
        return "{\"success\":false,\"error\":\"Invalid template size. Templates must decode to at least " + std::to_string(FEATURE_SIZE) + " bytes.\"}";
    }

    pfp fp_func = g_drivers[0].fp_func;

    INT_PTR openRet = fp_func(FP_OPEN, SENSOR_EB6048, 0, 0);
    if (openRet < 0 && openRet != -100) {
        return "{\"success\":false,\"error\":\"Engine Open failed with code: " + std::to_string(openRet) + "\"}";
    }

    // Retrieve engine database match pointer
    unsigned char* pMatchData = (unsigned char*)fp_func(FP_GETMATCHDATA, 0, 0, 0);

    // Prepare tempB as valid slot 0 item inside gMatchData
    std::vector<unsigned char> slotB = tempB;
    if (slotB.size() < FEATURE_SIZE) slotB.resize(FEATURE_SIZE, 0);

    *(uint32_t*)(&slotB[0]) = 1; // ID = 1
    slotB[4] = 1;               // Valid = 1
    slotB[6] = 1;               // FingerNum = 1

    if (pMatchData) {
        memcpy(pMatchData, slotB.data(), FEATURE_SIZE);
    } else {
        fp_func(FP_SETFPDATA, (LONG_PTR)slotB.data(), 0, 0);
    }

    // Verify tempA against slot 0
    std::vector<unsigned char> featA = tempA;
    if (featA.size() < FEATURE_SIZE) featA.resize(FEATURE_SIZE, 0);

    INT_PTR verifyRet = fp_func(FP_VERIFYFPDATA, (LONG_PTR)featA.data(), 0, 0);

    LONG_PTR similarity = 0;
    if (verifyRet <= 0) {
        INT_PTR identifyRet = fp_func(FP_IDENTIFYFPDATA, (LONG_PTR)featA.data(), (LONG_PTR)&similarity, 0);
        if (identifyRet > 0) {
            verifyRet = identifyRet;
        }
    }

    bool matched = (verifyRet > 0);

    fp_func(FP_CLOSE, 0, 0, 0);

    return "{\"success\":true,\"matched\":" + std::string(matched ? "true" : "false") + ",\"code\":" + std::to_string(verifyRet) + ",\"similarity\":" + std::to_string(similarity) + "}";
}

std::string handle_identify_request(const std::string& candidate_b64, const std::string& bodyText) {
    std::lock_guard<std::mutex> lock(g_sfe_mutex);

    if (g_drivers.empty()) {
        return "{\"success\":false,\"error\":\"SFE driver libraries are not available.\"}";
    }

    std::vector<unsigned char> candidate = base64_decode(candidate_b64);
    if (candidate.size() < FEATURE_SIZE) {
        return "{\"success\":false,\"error\":\"Invalid candidate template size.\"}";
    }

    pfp fp_func = g_drivers[0].fp_func;

    INT_PTR openRet = fp_func(FP_OPEN, SENSOR_EB6048, 0, 0);
    if (openRet < 0 && openRet != -100) {
        return "{\"success\":false,\"error\":\"Engine Open failed with code: " + std::to_string(openRet) + "\"}";
    }

    std::vector<std::pair<std::string, std::vector<unsigned char>>> candidateList;
    size_t pos = 0;
    while ((pos = bodyText.find("\"id\"", pos)) != std::string::npos) {
        std::string id = extract_json_value(bodyText.substr(pos), "id");
        size_t b64Pos = bodyText.find("\"templateBase64\"", pos);
        if (b64Pos != std::string::npos) {
            std::string tB64 = extract_json_value(bodyText.substr(b64Pos), "templateBase64");
            if (!id.empty() && !tB64.empty()) {
                candidateList.push_back({id, base64_decode(tB64)});
            }
        }
        pos += 4;
    }

    if (candidateList.empty()) {
        fp_func(FP_CLOSE, 0, 0, 0);
        return "{\"success\":true,\"matched\":false,\"message\":\"No valid candidate templates found in payload.\"}";
    }

    unsigned char* pMatchData = (unsigned char*)fp_func(FP_GETMATCHDATA, 0, 0, 0);

    int slot_index = 0;
    std::vector<std::string> slotIds;
    for (auto& item : candidateList) {
        if (item.second.size() >= FEATURE_SIZE) {
            std::vector<unsigned char> slot = item.second;
            *(uint32_t*)(&slot[0]) = slot_index + 1;
            slot[4] = 1; // Valid
            slot[6] = 1; // FingerNum

            if (pMatchData) {
                memcpy(pMatchData + (slot_index * FEATURE_SIZE), slot.data(), FEATURE_SIZE);
            } else {
                fp_func(FP_SETFPDATA, (LONG_PTR)slot.data(), slot_index, 0);
            }
            slotIds.push_back(item.first);
            slot_index++;
        }
    }

    if (slot_index == 0) {
        fp_func(FP_CLOSE, 0, 0, 0);
        return "{\"success\":true,\"matched\":false,\"message\":\"Could not load candidate templates into engine slots.\"}";
    }

    LONG_PTR similarity = 0;
    INT_PTR identifyRet = fp_func(FP_IDENTIFYFPDATA, (LONG_PTR)candidate.data(), (LONG_PTR)&similarity, 0);

    fp_func(FP_CLOSE, 0, 0, 0);

    if (identifyRet > 0) {
        int matchedIdx = (int)(identifyRet - 1);
        if (matchedIdx >= 0 && matchedIdx < (int)slotIds.size()) {
            return "{\"success\":true,\"matched\":true,\"id\":\"" + slotIds[matchedIdx] + "\",\"similarity\":" + std::to_string(similarity) + "}";
        }
    }

    return "{\"success\":true,\"matched\":false,\"code\":" + std::to_string(identifyRet) + "}";
}

// -----------------------------------------------------------------------------
// HTTP Server Engine
// -----------------------------------------------------------------------------
void send_http_response(int clientSocket, int statusCode, const std::string& jsonBody, const std::string& clientOrigin = "") {
    std::string statusText = (statusCode == 200) ? "OK" : (statusCode == 400 ? "Bad Request" : (statusCode == 404 ? "Not Found" : "Internal Server Error"));
    std::ostringstream response;
    response << "HTTP/1.1 " << statusCode << " " << statusText << "\r\n";
    
    if (!clientOrigin.empty()) {
        response << "Access-Control-Allow-Origin: " << clientOrigin << "\r\n";
        response << "Access-Control-Allow-Credentials: true\r\n";
    } else {
        response << "Access-Control-Allow-Origin: *\r\n";
    }
    
    response << "Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With\r\n";
    response << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
    response << "Content-Type: application/json\r\n";
    response << "Content-Length: " << jsonBody.length() << "\r\n";
    response << "Connection: close\r\n\r\n";
    response << jsonBody;

    std::string respStr = response.str();
    send(clientSocket, respStr.c_str(), respStr.length(), 0);
}

void handle_client(int clientSocket) {
    std::vector<char> rawBuffer;
    char chunk[4096];
    ssize_t bytesRead = 0;
    size_t expectedContentLength = 0;
    bool hasContentLength = false;
    size_t headerEndPos = std::string::npos;

    while ((bytesRead = recv(clientSocket, chunk, sizeof(chunk), 0)) > 0) {
        rawBuffer.insert(rawBuffer.end(), chunk, chunk + bytesRead);
        std::string currentStr(rawBuffer.begin(), rawBuffer.end());

        if (headerEndPos == std::string::npos) {
            headerEndPos = currentStr.find("\r\n\r\n");
            if (headerEndPos != std::string::npos) {
                std::string lowerStr = currentStr;
                std::transform(lowerStr.begin(), lowerStr.end(), lowerStr.begin(), ::tolower);
                size_t clPos = lowerStr.find("content-length:");
                if (clPos != std::string::npos) {
                    size_t valStart = clPos + strlen("content-length:");
                    size_t valEnd = lowerStr.find("\r\n", valStart);
                    if (valEnd != std::string::npos) {
                        std::string clStr = currentStr.substr(valStart, valEnd - valStart);
                        expectedContentLength = std::atoi(clStr.c_str());
                        hasContentLength = true;
                    }
                }
            }
        }

        if (headerEndPos != std::string::npos) {
            size_t bodyReceived = rawBuffer.size() - (headerEndPos + 4);
            if (!hasContentLength || bodyReceived >= expectedContentLength) {
                break;
            }
        }
    }

    if (rawBuffer.empty()) {
        close(clientSocket);
        return;
    }

    std::string requestStr(rawBuffer.begin(), rawBuffer.end());
    std::istringstream stream(requestStr);
    std::string method, path, protocol;
    stream >> method >> path >> protocol;

    // Extract Origin header
    std::string clientOrigin = "";
    size_t originPos = requestStr.find("Origin: ");
    if (originPos == std::string::npos) originPos = requestStr.find("origin: ");
    if (originPos != std::string::npos) {
        size_t valStart = originPos + 8;
        size_t valEnd = requestStr.find("\r\n", valStart);
        if (valEnd != std::string::npos) {
            clientOrigin = requestStr.substr(valStart, valEnd - valStart);
        }
    }

    // Handle CORS preflight
    if (method == "OPTIONS") {
        send_http_response(clientSocket, 200, "{\"success\":true}", clientOrigin);
        close(clientSocket);
        return;
    }

    // Parse body if present
    std::string body;
    if (headerEndPos != std::string::npos && (headerEndPos + 4) < requestStr.length()) {
        body = requestStr.substr(headerEndPos + 4);
    }

    std::string responseJson;
    int statusCode = 200;

    size_t queryPos = path.find('?');
    std::string route = (queryPos != std::string::npos) ? path.substr(0, queryPos) : path;
    std::transform(route.begin(), route.end(), route.begin(), ::tolower);

    if (route == "/" || route == "/status") {
        responseJson = "{\"success\":true,\"status\":\"running\",\"details\":\"SFE Linux Biometric Proxy Server (Native Driver)\"}";
    } else if (route == "/capture") {
        int sensorType = SENSOR_EB6048;
        if (queryPos != std::string::npos) {
            std::string queryString = path.substr(queryPos + 1);
            if (queryString.find("sensorType=") != std::string::npos) {
                size_t valPos = queryString.find("sensorType=") + strlen("sensorType=");
                size_t valEnd = queryString.find('&', valPos);
                std::string val = queryString.substr(valPos, valEnd == std::string::npos ? std::string::npos : valEnd - valPos);
                if (!val.empty()) sensorType = std::atoi(val.c_str());
            }
        }
        responseJson = handle_capture_request(sensorType);
    } else if (route == "/verify") {
        std::string tempA = extract_json_value(body, "templateA");
        if (tempA.empty()) tempA = extract_json_value(body, "template1");
        if (tempA.empty()) tempA = extract_json_value(body, "captured");

        std::string tempB = extract_json_value(body, "templateB");
        if (tempB.empty()) tempB = extract_json_value(body, "template2");
        if (tempB.empty()) tempB = extract_json_value(body, "candidateTemplate");
        if (tempB.empty()) tempB = extract_json_value(body, "templateData");
        if (tempB.empty()) tempB = extract_json_value(body, "template_data");

        if (tempA.empty() || tempB.empty()) {
            responseJson = "{\"success\":false,\"error\":\"Missing templateA or templateB in request body\"}";
            statusCode = 400;
        } else {
            responseJson = handle_verify_request(tempA, tempB);
        }
    } else if (route == "/identify") {
        std::string candidate = extract_json_value(body, "candidate");
        if (candidate.empty()) candidate = extract_json_value(body, "templateA");
        if (candidate.empty()) candidate = extract_json_value(body, "captured");

        if (candidate.empty()) {
            responseJson = "{\"success\":false,\"error\":\"Missing candidate template in request body\"}";
            statusCode = 400;
        } else {
            responseJson = handle_identify_request(candidate, body);
        }
    } else {
        statusCode = 404;
        responseJson = "{\"success\":false,\"error\":\"Not Found\"}";
    }

    send_http_response(clientSocket, statusCode, responseJson, clientOrigin);
    close(clientSocket);
}

int main(int argc, char* argv[]) {
    if (argc > 1) {
        g_port = std::atoi(argv[1]);
        if (g_port <= 0) g_port = 5000;
    }

    std::cout << "=================================================" << std::endl;
    std::cout << " SFE Biometric Proxy Server for Linux (Native)  " << std::endl;
    std::cout << "=================================================" << std::endl;

    load_sfe_drivers();

    int serverFd = socket(AF_INET, SOCK_STREAM, 0);
    if (serverFd < 0) {
        std::cerr << "Failed to create socket." << std::endl;
        return 1;
    }

    int opt = 1;
    setsockopt(serverFd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    sockaddr_in address;
    memset(&address, 0, sizeof(address));
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(g_port);

    if (bind(serverFd, (struct sockaddr*)&address, sizeof(address)) < 0) {
        std::cerr << "Failed to bind to port " << g_port << ". Check if port is already in use." << std::endl;
        close(serverFd);
        return 1;
    }

    if (listen(serverFd, 10) < 0) {
        std::cerr << "Listen failed." << std::endl;
        close(serverFd);
        return 1;
    }

    std::cout << "Server active and listening on http://localhost:" << g_port << "/" << std::endl;

    while (true) {
        sockaddr_in clientAddr;
        socklen_t clientLen = sizeof(clientAddr);
        int clientSocket = accept(serverFd, (struct sockaddr*)&clientAddr, &clientLen);

        if (clientSocket >= 0) {
            std::thread(handle_client, clientSocket).detach();
        }
    }

    close(serverFd);
    return 0;
}
