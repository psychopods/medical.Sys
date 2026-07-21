#include <iostream>
#include <vector>
#include <string>
#include <dlfcn.h>
#include <unistd.h>

typedef long long INT_PTR;
typedef long long LONG_PTR;
typedef INT_PTR (*pfp)(INT_PTR FuncNo, LONG_PTR Param1, LONG_PTR Param2, LONG_PTR Param3);

#define FP_OPEN 1
#define FP_CLOSE 2

int main() {
    const char* libs[] = { "./sfe_30K.so", "./sfe_2K.so", "./sfe_1.so", "./sfe.so" };

    for (const char* lib_path : libs) {
        void* handle = dlopen(lib_path, RTLD_LAZY);
        if (!handle) continue;
        pfp fp = (pfp)dlsym(handle, "fp");
        if (!fp) { dlclose(handle); continue; }

        std::cout << "========== Testing " << lib_path << " ==========" << std::endl;

        int brList[] = { 0, 10, 20, -10, -20, 50, 100, 255 };

        for (int sensor = 0; sensor <= 10; sensor++) {
            for (int br : brList) {
                // Signature A: fp(1, sensor, br, 0)
                INT_PTR r1 = fp(FP_OPEN, sensor, br, 0);
                if (r1 >= 0) {
                    std::cout << "SUCCESS SigA! lib=" << lib_path << " sensor=" << sensor << " br=" << br << " ret=" << r1 << std::endl;
                    fp(FP_CLOSE, 0, 0, 0);
                }

                // Signature B: fp(1, "temp.db", sensor, br)
                const char* dbName = "temp.db";
                INT_PTR r2 = fp(FP_OPEN, (LONG_PTR)dbName, sensor, br);
                if (r2 >= 0) {
                    std::cout << "SUCCESS SigB! lib=" << lib_path << " sensor=" << sensor << " br=" << br << " ret=" << r2 << std::endl;
                    fp(FP_CLOSE, 0, 0, 0);
                }

                // Signature C: fp(1, sensor, (LONG_PTR)dbName, br)
                INT_PTR r3 = fp(FP_OPEN, sensor, (LONG_PTR)dbName, br);
                if (r3 >= 0) {
                    std::cout << "SUCCESS SigC! lib=" << lib_path << " sensor=" << sensor << " br=" << br << " ret=" << r3 << std::endl;
                    fp(FP_CLOSE, 0, 0, 0);
                }
            }
        }
        dlclose(handle);
    }

    return 0;
}
