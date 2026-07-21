#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <sstream>
#include <dlfcn.h>
#include <cstring>

typedef long long INT_PTR;
typedef long long LONG_PTR;

typedef INT_PTR (*pfp)(INT_PTR FuncNo, LONG_PTR Param1, LONG_PTR Param2, LONG_PTR Param3);

// Constants
#define FP_OPEN                             1
#define FP_CLOSE                            2
#define FP_GETENROLLCOUNT                   5
#define FP_SETFPDATA                        11
#define FP_GETFPDATA                        12
#define FP_VERIFYFPDATA                     44
#define FP_IDENTIFYFPDATA                   43
#define FP_DELETEALL                        52
#define FP_GETLIBVER                        100
#define FP_GETMATCHDATA                     1000

#define SENSOR_EB6048                       4
#define SENSOR_GC0307                       5
#define FEATURE_SIZE                        1404

// Base64 helper character set
static const std::string base64_chars = 
             "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
             "abcdefghijklmnopqrstuvwxyz"
             "0123456789+/";

static inline bool is_base64(unsigned char c) {
  return (isalnum(c) || (c == '+') || (c == '/'));
}

std::vector<unsigned char> base64_decode(std::string const& encoded_string) {
  int in_len = encoded_string.size();
  int i = 0;
  int j = 0;
  int in_ = 0;
  unsigned char char_array_4[4], char_array_3[3];
  std::vector<unsigned char> ret;

  while (in_len-- && ( encoded_string[in_] != '=') && is_base64(encoded_string[in_])) {
    char_array_4[i++] = encoded_string[in_]; in_++;
    if (i == 4) {
      for (i = 0; i < 4; i++)
        char_array_4[i] = base64_chars.find(char_array_4[i]);

      char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
      char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
      char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];

      for (i = 0; (i < 3); i++)
        ret.push_back(char_array_3[i]);
      i = 0;
    }
  }

  if (i) {
    for (j = i; j < 4; j++)
      char_array_4[j] = 0;

    for (j = 0; j < 4; j++)
      char_array_4[j] = base64_chars.find(char_array_4[j]);

    char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
    char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
    char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];

    for (j = 0; (j < i - 1); j++) ret.push_back(char_array_3[j]);
  }

  return ret;
}

// Function to resolve sfe.so library handle
pfp load_sfe_library(void** handle_out) {
    const char* paths[] = {
        "./sfe.so",
        "../SB1001U-SDK/20180911-SB1001U-SDK/Win/Comm_10K/SFE/sfe.so",
        "/home/paschaltjoseph/work/mitz-office/medical.Sys/API/SB1001U-SDK/20180911-SB1001U-SDK/Win/Comm_10K/SFE/sfe.so"
    };

    void* handle = nullptr;
    for (const char* path : paths) {
        handle = dlopen(path, RTLD_LAZY);
        if (handle) {
            break;
        }
    }

    if (!handle) {
        std::cerr << "{\"success\":false,\"error\":\"Cannot open library sfe.so: " << dlerror() << "\"}" << std::endl;
        return nullptr;
    }

    pfp fp_func = (pfp)dlsym(handle, "fp");
    const char* dlsym_error = dlerror();
    if (dlsym_error) {
        std::cerr << "{\"success\":false,\"error\":\"Cannot load symbol 'fp': " << dlsym_error << "\"}" << std::endl;
        dlclose(handle);
        return nullptr;
    }

    *handle_out = handle;
    return fp_func;
}

