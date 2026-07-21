#include <iostream>
#include <vector>
#include <string>
#include <chrono>
#include <thread>
#include <dlfcn.h>

typedef long long INT_PTR;
typedef long long LONG_PTR;
typedef INT_PTR (*pfp)(INT_PTR FuncNo, LONG_PTR Param1, LONG_PTR Param2, LONG_PTR Param3);

#define FP_OPEN                             1
#define FP_CLOSE                            2
#define FP_SEN_ADJUST                      60
#define FP_SEN_CAPTURE                     61
#define FP_SEN_ISFINGER                    62
#define FP_SEN_GETIMG                      63
#define FP_SEN_GETFEATURE                  64

#define FEATURE_SIZE                     1404

int main() {
    const char* libs[] = { "./sfe_30K.so", "./sfe_2K.so", "./sfe_1.so", "./sfe.so" };

    for (const char* lib_path : libs) {
        void* handle = dlopen(lib_path, RTLD_LAZY);
        if (!handle) continue;
        pfp fp = (pfp)dlsym(handle, "fp");
        if (!fp) { dlclose(handle); continue; }

        std::cout << "\n=================================================" << std::endl;
        std::cout << " Testing SB1001U Hardware Sensor on: " << lib_path << std::endl;
        std::cout << "=================================================" << std::endl;

        for (int sensor : { 5, 1, 4, 6, 0, 2, 3, 7, 8 }) {
            INT_PTR openRet = fp(FP_OPEN, sensor, 0, 0);
            std::cout << "Sensor " << sensor << " FP_OPEN ret=" << openRet << std::endl;

            if (openRet >= 0 || openRet == -100) {
                INT_PTR adjRet = fp(FP_SEN_ADJUST, 0, 0, 0);
                std::cout << "  FP_SEN_ADJUST ret=" << adjRet << std::endl;

                std::cout << "--> Polling FP_SEN_CAPTURE (61) and FP_SEN_ISFINGER (62)..." << std::endl;
                auto start = std::chrono::steady_clock::now();
                while (std::chrono::duration_cast<std::chrono::seconds>(std::chrono::steady_clock::now() - start).count() < 3) {
                    INT_PTR capRet = fp(FP_SEN_CAPTURE, 0, 0, 0);
                    INT_PTR isFingerRet = fp(FP_SEN_ISFINGER, 0, 0, 0);

                    if (capRet >= 0 || isFingerRet > 0) {
                        std::cout << "    [SENSOR DETECTED!] capRet=" << capRet << " isFinger=" << isFingerRet << std::endl;
                        
                        std::vector<unsigned char> templ(FEATURE_SIZE, 0);
                        INT_PTR featRet = fp(FP_SEN_GETFEATURE, (LONG_PTR)templ.data(), 0, 0);
                        int nonZero = 0;
                        for (unsigned char b : templ) if (b != 0) nonZero++;

                        std::cout << "    [FEATURE EXTRACT] featRet=" << featRet << " nonZeroBytes=" << nonZero << std::endl;
                        if (nonZero > 0) {
                            std::cout << "====> LIVE SENSOR TEMPLATE CAPTURED SUCCESSFULLY! <====" << std::endl;
                            fp(FP_CLOSE, 0, 0, 0);
                            dlclose(handle);
                            return 0;
                        }
                    }
                    std::this_thread::sleep_for(std::chrono::milliseconds(150));
                }
            }
            fp(FP_CLOSE, 0, 0, 0);
        }
        dlclose(handle);
    }

    std::cout << "\nTest completed." << std::endl;
    return 0;
}
