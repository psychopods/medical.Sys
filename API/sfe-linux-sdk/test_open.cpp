#include <iostream>
#include <dlfcn.h>

typedef long long INT_PTR;
typedef long long LONG_PTR;
typedef INT_PTR (*pfp)(INT_PTR FuncNo, LONG_PTR Param1, LONG_PTR Param2, LONG_PTR Param3);

#define FP_OPEN 1
#define FP_CLOSE 2

int test_lib(const char* lib_path) {
    void* handle = dlopen(lib_path, RTLD_LAZY);
    if (!handle) {
        std::cerr << "dlopen failed for " << lib_path << ": " << dlerror() << std::endl;
        return -1;
    }

    pfp fp = (pfp)dlsym(handle, "fp");
    if (!fp) {
        std::cerr << "dlsym failed for " << lib_path << ": " << dlerror() << std::endl;
        dlclose(handle);
        return -1;
    }

    std::cout << "Testing " << lib_path << ":" << std::endl;

    for (int s = 0; s <= 8; s++) {
        INT_PTR res = fp(FP_OPEN, s, 0, 0);
        if (res >= 0) {
            std::cout << "  ===> SUCCESS! Opened sensor " << s << " with return code " << res << " using " << lib_path << std::endl;
            fp(FP_CLOSE, 0, 0, 0);
            dlclose(handle);
            return s;
        }
    }

    std::cout << "  (All sensor types returned -100 for " << lib_path << ")" << std::endl;
    dlclose(handle);
    return -1;
}

int main() {
    test_lib("./sfe.so");
    test_lib("./sfe_1.so");
    test_lib("./sfe_2K.so");
    test_lib("./sfe_30K.so");
    return 0;
}