INT_PTR open_sfe_engine(pfp fp, int* selected_sensor) {
    const int sensors[] = { SENSOR_GC0307, 1, SENSOR_EB6048, 6, 0, 2, 3, 7, 8 };
    for (int sensor : sensors) {
        INT_PTR ret = fp(FP_OPEN, sensor, 0, 0);
        if (ret == 0) {
            if (selected_sensor) *selected_sensor = sensor;
            return ret;
        }
        fp(FP_CLOSE, 0, 0, 0);
    }

    if (selected_sensor) *selected_sensor = -1;
    return -100;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "{\"success\":false,\"error\":\"Missing command. Usage: sfe_cli [version|verify|identify] ...\"}" << std::endl;
        return 1;
    }

    std::string command = argv[1];

    if (command == "version") {
        void* handle = nullptr;
        pfp fp = load_sfe_library(&handle);
        if (!fp) return 1;

        INT_PTR ver = fp(FP_GETLIBVER, 0, 0, 0);
        std::cout << "{\"success\":true,\"version\":" << ver << "}" << std::endl;

        dlclose(handle);
        return 0;
    } 
    else if (command == "verify") {
        if (argc < 4) {
            std::cerr << "{\"success\":false,\"error\":\"Usage: sfe_cli verify <templateA_base64> <templateB_base64>\"}" << std::endl;
            return 1;
        }

        std::string tempA_str = argv[2];
        std::string tempB_str = argv[3];

        std::vector<unsigned char> tempA = base64_decode(tempA_str);
        std::vector<unsigned char> tempB = base64_decode(tempB_str);

        if (tempA.size() < FEATURE_SIZE || tempB.size() < FEATURE_SIZE) {
            std::cerr << "{\"success\":false,\"error\":\"Invalid template size. Must decode to at least " << FEATURE_SIZE << " bytes.\"}" << std::endl;
            return 1;
        }

        void* handle = nullptr;
        pfp fp = load_sfe_library(&handle);
        if (!fp) return 1;

        int selected_sensor = -1;
        INT_PTR open_ret = open_sfe_engine(fp, &selected_sensor);
        if (open_ret != 0) {
            std::cerr << "{\"success\":false,\"error\":\"Engine Open failed with code: " << open_ret << "\",\"diagnostics\":\"sensor=" << selected_sensor << "\"}" << std::endl;
            dlclose(handle);
            return 1;
        }

        fp(FP_DELETEALL, 0, 0, 0);
        INT_PTR set_ret = fp(FP_SETFPDATA, (LONG_PTR)tempB.data(), 0, 0);
        if (set_ret < 0) {
            std::cerr << "{\"success\":false,\"error\":\"Set template B failed with code: " << set_ret << "\",\"diagnostics\":\"sensor=" << selected_sensor << "\"}" << std::endl;
            fp(FP_CLOSE, 0, 0, 0);
            dlclose(handle);
            return 1;
        }

        INT_PTR verify_ret = fp(FP_VERIFYFPDATA, (LONG_PTR)tempA.data(), 0, 0);
        long long similarity = 0;
        if (verify_ret <= 0) {
            INT_PTR identify_ret = fp(FP_IDENTIFYFPDATA, (LONG_PTR)tempA.data(), (LONG_PTR)&similarity, 0);
            if (identify_ret > 0) verify_ret = identify_ret;
        }

        bool matched = (verify_ret > 0);
        std::cout << "{\"success\":true,\"matched\":" << (matched ? "true" : "false")
                  << ",\"code\":" << verify_ret
                  << ",\"similarity\":" << similarity
                  << ",\"diagnostics\":\"lenA=" << tempA.size()
                  << ",lenB=" << tempB.size()
                  << ",sensor=" << selected_sensor
                  << ",open=" << open_ret
                  << ",set=" << set_ret
                  << ",verify=" << verify_ret << "\"}" << std::endl;

        fp(FP_CLOSE, 0, 0, 0);
        dlclose(handle);
        return matched ? 0 : 1;
    }
    else if (command == "identify") {
        if (argc < 4) {
            std::cerr << "{\"success\":false,\"error\":\"Usage: sfe_cli identify <candidate_base64> <database_file_path>\"}" << std::endl;
            return 1;
        }

        std::string candidate_str = argv[2];
        std::string db_file_path = argv[3];

        std::vector<unsigned char> candidate = base64_decode(candidate_str);
        if (candidate.size() < FEATURE_SIZE) {
            std::cerr << "{\"success\":false,\"error\":\"Invalid candidate template size. Must decode to at least " << FEATURE_SIZE << " bytes.\"}" << std::endl;
            return 1;
        }

        // Read database file containing: [id] [base64_template]
        std::ifstream db_file(db_file_path.c_str());
        if (!db_file.is_open()) {
            std::cerr << "{\"success\":false,\"error\":\"Cannot open database file: " << db_file_path << "\"}" << std::endl;
            return 1;
        }

        void* handle = nullptr;
        pfp fp = load_sfe_library(&handle);
        if (!fp) return 1;

        int selected_sensor = -1;
        INT_PTR open_ret = open_sfe_engine(fp, &selected_sensor);
        if (open_ret != 0) {
            std::cerr << "{\"success\":false,\"error\":\"Engine Open failed with code: " << open_ret << "\",\"diagnostics\":\"sensor=" << selected_sensor << "\"}" << std::endl;
            dlclose(handle);
            return 1;
        }

        fp(FP_DELETEALL, 0, 0, 0);

        // Load templates into matching database slots
        std::string line;
        std::vector<std::string> ids;
        int slot_index = 0;

        while (std::getline(db_file, line)) {
            if (line.empty()) continue;
            std::stringstream ss(line);
            std::string id, templ_b64;
            if (!(ss >> id >> templ_b64)) continue;

            std::vector<unsigned char> decoded_templ = base64_decode(templ_b64);
            if (decoded_templ.size() < FEATURE_SIZE) continue;

            INT_PTR set_ret = fp(FP_SETFPDATA, (LONG_PTR)decoded_templ.data(), slot_index, 0);
            if (set_ret == 0) {
                ids.push_back(id);
                slot_index++;
            }
        }
        db_file.close();

        if (slot_index == 0) {
            std::cout << "{\"success\":true,\"matched\":false,\"message\":\"No valid templates loaded from database file.\"}" << std::endl;
            fp(FP_CLOSE, 0, 0, 0);
            dlclose(handle);
            return 0;
        }

        // Run identification
        long long similarity = 0;
        INT_PTR identify_ret = fp(FP_IDENTIFYFPDATA, (LONG_PTR)candidate.data(), (LONG_PTR)&similarity, 0);

        if (identify_ret > 0) {
            int matched_index = (int)(identify_ret - 1);
            if (matched_index >= 0 && matched_index < (int)ids.size()) {
                std::cout << "{\"success\":true,\"matched\":true,\"id\":\"" << ids[matched_index] 
                          << "\",\"similarity\":" << similarity << ",\"slot\":" << matched_index << "}" << std::endl;
            } else {
                std::cerr << "{\"success\":false,\"error\":\"Identify index out of range: " << matched_index << "\"}" << std::endl;
            }
        } else {
            std::cout << "{\"success\":true,\"matched\":false,\"code\":" << identify_ret << "}" << std::endl;
        }

        fp(FP_CLOSE, 0, 0, 0);
        dlclose(handle);
        return 0;
    }
    else {
        std::cerr << "{\"success\":false,\"error\":\"Unknown command '" << command << "'. Use version, verify, or identify.\"}" << std::endl;
        return 1;
    }
}
