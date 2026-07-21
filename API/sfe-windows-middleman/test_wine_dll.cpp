#include <windows.h>
#include <iostream>

typedef int (*p_sfem_Open)(LPCWSTR strDBFileName, int nSensorType, int nSensorBrAdjust);
typedef int (*p_sfem_Close)();
typedef int (*p_sfem_Capture)();
typedef int (*p_sfem_IsFinger)();

int main() {
    std::cout << "Testing LoadLibraryA on SFEMediator64.dll via Winelib..." << std::endl;
    HMODULE hMediator = LoadLibraryA("SFEMediator64.dll");
    if (!hMediator) {
        hMediator = LoadLibraryA("SFEMediator.dll");
    }

    if (!hMediator) {
        std::cerr << "Failed to LoadLibrary SFEMediator. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    std::cout << "Successfully loaded SFEMediator DLL!" << std::endl;

    p_sfem_Open sfem_Open = (p_sfem_Open)GetProcAddress(hMediator, "sfem_Open");
    p_sfem_Close sfem_Close = (p_sfem_Close)GetProcAddress(hMediator, "sfem_Close");

    if (sfem_Open) {
        std::cout << "Found sfem_Open function address!" << std::endl;
        int ret = sfem_Open(L"test_wine.db", 4, 0);
        std::cout << "sfem_Open ret = " << ret << std::endl;
        if (sfem_Close) sfem_Close();
    } else {
        std::cout << "sfem_Open symbol not found." << std::endl;
    }

    FreeLibrary(hMediator);
    return 0;
}
