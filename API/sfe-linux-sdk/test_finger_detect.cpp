#include <iostream>
#include <vector>
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
#define FP_SEN_GETFEATURE                  64
#define FEATURE_SIZE                        1404

int main() {
    void* handle = dlopen("./sfe_30K.so", RTLD_LAZY);
    if (!handle) handle = dlopen("./sfe.so", RTLD_LAZY);
    if (!handle) {
        std::cerr << "Failed to load sfe.so" << std::endl;
        return 1;
    }

    pfp fp = (pfp)dlsym(handle, "fp");
    if (!fp) return 1;

    std::cout << "=========================================" << std::endl;
    std::cout << " Testing Finger Detection Polling Loop   " << std::endl;
    std::cout << "=========================================" << std::endl;

    INT_PTR openRet = fp(FP_OPEN, 5, 0, 0);
    std::cout << "FP_OPEN(5,0,0) ret = " << openRet << std::endl;
    if (openRet != 0) {
        std::cout << "Trying sensor 4..." << std::endl;
        openRet = fp(FP_OPEN, 4, 0, 0);
        std::cout << "FP_OPEN(4,0,0) ret = " << openRet << std::endl;
    }

    fp(FP_SEN_ADJUST, 0, 0, 0);

    std::cout << "\n--> Please DO NOT touch the sensor for 5 seconds..." << std::endl;
    for (int i = 0; i < 10; i++) {
        fp(FP_SEN_CAPTURE, 0, 0, 0);
        INT_PTR isFinger = fp(FP_SEN_ISFINGER, 0, 0, 0);

        std::vector<unsigned char> feat(FEATURE_SIZE, 0);
        INT_PTR featRet = fp(FP_SEN_GETFEATURE, (LONG_PTR)feat.data(), 0, 0);

        int minutiaeCount = 0;
        for (size_t k = 7; k < feat.size(); k++) {
            if (feat[k] != 0) minutiaeCount++;
        }

        std::cout << " [AIR READ] isFinger=" << isFinger << " featRet=" << featRet << " minutiaeBytes=" << minutiaeCount << std::endl;
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }

    fp(FP_CLOSE, 0, 0, 0);
    dlclose(handle);
    return 0;
}
